<script setup>
import { useRouter } from 'vue-router'
import ArrowLeft from '@carbon/icons-vue/es/arrow--left/16'
import Document from '@carbon/icons-vue/es/document/20'
import LogoGithub from '@carbon/icons-vue/es/logo--github/20'
import Launch from '@carbon/icons-vue/es/launch/16'
import '../styles/views/about-view.scss'

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
          href="https://joaohb07.github.io/documentation/apps/task_app/"
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
          <span class="link-card-url">https://joaohb07.github.io/documentation/apps/task_app/</span>
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