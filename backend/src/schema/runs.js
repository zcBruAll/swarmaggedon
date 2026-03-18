import { gql } from 'graphql-tag'
import { COLLECTION_USERS, COLLECTION_FRIENDS, COLLECTION_RUNS, getDB } from '../config/db.js'
import { ObjectId } from 'mongodb'
import { checkScoreValidity, setCheater } from '../utils.js'

export const runTypeDefs = gql`
    type Run {
        id: ID!
        user_id: ID
        date: String!
        score: Int!
        duration: Int!
        wave: Int!
        kills: Int!
    }

    extend type User {
        runs(first: Int, offset: Int): [Run]
        last_run: Run
    }

    extend type Mutation {
        addRun(score: Int!, duration: Int!, wave: Int!, kills: Int!): String
    }
`

export const runResolvers = {
    User: {
        runs: async (user, {first: f, offset: o}, {}) => {
            let first = f || 0
            let offset = o || 0
            const results = await getDB().collection(COLLECTION_RUNS).find({
                user_id: user.id.toString()
            },{
                limit: first,
                skip: offset
            }).sort({$natural:-1}).toArray()

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
    },
    Mutation: {
        addRun: async (_, {score, duration, wave, kills}, {user}) => {
            if (!user) throw new Error("You are not logged in")
                if (score < 0 || duration < 0 || wave <= 0 || kills < 0) {
                    await setCheater(user)
                    console.log("Detected", user, "as cheater for run", {score, duration, wave, kills}, "for negative values")
                    throw new Error("Invalid run" + JSON.stringify({score, duration, wave, kills}))
                }

            if (!checkScoreValidity(score, wave, kills)) {
                await setCheater(user)
                console.log("Detected", user, "as cheater for run", {score, duration, wave, kills}, "for score validity")
                throw new Error("Invalid run" + JSON.stringify({score, duration, wave, kills}))
            }

            const result = await getDB().collection(COLLECTION_RUNS).insertOne({
                user_id: user.id.toString(),
                date: new Date(),
                score,
                duration,
                wave,
                kills
            })

            if (!result) return "Unknown error while inserting"
            return "Inserted new run"
        }
    }
}