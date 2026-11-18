const mongoose = require('mongoose')

// List of allowed colors for tags.
const ALLOWED_COLORS = [
  'blue',
  'teal',
  'purple',
  'magenta',
  'cyan',
  'green',
  'warm-gray',
  'cool-gray'
]

/**
 * Tag schema definition for MongoDB using Mongoose.
 * Each tag has a name, color, and an associated author (user).
 * The schema includes timestamps for creation and last update.
 */
const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30
    },
    color: {
      type: String,
      enum: ALLOWED_COLORS,
      default: 'blue'
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

// Prevent duplicate tag names per user (case-insensitive via collation or normalized check)
tagSchema.index({ author: 1, name: 1 }, { unique: true })

const Tag = mongoose.model('Tag', tagSchema)

module.exports = Tag