const fs = require('fs')
const path = require('path')
const express = require('express')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')
const tagRouter = require('./routers/tag')

const app = express()
const clientDistPath = path.join(__dirname, '../client/dist')

app.use(express.json())

// Mount REST API routes under `/api` so they never collide with Vue Router paths
app.use('/api', userRouter)
app.use('/api', taskRouter)
app.use('/api', tagRouter)

// Serve compiled Vue + Carbon frontend in production
if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath))

    app.get('*', (req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'))
    })
} else {
    app.get('*', (req, res) => {
        res.status(200).send('Task App API running. Frontend dev server available at http://localhost:5173')
    })
}

module.exports = app