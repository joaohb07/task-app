const mongoose = require('mongoose')

const connectionURL = 'mongodb://127.0.0.1:27017' // 27017 is mongodb default port
const databaseName = '/task-manager-api' // My db name

mongoose.connect(connectionURL + databaseName, {})

