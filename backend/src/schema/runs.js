import { gql } from 'graphql-tag'
import { COLLECTION_USERS, COLLECTION_FRIENDS, COLLECTION_RUNS, getDB } from '../config/db.js'
import { ObjectId } from 'mongodb'

export const runTypeDefs = gql`
    type Run {
        id: ID!
        user_id: ID!
        date: String!
        score: Int!
        duration: Int!
        wave: Int!
        kills: Int!
    }

    extend type User {
        runs: [Run]
        last_run: Run
    }
`

export const runResolvers = {
    User: {
        runs: async (user, _, {}) => {
            const results = await getDB().collection(COLLECTION_RUNS).find({
                user_id: user.id.toString()
            }).toArray()

            return results || []
        },
        last_run: async(user, _, {}) => {
            const lastRun = await getDB().collection(COLLECTION_RUNS).findOne(
                { user_id: user.id.toString() },
                { sort: { date: -1 } }
            )
            
            return lastRun || null
        }
    },
    Run: {
        date: (parent) => parent.date ? new Date(Number(parent.date)).toISOString() : null
    }
}