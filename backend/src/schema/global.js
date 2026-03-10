import { gql } from 'graphql-tag'
import { COLLECTION_USERS, COLLECTION_FRIENDS, COLLECTION_RUNS, getDB } from '../config/db.js'

function getMatch(since) {
    return since == 0 ? {
        user_id: { $ne: null }
    } : {
        user_id: { $ne: null }, 
        date: { $gt: since }
    }
}

/**
 * 
 * @param {*} since 
 * @returns [rank, score]
 */
async function getRankAndScore(since, user) {
    const userBest = await getDB().collection(COLLECTION_RUNS).aggregate([
        { $match: { user_id: user.id.toString() } },
        { $group: { _id: null, maxScore: { $max: "$score" } } }
    ]).toArray();

    if (userBest.length === 0) return null;

    const betterPlayers = await getDB().collection(COLLECTION_RUNS).aggregate([
        { $match: getMatch(since) },
        { $group: { _id: "$user_id", maxScore: { $max: "$score" } } },
        { $match: { maxScore: { $gt: userBest[0].maxScore } } },
        { $count: "count" }
    ]).toArray();

    return [(betterPlayers[0]?.count || 0) + 1, userBest[0].maxScore]
}

async function getLeaderboard(since=0) {
    return await getDB().collection(COLLECTION_RUNS).aggregate([
        // Filter out runs where user_id is null (deleted accounts)
        { 
            $match: getMatch(since)
        },
        // Sort by score descending first to ensure we get the best score for each user in the next step
        { $sort: { score: -1 } },
        // Group by user_id and take the first (highest) score
        {
            $group: {
                _id: "$user_id",
                best_score: { $first: "$score" },
                kills: { $first: "$kills" },
                duration: { $first: "$duration" },
                date: { $first: "$date" }
            }
        },
        // Sort again the grouped results
        { $sort: { best_score: -1 } },
        // Take top 10
        { $limit: 10 },
        // Join with users collection to get usernames
        {
            $lookup: {
                from: COLLECTION_USERS,
                let: { userId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$userId"] } } },
                    { $project: { username: 1, _id: 0 } }
                ],
                as: "user_info"
            }
        },
        // Unwind the user_info array
        { $unwind: "$user_info" },
        // Project final fields
        {
            $project: {
                _id: 0,
                user_id: "$_id",
                username: "$user_info.username",
                score: "$best_score",
                kills: 1,
                duration: 1,
                date: 1
            }
        }
    ]).toArray()
}

async function getLeaderboardResult(date, user) {
    const rankAndScore = !user ? [null, null] : await getRankAndScore(date, user)
    return {
        leaderboard: await getLeaderboard(date),
        user_rank: rankAndScore[0],
        user_score: rankAndScore[1]
    }
}

export const globalTypeDefs = gql`
    type GlobalStats {
        players_online: Int
        total_games: Int
        total_kills: Int
        total_survival_time: Float
    }

    type GlobalLeaderboardPlace {
        user_id: ID!
        username: String
        date: String
        score: Int!
        kills: Int
        duration: Int
    }

    type GlobalLeaderboardResult {
        leaderboard: [GlobalLeaderboardPlace]
        user_rank: Int
        user_score: Int
    }
 
    type Global {
        stats: GlobalStats
        daily_leaderboard: GlobalLeaderboardResult
        weekly_leaderboard: GlobalLeaderboardResult
        alltime_leaderboard: GlobalLeaderboardResult
    }

    extend type Query {
        global: Global
    }
`

export const globalResolvers = {
    Query: {
        global: () => {return {}}
    },
    Global: {
        stats: async (_, __, {}) => {
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
        
            const players_online = await getDB().collection(COLLECTION_USERS).countDocuments({
                last_online: { $gte: fiveMinutesAgo }
            })

            const global_run_stats = await getDB().collection(COLLECTION_RUNS).aggregate([
                {
                    $group: {
                        _id: null,
                        total_games: { $sum: 1 },
                        total_kills: { $sum: "$kills" },
                        total_survival_time: { $sum: "$duration" }
                    }
                }
            ]).toArray()

            const stats = {
                players_online,
                total_games: global_run_stats[0]?.total_games || 0,
                total_kills: global_run_stats[0]?.total_kills || 0,
                total_survival_time: global_run_stats[0]?.total_survival_time || 0
            }

            return stats
        },
        alltime_leaderboard: async (_, __, {user}) => {
            return await getLeaderboardResult(0, user)
        },
        weekly_leaderboard: async (_, __, {user}) => {
            var date = new Date();
            // set date to sunday morning (2AM UTC)
            date.setDate(date.getDate() - date.getDay())
            date.setUTCHours(2, 0, 0, 0)
            return await getLeaderboardResult(date, user)
        },
        daily_leaderboard: async (_, __, {user}) => {
            var date = new Date()
            // set date to this morning (2AM UTC)
            date.setUTCHours(2, 0, 0, 0)
            return await getLeaderboardResult(date, user)
        }
    }    
}
