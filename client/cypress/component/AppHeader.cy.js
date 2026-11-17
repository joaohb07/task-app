import AppHeader from '../../src/components/AppHeader.vue'
import { useAuthStore } from '../../src/stores/auth'

describe('AppHeader Component', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.setAttribute('data-carbon-theme', 'g100')
  })

  it('renders Task App branding and theme switcher for guests', () => {
    cy.mountWithPlugins(AppHeader)

    cy.get('.cds--header__name').should('contain.text', 'Task App')
    cy.get('.cds--header__nav').should('not.exist')

    // Toggle theme from g100 to g10
    cy.get('button[title*="Switch to Light Theme"]').click()
    cy.document().its('documentElement').should('have.attr', 'data-carbon-theme', 'g10')
  })

  it('displays navigation links and user info when authenticated on desktop', () => {
    localStorage.setItem('task_app_token', 'test-token')
    localStorage.setItem(
      'task_app_user',
      JSON.stringify({ name: 'João Botelho', email: 'joao@example.com' })
    )

    cy.mountWithPlugins(AppHeader)

    cy.get('.cds--header__nav').should('be.visible')
    cy.contains('.cds--header__menu-item', 'Tasks').should('be.visible')
    cy.contains('.cds--header__menu-item', 'Profile').should('be.visible')
    cy.get('.header-username').should('contain.text', 'João Botelho')
  })

  it('collapses navigation into a toggleable mobile drawer on small viewports', () => {
    cy.viewport(375, 667)
    localStorage.setItem('task_app_token', 'test-token')
    localStorage.setItem(
      'task_app_user',
      JSON.stringify({ name: 'João Botelho', email: 'joao@example.com' })
    )

    cy.mountWithPlugins(AppHeader)

    cy.get('.mobile-menu-trigger').should('be.visible').click()
    cy.get('.mobile-nav-drawer').should('be.visible')
    cy.contains('.mobile-nav-link', 'Tasks').should('be.visible')
    cy.contains('.mobile-nav-link', 'Profile').should('be.visible')

    // Close drawer via backdrop overlay
    cy.get('.mobile-nav-overlay').click({ force: true })
    cy.get('.mobile-nav-drawer').should('not.exist')
  })
})