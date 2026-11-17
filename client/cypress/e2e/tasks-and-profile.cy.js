describe('Dashboard Task Management & Profile E2E', () => {
  const sampleUser = {
    _id: '673a00000000000000000001',
    name: 'João Botelho',
    email: 'joao@example.com',
    age: 26,
    hasAvatar: false
  }

  let mockTasks = []

  beforeEach(() => {
    mockTasks = [
      {
        _id: 'task-1',
        description: 'Write Jest backend tests',
        completed: false,
        createdAt: '2026-11-17T10:00:00.000Z'
      },
      {
        _id: 'task-2',
        description: 'Build Cypress E2E suite',
        completed: true,
        createdAt: '2026-11-16T10:00:00.000Z'
      }
    ]

    cy.intercept('GET', '/api/users/me', {
      statusCode: 200,
      body: sampleUser
    }).as('getProfile')

    cy.intercept('GET', '/api/tasks*', (req) => {
      let filtered = [...mockTasks]
      if (req.query.completed === 'true') {
        filtered = filtered.filter((t) => t.completed)
      } else if (req.query.completed === 'false') {
        filtered = filtered.filter((t) => !t.completed)
      }

      const completedCount = mockTasks.filter((t) => t.completed).length
      req.reply({
        statusCode: 200,
        body: {
          tasks: filtered,
          total: filtered.length,
          stats: {
            total: mockTasks.length,
            completed: completedCount,
            pending: mockTasks.length - completedCount
          }
        }
      })
    }).as('fetchTasks')

    cy.intercept('POST', '/api/tasks', (req) => {
      const created = {
        _id: `task-${Date.now()}`,
        description: req.body.description,
        completed: false,
        createdAt: new Date().toISOString()
      }
      mockTasks.unshift(created)
      req.reply({ statusCode: 201, body: created })
    }).as('createTask')

    cy.intercept('PATCH', '/api/tasks/*', (req) => {
      const id = req.url.split('/').pop()
      const target = mockTasks.find((t) => t._id === id)
      if (target) Object.assign(target, req.body)
      req.reply({ statusCode: 200, body: target })
    }).as('updateTask')

    cy.intercept('DELETE', '/api/tasks/*', (req) => {
      const id = req.url.split('/').pop()
      mockTasks = mockTasks.filter((t) => t._id !== id)
      req.reply({ statusCode: 200, body: { _id: id } })
    }).as('deleteTask')

    cy.visit('/#/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('task_app_token', 'fake-jwt-token-for-cypress')
        win.localStorage.setItem('task_app_user', JSON.stringify(sampleUser))
      }
    })
    cy.wait('@fetchTasks')
  })

  it('creates, toggles, edits, filters, and deletes tasks on the dashboard', () => {
    // Verify initial KPI tiles
    cy.contains('.kpi-tile', 'TOTAL TASKS').should('contain.text', '2')
    cy.contains('.kpi-tile', 'PENDING').should('contain.text', '1')
    cy.contains('.kpi-tile', 'COMPLETED').should('contain.text', '1')

    // Create a new task
    cy.get('.create-bar input').type('Deploy Task App to Home Server')
    cy.get('.create-bar button[type="submit"]').click()
    cy.wait('@createTask')
    cy.wait('@fetchTasks')
    cy.contains('td', 'Deploy Task App to Home Server').should('be.visible')

    // Toggle task completion
    cy.contains('tr', 'Deploy Task App to Home Server').find('input[type="checkbox"]').click()
    cy.wait('@updateTask')
    cy.wait('@fetchTasks')

    // Edit task description inline
    cy.contains('tr', 'Write Jest backend tests').find('button[title="Edit description"]').click()
    cy.get('tbody input[type="text"]').clear().type('Write Jest & Supertest suite{enter}')
    cy.wait('@updateTask')
    cy.wait('@fetchTasks')
    cy.contains('td', 'Write Jest & Supertest suite').should('be.visible')

    // Filter by Pending
    cy.contains('.filter-tabs button', 'Pending').click()
    cy.wait('@fetchTasks')
    cy.contains('td', 'Write Jest & Supertest suite').should('be.visible')
    cy.contains('td', 'Build Cypress E2E suite').should('not.exist')

    // Delete task
    cy.contains('tr', 'Write Jest & Supertest suite').find('button[title="Delete task"]').click()
    cy.wait('@deleteTask')
    cy.wait('@fetchTasks')
    cy.contains('td', 'Write Jest & Supertest suite').should('not.exist')
  })

  it('navigates to Profile view and updates user details', () => {
    cy.intercept('PATCH', '/api/users/me', (req) => {
      req.reply({
        statusCode: 200,
        body: { ...sampleUser, ...req.body }
      })
    }).as('updateProfile')

    cy.contains('.cds--header__menu-item', 'Profile').click()
    cy.url().should('include', '#/profile')
    cy.wait('@getProfile')

    cy.get('#prof-name').clear().type('João Henrique Botelho')
    cy.get('#prof-age').clear().type('27')
    cy.get('.profile-form button[type="submit"]').click()

    cy.wait('@updateProfile')
    cy.contains('Profile updated successfully.').should('be.visible')
  })
})