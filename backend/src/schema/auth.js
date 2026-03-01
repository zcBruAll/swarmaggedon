import { gql } from 'graphql-tag'
import { COLLECTION_USERS, COLLECTION_FRIENDS, COLLECTION_RUNS, getDB } from '../config/db.js'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

export const authTypeDefs = gql`
    extend type Mutation {
        login(username: String!, password: String!): String

        register(username: String!, email: String!, password: String!): String

        logout: Boolean
    }
`

export const authResolvers = {
    Mutation: {
        login: async (_, {username, password}, {res}) => {
            const user = await getDB().collection(COLLECTION_USERS).findOne({username})

            if (!user || !bcrypt.compareSync(password, user.password)) return "Wrong username or password"
            
            // JWT
            const token = jwt.sign({id: user._id.toString(), email: user.email}, process.env.JWT_SECRET, {expiresIn: '7d'})
            
            res.cookie('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            
            return "Logged in successfully"
        },
        register: async(_, {username, email, password}, {}) => {
            if (username.length > 16 || username.length < 3) throw new Error("Your new username is not correct")
            
            const existingUsername = await getDB().collection(COLLECTION_USERS).findOne({username})
            if (existingUsername) return "Username already taken"
            
            const existingEmail = await getDB().collection(COLLECTION_USERS).findOne({ email })
            if (existingEmail) return "Email already taken"
        
            const newUser = {
                username: username,
                email: email,
                password: bcrypt.hashSync(password, Number(process.env.SALT_ROUNDS)),
                last_online: Date.now(),
                in_game: false,
                date_created: Date.now()
            }
            try {
                await getDB().collection(COLLECTION_USERS).insertOne(newUser)
            } catch (error) {
                console.log("Registration error", error)
                return "Internal server error"
            }
            return "Account created successfully"
        },
        logout: async(_, __, {res}) => {
            res.clearCookie('auth_token')
            return true
        }
    }
}