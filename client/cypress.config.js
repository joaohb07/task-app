import { defineConfig } from 'cypress'
import viteConfig from './vite.config.js'

export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:5173',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false
  },
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
      viteConfig
    },
    specPattern: 'cypress/component/**/*.cy.js',
    supportFile: 'cypress/support/component.js',
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false
  }
})