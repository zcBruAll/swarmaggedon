import { gql } from 'graphql-tag'
import { COLLECTION_USERS, COLLECTION_FRIENDS, COLLECTION_RUNS, getDB } from '../config/db.js'

const db = getDB()

export const statsTypeDefs = gql`
    type Stats {
        total_games: Int
        total_kills: Int
        best_time: Int
        avg_wave: Float
        high_score: Int
        avg_duration: Float
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
                        total_kills: { $sum: "$kills" },
                        best_time: { $max: "$duration" },
                        avg_wave: { $avg: "$wave" },
                        high_score: { $max: "$score" },
                        avg_duration: { $avg: "$duration" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        total_games: 1,
                        total_kills: 1,
                        best_time: 1,
                        avg_wave: 1,
                        high_score: 1,
                        avg_duration: 1
                    }
                }
            ]).toArray()

            return run_data[0] || { total_games: 0, total_kills: 0, avg_wave: 0, best_time: 0, high_score: 0, avg_duration: 0 }
        }
    }
}