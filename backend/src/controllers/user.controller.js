import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import jwt from 'jsonwebtoken'

const COLLECTION_USERS = 'users'
const COLLECTION_FRIENDS = 'friends'
const COLLECTION_RUNS = 'runs'

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
    const user = await db.collection(COLLECTION_USERS).findOne({ _id: new ObjectId(decoded.id) })

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
    
    // retrieve specified user basic data
    const db = getDB()
    const user = await db.collection(COLLECTION_USERS).findOne({
        _id: new ObjectId(id)
    })

    if (!user) return res.status(404).send("User not found")

    // retrieve friend status
    const friend_status = await db.collection(COLLECTION_FRIENDS).findOne({
        $or: [
            { requester_id: new ObjectId(loggedin_info.id), accepter_id: user._id },
            { requester_id: user._id, accepter_id: new ObjectId(loggedin_info.id) }
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

    return res.status(200).json({...user_data, stats: await getStatsFromUser(user)})
}

export {
    getLoggedInUser,
    getUser
}