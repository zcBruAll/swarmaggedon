import { gql } from 'graphql-tag'
import { COLLECTION_USERS, COLLECTION_FRIENDS, COLLECTION_RUNS, getDB } from '../config/db.js'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { checkProfanity } from '../utils.js'

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

        friends: [User]

        pending_requests: [User]

        search(usernameSearch: String!): [User]
    }

    extend type Mutation {
        addFriend(userId: ID!): String
        deleteFriend(userId: ID!): String
        changeUsername(newUsername: String!): String
        changePassword(oldPassword: String!, newPassword: String!): String
        deleteAccount: String
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
        },
        friends: async (_, __, {user: loggedin_info}) => {
            if (!loggedin_info) throw new Error("You are not logged in")
            const friends = await getDB().collection(COLLECTION_FRIENDS).aggregate([
                {
                    $match: {
                        $or: [
                            { requester_id: loggedin_info.id },
                            { accepter_id: loggedin_info.id }
                        ],
                        pending: false
                    }
                },
                {
                    $project: {
                        _id: 0,
                        requester_id: 1,
                        accepter_id: 1
                    }
                }
            ]).toArray()
    
            const ret = []
    
            for (const f of friends) {
                const fid = f.requester_id == loggedin_info.id ? f.accepter_id : f.requester_id
                const friend = await getDB().collection(COLLECTION_USERS).findOne({
                    _id: new ObjectId(fid)
                })
                ret.push({
                    id: friend._id,
                    requester_id: f.requester_id,
                    accepter_id: f.accepter_id,
                    username: friend.username,
                    last_online: friend.last_online,
                    in_game: friend.in_game,
                    date_created: friend.date_created
                })
            }

            return ret
        },
        search: async (_, {usernameSearch}, { user: loggedin_info }) => {
            if (!loggedin_info) throw new Error("You are not logged in")
            
            if (!usernameSearch) throw new Error("You must give a search keyword")

            // Find all relationships initiated by the current user
            const initiatedRelations = await getDB().collection(COLLECTION_FRIENDS).find({
                requester_id: loggedin_info.id
            }).toArray()

            const excludedIds = initiatedRelations.map(rel => new ObjectId(rel.accepter_id))
            excludedIds.push(new ObjectId(loggedin_info.id))
                
            const results = await getDB().collection(COLLECTION_USERS).find({
                "username": { $regex: usernameSearch, $options: 'i' },
                _id: { $nin: excludedIds }
            }, {
                projection: {
                    _id: 1,
                    username: 1
                }
            }).limit(10).toArray()
            
            const formattedResults = results.map(user => ({
                id: user._id,
                username: user.username
            }))
        
            return formattedResults
        },
        pending_requests: async (_, __, {user: loggedin_info}) => {
            if (!loggedin_info) throw new Error("You are not logged in")
            const pending = await getDB().collection(COLLECTION_FRIENDS).aggregate([
                {
                    $match: {
                        accepter_id: loggedin_info.id,
                        pending: true
                    }
                },
                {
                    $project: {
                        _id: 0,
                        requester_id: 1
                    }
                }
            ]).toArray()
    
            const ret = []
    
            for (const f of pending) {
                const user = await getDB().collection(COLLECTION_USERS).findOne({
                    _id: new ObjectId(f.requester_id)
                })
                ret.push({
                    id: f.requester_id,
                    username: user.username,
                    last_online: user.last_online,
                    in_game: user.in_game,
                    date_created: user.date_created
                })
            }

            return ret
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
                { $match: { user_id: { $ne: null } } },
                { $group: { _id: "$user_id", maxScore: { $max: "$score" } } },
                { $match: { maxScore: { $gt: userBest[0].maxScore } } },
                { $count: "count" }
            ]).toArray();

            return (betterPlayers[0]?.count || 0) + 1;
        }
    },
    Mutation: {
        addFriend: async (_, {userId: id}, {user: loggedin_info}) => {
            const current_friend_status = await getDB().collection(COLLECTION_FRIENDS).findOne({
                $or: [
                    { requester_id: loggedin_info.id.toString(), accepter_id: id },
                    { requester_id: id, accepter_id: loggedin_info.id.toString() }
                ]
            })

            if (!!current_friend_status) {
                // friend status found
                if (current_friend_status.pending && current_friend_status.accepter_id == loggedin_info.id) {
                    // pending, if current user is accepter, pending => false
                    const result = await getDB().collection(COLLECTION_FRIENDS).findOneAndUpdate(
                        {
                            $or: [
                                { requester_id: loggedin_info.id.toString(), accepter_id: id },
                                { requester_id: id, accepter_id: loggedin_info.id.toString() }
                            ]
                        },
                        {
                            $set: { pending: false }
                        }
                    )
                    if (!!result) return "Success"
                    else return "Please try again later"
                } else {
                    // nothing to do
                    return ""
                }
            }
            // currently no friend status

            /// Create new document in friend collection
            const user_exists = await getDB().collection(COLLECTION_USERS).findOne({
                _id: new ObjectId(id)
            })

            if (!user_exists) return "User does not exist"

            const data = await getDB().collection(COLLECTION_FRIENDS).insertOne({
                requester_id: loggedin_info.id,
                accepter_id: id,
                pending: true
            })

            return "Friend request sent"
        },
        deleteFriend: async (_, {userId: id}, {user: loggedin_info}) => {
            const removed = await getDB().collection(COLLECTION_FRIENDS).findOneAndDelete(
                {
                    $or: [
                        { requester_id: loggedin_info.id.toString(), accepter_id: id },
                        { requester_id: id, accepter_id: loggedin_info.id.toString() }
                    ]
                }
            )
        
            if (!removed) return "No friend status found"
        
            return "Successfully removed friend"
        },
        changeUsername: async (_, {newUsername}, {user}) => {
            if (!user) throw new Error("You are not logged in")
            if (newUsername.length > 16 || newUsername.length < 3) throw new Error("Your new username is not correct")
            if (newUsername === user.username) throw new Error("New username must be different")
            const existingUsername = await getDB().collection(COLLECTION_USERS).findOne({username: newUsername})
            if (existingUsername) throw new Error("Username already taken")

            if (!await checkProfanity(newUsername)) throw new Error("New username contains profanity")
            
            const result = await getDB().collection(COLLECTION_USERS).findOneAndUpdate({
                _id: new ObjectId(user.id)
            },{
                $set: {
                    username: newUsername
                }
            })

            if (result) return "Username changed successfully"
            else throw new Error("Unknown error")
        },
        changePassword: async (_, {oldPassword, newPassword}, {user}) => {
            if (!user) throw new Error("You are not logged in")
            if (oldPassword == newPassword) throw new Error("New password must be different from last one")
            const userDb = await getDB().collection(COLLECTION_USERS).findOne({_id: new ObjectId(user.id)})
            if (!userDb) throw new Error("User not found")
            if (!bcrypt.compareSync(oldPassword, userDb.password)) throw new Error("Old password is incorrect")
            const res = await getDB().collection(COLLECTION_USERS).findOneAndUpdate({_id: new ObjectId(user.id)}, {
                $set: {
                    password: bcrypt.hashSync(newPassword, Number(process.env.SALT_ROUNDS))
                }
            })
            
            return "Password changed successfully"
        },
        deleteAccount: async (_, __, {user}) => {
            // delete user from collection
            const result = await getDB().collection(COLLECTION_USERS).findOneAndDelete({
                _id: new ObjectId(user.id)
            })

            if (!result) return "Error while deleting user"

            // Delete all friends
            const fres = await getDB().collection(COLLECTION_FRIENDS).deleteMany({
                $or: [
                    {
                        requester_id: user.id
                    },
                    {
                        accepter_id: user.id
                    }
                ]
            })

            if (!fres) return "Error while deleting user's friends"

            // Set run user id to null
            const runres = await getDB().collection(COLLECTION_RUNS).updateMany(
                { user_id: user.id },
                { $set: { user_id: null }}
            )

            return "Account deleted successfully"
        }
    }
}