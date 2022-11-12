// Import libs
const mongoose = require('mongoose')
const validator = require('validator')

// Create User model, using mongoose
const User = mongoose.model('User', {
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
    }
})

// Export User
module.exports = User 

// Local Tests
// const me = new User({
//     name: 'Botelho',
//     email: 'botelho@email.com',
//     password: 'phone!a'
// })

// me.save().then(() => {
//     console.log(me)
// }).catch((error) => {
//     console.log(error)
// })