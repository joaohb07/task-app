// Import libs
const mongoose = require('mongoose')

// Define new Mongoose Schema - for using timestamps
const taskSchema = new mongoose.Schema({
    description: { // define description
        type: String, // description is a string
        required: true, // description is required
        trim: true // extra blank spaces will be removed
    },
    completed: { // define completed
        type: Boolean, // completed is a string
        required: false, // completed is not required
        default: false // completed default value is false
    },
    author: { // define author
        type: mongoose.Schema.Types.ObjectId, // author will be the user id that created the task
        required: true, // author will be required to create a task
        ref: 'User' // author will be a reference to User model
    }
},{ // define Schema options
    timestamps: true // Allows to have timestamps, createdAt and updateAt - to track objects
})

// Create Task model with mongoose
const Task = mongoose.model('Task', taskSchema)

// Export Task
module.exports = Task