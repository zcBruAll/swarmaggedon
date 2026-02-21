import express from 'express'
import { connectDB, getDB } from './config/db.js'

const app = express()
const port = 2877

app.use(express.json())

app.listen(port, async () => {
    await connectDB()
    console.log(`Backend is ready. Listening on port ${port}`)
})

app.get('/', async (req, res) => {
    const results = await getDB().collection("users").find({}).toArray()
    res.json(results)
    // res.status(200).send("version 0.0")
})

app.get('/add', async (req, res) => {
    try {
        const db = getDB()
        
        let myobj = [
            { name: 'Chocolate Heaven'},
            { name: 'Tasty Lemon'},
            { name: 'Vanilla Dream'}
        ]

        const result = await db.collection("users").insertMany(myobj)

        return res.status(200).json({
            message: "added",
            insertedCount: result.insertedCount,
            ids: result.insertedIds
        })

    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: "Error while adding data" })
    }
})