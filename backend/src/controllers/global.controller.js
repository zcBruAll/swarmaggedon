import { getDB, COLLECTION_USERS, COLLECTION_RUNS } from "../config/db.js";

const getGlobalStats = async (req, res) => {
    const db = getDB()
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    
    try {
        const players_online = await db.collection(COLLECTION_USERS).countDocuments({
            last_online: { $gte: fiveMinutesAgo }
        })

        const global_run_stats = await db.collection(COLLECTION_RUNS).aggregate([
            {
                $group: {
                    _id: null,
                    total_games: { $sum: 1 },
                    total_kills: { $sum: "$kills" },
                    avg_survival_time: { $avg: "$duration" }
                }
            }
        ]).toArray()

        const stats = {
            players_online,
            total_games: global_run_stats[0]?.total_games || 0,
            total_kills: global_run_stats[0]?.total_kills || 0,
            avg_survival_time: global_run_stats[0]?.avg_survival_time || 0
        }

        return res.status(200).json(stats)
    } catch (error) {
        console.error("Error fetching global stats:", error)
        return res.status(500).send("Internal server error")
    }
}

const getGlobalLeaderboard = async (req, res) => {
    const db = getDB()
    try {
        const leaderboard = await db.collection(COLLECTION_RUNS).aggregate([
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

        return res.status(200).json(leaderboard)
    } catch (error) {
        console.error("Error fetching leaderboard:", error)
        return res.status(500).send("Internal server error")
    }
}

export {
    getGlobalLeaderboard,
    getGlobalStats
}