describe('About Page Navigation', () => {
  it('navigates to /about and displays documentation and GitHub links', () => {
    cy.visit('/#/about')

    cy.contains('h1', 'Task App').should('be.visible')
    cy.contains('a', 'Official Documentation').should(
      'have.attr',
      'href',
      'https://joaohb07.github.io/documentation/web/task_app/task_app/'
    )
    cy.contains('a', 'GitHub Repository').should(
      'have.attr',
      'href',
      'https://github.com/joaohb07/task-app'
    )
  })
})