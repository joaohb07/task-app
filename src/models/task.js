// Import libs
const mongoose = require('mongoose')

// Create Task model with mongoose
const Task = mongoose.model('Task', {
    description: { // define description
        type: String, // description is a string
        required: true, // description is required
        trim: true // extra blank spaces will be removed
    },
    completed: { // define completed
        type: Boolean, // completed is a string
        required: false, // completed is not required
        default: false // default value is false
    }
})

// Export Task
module.exports = Task