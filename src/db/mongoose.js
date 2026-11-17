const mongoose = require('mongoose')

const connectDB = async () => {
    const connectionURL = process.env.MONGODB_URL_DB || 'mongodb://127.0.0.1:27017/task-manager-api'
    await mongoose.connect(connectionURL)
}

module.exports = connectDB