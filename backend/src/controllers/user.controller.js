import { getDB } from "../config/db.js";
import jwt from 'jsonwebtoken'

const COLLETION_NAME = 'users'

// /user/
// Get current user info from token
const getLoggedInUser = async (req, res) => {
    const token = req.cookies.auth_token
    if (!token) return res.status(401).send("Not logged in")
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const username = decoded.username

    // retrieve basic data from mongodb
    const db = getDB()
    const user = await db.collection(COLLETION_NAME).findOne({ username })

    if (!user) return res.status(404).send("User not found")
    
    // retrive run data from mongodb (games played, win rate, etc.)
    // TODO

    return res.status(200).json({
        username: user.username,
        email: user.email,
        date_created: user.date_created
    })
}

// /user/:id
// Get info for specified user (username, winrate, status, friend_status)
const getUser = async (req, res) => {

}

export {
    getLoggedInUser,
    getUser
}