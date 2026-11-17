const request = require('supertest')
const app = require('../../src/app')
const Task = require('../../src/models/task')
const {
    userOneId,
    userOne,
    userTwo,
    taskOne,
    taskTwo,
    taskThree,
    connectTestDB,
    setupDatabase,
    disconnectTestDB
} = require('../fixtures/db')

beforeAll(connectTestDB)
beforeEach(setupDatabase)
afterAll(disconnectTestDB)

describe('Tasks API (/api/tasks)', () => {
    describe('POST /api/tasks', () => {
        it('should create a new task for authenticated user', async () => {
            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .send({ description: 'Configure Cypress E2E suite' })
                .expect(201)

            const task = await Task.findById(response.body._id)
            expect(task).not.toBeNull()
            expect(task.description).toBe('Configure Cypress E2E suite')
            expect(task.completed).toBe(false)
            expect(task.author.toString()).toBe(userOneId.toString())
        })

        it('should reject task creation when description is missing', async () => {
            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .send({})
                .expect(400)
        })

        it('should reject unauthenticated task creation', async () => {
            await request(app)
                .post('/api/tasks')
                .send({ description: 'Unauthorized task' })
                .expect(401)
        })
    })

    describe('GET /api/tasks & GET /api/tasks/:id', () => {
        it('should list all tasks and stats for authenticated user only', async () => {
            const response = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .expect(200)

            expect(response.body.tasks).toHaveLength(2)
            expect(response.body.total).toBe(2)
            expect(response.body.stats).toEqual({
                total: 2,
                completed: 1,
                pending: 1
            })
        })

        it('should filter tasks by completed status and support pagination/sorting', async () => {
            const response = await request(app)
                .get('/api/tasks?completed=true&limit=1&skip=0&sortBy=createdAt:desc')
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .expect(200)

            expect(response.body.tasks).toHaveLength(1)
            expect(response.body.tasks[0]._id).toBe(taskTwo._id.toString())
            expect(response.body.total).toBe(1)
        })

        it('should fetch a single task by ID for its owner', async () => {
            const response = await request(app)
                .get(`/api/tasks/${taskOne._id}`)
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .expect(200)

            expect(response.body.description).toBe(taskOne.description)
        })

        it('should return 404 when trying to access another user task', async () => {
            await request(app)
                .get(`/api/tasks/${taskThree._id}`)
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .expect(404)
        })
    })

    describe('PATCH /api/tasks/:id', () => {
        it('should update task description and completed status', async () => {
            const response = await request(app)
                .patch(`/api/tasks/${taskOne._id}`)
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .send({
                    description: 'Updated task description',
                    completed: true
                })
                .expect(200)

            expect(response.body.description).toBe('Updated task description')
            expect(response.body.completed).toBe(true)
        })

        it('should reject disallowed update fields', async () => {
            await request(app)
                .patch(`/api/tasks/${taskOne._id}`)
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .send({ author: userTwo._id })
                .expect(400)
        })

        it('should prevent user from updating another user task', async () => {
            await request(app)
                .patch(`/api/tasks/${taskThree._id}`)
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .send({ completed: true })
                .expect(404)
        })
    })

    describe('DELETE /api/tasks/:id', () => {
        it('should delete own task', async () => {
            await request(app)
                .delete(`/api/tasks/${taskOne._id}`)
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .expect(200)

            const deleted = await Task.findById(taskOne._id)
            expect(deleted).toBeNull()
        })

        it('should prevent user from deleting another user task', async () => {
            await request(app)
                .delete(`/api/tasks/${taskThree._id}`)
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .expect(404)

            const stillExists = await Task.findById(taskThree._id)
            expect(stillExists).not.toBeNull()
        })
    })
})