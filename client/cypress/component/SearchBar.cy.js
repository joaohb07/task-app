import { mount } from 'cypress/vue'
import '@carbon/styles/css/styles.css'
import SearchBar from '../../src/components/SearchBar.vue'

describe('SearchBar Component', () => {
  it('renders placeholder and does not display clear button or counter when empty', () => {
    mount(SearchBar, {
      props: {
        modelValue: '',
        resultCount: 2,
        totalCount: 2
      }
    })

    cy.get('input[type="search"]')
      .should('have.attr', 'placeholder', 'Search tasks by title, details, tag, or subtask...')
      .and('have.value', '')

    cy.get('button[aria-label="Clear search"]').should('not.exist')
    cy.contains('.search-counter', 'shown').should('not.exist')
  })

  it('emits update:modelValue as the user types and displays result counter', () => {
    const onUpdate = cy.spy().as('onUpdate')

    mount(SearchBar, {
      props: {
        modelValue: 'Jest',
        resultCount: 1,
        totalCount: 3,
        'onUpdate:modelValue': onUpdate
      }
    })

    cy.contains('.search-counter', '1 of 3 shown').should('be.visible')
    cy.get('input[type="search"]').type(' suite')
    cy.get('@onUpdate').should('have.been.calledWith', 'Jest suite')
  })

  it('emits update:modelValue with empty string and clear event when clicking clear button or pressing Esc', () => {
    const onUpdate = cy.spy().as('onUpdate')
    const onClear = cy.spy().as('onClear')

    mount(SearchBar, {
      props: {
        modelValue: 'Docker',
        resultCount: 1,
        totalCount: 4,
        'onUpdate:modelValue': onUpdate,
        onClear
      }
    })

    cy.get('button[aria-label="Clear search"]').should('be.visible').click()
    cy.get('@onUpdate').should('have.been.calledWith', '')
    cy.get('@onClear').should('have.been.calledOnce')

    cy.get('input[type="search"]').type('{esc}')
    cy.get('@onUpdate').should('have.been.calledWith', '')
    cy.get('@onClear').should('have.been.calledTwice')
  })
})