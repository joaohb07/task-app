const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const { MongoMemoryServer } = require('mongodb-memory-server')
const User = require('../../src/models/user')
const Task = require('../../src/models/task')

let mongoServer

const userOneId = new mongoose.Types.ObjectId()
const userOne = {
    _id: userOneId,
    name: 'João Botelho',
    email: 'joao@example.com',
    password: 'StrongSecret123',
    age: 26,
    tokens: [
        {
            token: jwt.sign({ _id: userOneId.toString() }, process.env.JWT_SECRET || 'test-jwt-secret')
        }
    ]
}

const userTwoId = new mongoose.Types.ObjectId()
const userTwo = {
    _id: userTwoId,
    name: 'Alice Smith',
    email: 'alice@example.com',
    password: 'AnotherSecret123',
    age: 30,
    tokens: [
        {
            token: jwt.sign({ _id: userTwoId.toString() }, process.env.JWT_SECRET || 'test-jwt-secret')
        }
    ]
}

const taskOne = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Write Jest backend tests',
    completed: false,
    author: userOneId
}

const taskTwo = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Deploy Task App container',
    completed: true,
    author: userOneId
}

const taskThree = {
    _id: new mongoose.Types.ObjectId(),
    description: 'User two private task',
    completed: false,
    author: userTwoId
}

/**
 * Starts an in-memory MongoDB instance and connects Mongoose.
 */
const connectTestDB = async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret'
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()
    await mongoose.connect(uri)
}

/**
 * Resets all collections and seeds deterministic users and tasks before each test.
 */
const setupDatabase = async () => {
    await User.deleteMany({})
    await Task.deleteMany({})

    await new User(userOne).save()
    await new User(userTwo).save()
    await new Task(taskOne).save()
    await new Task(taskTwo).save()
    await new Task(taskThree).save()
}

/**
 * Disconnects Mongoose and stops the in-memory MongoDB server.
 */
const disconnectTestDB = async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    if (mongoServer) {
        await mongoServer.stop()
    }
}

module.exports = {
    userOneId,
    userOne,
    userTwoId,
    userTwo,
    taskOne,
    taskTwo,
    taskThree,
    connectTestDB,
    setupDatabase,
    disconnectTestDB
}