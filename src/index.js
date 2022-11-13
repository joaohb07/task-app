// Import Libs
const express = require('express') // create web server

// Import db file configs
require('./db/mongoose')

// Import Routers
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

// Initialize App
const app = express()
const port = process.env.PORT// Define port for heroku or local dev

// Express use JSON format
app.use(express.json())

// Define app routes
// Users Endpoints
app.use(userRouter)
// Tasks Endpoints
app.use(taskRouter)

// Set App listen port
app.listen(port, () => {
    console.log('Server is up on port ', port)
})