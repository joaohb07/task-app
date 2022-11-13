// Import libs
const mongoose = require('mongoose') // for db definitions
const validator = require('validator') // for validating email
const bcrypt = require('bcryptjs') // for hashing User Password
const jwt = require('jsonwebtoken') // for generate Web Tokn for authentication

// Import Task model
const Task = require('./task')

// Define new Mongoose Schema - for bcrypt validation with middleware
const userSchema = new mongoose.Schema({
    name: { // define name
        type: String, // name is a string
        required: true, // name is required
        trim: true // extra blank spaces will be removed
    },
    password: { // define password
        type: String, // password is a string
        required: true, // password is required
        trim: true, // extra blank spaces will be removed
        minLength: 7, // password length has to be > 6
        validate(value) { // validation step, receives field value
            if(value.toLowerCase().includes("password")){ // password cannot be "password"
                throw new Error('Password cannot be "password"!') // throws Error message
            }
        }
    },
    email: { // define email
        type: String, // email is a string
        unique: true, // email is unique for each user
        required: true, // email is required
        trim: true, // extra blank spaces will be removed
        validate(value) { // validation step, receives field value
            if(!validator.isEmail(value)){ // uses isEmail method from validator lib to validate email
                throw new Error('Invalid email') // throws Error message
            }
        }
    },
    age: { // define age
        type: Number, // email is a number
        validate(value) { // validation step, receives field value
            if (value < 0){ // age cannot be < 0
                throw new Error('Age must be a positive number!') // throws Error message
            }
        }
    },
    avatar: { // define avatar
        type: Buffer // avatar is a buffer containing file data
    },
    tokens: [{ // define authentication tokens array
        token: { // define token
            type: String, // token is a string, provided by jwt lib
            required: true // token is required
        }
    }] // I will use this set of tokens to authenticate users when they log in the app
}, { // define Schema options
    timestamps: true // Allows to have timestamps, createdAt and updateAt - to track objects
})

// Virtual Property - relationship between User and Task
userSchema.virtual('userTasks', {
    ref: 'Task', // userTasks will be a reference to Task model
    localField: '_id', // userTasks local field is User Id
    foreignField: 'author' // userTasks foreignField is Task author
})

// Whenever Mongoose Access an object, it will call toJSON function.
// This function Enables to remove sensitive data from responses, such as
// auth tokens and password (even though is hashed)
userSchema.methods.toJSON = function() {
    const user = this // this = user object

    // Create user object using mongoose toObject
    const userObject = user.toObject()

    // Eemove password
    delete userObject.password
    // Remove tokens array
    delete userObject.tokens
    // Remove avatar binary data
    delete userObject.avatar
    
    // Return Updated userObject
    return userObject
}


// Define method to generate authentication token - used when user is created and when user logs in
userSchema.methods.genToken = async function () {
    const user = this // this = user object

    // use jwt sign method to create new token, JWT_SECRET is the secret defined by me so jwt can move forward with this process
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    // Concat generated token to user tokens array
    user.tokens = user.tokens.concat({ token })
    // save in database
    await user.save()

    // return generated token
    return token
}

// Define middleware method to Login
userSchema.statics.findByCredentials = async (email, password) => {
    // Find user by email
    const user = await User.findOne({ email })

    // Check if exists
    if (!user) {
        throw new Error('Unable to Login!')
    }

    // Matches user hashed password with the one stored in database, with bcryptjs compare method
    const isMatch = await bcrypt.compare(password, user.password)

    // Check if exists
    if (!isMatch) {
        throw new Error('Unable to Login!')
    }

    // Return user object
    return user
}

// Hash password before save to database, happens everytime `user.save()` operation is called
// A middleware that does something before making the request
userSchema.pre('save', async function (next) {
    const user = this // this - user object about to be saved
    // If user password field is modified, it will hash it
    if (user.isModified('password')) {
        // Hash user password using bcryptjs hash method
        user.password = await bcrypt.hash(user.password, 8) // 8 = rounds number, standard
    }

    // call next function, which is save function to save user, proceed with the request
    next()
})

// Delete user tasks when user is removed
// A middleware that does something before making the request
userSchema.pre('remove', async function(next) {
    const user = this // this - user object about to be saved

    // Delete all the tasks that matches up with the deleted user (author)
    await Task.deleteMany({ author: user._id })

    // call next function, which is remove function to remove user, proceed with the request
    next()
})

// Create User model, using mongoose
const User = mongoose.model('User', userSchema)

// Export User
module.exports = User 