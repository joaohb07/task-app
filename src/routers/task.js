const express = require('express')
const mongoose = require('mongoose')
const Task = require('../models/task')
const Tag = require('../models/tag')
const auth = require('../middlewares/auth')

const router = new express.Router()

const TAG_POPULATE = { path: 'tags', select: 'name color' }

/**
 * Validates that every provided tag ID exists and belongs to the authenticated user.
 * Returns deduplicated ObjectId strings or throws an Error if any tag is invalid/unauthorized.
 */
const validateUserTags = async (tagIds, userId) => {
  if (!Array.isArray(tagIds)) {
    throw new Error('Tags must be an array of tag IDs.')
  }

  const uniqueIds = [...new Set(tagIds.map(String))]
  if (uniqueIds.length === 0) return []

  const allValidIds = uniqueIds.every((id) => mongoose.Types.ObjectId.isValid(id))
  if (!allValidIds) {
    throw new Error('One or more tag IDs are invalid.')
  }

  const ownedTags = await Tag.find({
    _id: { $in: uniqueIds },
    author: userId
  }).select('_id')

  if (ownedTags.length !== uniqueIds.length) {
    throw new Error('One or more selected tags were not found.')
  }

  return uniqueIds
}

// Create task
router.post('/tasks', auth, async (req, res) => {
  try {
    let validatedTags = []
    if (req.body.tags !== undefined) {
      validatedTags = await validateUserTags(req.body.tags, req.user._id)
    }

    const task = new Task({
      description: req.body.description,
      details: req.body.details ?? '',
      dueDate: req.body.dueDate || null,
      completed: Boolean(req.body.completed),
      tags: validatedTags,
      author: req.user._id
    })

    await task.save()
    await task.populate(TAG_POPULATE)

    res.status(201).send(task)
  } catch (error) {
    res.status(400).send({ error: error.message || 'Unable to create task.' })
  }
})

// List tasks with filtering (completed, tag), pagination, and sorting
// GET /api/tasks?completed=true&tag=<id>&limit=10&skip=0&sortBy=dueDate:asc
router.get('/tasks', auth, async (req, res) => {
  const match = { author: req.user._id }
  const sort = {}

  if (req.query.completed) {
    match.completed = req.query.completed === 'true'
  }

  if (req.query.tag) {
    if (!mongoose.Types.ObjectId.isValid(req.query.tag)) {
      return res.status(400).send({ error: 'Invalid tag filter ID.' })
    }
    match.tags = req.query.tag
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
    const [tasks, total, totalAll, completedCount] = await Promise.all([
      Task.find(match, null, { limit, skip, sort }).populate(TAG_POPULATE),
      Task.countDocuments(match),
      Task.countDocuments({ author: req.user._id }),
      Task.countDocuments({ author: req.user._id, completed: true })
    ])

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
    const task = await Task.findOne({ _id: req.params.id, author: req.user._id }).populate(
      TAG_POPULATE
    )
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
  const allowedUpdates = ['description', 'details', 'dueDate', 'completed', 'tags']
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation || updates.length === 0) {
    return res.status(400).send({ error: 'Invalid updates!' })
  }

  try {
    const task = await Task.findOne({ _id: req.params.id, author: req.user._id })
    if (!task) {
      return res.status(404).send({ error: 'Task not found.' })
    }

    if (req.body.tags !== undefined) {
      task.tags = await validateUserTags(req.body.tags, req.user._id)
    }

    for (const update of updates) {
      if (update === 'tags') continue
      if (update === 'dueDate') {
        task.dueDate = req.body.dueDate || null
      } else {
        task[update] = req.body[update]
      }
    }

    await task.save()
    await task.populate(TAG_POPULATE)

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