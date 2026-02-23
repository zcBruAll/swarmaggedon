import { COLLECTION_USERS, getDB,  } from "../config/db.js";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const JWT_EXPIRATION = "1h"
const SALT_ROUNDS = 10

// /auth/login
// requires "username" and "password" (sha-256 hashed) on request body
const postLogin = async (req, res) => {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).send("Bad usage")
    
    const db = getDB()
    const user = await db.collection(COLLECTION_USERS).findOne({username})

    if (!user) return res.status(400).send("Wrong username or password")
    if (!bcrypt.compareSync(password, user.password)) return res.status(400).send("Wrong username or password")
    const token = jwt.sign({id: user._id.toString(), email: user.email}, process.env.JWT_SECRET, {expiresIn: JWT_EXPIRATION})
    
    res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600 * 1000
    })
    
    res.status(200).send("Logged in successfully")
}

const deleteLogout = async (req, res) => {
    res.clearCookie('auth_token')
    res.status(200).send("Logged out successfully")
}

// /auth/register
// requires "username", "email", "password" (sha-256 hashed) on request body
const postRegister = async (req, res) => {
    const { username, email, password } = req.body
    if (!username || !email || !password) return res.status(400).send("Bad usage")
    
    const db = getDB()

    const existingUsername = await db.collection(COLLECTION_USERS).findOne({username})
    if (existingUsername) return res.status(400).send("Username already taken")
    
    const existingEmail = await db.collection(COLLECTION_USERS).findOne({ email })
    if (existingEmail) return res.status(400).send("Email already taken")

    const newUser = {
        username: username,
        email: email,
        password: bcrypt.hashSync(password, SALT_ROUNDS),
        last_online: Date.now(),
        in_game: false,
        date_created: Date.now()
    }
    try {
        await db.collection(COLLECTION_USERS).insertOne(newUser)
    } catch (error) {
        console.log("Registration error", error)
        return res.status(500).send("Internal server error")
    }
    res.status(200).send("Account created successfully")
}

export {
    postLogin,
    postRegister,
    deleteLogout
}