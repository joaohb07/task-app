// Import libs
const express = require('express')

// Import Task model
const Task = require('../models/task')

// Import Middlewares
const auth = require('../middlewares/auth')
const paginate = require('../middlewares/paginate')

// Create new router variable - using express Router
const router = new express.Router()

// Tasks Endpoints

// Create Tasks Endpoint
// Run middleware `auth` for authentication
router.post('/tasks', auth, async (req, res) => {
    // Define task object as Task model
    const task = new Task({
        ...req.body, // copy body request to task object
        author: req.user._id // With auth middleware, we can fecth user id of our authenticated user
    })

    // Save in MongoDB
    try {
        await task.save()
        // res.status(201).send(task) // 201 - Created, send task created object
        res.status(201).render('createtask', { 
            user: req.user,
            title: 'View Tasks',
            task,
            action: 'Created',
            display: "display: block;" 
        })
    } catch(error) {
        // res.status(400).send(error) // 400 - Bad Request, send error
        res.status(400).render('private', { 
            user: req.user,
            token: req.token,
            title: error
        })
    }
})

// Find All Tasks Endpoint
// Run middleware `auth` for authentication
router.get('/tasks', auth, async (req,res) => {

    // Create a new sort object for filtering data
    const sort = {}

    // Create a new match object for filtering data
    const match = { // always will include author for validation
        author: req.user._id // req.user provided by authentication
    }

    // if the request receives completed as parameter add to match object
    if (req.query.completed) { // url/tasks?completed=true || false
        match.completed = req.query.completed === 'true' // Add completed passed to match object
    }

    // if the request receives sortBy as parameter add its value to sort object
    if (req.query.sortBy) { // url/tasks?sortBy=completed||createdAt||updatedAt:desc(for descending order)||asc(for ascending order)
       const parts = req.query.sortBy.split(':') // divide value, orde
       sort[parts[0]] = parts[1] === 'desc' ? -1 : 1// first part - value, second part - order
    }
    const limit = 4
    var count = 0
    var pages = [1]


    try {
        // Find tasks by match

        const tasks = await Task.find(match)

        for(task in tasks) {
            count++
            if (count % 4 == 0){
                pages.push(pages.length + 1)
            }
        }

        // console.log(pages)

        var skip = (req.query.page - 1) * limit
        // console.log(pages)
        // Set project parameter to null
        const tasks_selected = await Task.find(match, null, { // find options
            skip: skip, // skip (for pagination), only if set as query param in the request
            limit: limit, // limit (for pagination), only if set as query param in the request
            sort
        }) // match object to find specified data

        // Another solution would be
        // await req.user.populate({
        //     path: 'tasks', // where tasks retrieved will be stored
        //     match,
        //     strictPopulate: false
        // }).execPopulate()
        // This would fill user with its tasks matched by author(user) id
        res.render('tasks',{
            user: req.user,
            title: 'View Tasks',
            display: 'display: none;', 
            tasks: tasks_selected,
            pages,
            completed: match.completed
        }) // 200 - OK (pattern), Send retrieved Tasks Object
    } catch(error) {
        res.status(500).send(error) // 500 - Internal Server Error, Send Service Down
    }
})

// Find Task by id Endpoint
// Run middleware `auth` for authentication
router.get('/tasks/:id', auth, async (req,res) => {
    const _id = req.params.id

    try {
        // Await Task find by id 
        // const task = await Task.findById(_id)

        // Finds task by id and author (user) id
        const task = await Task.findOne({_id, author: req.user._id})

        if(!task){
            return res.status(404).send({ task: "Not Found!" }) // 404 - Not Found, Send User not found
        }
        res.send(task) // 200 - OK (pattern), Send retrieved User Object
    } catch (error) {
        res.status(500).send(error) // 500 - Internal Server Error, Send Service Down
    }
})

// Update Task by id Endpoint
// Run middleware `auth` for authentication
router.patch('/tasks/:id', auth, async (req,res) => { 
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
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

        const task = await Task.findOne({ _id: req.params.id, author: req.user._id })
        
        if(!task) {
            return res.status(404).send() // 404 - Not Found, Send User not found
        }

        // Spdate value(s) for each task in task Object
        updates.forEach((update) => task[update] = req.body[update])

        // Save task
        await task.save()

        res.render('tasks', { 
            user: req.user,
            title: 'View Tasks',
            task,
            action: 'Updated',
            display: "display: block;" 
        }) // 200 - OK (pattern), Task updated

    } catch (error) {
        res.status(500).send() // 500 - Internal Server Error,
    }
})

// Delete Task Endpoint
// Run middleware `auth` for authentication
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        // Task find by id and remove
        // const task = await Task.findByIdAndRemove(req.params.id)

        // Find tasks by id and author's is and remove
        const task = await Task.findOneAndDelete({ _id: req.params.id, author: req.user._id }) // with auth middleware we have access to the authenticated user id

        if(!task){
            return res.status(404).send() // 404 - Not Found, Send Task not found
        }

        // res.send(task) // 200 - OK (pattern), Task deleted

        res.render('tasks', { 
            user: req.user,
            title: 'View Tasks',
            task,
            action: 'Deleted',
            display: "display: block;" 
        })

    } catch (error) {
        res.status(500).send(error) // 500 - Internal Server Error, Send Service Down
    }
})

module.exports = router