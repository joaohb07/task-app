const mongoose = require('mongoose')

/**
 * Connects to MongoDB using `MONGODB_URL_DB` or the local `task-manager-api` database.
 * @returns {Promise<void>} Resolves once the connection is established.
 */
const connectDB = async () => {
    const connectionURL = process.env.MONGODB_URL_DB || 'mongodb://127.0.0.1:27017/task-manager-api'
    await mongoose.connect(connectionURL)
}

module.exports = connectDB
