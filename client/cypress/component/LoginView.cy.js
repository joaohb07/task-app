import LoginView from '../../src/views/LoginView.vue'
import { useAuthStore } from '../../src/stores/auth'

describe('LoginView Component', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('toggles between Login and Register modes dynamically', () => {
    cy.mountWithPlugins(LoginView)

    cy.contains('h1', 'Log in to Task Manager').should('be.visible')
    cy.get('#name').should('not.exist')
    cy.get('#age').should('not.exist')

    // Switch to Register mode
    cy.contains('button.switch-btn', 'Create an account').click()

    cy.contains('h1', 'Create an account').should('be.visible')
    cy.get('#name').should('be.visible')
    cy.get('#age').should('be.visible')
  })

  it('displays inline error notification when auth store has an error', () => {
    cy.mountWithPlugins(LoginView)

    cy.then(() => {
      const auth = useAuthStore()
      auth.error = 'Unable to login. Check your credentials.'
    })

    cy.get('[role="alert"]').should('be.visible')
    cy.contains('Unable to login. Check your credentials.').should('be.visible')
  })
})