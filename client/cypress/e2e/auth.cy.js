describe('Authentication & Route Guards E2E', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('redirects unauthenticated visitors from /dashboard to /login', () => {
    cy.visit('/#/dashboard')
    cy.url().should('include', '#/login')
    cy.contains('h1', 'Log in to Task Manager').should('be.visible')
  })

  it('shows an error alert when login fails with invalid credentials', () => {
    cy.intercept('POST', '/api/users/login', {
      statusCode: 400,
      body: { error: 'Unable to login. Check your credentials.' }
    }).as('loginFail')

    cy.visit('/#/login')
    cy.get('#email').type('wrong@example.com')
    cy.get('#password').type('WrongSecret123')
    cy.get('button[type="submit"]').click()

    cy.wait('@loginFail')
    cy.get('[role="alert"]').should('contain.text', 'Unable to login. Check your credentials.')
  })

  it('logs in successfully, redirects to /dashboard, and logs out', () => {
    cy.intercept('POST', '/api/users/login', {
      statusCode: 200,
      body: {
        user: {
          _id: '673a00000000000000000001',
          name: 'João Botelho',
          email: 'joao@example.com',
          hasAvatar: false
        },
        token: 'valid-jwt-token'
      }
    }).as('loginSuccess')

    cy.intercept('GET', '/api/tasks*', {
      statusCode: 200,
      body: {
        tasks: [],
        total: 0,
        stats: { total: 0, completed: 0, pending: 0 }
      }
    }).as('getTasks')

    cy.intercept('POST', '/api/users/logout', {
      statusCode: 200,
      body: { message: 'Logged out successfully.' }
    }).as('logoutReq')

    cy.visit('/#/login')
    cy.get('#email').type('joao@example.com')
    cy.get('#password').type('StrongSecret123')
    cy.get('button[type="submit"]').click()

    cy.wait('@loginSuccess')
    cy.url().should('include', '#/dashboard')
    cy.contains('.header-username', 'João Botelho').should('be.visible')

    // Click sign out button in header
    cy.get('button[title="Sign out"]').click()
    cy.wait('@logoutReq')
    cy.url().should('include', '#/login')
  })
})