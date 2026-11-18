const mongoose = require('mongoose')

/**
 * Task schema definition for MongoDB using Mongoose.
 * Each task has a description, optional details, due date, completion status, associated tags, and an author (user).
 * The schema includes timestamps for creation and last update.
 */
const taskSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    details: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ''
    },
    dueDate: {
      type: Date,
      default: null
    },
    completed: {
      type: Boolean,
      default: false
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
      }
    ],
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

// Indexes to optimize queries for tasks by author, completion status, and creation date, as well as by associated tags.
taskSchema.index({ author: 1, completed: 1, createdAt: -1 })
taskSchema.index({ author: 1, tags: 1 })

const Task = mongoose.model('Task', taskSchema)

module.exports = Task