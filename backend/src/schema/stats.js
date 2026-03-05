import { gql } from 'graphql-tag'
import { COLLECTION_USERS, COLLECTION_FRIENDS, COLLECTION_RUNS, getDB } from '../config/db.js'

const db = getDB()

export const statsTypeDefs = gql`
    type Stats {
        total_games: Int
        high_score: Int
        best_time: Int
        best_wave: Int
        total_kills: Int
        total_time: Int
    }
    
    extend type User {
        stats: Stats
    }
`

export const statsResolvers = {
    User: {
        stats: async (user, _, {}) => {
            const run_data = await getDB().collection(COLLECTION_RUNS).aggregate([
                { $match: { user_id: user.id.toString() } },  // filter for specified user
                {
                    $group: {
                        _id: null,
                        total_games: { $sum: 1 },
                        high_score: { $max: "$score" },
                        best_time: { $max: "$duration" },
                        best_wave: { $max: "$wave" },
                        total_kills: { $sum: "$kills" },
                        total_time: { $sum: "$duration" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        total_games: 1,
                        high_score: 1,
                        best_time: 1,
                        best_wave: 1,
                        total_kills: 1,
                        total_time: 1
                    }
                }
            ]).toArray()

            return run_data[0] || { total_games: 0, high_score: 0, best_wave: 0, best_time: 0, total_kills: 0, total_time: 0 }
        }
    }
}