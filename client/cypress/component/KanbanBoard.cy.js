import KanbanBoard from '../../src/components/KanbanBoard.vue'

describe('KanbanBoard Component', () => {
  const sampleTasks = [
    {
      _id: 't-1',
      description: 'Setup Docker Compose',
      details: 'Configure MongoDB healthcheck',
      priority: 'high',
      status: 'todo',
      completed: false,
      subtasks: [{ title: 'Create network', completed: true }],
      tags: [{ _id: 'tag-1', name: 'DevOps', color: 'purple' }]
    },
    {
      _id: 't-2',
      description: 'Build Kanban Board UI',
      details: '',
      priority: 'medium',
      status: 'wip',
      completed: false,
      subtasks: [],
      tags: []
    },
    {
      _id: 't-3',
      description: 'Write Jest tests',
      details: '',
      priority: 'low',
      status: 'done',
      completed: true,
      subtasks: [],
      tags: []
    }
  ]

  it('renders all 3 stages (TO-DO, WIP, DONE) and distributes cards accurately', () => {
    cy.mountWithPlugins(KanbanBoard, {
      props: { tasks: sampleTasks }
    })

    cy.get('[data-stage="todo"]').within(() => {
      cy.contains('.kanban-column-title', 'TO-DO').should('be.visible')
      cy.contains('.kanban-column-count', '1').should('be.visible')
      cy.contains('.kanban-card-title', 'Setup Docker Compose').should('be.visible')
      cy.contains('.subtask-counter-badge', '1/1').should('be.visible')
    })

    cy.get('[data-stage="wip"]').within(() => {
      cy.contains('.kanban-column-title', 'WIP').should('be.visible')
      cy.contains('.kanban-column-count', '1').should('be.visible')
      cy.contains('.kanban-card-title', 'Build Kanban Board UI').should('be.visible')
    })

    cy.get('[data-stage="done"]').within(() => {
      cy.contains('.kanban-column-title', 'DONE').should('be.visible')
      cy.contains('.kanban-column-count', '1').should('be.visible')
      cy.contains('.kanban-card-title', 'Write Jest tests').should('be.visible')
    })
  })

  it('emits move-task when quick stage arrow buttons are clicked', () => {
    const onMoveSpy = cy.spy().as('onMoveSpy')

    cy.mountWithPlugins(KanbanBoard, {
      props: {
        tasks: sampleTasks,
        onMoveTask: onMoveSpy
      }
    })

    cy.get('[data-stage="todo"]')
      .find('button[title="Move to WIP"]')
      .click()

    cy.get('@onMoveSpy').should('have.been.calledOnceWith', {
      task: sampleTasks[0],
      status: 'wip'
    })
  })
})