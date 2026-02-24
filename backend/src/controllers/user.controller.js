import { ObjectId } from "mongodb";
import { COLLECTION_FRIENDS, COLLECTION_RUNS, COLLECTION_USERS, getDB } from "../config/db.js";
import jwt from 'jsonwebtoken'

const getStatsFromUser = async (user) => {
        const run_data = await getDB().collection(COLLECTION_RUNS).aggregate([
        { $match: { user_id: user._id.toString() } },  // filter for specified user
        {
            $group: {
                _id: null,
                total_games: { $sum: 1 },
                total_kills: { $sum: "$kills" },
                best_time: { $max: "$duration" },
                wins: { $sum: { $cond: [{ $eq: ["$win", true] }, 1, 0] } },
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
                win_rate: {
                    $cond: [
                        { $eq: ["$total_games", 0] },
                        0,
                        { $divide: ["$wins", "$total_games"] }
                    ]
                },
                high_score: 1,
                avg_duration: 1
            }
        }
    ]).toArray()

    return run_data[0] || { total_games: 0, total_kills: 0, win_rate: 0, best_time: 0, high_score: 0, avg_duration: 0 }
}

const getUserInfo = async (loggedin_id, user_id) => {    
    // retrieve specified user basic data
    const db = getDB()
    const user = await db.collection(COLLECTION_USERS).findOne({
        _id: new ObjectId(user_id)
    })

    if (!user) return res.status(404).send("User not found")

    // retrieve friend status
    const friend_status = await db.collection(COLLECTION_FRIENDS).findOne({
        $or: [
            { requester_id: loggedin_id, accepter_id: user._id.toString() },
            { requester_id: user._id.toString(), accepter_id: loggedin_id }
        ],
        pending: false
    })
    const user_data = {
        username: user.username,
        is_friend: !!friend_status,
        last_online: user.last_online,
        in_game: user.in_game,
        date_created: user.date_created
    }
    return {...user_data, stats: await getStatsFromUser(user)}
}

// /user/
// Get current user info from token
const getLoggedInUser = async (req, res) => {
    const token = req.cookies.auth_token
    if (!token) return res.status(401).send("Not logged in")
    
    let decoded
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch(err) {
        return res.status(401).send("Invalid token")
    }

    // retrieve basic data from mongodb
    const db = getDB()
    const user = await db.collection(COLLECTION_USERS).findOneAndUpdate(
        { _id: new ObjectId(decoded.id) },
        { $set: { last_online: Date.now() } },
        { returnDocument: 'after' }
    )

    if (!user) return res.status(404).send("User not found")
    
    // retrive run data from mongodb (games played, win rate, etc.)
    const run_data = await getStatsFromUser(user)

    return res.status(200).json({
        username: user.username,
        email: user.email,
        date_created: user.date_created,
        stats: run_data
    })
}

// /user/:id
// Get info for specified user (username, winrate, status, friend_status)
const getUser = async (req, res) => {
    const token = req.cookies.auth_token
    if (!token) return res.status(401).send("Not logged in")

    let loggedin_info
    try {
        loggedin_info = jwt.verify(token, process.env.JWT_SECRET)
    } catch(err) {
        return res.status(401).send("Unauthorized")
    }
    
    const { id } = req.params
    if (!id) return res.status(400).send("Bad usage")

    // if id is of logged in user, return "/user" response
    if (id == loggedin_info.id) return getLoggedInUser(req, res)

    return res.status(200).json(await getUserInfo(loggedin_info.id, id))
}

const getLoggedInUserFriends = async (req, res) => {
    const token = req.cookies.auth_token
    if (!token) return res.status(401).send("Not logged in")

    let loggedin_info
    try {
        loggedin_info = jwt.verify(token, process.env.JWT_SECRET)
    } catch(err) {
        return res.status(401).send("Unauthorized")
    }

    const db = getDB()

    try {
        const friends = await db.collection(COLLECTION_FRIENDS).aggregate([
            {
                $match: {
                    $or: [
                        { requester_id: loggedin_info.id },
                        { accepter_id: loggedin_info.id }
                    ]
                }
            },
            {
                $addFields: {
                    friend_id: {
                        $cond: {
                            if: { $eq: ["$requester_id", loggedin_info.id] },
                            then: "$accepter_id",
                            else: "$requester_id"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    id: "$friend_id",
                    pending: "$pending"
                }
            }
        ]).toArray()

        const ret = []

        for (const f of friends) {
            if (f.pending) {
                ret.push(f)
                continue
            }

            // already friends
            const fdata = await getUserInfo(loggedin_info.id, f.id)
            const {is_friend, ...rest} = fdata
            ret.push({...f, ...rest})
        }

        return res.status(200).json(ret)
    } catch (error) {
        console.error("Error fetching friends:", error)
        return res.status(500).send("Internal server error")
    }
}

export {
    getLoggedInUser,
    getUser,
    getLoggedInUserFriends
}