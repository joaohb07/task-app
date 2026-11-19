<script setup>
import { useRouter } from 'vue-router'
import ArrowLeft from '@carbon/icons-vue/es/arrow--left/16'
import Document from '@carbon/icons-vue/es/document/20'
import LogoGithub from '@carbon/icons-vue/es/logo--github/20'
import Launch from '@carbon/icons-vue/es/launch/16'

const router = useRouter()

/**
 * Tech stack information for the About page.
 * Each entry includes the technology name, its role in the application, and a color for display.
 */
const techStack = [
  { name: 'Vue 3 + Vite', role: 'Reactive SPA & Composition API', color: 'green' },
  { name: 'Pinia', role: 'Modular State Management', color: 'teal' },
  { name: 'IBM Carbon Design', role: 'Enterprise UI & Design Tokens', color: 'blue' },
  { name: 'Node.js & Express', role: 'RESTful API & JWT Auth', color: 'purple' },
  { name: 'MongoDB & Mongoose', role: 'Document Persistence & Aggregation', color: 'cyan' },
  { name: 'Jest & Cypress', role: 'Unit, Integration, Component & E2E Tests', color: 'magenta' }
]
</script>

<template>
  <section class="about-page">
    <div class="about-container">
      <!-- Top Navigation Bar -->
      <div class="about-topbar">
        <button
          type="button"
          class="cds--btn cds--btn--ghost cds--btn--sm back-btn"
          @click="router.back()"
        >
          <ArrowLeft class="back-btn-icon" />
          <span class="back-btn-label">Back</span>
        </button>
      </div>

      <!-- Hero / Overview Tile -->
      <div class="cds--tile about-hero">
        <p class="cds--type-label-01 about-eyebrow">ABOUT THE APPLICATION</p>
        <h1 class="about-title">Task App</h1>
        <p class="about-description">
          A full-stack task management platform designed for structured productivity. Built with a
          Node.js/Express REST API and a Vue 3 single-page application styled with IBM Carbon
          Design System, supporting JWT authentication, custom color-coded tags, server-side
          filtering, sorting, pagination, and profile avatar management.
        </p>

        <!-- Tech Stack Pills -->
        <div class="stack-section">
          <h2 class="cds--label">Architecture & Stack</h2>
          <div class="stack-tags">
            <span
              v-for="tech in techStack"
              :key="tech.name"
              class="cds--tag cds--tag--sm"
              :class="`cds--tag--${tech.color}`"
              :title="tech.role"
            >
              <span class="cds--tag__label">{{ tech.name }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- External Links Grid -->
      <div class="links-grid">
        <a
          href="https://joaohb07.github.io/documentation/web/task_app/task_app/"
          target="_blank"
          rel="noopener noreferrer"
          class="cds--tile cds--tile--clickable link-card"
        >
          <div class="link-card-header">
            <Document class="link-icon" />
            <Launch class="external-icon" />
          </div>
          <h3 class="link-card-title">Official Documentation</h3>
          <p class="link-card-desc">
            Read the full architecture breakdown, API endpoints, deployment setup, and testing
            strategy.
          </p>
          <span class="link-card-url">joaohb07.github.io/documentation/web/task_app/task_app/</span>
        </a>

        <a
          href="https://github.com/joaohb07/task-app"
          target="_blank"
          rel="noopener noreferrer"
          class="cds--tile cds--tile--clickable link-card"
        >
          <div class="link-card-header">
            <LogoGithub class="link-icon" />
            <Launch class="external-icon" />
          </div>
          <h3 class="link-card-title">GitHub Repository</h3>
          <p class="link-card-desc">
            Inspect the source code, Docker configuration, CI/CD workflows, and automated test
            suites.
          </p>
          <span class="link-card-url">github.com/joaohb07/task-app</span>
        </a>
      </div>

      <footer class="about-footer">
        <p>Developed by João Henrique Botelho (joaohb07)</p>
      </footer>
    </div>
  </section>
</template>

<style scoped>
.about-topbar {
  display: flex;
  align-items: center;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding-left: 0.5rem;
  padding-right: 0.75rem;
}

.back-btn-icon {
  flex-shrink: 0;
  display: block;
}

.back-btn-label {
  line-height: 1;
  transform: translateY(-0.5px);
}

.about-page {
  min-height: calc(100vh - 48px);
  padding: 2rem 1rem 3rem;
  background-color: var(--cds-background);
}

.about-container {
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.about-topbar {
  display: flex;
  align-items: center;
}

.about-hero {
  padding: 2rem;
  border: 1px solid var(--cds-border-subtle);
}

.about-eyebrow {
  color: var(--cds-link-primary);
  letter-spacing: 0.08em;
  margin-bottom: 0.35rem;
}

.about-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--cds-text-primary);
  margin-bottom: 0.75rem;
}

.about-description {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--cds-text-secondary);
  margin-bottom: 1.5rem;
}

.stack-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--cds-border-subtle);
}

.stack-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.link-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.5rem;
  border: 1px solid var(--cds-border-subtle);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.link-card:hover {
  border-color: var(--cds-focus);
}

.link-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--cds-link-primary);
}

.link-card-title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--cds-text-primary);
}

.link-card-desc {
  font-size: 0.875rem;
  line-height: 1.45;
  color: var(--cds-text-secondary);
}

.link-card-url {
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--cds-link-primary);
  word-break: break-all;
}

.about-footer {
  text-align: center;
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
  padding-top: 0.5rem;
}

@media (max-width: 640px) {
  .links-grid {
    grid-template-columns: 1fr;
  }
}
</style>