import express from 'express'

const app = express()
const port = 2877

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

app.get('/', (req, res) => {
    res.status(200).send("version 0.0")
})