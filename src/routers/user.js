// Import libs
const express = require('express')

// Import User model
const User = require('../models/user')

// Create new router variable - using express Router
const router = new express.Router()

// Users Endpoints

// Create Users Endpoint
router.post('/users', async (req,res) => {
    // Define user object as User model
    const user = new User(req.body)

    // Save in MongoDB
    try {
        await user.save()
        res.status(201).send(user) // 201 - Created, send task created object
    } catch (error) {
        res.status(500).send(error) // 400 - Bad Request, send error
    }
})

// Find All Users Endpoint
router.get('/users', async (req,res) => {

    try {
        // Await User.find result
        const users = await User.find({})
        res.send(users) // 200 - OK (pattern), Send retrieved Users Object
    } catch(error) {
        res.status(500).send() // 500 - Internal Server Error, Send Service Down
    }
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
router.patch('/users/:id', async (req,res) => { 
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
        const user = await User.findById(req.params.id)

        // For each key in updates list, set new values
        updates.forEach((update) => {user[update] = req.body[update]})

        // Save modifications - trigger hash password validation as well
        await user.save()
        
        if(!user) {
            return res.status(404).send() // 404 - Not Found, Send User not found
        }

        res.send(user) // 200 - OK (pattern), User updated

    } catch (error) {
        res.status(400).send(error) // 400 - Bad Request, Invalid Update
    }
})

// Delete User Endpoint
router.delete('/users/:id', async (req, res) => {
    try {
        // User find by id and remove
        const user = await User.findByIdAndRemove(req.params.id)

        if(!user){
            return res.status(404).send() // 404 - Not Found, Send User not found
        }

        res.send(user) // 200 - OK (pattern), User deleted
    } catch (error) {
        res.status(500).send(error) // 500 - Internal Server Error, Send Service Down
    }
})

module.exports = router