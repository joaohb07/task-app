import TaskModal from '../../src/components/TaskModal.vue'
import { useTaskStore } from '../../src/stores/tasks'
import { useTagStore } from '../../src/stores/tags'

describe('TaskModal Component', () => {
  const sampleTags = [
    { _id: 'tag-1', name: 'Backend', color: 'magenta' },
    { _id: 'tag-2', name: 'Testing', color: 'green' },
    { _id: 'tag-3', name: 'Frontend', color: 'blue' }
  ]

  const sampleTask = {
    _id: 'task-101',
    description: 'Implement Carbon Design modals',
    details: 'Create TaskModal and ManageTagsModal with full CRUD support.',
    dueDate: '2026-12-15T00:00:00.000Z',
    completed: false,
    tags: [sampleTags[0], sampleTags[2]]
  }

  beforeEach(() => {
    cy.intercept('GET', '**/api/tags*', {
      statusCode: 200,
      body: { tags: sampleTags, total: sampleTags.length }
    }).as('fetchAllTags')
  })

  it('does not render modal dialog when open prop is false', () => {
    cy.mountWithPlugins(TaskModal, {
      props: {
        open: false,
        mode: 'create'
      }
    })

    cy.get('[role="dialog"]').should('not.exist')
  })

  it('renders create mode, selects tags, emits open-tags, and submits new task payload', () => {
    const onCloseSpy = cy.spy().as('onCloseSpy')
    const onOpenTagsSpy = cy.spy().as('onOpenTagsSpy')

    cy.intercept('POST', '**/api/tasks', (req) => {
      expect(req.body).to.deep.equal({
        description: 'Setup CI/CD pipeline',
        details: 'Run Jest and Cypress before merge.',
        dueDate: '2026-11-30T00:00:00.000Z',
        tags: ['tag-2']
      })
      req.reply({
        statusCode: 201,
        body: { _id: 'task-new', ...req.body, completed: false }
      })
    }).as('createTask')

    cy.intercept('GET', '**/api/tasks*', {
      statusCode: 200,
      body: { tasks: [], total: 0, stats: { total: 0, completed: 0, pending: 0 } }
    }).as('refreshTasks')

    cy.mountWithPlugins(TaskModal, {
      props: {
        open: true,
        mode: 'create',
        onClose: onCloseSpy,
        onOpenTags: onOpenTagsSpy
      }
    })

    cy.wait('@fetchAllTags')

    cy.contains('#task-modal-title', 'New Task').should('be.visible')

    // Click "+ Manage Tags" button and assert event emission
    cy.contains('.manage-inline-btn', '+ Manage Tags').click()
    cy.get('@onOpenTagsSpy').should('have.been.calledOnce')

    // Fill form inputs and toggle tag selection
    cy.get('#task-desc-input').type('  Setup CI/CD pipeline  ')
    cy.get('#task-details-input').type('Run Jest and Cypress before merge.')
    cy.get('#task-due-input').type('2026-11-30')

    cy.contains('.tag-option-pill', 'Testing').click()
    cy.contains('.tag-option-pill', 'Testing').should('have.class', 'is-selected')

    // Submit form
    cy.contains('.cds--modal-footer button', 'Create Task').click()
    cy.wait('@createTask')
    cy.get('@onCloseSpy').should('have.been.calledOnce')
  })

  it('renders read-only view mode and switches to edit mode when Edit Task is clicked', () => {
    const onUpdateModeSpy = cy.spy().as('onUpdateModeSpy')

    cy.mountWithPlugins(TaskModal, {
      props: {
        open: true,
        mode: 'view',
        task: sampleTask,
        'onUpdate:mode': onUpdateModeSpy
      }
    })

    cy.wait('@fetchAllTags')

    cy.contains('#task-modal-title', 'Task Details').should('be.visible')
    cy.contains('.view-title-text', 'Implement Carbon Design modals').should('be.visible')
    cy.contains('.view-details-text', 'Create TaskModal and ManageTagsModal with full CRUD support.').should('be.visible')
    cy.contains('.view-date-badge', 'Dec 15, 2026').should('be.visible')
    cy.contains('.tags-list .cds--tag', 'Backend').should('be.visible')
    cy.contains('.tags-list .cds--tag', 'Frontend').should('be.visible')

    // Click Edit Task in footer
    cy.contains('.cds--modal-footer button', 'Edit Task').click()
    cy.get('@onUpdateModeSpy').should('have.been.calledOnceWith', 'edit')
  })

  it('pre-populates fields in edit mode and submits updated task with completion status', () => {
    const onCloseSpy = cy.spy().as('onCloseSpy')

    cy.intercept('PATCH', '**/api/tasks/task-101', (req) => {
      expect(req.body).to.deep.equal({
        description: 'Implement Carbon Design modals v2',
        details: 'Create TaskModal and ManageTagsModal with full CRUD support.',
        dueDate: '2026-12-15T00:00:00.000Z',
        tags: ['tag-1'],
        completed: true
      })
      req.reply({
        statusCode: 200,
        body: { ...sampleTask, ...req.body }
      })
    }).as('updateTask')

    cy.intercept('GET', '**/api/tasks*', {
      statusCode: 200,
      body: { tasks: [], total: 0, stats: { total: 0, completed: 0, pending: 0 } }
    }).as('refreshTasks')

    cy.mountWithPlugins(TaskModal, {
      props: {
        open: true,
        mode: 'edit',
        task: sampleTask,
        onClose: onCloseSpy
      }
    })

    cy.wait('@fetchAllTags')

    cy.contains('#task-modal-title', 'Edit Task').should('be.visible')
    cy.get('#task-desc-input').should('have.value', 'Implement Carbon Design modals')
    cy.get('#task-due-input').should('have.value', '2026-12-15')

    // Unselect Frontend tag, update title, and mark task as completed
    cy.contains('.tag-option-pill', 'Frontend').click()
    cy.get('#task-desc-input').clear().type('Implement Carbon Design modals v2')
    cy.get('.status-toggle-box input[type="checkbox"]').check()

    cy.contains('.cds--modal-footer button', 'Save Changes').click()
    cy.wait('@updateTask')
    cy.get('@onCloseSpy').should('have.been.calledOnce')
  })

  it('displays error message when taskStore has an error', () => {
    cy.mountWithPlugins(TaskModal, {
      props: {
        open: true,
        mode: 'create'
      }
    })

    cy.wait('@fetchAllTags')

    cy.then(() => {
      const taskStore = useTaskStore()
      taskStore.error = 'Task title is required.'
    })

    cy.get('.form-error-msg').should('be.visible').and('contain.text', 'Task title is required.')
  })
})