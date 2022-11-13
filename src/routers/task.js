// Import libs
const express = require('express')

// Import Task model
const Task = require('../models/task')

// Create new router variable - using express Router
const router = new express.Router()

// Tasks Endpoints

// Create Tasks Endpoint
router.post('/tasks', async (req, res) => {
    // Define task object as Task model
    const task = new Task(req.body)

    // Save in MongoDB
    try {
        await task.save()
        res.status(201).send(task) // 201 - Created, send task created object
    } catch(error) {
        res.status(400).send(error) // 400 - Bad Request, send error
    }
})

// Find All Tasks Endpoint
router.get('/tasks', async (req,res) => {

    try {
        // await tasks object result
        const tasks = await Task.find({})
        res.send(tasks) // 200 - OK (pattern), Send retrieved Tasks Object
    } catch(error) {
        res.status(500).send(error) // 500 - Internal Server Error, Send Service Down
    }
})

// Find Task by id Endpoint
router.get('/tasks/:id', async (req,res) => {
    const _id = req.params.id

    try {
        // Await Task find by id 
        const task = await Task.findById(_id)
        if(!task){
            return res.status(404).send({ task: "Not Found!" }) // 404 - Not Found, Send User not found
        }
        res.send(task) // 200 - OK (pattern), Send retrieved User Object
    } catch (error) {
        res.status(500).send(error) // 500 - Internal Server Error, Send Service Down
    }
})

// Update Task by id Endpoint
router.patch('/tasks/:id', async (req,res) => { 
    // store request object keys(fields) as an Array of strings
    const updates = Object.keys(req.body)

    // Define allowed Updates Array
    const allowedUpdates = ['description', 'completed']

    // is valid operation - return boolean, check if request object key(s) are in allowed updates list (Array)
    const isValidOperation = updates.every((update) => {return allowedUpdates.includes(update)})

    // if valid operation is false
    if(!isValidOperation) {
        return res.status(400).send({ error: "Invalid Task Update!" }) // 400 - Bad Request, Invalid Update
    }

    try {
        // Task find by id - (id from request, object to update from request body, options - new: shows the new updated user ; runValidators: runs User fields validation)
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        
        if(!task) {
            return res.status(404).send() // 404 - Not Found, Send User not found
        }

        res.send(task) // 200 - OK (pattern), Task updated

    } catch (error) {
        res.status(400).send(error) // 400 - Bad Request, Invalid Update
    }
})

// Delete Task Endpoint
router.delete('/tasks/:id', async (req, res) => {
    try {
        // Task find by id and remove
        const task = await Task.findByIdAndRemove(req.params.id)

        if(!task){
            return res.status(404).send() // 404 - Not Found, Send Task not found
        }

        res.send(task) // 200 - OK (pattern), Task deleted
    } catch (error) {
        res.status(500).send(error) // 500 - Internal Server Error, Send Service Down
    }
})

module.exports = router