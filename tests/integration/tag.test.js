const request = require('supertest')
const app = require('../../src/app')
const Tag = require('../../src/models/tag')
const {
  userOne,
  userOneId,
  userTwo,
  connectTestDB,
  setupDatabase,
  disconnectTestDB
} = require('../fixtures/db')

beforeAll(connectTestDB)
beforeEach(setupDatabase)
afterAll(disconnectTestDB)

test('Should create a tag for authenticated user', async () => {
  const response = await request(app)
    .post('/api/tags')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ name: 'DevOps', color: 'purple' })
    .expect(201)

  const tag = await Tag.findById(response.body._id)
  expect(tag).not.toBeNull()
  expect(tag.name).toBe('DevOps')
  expect(tag.color).toBe('purple')
  expect(tag.author).toEqual(userOneId)
})

test('Should not create duplicate tag name (case-insensitive) for same user', async () => {
  await request(app)
    .post('/api/tags')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ name: 'Backend' })
    .expect(201)

  await request(app)
    .post('/api/tags')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ name: 'backend' })
    .expect(400)
})

test('Should list paginated tags for authenticated user', async () => {
  await request(app)
    .post('/api/tags')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ name: 'Alpha' })

  await request(app)
    .post('/api/tags')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ name: 'Beta' })

  const response = await request(app)
    .get('/api/tags?limit=1&skip=0')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .expect(200)

  expect(response.body.total).toBe(2)
  expect(response.body.tags).toHaveLength(1)
  expect(response.body.tags[0].name).toBe('Alpha')
})

test('Should update tag name and color', async () => {
  const created = await request(app)
    .post('/api/tags')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ name: 'Work', color: 'blue' })
    .expect(201)

  const updated = await request(app)
    .patch(`/api/tags/${created.body._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ name: 'Urgent Work', color: 'magenta' })
    .expect(200)

  expect(updated.body.name).toBe('Urgent Work')
  expect(updated.body.color).toBe('magenta')
})

test('Should not allow another user to delete or update a tag', async () => {
  const created = await request(app)
    .post('/api/tags')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ name: 'PrivateTag' })
    .expect(201)

  await request(app)
    .delete(`/api/tags/${created.body._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .expect(404)
})