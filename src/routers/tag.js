const express = require('express')
const Tag = require('../models/tag')
const Task = require('../models/task')
const auth = require('../middlewares/auth')

const router = new express.Router()

/** 
 * Create a new tag,
 * allows users to create a new tag with a unique name and an optional color.
 * @route POST /tags
 * @access private
 * @bodyParam {string} name - The name of the tag (required).
 * @bodyParam {string} [color] - Optional color for the tag (default is 'blue').
 * @returns {Object} - The created tag object.
 * @throws {Error} - Throws an error if validation fails or tag creation is unsuccessful.
 */
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

/** 
 * List tags with pagination & search,
 * allows users to fetch their tags with optional search by name, and supports pagination through limit and skip query parameters.
 * @route GET /tags
 * @access private
 * @queryParam {string} [search] - Optional search term to filter tags by name (case-insensitive).
 * @queryParam {number} [limit=50] - Limit the number of tags returned (default is 50).
 * @queryParam {number} [skip=0] - Skip a number of tags for pagination (default is 0).
 * @returns {Object} - An object containing the list of tags and the total count.
 * @throws {Error} - Throws an error if fetching tags fails.
 */
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

/** 
 * Update tag by ID,
 * allows updating the name and color of a tag, ensuring that the new name is unique for the user and not empty.
 * @route PATCH /tags/:id
 * @access private
 * @param {string} id - The ID of the tag to update.
 * @bodyParam {string} [name] - The new name for the tag (optional).
 * @bodyParam {string} [color] - The new color for the tag (optional).
 * @returns {Object} - The updated tag object.
 * @throws {Error} - Throws an error if validation fails, the tag is not found, or the update is unsuccessful.
*/
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

/** 
 * Delete tag by ID and detach it from user's tasks,
 * also removes the tag from any tasks that reference it to maintain data integrity.
 * This ensures that when a tag is deleted, it does not leave orphaned references in tasks.
 * @route DELETE /tags/:id
 * @access private
 * @param {string} id - The ID of the tag to delete.
 * @returns {Object} - The deleted tag object.
 * @throws {Error} - Throws an error if the tag is not found or deletion fails.
 */
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