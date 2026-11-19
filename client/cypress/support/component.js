import { mount } from 'cypress/vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import '@carbon/styles/css/styles.css'

/**
 * Custom Cypress command to mount a Vue component with Pinia and Vue Router plugins.
 * This command sets up a Pinia store and a Vue Router instance, allowing components to be tested in isolation with their dependencies.
 * 
 * @param {Object} component - The Vue component to be mounted.
 * @param {Object} options - Optional configuration for mounting the component, including props and global options.
 * @returns {Cypress.Chainable} - A Cypress chainable object for further testing.
 */
Cypress.Commands.add('mountWithPlugins', (component, options = {}) => {
  /**
   * Creates a new Pinia instance and sets it as the active Pinia for the test.
   * This allows components to access the Pinia store during testing.
   */
  const pinia = createPinia()
  setActivePinia(pinia)

  /**
   * Creates a Vue Router instance with hash-based history and predefined routes for testing.
   * If a router is provided in the options, it uses that instead of creating a new one.
   */
  const router =
    options.router ||
    createRouter({
      history: createWebHashHistory(),
      routes: [
        { path: '/', redirect: '/dashboard' },
        { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
        { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
        { path: '/profile', name: 'profile', component: { template: '<div>Profile</div>' } },
        { path: '/about', name: 'about', component: { template: '<div>About</div>' } }
      ]
    })
  
  /**
   * Mounts the provided Vue component with the specified options, including global plugins and props.
   * This allows for testing the component in isolation while providing access to Pinia and Vue Router.
   */
  return mount(component, {
    global: {
      plugins: [pinia, router],
      ...(options.global || {})
    },
    props: options.props || {}
  })
})