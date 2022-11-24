const express = require('express') // Define Router
const bodyParser = require('body-parser')

// Import User model
const User = require('../models/user')

// Import middlewares
const auth = require('../middlewares/auth')

// Create router json parser
const jsonParser = bodyParser.json()
// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// Create new router variable - using express Router
const router = new express.Router()

// Define index route
router.get('/', (req,res) => {
    res.render('index', { // send an object with essencial information
        title: 'Task App',
        name: 'joaohb07',
        display: 'display:none;'
    }) // send an object with essencial information
})

// Define register route
router.get('/register', (req,res) => {
    res.render('register', { // send an object with essencial information
        title: 'Register',
        name: 'joaohb07',
        display: 'display:none;'
    }) // send an object with essencial information
})

// Front end
router.get('/private', auth, async (req, res) => {
    try {
        res.render('private', { 
            user: req.user,
            title: 'Home' 
        })
    } catch (error) {
        res.status(404).send() // 404 - Not Found
    }
})

router.get('/createtask', auth, async (req, res) => {
    try {
        res.render('createtask', { 
            user: req.user,
            title: 'Create Task',
            display: 'display: none;'  
        })
    } catch (error) {
        res.status(404).send() // 404 - Not Found
    }
})


router.get('/viewtask', auth, async (req, res) => {
    try {
        res.render('tasks', { 
            user: req.user,
            title: 'View Tasks',
            display: 'display: none;'  
        })
    } catch (error) {
        res.status(404).send() // 404 - Not Found
    }
})

router.get('/userpage', auth, async (req, res) => {
    try {
        res.render('user', { 
            user: req.user,
            title: 'User Details' 
        })
    } catch (error) {
        res.status(404).send() // 404 - Not Found
    }
})


// Exports router routes
module.exports = router