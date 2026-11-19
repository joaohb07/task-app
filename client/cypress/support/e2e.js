/**
 * Logs in the user with a fake session stored in localStorage.
 * This allows testing protected routes without going through the actual login process.
 *
 * @param {Object} userOverride - Optional override for the default user object.
 */
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