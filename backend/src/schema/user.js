import { gql } from 'graphql-tag'
import { COLLECTION_USERS, COLLECTION_FRIENDS, COLLECTION_RUNS, getDB } from '../config/db.js'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'

export const userTypeDefs = gql`
    type User {
        id: ID!
        username: String!
        email: String,
        last_online: Float
        rank: Int
        in_game: Boolean
        date_created: Float!
    }
    
    extend type Query {
        # returns logged in user info
        me: User

        # returns other user info
        user_by_id(id: ID!): User
    }
`

export const userResolvers = {
    Query: {
        // parent, args, context
        me: async (_, __, { res, user }) => {
            // must be authenticated
            if (!user) throw new Error("You are not logged in")

            const user_data = await getDB().collection(COLLECTION_USERS).findOneAndUpdate(
                { _id: new ObjectId(user.id) },
                { $set: { last_online: Date.now() } },
                { returnDocument: 'after' }
            )

            // JWT
            const token = jwt.sign({id: user_data._id.toString(), email: user_data.email}, process.env.JWT_SECRET, {expiresIn: '7d'})

            res.cookie('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return {
                id: user_data._id,
                username: user_data.username,
                email: user_data.email,
                date_created: user_data.date_created
            }
        },
        // old /user/:id
        user_by_id: async (_, {id}, {user: loggedin_user}) => {
            // check if id is valid for mongodb
            if (!ObjectId.isValid(id)) throw new Error("Invalid User ID format");
            if (!loggedin_user) throw new Error("You are not logged in")

            // retrieve specified user basic data
            const user = await getDB().collection(COLLECTION_USERS).findOne({
                _id: new ObjectId(id)
            })

            if (!user) return {}

            // retrieve friend status
            const friend_status = await getDB().collection(COLLECTION_FRIENDS).findOne({
                $or: [
                    { requester_id: loggedin_user.id, accepter_id: user._id.toString() },
                    { requester_id: user._id.toString(), accepter_id: loggedin_user.id }
                ],
                pending: false
            })
            return {
                id: user._id,
                username: user.username,
                is_friend: !!friend_status,
                last_online: user.last_online,
                in_game: user.in_game,
                date_created: user.date_created
            }
        }
    },
    User: {
        rank: async (parent, _, {}) => {
            const userBest = await getDB().collection(COLLECTION_RUNS).aggregate([
                { $match: { user_id: parent.id.toString() } },
                { $group: { _id: null, maxScore: { $max: "$score" } } }
            ]).toArray();

            if (userBest.length === 0) return null;

            const betterPlayers = await getDB().collection(COLLECTION_RUNS).aggregate([
                { $group: { _id: "$user_id", maxScore: { $max: "$score" } } },
                { $match: { maxScore: { $gt: userBest[0].maxScore } } },
                { $count: "count" }
            ]).toArray();

            return (betterPlayers[0]?.count || 0) + 1;
        }
    }
}