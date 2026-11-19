const express = require('express')
const mongoose = require('mongoose')
const Task = require('../models/task')
const Tag = require('../models/tag')
const auth = require('../middlewares/auth')

const router = new express.Router()

/**
 * Populate options for task queries to include tag details.
 */
const TAG_POPULATE = { path: 'tags', select: 'name color' }
const ALLOWED_PRIORITIES = ['none', 'low', 'medium', 'high']

/**
 * Validates that every provided tag ID exists and belongs to the authenticated user.
 * @param {Array} tagIds - Array of tag IDs to validate.
 * @param {String} userId - The ID of the authenticated user.
 * @returns {Promise<Array>} - Resolves with an array of valid tag IDs.
 * @throws {Error} - Throws an error if validation fails.
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

/**
 * Validates and normalizes the subtasks array payload.
 * @param {Array} subtasks - Array of subtask objects to normalize.
 * @returns {Array} - Normalized array of subtask objects.
 * @throws {Error} - Throws an error if validation fails.
 */
const normalizeSubtasks = (subtasks) => {
  if (!Array.isArray(subtasks)) {
    throw new Error('Subtasks must be an array.')
  }

  return subtasks.map((item) => {
    if (!item || typeof item.title !== 'string' || !item.title.trim()) {
      throw new Error('Each subtask must have a non-empty title.')
    }
    const normalized = {
      title: item.title.trim(),
      completed: Boolean(item.completed)
    }
    if (item._id && mongoose.Types.ObjectId.isValid(item._id)) {
      normalized._id = item._id
    }
    return normalized
  })
}

/** 
 * Create a new task
 * @route POST /tasks
 * @access private
 * @bodyParam {string} description - The description of the task (required).
 * @bodyParam {string} [details] - Optional detailed information about the task.
 * @bodyParam {string} [dueDate] - Optional due date for the task in ISO format.
 * @bodyParam {string} [priority] - Optional priority level ('none', 'low', 'medium', 'high').
 * @bodyParam {Array} [subtasks] - Optional array of subtasks, each with a title and completion status.
 * @bodyParam {boolean} [completed] - Optional completion status of the task (default is false).
 * @bodyParam {Array} [tags] - Optional array of tag IDs associated with the task.
 * @returns {Object} - The created task object with populated tag details.
 * @throws {Error} - Throws an error if validation fails or task creation is unsuccessful.
 */
router.post('/tasks', auth, async (req, res) => {
  try {
    let validatedTags = []
    if (req.body.tags !== undefined) {
      validatedTags = await validateUserTags(req.body.tags, req.user._id)
    }

    let normalizedSubtasks = []
    if (req.body.subtasks !== undefined) {
      normalizedSubtasks = normalizeSubtasks(req.body.subtasks)
    }

    const task = new Task({
      description: req.body.description,
      details: req.body.details ?? '',
      dueDate: req.body.dueDate || null,
      priority: req.body.priority || 'none',
      subtasks: normalizedSubtasks,
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

/** 
 * List tasks with filtering (completed, tag, priority), pagination, and sorting
 * @route GET /tasks
 * @access private
 * @queryParam {boolean} [completed] - Filter tasks by completion status.
 * @queryParam {string} [tag] - Filter tasks by a specific tag ID.
 * @queryParam {string} [priority] - Filter tasks by priority level ('none', 'low', 'medium', 'high').
 * @queryParam {string} [sortBy] - Sort tasks by a field and order (e.g., 'createdAt:desc', 'priority:asc').
 * @queryParam {number} [limit=10] - Limit the number of tasks returned (default is 10).
 * @queryParam {number} [skip=0] - Skip a number of tasks for pagination (default is 0).
 */
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

  if (req.query.priority) {
    if (!ALLOWED_PRIORITIES.includes(req.query.priority)) {
      return res.status(400).send({ error: 'Invalid priority filter.' })
    }
    match.priority = req.query.priority
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':')
    const sortField = parts[0] === 'priority' ? 'priorityOrder' : parts[0]
    sort[sortField] = parts[1] === 'desc' ? -1 : 1
    if (sortField === 'priorityOrder') {
      sort.createdAt = -1
    }
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

/** 
 * Get single task by ID
 * @route GET /tasks/:id
 * @access private
 * @param {string} id - The ID of the task to retrieve.
 * @returns {Object} - The task object with populated tag details.
 * @throws {Error} - Throws an error if the task is not found or retrieval fails.
 */
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

/** 
 * Update task by ID
 * @route PATCH /tasks/:id
 * @access private
 * @param {string} id - The ID of the task to update.
 * @bodyParam {string} [description] - The description of the task.
 * @bodyParam {string} [details] - Optional detailed information about the task.
 * @bodyParam {string} [dueDate] - Optional due date for the task in ISO format.
 * @bodyParam {string} [priority] - Optional priority level ('none', 'low', 'medium', 'high').
 * @bodyParam {Array} [subtasks] - Optional array of subtasks, each with a title and completion status.
 * @bodyParam {boolean} [completed] - Optional completion status of the task.
 * @bodyParam {Array} [tags] - Optional array of tag IDs associated with the task.
 * @returns {Object} - The updated task object with populated tag details.
 * @throws {Error} - Throws an error if the task is not found or update fails.
 */
router.patch('/tasks/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = [
    'description',
    'details',
    'dueDate',
    'priority',
    'subtasks',
    'completed',
    'tags'
  ]
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

    if (req.body.subtasks !== undefined) {
      task.subtasks = normalizeSubtasks(req.body.subtasks)
    }

    for (const update of updates) {
      if (update === 'tags' || update === 'subtasks') continue
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

/** 
 * Delete task by ID
 * @route DELETE /tasks/:id
 * @access private
 * @param {string} id - The ID of the task to delete.
 * @returns {Object} - The deleted task object.
 * @throws {Error} - Throws an error if the task is not found or deletion fails.
 */
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