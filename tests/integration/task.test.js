const request = require('supertest')
const app = require('../../src/app')
const Task = require('../../src/models/task')
const {
  userOne,
  userOneId,
  userTwo,
  taskOne,
  connectTestDB,
  setupDatabase,
  disconnectTestDB
} = require('../fixtures/db')

beforeAll(connectTestDB)
beforeEach(setupDatabase)
afterAll(disconnectTestDB)

test('Should create task with details, dueDate, and populated tags', async () => {
  const tagRes = await request(app)
    .post('/api/tags')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ name: 'Release', color: 'teal' })
    .expect(201)

  const dueDate = '2026-12-15T00:00:00.000Z'

  const response = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'Deploy v2.0',
      details: 'Run integration tests and verify Docker image before deploy.',
      dueDate,
      tags: [tagRes.body._id]
    })
    .expect(201)

  expect(response.body.description).toBe('Deploy v2.0')
  expect(response.body.details).toBe('Run integration tests and verify Docker image before deploy.')
  expect(new Date(response.body.dueDate).toISOString()).toBe(dueDate)
  expect(response.body.tags).toHaveLength(1)
  expect(response.body.tags[0].name).toBe('Release')
  expect(response.body.tags[0].color).toBe('teal')

  const taskInDb = await Task.findById(response.body._id)
  expect(taskInDb).not.toBeNull()
  expect(taskInDb.author).toEqual(userOneId)
})

test('Should reject creating task with tag belonging to another user', async () => {
  const userTwoTag = await request(app)
    .post('/api/tags')
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send({ name: 'PrivateUserTwoTag' })
    .expect(201)

  await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'Unauthorized tag attach',
      tags: [userTwoTag.body._id]
    })
    .expect(400)
})

test('Should filter tasks by tag ID', async () => {
  const tagRes = await request(app)
    .post('/api/tags')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ name: 'Sprint1', color: 'blue' })
    .expect(201)

  await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'Tagged task',
      tags: [tagRes.body._id]
    })
    .expect(201)

  const response = await request(app)
    .get(`/api/tasks?tag=${tagRes.body._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .expect(200)

  expect(response.body.tasks).toHaveLength(1)
  expect(response.body.tasks[0].description).toBe('Tagged task')
  expect(response.body.total).toBe(1)
})

test('Should update task details, dueDate, and tags', async () => {
  const tagRes = await request(app)
    .post('/api/tags')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ name: 'Backend', color: 'purple' })
    .expect(201)

  const response = await request(app)
    .patch(`/api/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'Updated task title',
      details: 'Added technical notes',
      dueDate: '2026-12-20T00:00:00.000Z',
      tags: [tagRes.body._id],
      completed: true
    })
    .expect(200)

  expect(response.body.description).toBe('Updated task title')
  expect(response.body.details).toBe('Added technical notes')
  expect(response.body.completed).toBe(true)
  expect(response.body.tags).toHaveLength(1)
  expect(response.body.tags[0].name).toBe('Backend')
})

test('Should not allow userTwo to delete userOne task', async () => {
  await request(app)
    .delete(`/api/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .expect(404)
})