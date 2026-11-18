const jwt = require('jsonwebtoken')
const User = require('../models/user')

/**
 * Middleware function to authenticate requests using JWT.
 * It checks for the presence of a valid JWT in the Authorization header.
 * If the token is valid, it attaches the user and token to the request object.
 * If the token is invalid or missing, it responds with a 401 Unauthorized status.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error()
        }

        const token = authHeader.replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        if (!user) {
            throw new Error()
        }

        req.token = token
        req.user = user
        next()
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate.' })
    }
}

module.exports = auth