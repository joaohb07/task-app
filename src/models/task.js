const mongoose = require('mongoose')

const ALLOWED_PRIORITIES = ['none', 'low', 'medium', 'high']
const PRIORITY_WEIGHTS = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3
}

/**
 * Task schema definition for MongoDB using Mongoose.
 * Each task has a description, optional details, due date, priority, completion status, associated tags, and an author (user).
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
    priority: {
      type: String,
      enum: ALLOWED_PRIORITIES,
      default: 'none'
    },
    priorityOrder: {
      type: Number,
      default: 0
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

taskSchema.pre('validate', function (next) {
  if (this.priority && PRIORITY_WEIGHTS[this.priority] !== undefined) {
    this.priorityOrder = PRIORITY_WEIGHTS[this.priority]
  }
  next()
})

// Indexes to optimize queries for tasks by author, completion status, priority, and tags.
taskSchema.index({ author: 1, completed: 1, createdAt: -1 })
taskSchema.index({ author: 1, priorityOrder: -1, createdAt: -1 })
taskSchema.index({ author: 1, tags: 1 })

const Task = mongoose.model('Task', taskSchema)

module.exports = Task