const request = require('supertest')
const app = require('../../src/app')
const User = require('../../src/models/user')
const Task = require('../../src/models/task')
const {
    userOneId,
    userOne,
    connectTestDB,
    setupDatabase,
    disconnectTestDB
} = require('../fixtures/db')

// Mock SendGrid email helpers to avoid external calls during tests
jest.mock('../../src/emails/account', () => ({
    sendWelcomeEmail: jest.fn(),
    sendFarewellEmail: jest.fn()
}))

const { sendWelcomeEmail, sendFarewellEmail } = require('../../src/emails/account')

beforeAll(connectTestDB)
beforeEach(setupDatabase)
afterAll(disconnectTestDB)

describe('Users API (/api/users)', () => {
    describe('POST /api/users (Registration)', () => {
        it('should register a new user, hash password, and return JWT token', async () => {
            const response = await request(app)
                .post('/api/users')
                .send({
                    name: 'New Developer',
                    email: 'newdev@example.com',
                    password: 'SecurePass999'
                })
                .expect(201)

            const user = await User.findById(response.body.user._id)
            expect(user).not.toBeNull()
            expect(user.password).not.toBe('SecurePass999')
            expect(response.body.token).toBeDefined()
            expect(response.body.user.password).toBeUndefined()
            expect(response.body.user.tokens).toBeUndefined()
            expect(response.body.user.hasAvatar).toBe(false)
            expect(sendWelcomeEmail).toHaveBeenCalledWith('newdev@example.com', 'New Developer')
        })

        it('should reject registration when password contains the word "password"', async () => {
            await request(app)
                .post('/api/users')
                .send({
                    name: 'Weak User',
                    email: 'weak@example.com',
                    password: 'myPassword123'
                })
                .expect(400)
        })

        it('should reject registration with invalid email or negative age', async () => {
            await request(app)
                .post('/api/users')
                .send({
                    name: 'Bad Email',
                    email: 'not-an-email',
                    password: 'ValidPass123',
                    age: -5
                })
                .expect(400)
        })
    })

    describe('POST /api/users/login', () => {
        it('should login existing user with valid credentials', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: userOne.email,
                    password: userOne.password
                })
                .expect(200)

            const user = await User.findById(userOneId)
            expect(response.body.token).toBe(user.tokens[1].token)
        })

        it('should reject login with wrong password', async () => {
            await request(app)
                .post('/api/users/login')
                .send({
                    email: userOne.email,
                    password: 'WrongPassword999'
                })
                .expect(400)
        })

        it('should reject login for non-existent email', async () => {
            await request(app)
                .post('/api/users/login')
                .send({
                    email: 'ghost@example.com',
                    password: 'SomePassword123'
                })
                .expect(400)
        })
    })

    describe('POST /api/users/logout & /api/users/logoutAll', () => {
        it('should logout current session and invalidate token', async () => {
            await request(app)
                .post('/api/users/logout')
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .expect(200)

            const user = await User.findById(userOneId)
            expect(user.tokens).toHaveLength(0)
        })

        it('should logout from all active sessions', async () => {
            await request(app)
                .post('/api/users/logoutAll')
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .expect(200)

            const user = await User.findById(userOneId)
            expect(user.tokens).toHaveLength(0)
        })
    })

    describe('GET, PATCH, DELETE /api/users/me', () => {
        it('should fetch authenticated user profile', async () => {
            const response = await request(app)
                .get('/api/users/me')
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .expect(200)

            expect(response.body.email).toBe(userOne.email)
            expect(response.body.name).toBe(userOne.name)
        })

        it('should reject unauthenticated requests with 401', async () => {
            await request(app)
                .get('/api/users/me')
                .expect(401)
        })

        it('should update allowed user profile fields', async () => {
            const response = await request(app)
                .patch('/api/users/me')
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .send({ name: 'João Updated', age: 27 })
                .expect(200)

            expect(response.body.name).toBe('João Updated')
            expect(response.body.age).toBe(27)
        })

        it('should reject disallowed update fields on profile', async () => {
            await request(app)
                .patch('/api/users/me')
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .send({ role: 'admin' })
                .expect(400)
        })

        it('should delete authenticated user account and cascade delete user tasks', async () => {
            await request(app)
                .delete('/api/users/me')
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .expect(200)

            const deletedUser = await User.findById(userOneId)
            const remainingTasks = await Task.find({ author: userOneId })

            expect(deletedUser).toBeNull()
            expect(remainingTasks).toHaveLength(0)
            expect(sendFarewellEmail).toHaveBeenCalledWith(userOne.email, userOne.name)
        })
    })

    describe('Avatar Endpoints (/api/users/me/avatar & /api/users/:id/avatar)', () => {
        // Minimal valid 1x1 PNG buffer
        const samplePngBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        )

        it('should upload, retrieve, and delete user avatar', async () => {
            const token = userOne.tokens[0].token

            // Upload avatar
            await request(app)
                .post('/api/users/me/avatar')
                .set('Authorization', `Bearer ${token}`)
                .attach('avatar', samplePngBuffer, 'avatar.png')
                .expect(200)

            const userWithAvatar = await User.findById(userOneId)
            expect(userWithAvatar.avatar).toBeInstanceOf(Buffer)

            // Fetch via authenticated endpoint
            await request(app)
                .get('/api/users/me/avatar')
                .set('Authorization', `Bearer ${token}`)
                .expect('Content-Type', 'image/png')
                .expect(200)

            // Fetch via public user ID endpoint
            await request(app)
                .get(`/api/users/${userOneId}/avatar`)
                .expect('Content-Type', 'image/png')
                .expect(200)

            // Delete avatar
            await request(app)
                .delete('/api/users/me/avatar')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)

            await request(app)
                .get('/api/users/me/avatar')
                .set('Authorization', `Bearer ${token}`)
                .expect(404)
        })

        it('should reject unsupported file types on avatar upload', async () => {
            await request(app)
                .post('/api/users/me/avatar')
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .attach('avatar', Buffer.from('plain text file'), 'notes.txt')
                .expect(400)
        })

        it('should return 400 when no file is attached to avatar upload', async () => {
            await request(app)
                .post('/api/users/me/avatar')
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .expect(400)
        })
    })
})