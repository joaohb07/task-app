import ManageTagsModal from '../../src/components/ManageTagsModal.vue'
import { useTagStore } from '../../src/stores/tags'

describe('ManageTagsModal Component', () => {
  let mockTags = []

  beforeEach(() => {
    mockTags = [
      { _id: 'tag-1', name: 'Backend', color: 'magenta' },
      { _id: 'tag-2', name: 'Testing', color: 'green' }
    ]

    cy.intercept('GET', /\/api\/tags/, (req) => {
      const skip = Number(req.query.skip) || 0
      const limit = Number(req.query.limit) || 5
      const page = Math.floor(skip / limit) + 1
      req.reply({
        statusCode: 200,
        body: {
          tags: mockTags,
          total: mockTags.length,
          page,
          limit
        }
      })
    }).as('fetchTags')
  })

  it('creates a new tag, emits tags-changed, and renders it in the table', () => {
    const onTagsChangedSpy = cy.spy().as('onTagsChangedSpy')

    cy.intercept('POST', /\/api\/tags/, (req) => {
      const created = {
        _id: 'tag-3',
        name: req.body.name,
        color: req.body.color
      }
      mockTags.push(created)
      req.reply({ statusCode: 201, body: created })
    }).as('createTag')

    cy.mountWithPlugins(ManageTagsModal, {
      props: {
        open: true,
        onTagsChanged: onTagsChangedSpy
      }
    })

    cy.wait('@fetchTags')
    cy.contains('td .cds--tag', 'Backend').should('be.visible')
    cy.contains('td .cds--tag', 'Testing').should('be.visible')

    // Create a new tag
    cy.get('.tag-create-row input[type="text"]').scrollIntoView().type('Urgent')
    cy.get('.tag-create-row select').select('purple')
    cy.contains('.tag-create-row button', 'Add Tag').click()

    cy.wait('@createTag')
    cy.wait('@fetchTags')
    cy.get('@onTagsChangedSpy').should('have.been.calledOnce')
    cy.contains('td .cds--tag--purple', 'Urgent').should('be.visible')
    cy.get('.tag-create-row input[type="text"]').should('have.value', '')
  })

  it('edits an existing tag inline and cancels or saves changes', () => {
    const onTagsChangedSpy = cy.spy().as('onTagsChangedSpy')

    cy.intercept('PATCH', /\/api\/tags\/tag-1/, (req) => {
      const target = mockTags.find((t) => t._id === 'tag-1')
      Object.assign(target, req.body)
      req.reply({ statusCode: 200, body: target })
    }).as('updateTag')

    cy.mountWithPlugins(ManageTagsModal, {
      props: {
        open: true,
        onTagsChanged: onTagsChangedSpy
      }
    })

    cy.wait('@fetchTags')

    // Enter inline edit mode for "Backend"
    cy.contains('tr', 'Backend').find('button[title="Edit tag"]').click()
    cy.get('.inline-edit-row input[type="text"]')
      .should('have.value', 'Backend')
      .clear()
      .type('API Core')
    cy.get('.inline-edit-row select').select('teal')

    // Save edit
    cy.get('.inline-edit-row').closest('tr').find('button[title="Save tag"]').click()
    cy.wait('@updateTag')
    cy.wait('@fetchTags')

    cy.get('@onTagsChangedSpy').should('have.been.calledOnce')
    cy.contains('td .cds--tag--teal', 'API Core').should('be.visible')
  })

  it('deletes a tag and emits tags-changed', () => {
    const onTagsChangedSpy = cy.spy().as('onTagsChangedSpy')

    cy.intercept('DELETE', /\/api\/tags\/tag-2/, (req) => {
      mockTags = mockTags.filter((t) => t._id !== 'tag-2')
      req.reply({ statusCode: 200, body: { _id: 'tag-2' } })
    }).as('deleteTag')

    cy.mountWithPlugins(ManageTagsModal, {
      props: {
        open: true,
        onTagsChanged: onTagsChangedSpy
      }
    })

    cy.wait('@fetchTags')

    cy.contains('tr', 'Testing').find('button[title="Delete tag"]').click()
    cy.wait('@deleteTag')
    cy.wait('@fetchTags')

    cy.get('@onTagsChangedSpy').should('have.been.calledOnce')
    cy.contains('td', 'Testing').should('not.exist')
  })

  it('handles pagination controls and displays store errors', () => {
    cy.intercept('GET', /\/api\/tags/, (req) => {
      const skip = Number(req.query.skip) || 0
      const limit = Number(req.query.limit) || 5
      const page = Math.floor(skip / limit) + 1
      req.reply({
        statusCode: 200,
        body: {
          tags: page === 1 ? mockTags : [{ _id: 'tag-6', name: 'Page 2 Tag', color: 'cyan' }],
          total: 6,
          page,
          limit: 5
        }
      })
    }).as('fetchPaginatedTags')

    cy.mountWithPlugins(ManageTagsModal, {
      props: {
        open: true
      }
    })

    cy.wait('@fetchPaginatedTags')
    cy.contains('.pagination-controls', 'Page 1 of 2').should('be.visible')
    cy.get('button[aria-label="Previous tags page"]').should('be.disabled')
    cy.get('button[aria-label="Next tags page"]').should('not.be.disabled').click()

    cy.wait('@fetchPaginatedTags')
    cy.contains('.pagination-controls', 'Page 2 of 2').should('be.visible')
    cy.contains('td .cds--tag', 'Page 2 Tag').should('be.visible')

    // Verify store error display
    cy.then(() => {
      const tagStore = useTagStore()
      tagStore.error = 'Tag name already exists.'
    })
    cy.get('.tag-error-msg').should('be.visible').and('contain.text', 'Tag name already exists.')
  })
})