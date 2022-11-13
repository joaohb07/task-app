const mongoose = require('mongoose')

const connectionURL = process.env.MONGODB_URL_DB // 27017 is mongodb default port
// const databaseName = '' // My db name

mongoose.connect(connectionURL, {})

