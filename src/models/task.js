const mongoose = require('mongoose')

/**
 * Allowed priority levels for tasks.
 * Each priority level has an associated weight for sorting and comparison purposes.
 */
const ALLOWED_PRIORITIES = ['none', 'low', 'medium', 'high']
const PRIORITY_WEIGHTS = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3
}

/**
 * Subtask schema definition for MongoDB using Mongoose.
 * Each subtask has a title and a completion status.
 */
const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  completed: {
    type: Boolean,
    default: false
  }
})

/**
 * Task schema definition for MongoDB using Mongoose.
 * Each task has a description, optional details, due date, priority, subtasks, completion status, associated tags, and an author (user).
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
    subtasks: {
      type: [subtaskSchema],
      default: []
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

/**
 * Pre-validation hook to set the priorityOrder based on the priority string.
 * This ensures that tasks can be sorted by priority efficiently.
 */
taskSchema.pre('validate', function (next) {
  if (this.priority && PRIORITY_WEIGHTS[this.priority] !== undefined) {
    this.priorityOrder = PRIORITY_WEIGHTS[this.priority]
  }
  next()
})

/**
 * Indexes for the task schema to optimize query performance.
 * Indexes are created on author, completed status, creation date, priority order, and tags.
 */
taskSchema.index({ author: 1, completed: 1, createdAt: -1 })
taskSchema.index({ author: 1, priorityOrder: -1, createdAt: -1 })
taskSchema.index({ author: 1, tags: 1 })

const Task = mongoose.model('Task', taskSchema)

module.exports = Task