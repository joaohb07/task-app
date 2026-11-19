/**
 * End-to-End test suite for the Dashboard (task CRUD, subtasks, priorities, tags,
 * status/priority/tag filtering, 3-stage Kanban board view, and deletion) and Profile management flows.
 */
describe('Dashboard Task Management & Profile E2E', () => {
  // Mock authenticated user seeded into localStorage before visiting protected routes
  const sampleUser = {
    _id: '673a00000000000000000001',
    name: 'João Botelho',
    email: 'joao@example.com',
    age: 26,
    hasAvatar: false
  }

  let mockTags = []
  let mockTasks = []

  beforeEach(() => {
    // Reset in-memory fixtures before each test to keep specs isolated and deterministic
    mockTags = [
      { _id: 'tag-1', name: 'Backend', color: 'magenta' },
      { _id: 'tag-2', name: 'Testing', color: 'green' }
    ]

    mockTasks = [
      {
        _id: 'task-1',
        description: 'Write Jest backend tests',
        details: 'Cover tasks and tags endpoints with Supertest.',
        dueDate: '2026-11-25T00:00:00.000Z',
        priority: 'medium',
        status: 'todo',
        subtasks: [],
        tags: [mockTags[0], mockTags[1]],
        completed: false,
        createdAt: '2026-11-17T10:00:00.000Z'
      },
      {
        _id: 'task-2',
        description: 'Build Cypress E2E suite',
        details: '',
        dueDate: null,
        priority: 'none',
        status: 'done',
        subtasks: [],
        tags: [mockTags[1]],
        completed: true,
        createdAt: '2026-11-16T10:00:00.000Z'
      }
    ]

    // Stub current user profile endpoint
    cy.intercept('GET', '**/api/users/me', {
      statusCode: 200,
      body: sampleUser
    }).as('getProfile')

    // Stub tag listing and CRUD operations
    cy.intercept('GET', '**/api/tags*', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          tags: mockTags,
          total: mockTags.length,
          page: 1,
          limit: 10
        }
      })
    }).as('fetchTags')

    cy.intercept('POST', '**/api/tags*', (req) => {
      const created = {
        _id: `tag-${Date.now()}`,
        name: req.body.name,
        color: req.body.color || 'blue'
      }
      mockTags.push(created)
      req.reply({ statusCode: 201, body: created })
    }).as('createTag')

    cy.intercept('PATCH', '**/api/tags/*', (req) => {
      const id = req.url.split('/').pop()
      const target = mockTags.find((t) => t._id === id)
      if (target) Object.assign(target, req.body)
      req.reply({ statusCode: 200, body: target })
    }).as('updateTag')

    cy.intercept('DELETE', '**/api/tags/*', (req) => {
      const id = req.url.split('/').pop()
      mockTags = mockTags.filter((t) => t._id !== id)
      // Remove deleted tag references from existing tasks to mirror backend cascade behavior
      mockTasks = mockTasks.map((task) => ({
        ...task,
        tags: (task.tags || []).filter((t) => t._id !== id)
      }))
      req.reply({ statusCode: 200, body: { _id: id } })
    }).as('deleteTag')

    // Stub task listing with completion, tag, and priority query filtering
    cy.intercept('GET', '**/api/tasks*', (req) => {
      let filtered = [...mockTasks]

      if (req.query.completed === 'true') {
        filtered = filtered.filter((t) => t.completed)
      } else if (req.query.completed === 'false') {
        filtered = filtered.filter((t) => !t.completed)
      }

      if (req.query.tag) {
        filtered = filtered.filter((t) =>
          (t.tags || []).some((tag) => tag._id === req.query.tag)
        )
      }

      if (req.query.priority) {
        filtered = filtered.filter((t) => (t.priority || 'none') === req.query.priority)
      }

      const completedCount = mockTasks.filter((t) => t.completed).length
      req.reply({
        statusCode: 200,
        body: {
          tasks: filtered,
          total: filtered.length,
          page: Number(req.query.page) || 1,
          limit: 8,
          stats: {
            total: mockTasks.length,
            completed: completedCount,
            pending: mockTasks.length - completedCount
          }
        }
      })
    }).as('fetchTasks')

    // Stub task creation, resolving tag IDs and normalizing subtask items
    cy.intercept('POST', '**/api/tasks', (req) => {
      const resolvedTags = (req.body.tags || [])
        .map((id) => mockTags.find((t) => t._id === id))
        .filter(Boolean)

      const normalizedSubtasks = (req.body.subtasks || []).map((st, index) => ({
        _id: `sub-${Date.now()}-${index}`,
        title: st.title,
        completed: Boolean(st.completed)
      }))

      const created = {
        _id: `task-${Date.now()}`,
        description: req.body.description,
        details: req.body.details || '',
        dueDate: req.body.dueDate || null,
        priority: req.body.priority || 'none',
        status: req.body.status || 'todo',
        subtasks: normalizedSubtasks,
        tags: resolvedTags,
        completed: false,
        createdAt: new Date().toISOString()
      }
      mockTasks.unshift(created)
      req.reply({ statusCode: 201, body: created })
    }).as('createTask')

    // Stub partial task updates (description, priority, status, completion, subtasks, and tags)
    cy.intercept('PATCH', '**/api/tasks/*', (req) => {
      const id = req.url.split('/').pop()
      const target = mockTasks.find((t) => t._id === id)
      if (target) {
        if (Array.isArray(req.body.tags)) {
          target.tags = req.body.tags
            .map((tagId) => mockTags.find((t) => t._id === tagId))
            .filter(Boolean)
        }
        if (Array.isArray(req.body.subtasks)) {
          target.subtasks = req.body.subtasks.map((st, index) => ({
            _id: st._id || `sub-${Date.now()}-${index}`,
            title: st.title,
            completed: Boolean(st.completed)
          }))
        }
        const { tags: _ignoredTags, subtasks: _ignoredSubtasks, ...rest } = req.body
        Object.assign(target, rest)
        if (typeof rest.status === 'string') {
          target.completed = rest.status === 'done'
        } else if (typeof rest.completed === 'boolean') {
          target.completed = rest.completed
        }
      }
      req.reply({ statusCode: 200, body: target })
    }).as('updateTask')

    // Stub task deletion
    cy.intercept('DELETE', '**/api/tasks/*', (req) => {
      const id = req.url.split('/').pop()
      mockTasks = mockTasks.filter((t) => t._id !== id)
      req.reply({ statusCode: 200, body: { _id: id } })
    }).as('deleteTask')

    // Seed auth session before mounting the SPA on the dashboard route
    cy.visit('/#/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('task_app_token', 'fake-jwt-token-for-cypress')
        win.localStorage.setItem('task_app_user', JSON.stringify(sampleUser))
      }
    })
    cy.wait(['@fetchTasks', '@fetchTags'])
  })

  it('creates a task via modal with subtasks, priority, details, due date, inline tag creation, and filters/edits/deletes tasks', () => {
    // Verify initial KPI summary cards
    cy.contains('.kpi-tile', 'TOTAL TASKS').should('contain.text', '2')
    cy.contains('.kpi-tile', 'PENDING').should('contain.text', '1')
    cy.contains('.kpi-tile', 'COMPLETED').should('contain.text', '1')

    // Open New Task modal
    cy.contains('.action-bar-buttons button', 'Add Task').click()
    cy.contains('#task-modal-title', 'New Task').should('be.visible')

    // Open Manage Tags modal from inside TaskModal and create a new tag
    cy.contains('.manage-inline-btn', '+ Manage Tags').click()
    cy.contains('#manage-tags-modal-title', 'Manage Tags').should('be.visible')

    cy.get('.tag-create-row input[type="text"]').type('DevOps')
    cy.get('.tag-create-row select').select('purple')
    cy.contains('.tag-create-row button', 'Add Tag').click()
    cy.wait('@createTag')
    cy.wait('@fetchTags')
    cy.contains('.tag-table-wrapper td', 'DevOps').should('be.visible')

    // Return from Manage Tags modal back to New Task modal
    cy.contains('#manage-tags-modal-title', 'Manage Tags')
      .closest('.cds--modal-container')
      .contains('.cds--modal-footer button', 'Done')
      .click()

    // Populate task fields, add subtasks, select priority and tag, then submit
    cy.get('#task-desc-input').type('Deploy Task App to Home Server')
    cy.get('#task-details-input').type('Configure Nginx Proxy Manager and Docker Compose.')
    cy.get('#task-priority-select').select('high')
    cy.get('#task-due-input').type('2026-12-01')

    cy.get('#new-subtask-input').type('Configure Nginx Proxy route')
    cy.contains('.add-subtask-btn', 'Add').click()
    cy.get('#new-subtask-input').type('Verify Tailscale Funnel TLS')
    cy.contains('.add-subtask-btn', 'Add').click()

    cy.contains('.tag-option-pill', 'DevOps').click()

    cy.contains('#task-modal-title', 'New Task')
      .closest('.cds--modal-container')
      .contains('.cds--modal-footer button', 'Create Task')
      .click()

    cy.wait('@createTask')
    cy.wait('@fetchTasks')

    // Confirm created task row renders details, subtask counter badge, priority pill, and tag
    cy.contains('tr', 'Deploy Task App to Home Server').within(() => {
      cy.contains('Configure Nginx Proxy Manager and Docker Compose.').should('be.visible')
      cy.contains('.subtask-counter-badge', '0/2').should('be.visible')
      cy.contains('.priority-pill--high', 'High').should('be.visible')
      cy.contains('.cds--tag', 'DevOps').should('be.visible')
    })

    // Filter tasks by High priority
    cy.get('#priority-filter-select').select('high')
    cy.wait('@fetchTasks')
    cy.contains('td', 'Deploy Task App to Home Server').should('be.visible')
    cy.contains('td', 'Write Jest backend tests').should('not.exist')

    // Reset priority filter back to all priorities
    cy.get('#priority-filter-select').select('')
    cy.wait('@fetchTasks')

    // Inspect task in read-only View Details modal and switch into Edit mode
    cy.contains('tr', 'Write Jest backend tests').find('button[title="View details"]').click()
    cy.contains('#task-modal-title', 'Task Details').should('be.visible')
    cy.contains('.priority-pill', 'Priority: Medium').should('be.visible')
    cy.contains('.view-details-text', 'Cover tasks and tags endpoints with Supertest.').should('be.visible')

    cy.contains('.cds--modal-footer button', 'Edit Task').click()
    cy.contains('#task-modal-title', 'Edit Task').should('be.visible')
    cy.get('#task-desc-input').clear().type('Write Jest & Supertest suite')
    cy.contains('.cds--modal-footer button', 'Save Changes').click()
    cy.wait('@updateTask')
    cy.wait('@fetchTasks')
    cy.contains('td', 'Write Jest & Supertest suite').should('be.visible')

    // Toggle task completion via table row checkbox
    cy.contains('tr', 'Deploy Task App to Home Server').find('input[type="checkbox"]').click()
    cy.wait('@updateTask')
    cy.wait('@fetchTasks')

    // Filter tasks by Pending status
    cy.contains('.filter-tabs button', 'Pending').click()
    cy.wait('@fetchTasks')
    cy.contains('td', 'Write Jest & Supertest suite').should('be.visible')
    cy.contains('td', 'Build Cypress E2E suite').should('not.exist')

    // Reset status filter to All and filter by Backend tag
    cy.contains('.filter-tabs button', 'All').click()
    cy.wait('@fetchTasks')
    cy.get('#tag-filter-select').select('tag-1')
    cy.wait('@fetchTasks')
    cy.contains('td', 'Write Jest & Supertest suite').should('be.visible')
    cy.contains('td', 'Deploy Task App to Home Server').should('not.exist')

    // Clear tag filter and delete the edited task
    cy.get('#tag-filter-select').select('')
    cy.wait('@fetchTasks')
    cy.contains('tr', 'Write Jest & Supertest suite').find('button[title="Delete task"]').click()
    cy.wait('@deleteTask')
    cy.wait('@fetchTasks')
    cy.contains('td', 'Write Jest & Supertest suite').should('not.exist')
  })

  it('switches to Kanban board view, moves tasks across TO-DO, WIP, and DONE columns, and manages cards', () => {
    cy.contains('.view-switcher button', 'Kanban').click()
    cy.get('[data-testid="kanban-board"]').should('be.visible')

    // Verify initial cards in TO-DO, WIP, and DONE columns
    cy.get('[data-stage="todo"]').within(() => {
      cy.contains('.kanban-column-count', '1').should('be.visible')
      cy.contains('.kanban-card', 'Write Jest backend tests').should('be.visible')
    })

    cy.get('[data-stage="wip"]').within(() => {
      cy.contains('.kanban-column-count', '0').should('be.visible')
    })

    cy.get('[data-stage="done"]').within(() => {
      cy.contains('.kanban-column-count', '1').should('be.visible')
      cy.contains('.kanban-card', 'Build Cypress E2E suite').should('be.visible')
    })

    // Move TO-DO task to WIP column
    cy.get('[data-stage="todo"]')
      .contains('.kanban-card', 'Write Jest backend tests')
      .find('button[title="Move to WIP"]')
      .click()

    cy.wait('@updateTask')
    cy.wait('@fetchTasks')

    cy.get('[data-stage="todo"]').within(() => {
      cy.contains('.kanban-column-count', '0').should('be.visible')
      cy.contains('Write Jest backend tests').should('not.exist')
    })

    cy.get('[data-stage="wip"]').within(() => {
      cy.contains('.kanban-column-count', '1').should('be.visible')
      cy.contains('.kanban-card', 'Write Jest backend tests').should('be.visible')
    })

    // Move WIP task to DONE column
    cy.get('[data-stage="wip"]')
      .contains('.kanban-card', 'Write Jest backend tests')
      .find('button[title="Move to DONE"]')
      .click()

    cy.wait('@updateTask')
    cy.wait('@fetchTasks')

    cy.get('[data-stage="wip"]').within(() => {
      cy.contains('.kanban-column-count', '0').should('be.visible')
    })

    cy.get('[data-stage="done"]').within(() => {
      cy.contains('.kanban-column-count', '2').should('be.visible')
      cy.contains('.kanban-card', 'Write Jest backend tests').should('be.visible')
    })

    // Open view modal from card title and return to Table view
    cy.get('[data-stage="done"]')
      .contains('.kanban-card-title', 'Write Jest backend tests')
      .click()
    cy.contains('#task-modal-title', 'Task Details').should('be.visible')
    cy.contains('#task-modal-title', 'Task Details')
      .closest('.cds--modal-container')
      .contains('.cds--modal-footer button', 'Close')
      .click()

    cy.contains('.view-switcher button', 'Table').click()
    cy.get('[data-testid="kanban-board"]').should('not.exist')
    cy.get('table.cds--data-table').should('be.visible')
  })

  it('navigates to Profile view and updates user details', () => {
    // Stub profile update endpoint
    cy.intercept('PATCH', '**/api/users/me', (req) => {
      req.reply({
        statusCode: 200,
        body: { ...sampleUser, ...req.body }
      })
    }).as('updateProfile')

    // Navigate from header to Profile view
    cy.contains('.cds--header__menu-item', 'Profile').click()
    cy.url().should('include', '#/profile')
    cy.wait('@getProfile')

    // Update name and age and verify confirmation feedback
    cy.get('#prof-name').clear().type('João Henrique Botelho')
    cy.get('#prof-age').clear().type('27')
    cy.get('.profile-form button[type="submit"]').click()

    cy.wait('@updateProfile')
    cy.contains('Profile updated successfully.').should('be.visible')
  })
})