// Import libs
const express = require('express') // Define Router
const multer = require('multer') // Upload files via App Endpoints
const sharp = require('sharp')// Convert large images to smaller
const path = require('path') // Nodejs built-in lib, enables to work with dirs
const bodyParser = require('body-parser')

// Import User model
const User = require('../models/user')

// Import Send Welcome Email
const { sendWelcomeEmail, sendFarewellEmail } = require('../emails/account')

// Import middlewares
const auth = require('../middlewares/auth')

// Create app json parser
const jsonParser = bodyParser.json()
// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// Create new router variable - using express Router
const router = new express.Router()

// Users Endpoints

// Create Users Endpoint
router.post('/users', jsonParser, async (req,res) => {
    console.log(req.body)
    // Define user object as User model
    const user = new User(req.body)

    // Save in MongoDB
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name) // Send Welcome Email
        const token = await user.genToken() // Generate User token
        res.cookie('token', token) // Send token via cookie data
        // res.sendFile(path.resolve(__dirname, '..', 'templates',  'views', 'private.html'))
        res.render('private', { 
            user,
            title: 'Home' 
        })
        // res.status(201).send({ user, token }) // 201 - Created, send task created object
    } catch (error) {
        res.status(400).render('register', { // send an object with essencial information
            title: 'Register',
            name: 'joaohb07',
            display: 'display:block;',
            error
        }) // 400 - Bad Request, send error
    }
})

// Find All Users Endpoint
// Run middleware `auth` for authentication
// router.get('/users', auth, async (req,res) => {

//     try {
//         // Await User.find result
//         const users = await User.find({})
//         res.send(users) // 200 - OK (pattern), Send retrieved Users Object
//     } catch(error) {
//         res.status(500).send() // 500 - Internal Server Error, Send Service Down
//     }
// })

// Find Authenticated User Endpoint
// Run middleware `auth` for authentication
router.get('/users/me', auth, async (req,res) => {
    res.send(req.user) // Send current user authenticated
})

// Find User by id Endpoint
router.get('/users/:id', async (req,res) => {
    const _id = req.params.id

    try {
        // Await User find by id
        const user = await User.findById(_id)

        if (!user) {
            return res.status(404).send({ user: 'Not Found!' }) // 404 - Not Found, Send User not found
        }
        
        res.send(user) // 200 - OK (pattern), Send retrieved User Object

    } catch(error) {
        res.status(500).send(error) // 500 - Internal Server Error, Send Service Down
    }
})

// Update User by id Endpoint
// Run middleware `auth` for authentication
router.patch('/users/me', auth, async (req,res) => { 
    // store request object keys(fields) as an Array of strings
    const updates = Object.keys(req.body)

    // Define allowed Updates Array
    const allowedUpdates = ['name', 'password', 'email', 'age']

    // is valid operation - return boolean, check if request object key(s) are in allowed updates list (Array)
    const isValidOperation = updates.every((update) => {return allowedUpdates.includes(update)})

    // if valid operation is false
    if(!isValidOperation) {
        return res.status(400).send({ error: "Invalid User Update!" }) // 400 - Bad Request, Invalid Update
    }

    try {
        // User find by id - (id from request, object to update from request body, options - new shows the new updated user and run validators runs User fields validation)
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        // Unused because hash password validation doesnt run in findByIdAndUpdate
        
        // Find User by id
        // const user = await User.findById(req.params.id)
        // Unused, not tryng to fetch them by id anymore

        // For each key in updates list, set new values
        updates.forEach((update) => {req.user[update] = req.body[update]})

        // Save modifications - trigger hash password validation as well
        await req.user.save()
        
        // Because of the middleware auth, I don't have to check if the user exists
        // if(!user) {
        //     return res.status(404).send() // 404 - Not Found, Send User not found
        // }

        // res.send(req.user) // 200 - OK (pattern), User updated
        res.render('user', { 
            user: req.user,
            title: 'User Details' 
        }) 

    } catch (error) {
        res.status(500).send(error) // 400 - Internal Server Error, Invalid Update
    }
})

// Delete User Endpoint
// Run middleware `auth` for authentication
router.delete('/users/me', auth, async (req, res) => {
    try {
        // User find by id and remove
        // const user = await User.findByIdAndRemove(req.user._id) // as we using middleware auth, we got access to user _id

        // Check if user exists
        // if(!user){
        //     return res.status(404).send() // 404 - Not Found, Send User not found
        // }

        // As we have user authentication from auth middleware, we can remove the current user
        await req.user.remove() 

        sendFarewellEmail(req.user.email, req.user.name) // Send Farewell email

        res.render('index', { // send an object with essencial information
            title: 'Stack App',
            message: 'Successfully Deleted, Good Bye ' + req.user.name + '!',
            name: 'joaohb07',
            display: 'display:none;'
        }) // 200 - OK (pattern), User deleted
    } catch (error) {
        res.status(500).send(error) // 500 - Internal Server Error, Send Service Down
    }
})

// User Login Endpoint
router.post('/users/login', urlencodedParser, async (req, res) => {
    try {
        // Calls user statics findByCredentials to authenticate the user
        const user = await User.findByCredentials(req.body.email, req.body.password)
        // Generate user token when it returns the user object
        const token = await user.genToken()
        // Send token as cookie data in response
        res.cookie('token', token) // Send token via cookie data
        // Send private html access file, stored in views folder
        // res.sendFile(path.resolve(__dirname, '..', 'templates', 'views', 'private.html'))
        res.render('private', { 
            user,
            token,
            title: 'Home' 
        })
        // res.send({ user, token }) // 200 - OK, Send back user data and current authentication token
    } catch (error) {
        res.status(400).render('index', { // send an object with essencial information
            title: 'Stack App',
            name: 'joaohb07',
            display: 'display:block;',
            error
        }) // 400 - Bad Request, Cannot Authenticate User
    }
})

// User LogOut Endpoint
router.post('/users/logout', auth, async (req, res) => {
    try {
        // Fetch User tokens from request, then filter it 
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token // return only the tokens that are not the one from the request
            // This will automatically remove the auth token from user tokens array
        })

        // Save user after the operation
        await req.user.save()

        res.render('index', { // send an object with essencial information
            title: 'Task App',
            message: 'Successfully Logged Out,' + req.user.name,
            name: 'joaohb07',
            display: 'display:none;'
        }) // 200 - OK, Successfuly log out
    } catch (error) {
        res.status(500).send() // 500 - Internal Server Error, Impossible to LogOut
    }
})

// All User Sessions LogOut Endpoint
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        // Set User tokens array from request as an empty Array 
        req.user.tokens = []

        // Save User after the operation
        await req.user.save()

        // res.send() // 200 - OK, Successfuly log out
        res.render('index', { // send an object with essencial information
            title: 'Task App',
            message: 'Successfully Logged Out from all sessions,' + req.user.name,
            name: 'joaohb07',
            display: 'display:none;'
        })
    } catch (error) {
        res.status(500).send() // 500 - Internal Server Error, Impossible to LogOut from All User Sessions
    }
})

// Define multer options
const upload = multer({
    // dest: 'avatars', // directory folder stack-app/avatars
    limits: {
        fileSize: 1000000 // Bytes, set file size up to 1 MB large
    },
    fileFilter(req, file, callback) {
        // match - regex (regular expression) that matches the file extension
        if(!file.originalname.match(/\.(jpeg|jpg|png)$/)) { // /\.(files|extension)$/
            callback(new Error('File must be an image')) // Send Error
        }

        callback(undefined, true) // Accept upload

        // callback(new Error('File must be an image')) // Send Error
        // callback(undefined, true) // Accept upload
        // callback(undefined, false) // Reject upload
    }
})

// Upload User avatar Endpoint
// Uses multer middleware single to upload the file set by 'avatar' key
// Uses auth middleware
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {

    // Verifying if file exists
    if (!req.file) {
        return res.status(400).render('user', { 
            user: req.user,
            title: 'User Details' 
        })
    }

    // crete a buffer variable for the img, opmtimized by sharp, returned buffer
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    
    req.user.avatar = buffer // binary data from user img file

    // Save user
    await req.user.save()

    res.render('user', { 
        user: req.user,
        title: 'User Details' 
    }) // 200 - OK (pattern), Image Uploaded
}, (error, req, res, next) => { // Handle Express error
    res.status(400).send({error: error.message}) // 400 - Bad Request, File Rejected
})

// Delete User avatar Endpoint
// Uses auth middleware
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined // set user avatar as undefined

    // Save user
    await req.user.save()

    res.render('user', { 
        user: req.user,
        title: 'User Details' 
    }) // 200 - OK (pattern), Image deleted
})

// Get User avatar Endpoint
// Uses auth middleware
router.get('/users/me/avatar', auth, async (req, res) => {
    try {
        // Gets user avatar from authenticated user
        const avatar = req.user.avatar

        if(!avatar || avatar === ""){
            return res.status(404).send() // 404 - Not Found, Image Not Found
        }

        // Set content type of response as image/png, pre opmtimized by sharp
        res.set('Content-Type', 'image/png')
        // Sends user avatar
        res.send(avatar)
    } catch (error) {
        res.status(500).send() // 404 - Internal Server Error, Impossible to fetch avatar
    }
})

// Exports router routes
module.exports = router