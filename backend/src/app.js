import express from 'express'
import { connectDB, getDB } from './config/db.js'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import cookieparser from 'cookie-parser'

// setup dotenv
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../../.env'), quiet: true })

// express app
const app = express()
const port = 2877

app.use(express.json())
app.use(cors({
    credentials: true
}))
app.use(cookieparser())

app.listen(port, async () => {
    await connectDB()
    console.log(`Backend is ready. Listening on port ${port}`)
})

// routes
import authRoute from './routes/auth.route.js'
import userRoute from './routes/user.route.js'
import globalRoute from './routes/global.route.js'

app.use("/auth", authRoute)
app.use("/user", userRoute)
app.use("/global", globalRoute)