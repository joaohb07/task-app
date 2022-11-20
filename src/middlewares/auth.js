// Import Libs
const jwt = require('jsonwebtoken') // For Token validation

// Import Models
const User = require('../models/user')

// Create middleware for authentication
const auth = async (req, res, next) => {
    try {  
        const token = req.cookies['token']// Uses token passed by request header, removing 'Bearer ' initial string || fetch it from cookies req.header('Authorization').replace('Bearer ','') 

        const decoded = jwt.verify(token, process.env.JWT_SECRET) // Uses jwt verify method to decode the token and return the User id stored in it

        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token }) // Find user by decoded id and that has the token

        // Check if user exists
        if(!user) {
            throw new Error() // throw error
        }

        // Add token to the request, so it can be access later
        req.token = token
        // Add user to the request, so it can be access later
        req.user = user
        next()
        // console.log(token)
    } catch (error) {
        res.status(401).render('index',{ 
            error,
            display: 'display:block;',
            title: 'Stack App',
            name: 'joaohb07', 
        }) // 401 - Unauthorized, Sends back an error
    }
}
// Export middleware
module.exports = auth