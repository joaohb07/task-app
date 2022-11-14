// Import Libs
const express = require('express') // create web server
var cookieParser = require('cookie-parser') // for parsing cookie data in front end
const path = require('path') // Node.js built-in lib, work w/ dirs
const bodyParser = require('body-parser') // For parsing html requests
const methodOverride = require('method-override') // Allows HTML forms to process PATCH/DELETE requests
const hbs = require('hbs') // For dinamic html templating

// Import db file configs and connection
require('./db/mongoose')

// Import public folder - frontend
const publicFolder = path.join(__dirname,'../public/')
// hbs dinamic templates
const viewsPath = path.join(__dirname, '../views/views') // Define `views` folder path
// console.log(viewsPath)
const partialsPath = path.join(__dirname, '../views/partials') // Define `partials` folder path

// Import Routers
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')
const frontRouter = require('./routers/frontend')

// Initialize App
const app = express()
const port = process.env.PORT// Define port for heroku or local dev

// Express use public folder for frontend

// Set app view engine
app.set('view engine', 'hbs')

// Uses `views` folder as pattern, will change to `templates`
app.set('views', viewsPath)
// console.log(viewsPath)

// hbs method to register a partials dir
hbs.registerPartials(partialsPath)

app.use(express.static(publicFolder))
console.log(publicFolder)
// console.log(partialsPath)

// Express use JSON format
// app.use(bodyParser.urlencoded({ extended: false }))
// app.use(bodyParser.json())
app.use(express.json())


// FrontEnd
// bodyParser parse data from html forms
app.use(express.urlencoded({ extended: false }))
// Express use cookie parser
app.use(cookieParser())
// Allows HTML forms to process PATCH/DELETE requests
app.use(methodOverride('_method'))


// Define app routes
// Users Endpoints
app.use(userRouter)
// Tasks Endpoints
app.use(taskRouter)
// FrontEnd Endpoints
app.use(frontRouter)

// Set App listen port
app.listen(port, () => {
    console.log('Server is up on port ', port)
})