// Custom helper to seed an authenticated session in localStorage before visiting protected routes
Cypress.Commands.add('loginWithSession', (userOverride = {}) => {
  const user = {
    _id: '673a00000000000000000001',
    name: 'João Botelho',
    email: 'joao@example.com',
    age: 26,
    hasAvatar: false,
    ...userOverride
  }

  window.localStorage.setItem('task_app_token', 'fake-jwt-token-for-cypress')
  window.localStorage.setItem('task_app_user', JSON.stringify(user))
})