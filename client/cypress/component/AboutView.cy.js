import AboutView from '../../src/views/AboutView.vue'

describe('AboutView Component', () => {
  it('renders application overview and technology stack tags', () => {
    cy.mountWithPlugins(AboutView)

    cy.contains('h1', 'Task App').should('be.visible')
    cy.contains('.about-description', 'full-stack task management platform').should('be.visible')

    cy.contains('.stack-tags .cds--tag', 'Vue 3 + Vite').should('be.visible')
    cy.contains('.stack-tags .cds--tag', 'Pinia').should('be.visible')
    cy.contains('.stack-tags .cds--tag', 'IBM Carbon Design').should('be.visible')
    cy.contains('.stack-tags .cds--tag', 'Node.js & Express').should('be.visible')
    cy.contains('.stack-tags .cds--tag', 'MongoDB & Mongoose').should('be.visible')
    cy.contains('.stack-tags .cds--tag', 'Jest & Cypress').should('be.visible')
  })

  it('renders valid external links to official documentation and GitHub repository', () => {
    cy.mountWithPlugins(AboutView)

    cy.contains('a.link-card', 'Official Documentation')
      .should('be.visible')
      .and('have.attr', 'href', 'https://joaohb07.github.io/documentation/apps/task_app/')
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')

    cy.contains('a.link-card', 'GitHub Repository')
      .should('be.visible')
      .and('have.attr', 'href', 'https://github.com/joaohb07/task-app')
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
  })

  it('renders Back button and author attribution footer', () => {
    cy.mountWithPlugins(AboutView)

    cy.contains('.about-topbar button', 'Back').should('be.visible').and('not.be.disabled')
    cy.contains('.about-footer', 'João Henrique Botelho (joaohb07)').should('be.visible')
  })
})