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

const getUserInfo = async (loggedin_id, user_id, stats=true) => {    
    // retrieve specified user basic data
    const db = getDB()
    const user = await db.collection(COLLECTION_USERS).findOne({
        _id: new ObjectId(user_id)
    })

    if (!user) return {}

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
    if (!stats) return user_data
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
    let rank = 0
    
    try {
        const userBest = await db.collection(COLLECTION_RUNS).aggregate([
            { $match: { user_id: user._id.toString() } },
            { $group: { _id: null, maxScore: { $max: "$score" } } }
        ]).toArray()

        if (userBest.length === 0) {
            return res.status(200).json({ rank: null, score: 0 })
        }

        const currentBest = userBest[0].maxScore

        const betterPlayersCount = await db.collection(COLLECTION_RUNS).aggregate([
            { $group: { _id: "$user_id", maxScore: { $max: "$score" } } },
            { $match: { maxScore: { $gt: currentBest } } },
            { $count: "count" }
        ]).toArray()

        rank = (betterPlayersCount[0]?.count || 0) + 1
    } catch (err) {
        return res.status(500).send("unknown error")
    }

    return res.status(200).json({
        id: user._id,
        username: user.username,
        email: user.email,
        date_created: user.date_created,
        rank: rank,
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
                $project: {
                    _id: 0,
                    requester_id: 1,
                    accepter_id: 1,
                    pending: "$pending"
                }
            }
        ]).toArray()

        const ret = []

        for (const f of friends) {
            const fid = f.requester_id == loggedin_info.id ? f.accepter_id : f.requester_id
            const fdata = await getUserInfo(loggedin_info.id, fid, !f.pending)
            const {is_friend, ...rest} = fdata
            ret.push({id:fid, ...f, ...rest})
        }

        return res.status(200).json(ret)
    } catch (error) {
        console.error("Error fetching friends:", error)
        return res.status(500).send("Internal server error")
    }
}

const postAddFriend = async (req, res) => {
    const token = req.cookies.auth_token
    if (!token) return res.status(401).send("Not logged in")

    let loggedin_info
    try {
        loggedin_info = jwt.verify(token, process.env.JWT_SECRET)
    } catch(err) {
        return res.status(401).send("Unauthorized")
    }
    
    const { id } = req.params
    if (!id || loggedin_info == id) return res.status(400).send("Bad usage")

    const db = getDB()

    /// Get current friend status (friend collection)
    // if there already is a document, pending -> false
    const current_friend_status = await db.collection(COLLECTION_FRIENDS).findOne({
        $or: [
            { requester_id: loggedin_info.id, accepter_id: id },
            { requester_id: id, accepter_id: loggedin_info.id }
        ]
    })

    if (!!current_friend_status) {
        // friend status found
        if (current_friend_status.pending && current_friend_status.accepter_id == loggedin_info.id) {
            // pending, if current user is accepter, pending => false
            const result = await db.collection(COLLECTION_FRIENDS).findOneAndUpdate(
                {
                    $or: [
                        { requester_id: loggedin_info.id, accepter_id: id },
                        { requester_id: id, accepter_id: loggedin_info.id }
                    ]
                },
                {
                    $set: { pending: false }
                }
            )
            if (!!result) return res.status(200).send("Success")
            else return res.status(500).send("Please try again later")
        } else {
            // nothing to do
            return res.status(200).send("")
        }
    }
    // currently no friend status

    /// Create new document in friend collection
    const user_exists = await db.collection(COLLECTION_USERS).findOne({
        _id: new ObjectId(id)
    })

    if (!user_exists) return res.status(404).send("User does not exist")

    const data = await db.collection(COLLECTION_FRIENDS).insertOne({
        requester_id: loggedin_info.id,
        accepter_id: id,
        pending: true
    })

    return res.status(200).json(data)
}

const deleteRemoveFriend = async (req, res) => {
    const token = req.cookies.auth_token
    if (!token) return res.status(401).send("Not logged in")

    let loggedin_info
    try {
        loggedin_info = jwt.verify(token, process.env.JWT_SECRET)
    } catch(err) {
        return res.status(401).send("Unauthorized")
    }
    
    const { id } = req.params
    if (!id || loggedin_info == id) return res.status(400).send("Bad usage")

    const db = getDB()

    const removed = await db.collection(COLLECTION_FRIENDS).findOneAndDelete(
        {
            $or: [
                { requester_id: loggedin_info.id, accepter_id: id },
                { requester_id: id, accepter_id: loggedin_info.id }
            ]
        }
    )

    if (!removed) return res.status(204).send("No friend status found")

    res.status(200).send("Successfully removed friend")
}

const getUserSearch = async (req,res) => {
    const token = req.cookies.auth_token
    if (!token) return res.status(401).send("Not logged in")

    let loggedin_info
    try {
        loggedin_info = jwt.verify(token, process.env.JWT_SECRET)
    } catch(err) {
        return res.status(401).send("Unauthorized")
    }
    
    const { username } = req.params
    if (!username) return res.status(400).send("Bad usage")
    
    const db = getDB()
    const results = await db.collection(COLLECTION_USERS).find({
        "username": { $regex: username, $options: 'i' },
        _id: { $ne: new ObjectId(loggedin_info.id) }
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

    return res.status(200).json(formattedResults)
}

const getUserRuns = async (req, res) => {
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
        const results = await db.collection(COLLECTION_RUNS).find().toArray()
        return res.status(200).json(results)
    } catch(err) {
        console.log(err)
        return res.status(500).send("unknown error")
    }
}

const getUserLastRun = async (req, res) => {
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
        const lastRun = await db.collection(COLLECTION_RUNS).findOne(
            { user_id: loggedin_info.id },
            { sort: { date: -1 } }
        )
        
        return res.status(200).json(lastRun || null)
    } catch (err) {
        console.error("Error fetching last run:", err)
        return res.status(500).send("Internal server error")
    }
}

export {
    getLoggedInUser,
    getUser,
    getLoggedInUserFriends,
    postAddFriend,
    deleteRemoveFriend,
    getUserSearch,
    getUserRuns,
    getUserLastRun
}