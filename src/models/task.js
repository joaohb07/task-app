const mongoose = require('mongoose')

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

taskSchema.index({ author: 1, completed: 1, createdAt: -1 })
taskSchema.index({ author: 1, tags: 1 })

const Task = mongoose.model('Task', taskSchema)

module.exports = Task