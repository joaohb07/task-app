const connectDB = require('./db/mongoose')
const app = require('./app')

const port = process.env.PORT || 3000

connectDB()
    .then(() => {
        console.log('Connected to MongoDB')
        app.listen(port, () => {
            console.log(`Server is up on port ${port}`)
        })
    })
    .catch((error) => {
        console.error('Failed to connect to MongoDB:', error)
        process.exit(1)
    })