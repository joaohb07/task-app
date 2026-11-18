import { mount } from 'cypress/vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import '@carbon/styles/css/styles.css'

Cypress.Commands.add('mountWithPlugins', (component, options = {}) => {
  const pinia = createPinia()
  setActivePinia(pinia)

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

  return mount(component, {
    global: {
      plugins: [pinia, router],
      ...(options.global || {})
    },
    props: options.props || {}
  })
})