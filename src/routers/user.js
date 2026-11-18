const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const Tag = require('../models/tag')
const { sendWelcomeEmail, sendFarewellEmail } = require('../emails/account')
const auth = require('../middlewares/auth')

const router = new express.Router()

// Register a new user
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

// Login user
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.genToken()
        res.send({ user, token })
    } catch (error) {
        res.status(400).send({ error: error.message || 'Unable to login.' })
    }
})

// Logout current session
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((t) => t.token !== req.token)
        await req.user.save()
        res.send({ message: 'Logged out successfully.' })
    } catch (error) {
        res.status(500).send({ error: 'Failed to logout.' })
    }
})

// Logout all sessions
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send({ message: 'Logged out from all sessions.' })
    } catch (error) {
        res.status(500).send({ error: 'Failed to logout from all sessions.' })
    }
})

// Get authenticated user profile
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

// Update authenticated user profile
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

// Delete authenticated user account
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

// Multer config for avatar uploads (max 1MB, png/jpg/jpeg)
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

// Upload / Update avatar
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

// Delete avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send({ message: 'Avatar removed.', hasAvatar: false })
})

// Fetch avatar binary image (authenticated or by user ID for <img> tags)
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