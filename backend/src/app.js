import express from 'express'
import { connectDB, getDB } from './config/db.js'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import cookieparser from 'cookie-parser'
import { ApolloServer } from '@apollo/server'
import jwt from 'jsonwebtoken'
import { expressMiddleware } from '@as-integrations/express5'

// setup dotenv
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../../.env'), quiet: true })

// express app
const app = express()
const port = 2877

// init apollo server
import { typeDefs, resolvers } from './schema/index.js'
const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
})

// use
app.use(express.json())
app.use(cors({
    credentials: true
}))
app.use(cookieparser())

await connectDB()
await server.start()

app.get('/status', async (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date() }))

app.use(
    '/graphql',
    expressMiddleware(server, {
        context: async ({ req, res }) => {
            const token = req.cookies.auth_token;
            let user = null;

            if (token) {
                try {
                user = jwt.verify(token, process.env.JWT_SECRET);
                } catch (err) {
                // Token is invalid/expired
                }
            }

            return {
                res, 
                user 
            };
        }
    })
);

app.listen(port, () => {
    console.log(`Backend is ready. Listening on port ${port}`)
})

