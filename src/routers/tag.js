const express = require('express')
const Tag = require('../models/tag')
const Task = require('../models/task')
const auth = require('../middlewares/auth')

const router = new express.Router()

// Create tag
router.post('/tags', auth, async (req, res) => {
  const name = req.body.name?.trim()
  if (!name) {
    return res.status(400).send({ error: 'Tag name is required.' })
  }

  try {
    const existing = await Tag.findOne({
      author: req.user._id,
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    })

    if (existing) {
      return res.status(400).send({ error: 'You already have a tag with this name.' })
    }

    const tag = new Tag({
      name,
      color: req.body.color || 'blue',
      author: req.user._id
    })

    await tag.save()
    res.status(201).send(tag)
  } catch (error) {
    res.status(400).send({ error: error.message || 'Unable to create tag.' })
  }
})

// List tags with pagination & search
// GET /api/tags?limit=5&skip=0&search=dev
router.get('/tags', auth, async (req, res) => {
  const match = { author: req.user._id }

  if (req.query.search) {
    match.name = { $regex: req.query.search.trim(), $options: 'i' }
  }

  const limit = parseInt(req.query.limit, 10) || 50
  const skip = parseInt(req.query.skip, 10) || 0

  try {
    const [tags, total] = await Promise.all([
      Tag.find(match, null, { limit, skip, sort: { name: 1 } }),
      Tag.countDocuments(match)
    ])

    res.send({ tags, total })
  } catch (error) {
    res.status(500).send({ error: 'Unable to fetch tags.' })
  }
})

// Update tag by ID
router.patch('/tags/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'color']
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation || updates.length === 0) {
    return res.status(400).send({ error: 'Invalid tag updates!' })
  }

  try {
    const tag = await Tag.findOne({ _id: req.params.id, author: req.user._id })
    if (!tag) {
      return res.status(404).send({ error: 'Tag not found.' })
    }

    if (req.body.name !== undefined) {
      const trimmed = req.body.name.trim()
      if (!trimmed) {
        return res.status(400).send({ error: 'Tag name cannot be empty.' })
      }

      const duplicate = await Tag.findOne({
        _id: { $ne: tag._id },
        author: req.user._id,
        name: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      })

      if (duplicate) {
        return res.status(400).send({ error: 'You already have a tag with this name.' })
      }
      tag.name = trimmed
    }

    if (req.body.color !== undefined) {
      tag.color = req.body.color
    }

    await tag.save()
    res.send(tag)
  } catch (error) {
    res.status(400).send({ error: error.message || 'Unable to update tag.' })
  }
})

// Delete tag by ID and detach it from user's tasks
router.delete('/tags/:id', auth, async (req, res) => {
  try {
    const tag = await Tag.findOneAndDelete({ _id: req.params.id, author: req.user._id })
    if (!tag) {
      return res.status(404).send({ error: 'Tag not found.' })
    }

    await Task.updateMany(
      { author: req.user._id, tags: tag._id },
      { $pull: { tags: tag._id } }
    )

    res.send(tag)
  } catch (error) {
    res.status(500).send({ error: 'Unable to delete tag.' })
  }
})

module.exports = router