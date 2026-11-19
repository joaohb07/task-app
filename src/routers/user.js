const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const Tag = require('../models/tag')
const { sendWelcomeEmail, sendFarewellEmail } = require('../emails/account')
const auth = require('../middlewares/auth')

const router = new express.Router()

/** 
 * Register a new user,
 * allows users to create a new account with a unique email and a password.
 * @route POST /users
 * @access public
 * @bodyParam {string} name - The name of the user (required).
 * @bodyParam {string} email - The email of the user (required, must be unique).
 * @bodyParam {string} password - The password for the account (required, minimum length 7).
 * @bodyParam {number} [age] - Optional age of the user.
 * @returns {Object} - The created user object and an authentication token.
 * @throws {Error} - Throws an error if validation fails or user creation is unsuccessful.
 */
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.genToken()
        res.status(201).send({ user, token })
    } catch (error) {
        res.status(400).send({ error: error.message || 'Unable to register user.' })
    }
})

/** 
 * Login user,
 * allows users to authenticate with their email and password.
 * @route POST /users/login
 * @access public
 * @bodyParam {string} email - The email of the user (required).
 * @bodyParam {string} password - The password for the account (required).
 * @returns {Object} - The authenticated user object and an authentication token.
 * @throws {Error} - Throws an error if authentication fails.
 */
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.genToken()
        res.send({ user, token })
    } catch (error) {
        res.status(400).send({ error: error.message || 'Unable to login.' })
    }
})

/** 
 * Logout current session,
 * allows users to logout of their current session.
 * @route POST /users/logout
 * @access private
 */
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((t) => t.token !== req.token)
        await req.user.save()
        res.send({ message: 'Logged out successfully.' })
    } catch (error) {
        res.status(500).send({ error: 'Failed to logout.' })
    }
})

/** 
 * Logout all sessions,
 * allows users to logout from all active sessions.
 * @route POST /users/logoutAll
 * @access private
 */
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send({ message: 'Logged out from all sessions.' })
    } catch (error) {
        res.status(500).send({ error: 'Failed to logout from all sessions.' })
    }
})

/** 
 * Get authenticated user profile,
 * allows users to fetch their own profile information.
 * @route GET /users/me
 * @access private
 */
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

/** 
 * Update authenticated user profile,
 * allows users to update their own profile information.
 * @route PATCH /users/me
 * @access private
 * @bodyParam {string} [name] - The new name of the user (optional).
 * @bodyParam {string} [email] - The new email of the user (optional, must be unique).
 * @bodyParam {string} [password] - The new password for the account (optional, minimum length 7).
 * @bodyParam {number} [age] - The new age of the user (optional).
 * @returns {Object} - The updated user object.
 * @throws {Error} - Throws an error if validation fails or update is unsuccessful.
 */
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'password', 'email', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid user updates!' })
    }

    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update]
        })
        await req.user.save()
        res.send(req.user)
    } catch (error) {
        res.status(400).send({ error: error.message || 'Unable to update profile.' })
    }
})

/** 
 * Delete authenticated user account,
 * allows users to delete their own account and associated data.
 * @route DELETE /users/me
 * @access private
 * @returns {Object} - The deleted user object.
 * @throws {Error} - Throws an error if deletion fails.
 */
router.delete('/users/me', auth, async (req, res) => {
    try {
        const { email, name } = req.user
        await req.user.deleteOne()
        sendFarewellEmail(email, name)
        res.send(req.user)
    } catch (error) {
        res.status(500).send({ error: 'Unable to delete account.' })
    }
})

/** 
 * Upload / Update avatar,
 * allows users to upload or update their avatar image.
 * @route POST /users/me/avatar
 * @access private
 * @bodyParam {file} avatar - The avatar image file to upload (JPEG, JPG, or PNG).
 * @returns {Object} - A success message and the updated user object with avatar.
 * @throws {Error} - Throws an error if the file is not an image or upload fails.
 */
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpeg|jpg|png)$/i)) {
            return callback(new Error('File must be a JPEG, JPG, or PNG image.'))
        }
        callback(undefined, true)
    }
})

/** 
 * Upload / Update avatar,
 * allows users to upload or update their avatar image.
 * @route POST /users/me/avatar
 * @access private
 * @bodyParam {file} avatar - The avatar image file to upload (JPEG, JPG, or PNG).
 * @returns {Object} - A success message and the updated user object with avatar.
 * @throws {Error} - Throws an error if the file is not an image or upload fails.
 */
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: 'Please select an image file to upload.' })
    }

    const buffer = await sharp(req.file.buffer)
        .resize({ width: 250, height: 250 })
        .png()
        .toBuffer()

    req.user.avatar = buffer
    await req.user.save()
    res.send({ message: 'Avatar uploaded successfully.', hasAvatar: true })
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

/** 
 * Delete avatar,
 * allows users to remove their avatar image.
 * @route DELETE /users/me/avatar
 * @access private
 * @returns {Object} - A success message indicating the avatar has been removed.
 * @throws {Error} - Throws an error if deletion fails.
 */
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send({ message: 'Avatar removed.', hasAvatar: false })
})

/** 
 * Fetch avatar binary image,
 * allows users to view their own avatar image or fetch another user's avatar by ID.
 * @route GET /users/me/avatar
 * @access private
 * @returns {Buffer} - The binary image data of the user's avatar.
 * @throws {Error} - Throws an error if the avatar is not found or retrieval fails.
 */
router.get('/users/me/avatar', auth, async (req, res) => {
    try {
        if (!req.user.avatar) {
            return res.status(404).send({ error: 'Avatar not found.' })
        }
        res.set('Content-Type', 'image/png')
        res.send(req.user.avatar)
    } catch (error) {
        res.status(500).send()
    }
})

/** 
 * Fetch avatar binary image by user ID,
 * allows users to fetch another user's avatar by ID.
 * @route GET /users/:id/avatar
 * @access public
 * @param {string} id - The ID of the user whose avatar is to be fetched.
 * @returns {Buffer} - The binary image data of the user's avatar.
 * @throws {Error} - Throws an error if the user or avatar is not found or retrieval fails.
 */
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            return res.status(404).send()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (error) {
        res.status(404).send()
    }
})

module.exports = router