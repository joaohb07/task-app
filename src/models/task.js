const mongoose = require('mongoose')

/**
 * Allowed priority levels and Kanban workflow statuses for tasks.
 */
const ALLOWED_PRIORITIES = ['none', 'low', 'medium', 'high']
const ALLOWED_STATUSES = ['todo', 'wip', 'done']

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
 * Each task has a description, optional details, due date, priority, Kanban status,
 * subtasks, completion flag, associated tags, and an author (user).
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
    status: {
      type: String,
      enum: ALLOWED_STATUSES,
      default: 'todo'
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
 * Pre-validation hook to synchronize priorityOrder, Kanban status, and completed boolean.
 */
taskSchema.pre('validate', function (next) {
  if (this.priority && PRIORITY_WEIGHTS[this.priority] !== undefined) {
    this.priorityOrder = PRIORITY_WEIGHTS[this.priority]
  }

  if (this.isModified('status') && !this.isModified('completed')) {
    this.completed = this.status === 'done'
  } else if (this.isModified('completed') && !this.isModified('status')) {
    if (this.completed) {
      this.status = 'done'
    } else if (this.status === 'done') {
      this.status = 'todo'
    }
  } else if (this.completed && this.status !== 'done') {
    this.status = 'done'
  } else if (!this.completed && this.status === 'done') {
    this.completed = true
  }

  next()
})

/**
 * Indexes to optimize query performance for tasks based on author, completion status,
 * Kanban status, priority order, and tags.
 */
taskSchema.index({ author: 1, completed: 1, createdAt: -1 })
taskSchema.index({ author: 1, status: 1, createdAt: -1 })
taskSchema.index({ author: 1, priorityOrder: -1, createdAt: -1 })
taskSchema.index({ author: 1, tags: 1 })

const Task = mongoose.model('Task', taskSchema)

module.exports = Task