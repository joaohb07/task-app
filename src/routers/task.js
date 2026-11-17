const express = require('express')
const Task = require('../models/task')
const auth = require('../middlewares/auth')

const router = new express.Router()

// Create task
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        author: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send({ error: error.message || 'Unable to create task.' })
    }
})

// List tasks with filtering, sorting, and pagination metadata
// GET /api/tasks?completed=true&limit=10&skip=0&sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = { author: req.user._id }
    const sort = {}

    if (req.query.completed === 'true' || req.query.completed === 'false') {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    } else {
        sort.createdAt = -1
    }

    const limit = parseInt(req.query.limit, 10) || 10
    const skip = parseInt(req.query.skip, 10) || 0

    try {
        const [tasks, total, completedCount] = await Promise.all([
            Task.find(match, null, { limit, skip, sort }),
            Task.countDocuments(match),
            Task.countDocuments({ author: req.user._id, completed: true })
        ])

        const totalAll = await Task.countDocuments({ author: req.user._id })

        res.send({
            tasks,
            total,
            stats: {
                total: totalAll,
                completed: completedCount,
                pending: totalAll - completedCount
            }
        })
    } catch (error) {
        res.status(500).send({ error: 'Unable to fetch tasks.' })
    }
})

// Get single task by ID
router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, author: req.user._id })
        if (!task) {
            return res.status(404).send({ error: 'Task not found.' })
        }
        res.send(task)
    } catch (error) {
        res.status(500).send({ error: 'Unable to fetch task.' })
    }
})

// Update task by ID
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid task updates!' })
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, author: req.user._id })
        if (!task) {
            return res.status(404).send({ error: 'Task not found.' })
        }

        updates.forEach((update) => {
            task[update] = req.body[update]
        })
        await task.save()
        res.send(task)
    } catch (error) {
        res.status(400).send({ error: error.message || 'Unable to update task.' })
    }
})

// Delete task by ID
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, author: req.user._id })
        if (!task) {
            return res.status(404).send({ error: 'Task not found.' })
        }
        res.send(task)
    } catch (error) {
        res.status(500).send({ error: 'Unable to delete task.' })
    }
})

module.exports = router