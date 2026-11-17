<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import TaskComplete from '@carbon/icons-vue/es/task--complete/16'
import UserAvatar from '@carbon/icons-vue/es/user--avatar/20'
import Logout from '@carbon/icons-vue/es/logout/16'
import Light from '@carbon/icons-vue/es/light/16'
import Asleep from '@carbon/icons-vue/es/asleep/16'
import Menu from '@carbon/icons-vue/es/menu/20'
import Close from '@carbon/icons-vue/es/close/20'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const isLight = ref(false)
const mobileMenuOpen = ref(false)

// Fecha automaticamente o menu mobile ao navegar entre rotas
watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false
  }
)

const toggleTheme = () => {
  isLight.value = !isLight.value
  document.documentElement.setAttribute('data-carbon-theme', isLight.value ? 'g10' : 'g100')
}

const handleLogout = async () => {
  mobileMenuOpen.value = false
  await auth.logout(false)
  router.push('/login')
}
</script>

<template>
  <header class="cds--header" role="banner" aria-label="Task App">
    <!-- Botão Hamburger visível em telas menores quando autenticado -->
    <button
      v-if="auth.isAuthenticated"
      type="button"
      class="cds--header__action mobile-menu-trigger"
      :aria-expanded="mobileMenuOpen"
      aria-label="Open menu"
      @click="mobileMenuOpen = !mobileMenuOpen"
    >
      <Close v-if="mobileMenuOpen" />
      <Menu v-else />
    </button>

    <a class="cds--header__name" href="#/dashboard">Task App</a>

    <!-- Navegação Desktop -->
    <nav v-if="auth.isAuthenticated" class="cds--header__nav" aria-label="Main navigation">
      <ul class="cds--header__menu-bar">
        <li>
          <router-link
            to="/dashboard"
            class="cds--header__menu-item"
            :class="{ 'cds--header__menu-item--current': route.path === '/dashboard' }"
          >
            <TaskComplete class="icon-inline" />
            <span>Tasks</span>
          </router-link>
        </li>
        <li>
          <router-link
            to="/profile"
            class="cds--header__menu-item"
            :class="{ 'cds--header__menu-item--current': route.path === '/profile' }"
          >
            <UserAvatar class="icon-inline" />
            <span>Profile</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Ações Globais à Direita -->
    <div class="cds--header__global">
      <button
        type="button"
        class="cds--header__action"
        :title="isLight ? 'Switch to Dark Theme (g100)' : 'Switch to Light Theme (g10)'"
        @click="toggleTheme"
      >
        <Light v-if="!isLight" />
        <Asleep v-else />
      </button>

      <template v-if="auth.isAuthenticated">
        <router-link to="/profile" class="header-user-pill" title="Account Profile">
          <img v-if="auth.avatarUrl" :src="auth.avatarUrl" alt="Avatar" class="header-avatar" />
          <UserAvatar v-else class="header-avatar-fallback" />
          <span class="header-username">{{ auth.user?.name }}</span>
        </router-link>

        <button
          type="button"
          class="cds--header__action"
          title="Sign out"
          @click="handleLogout"
        >
          <Logout />
        </button>
      </template>
    </div>
  </header>

  <!-- Drawer Lateral Colapsável (Mobile / Tablet) -->
  <template v-if="auth.isAuthenticated && mobileMenuOpen">
    <div class="mobile-nav-overlay" @click="mobileMenuOpen = false" />
    <nav class="mobile-nav-drawer" aria-label="Mobile navigation">
      <ul class="mobile-nav-list">
        <li>
          <router-link
            to="/dashboard"
            class="mobile-nav-link"
            :class="{ active: route.path === '/dashboard' }"
          >
            <TaskComplete />
            <span>Tasks</span>
          </router-link>
        </li>
        <li>
          <router-link
            to="/profile"
            class="mobile-nav-link"
            :class="{ active: route.path === '/profile' }"
          >
            <UserAvatar />
            <span>Profile</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </template>
</template>

<style scoped>
:deep(.cds--header__menu-item) {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-inline {
  flex-shrink: 0;
}

.cds--header__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  padding: 0;
  flex-shrink: 0;
}

.cds--header__action svg {
  fill: currentColor;
}

/* Botão hamburger: oculto no desktop onde .cds--header__nav aparece (>= 1056px) */
.mobile-menu-trigger {
  display: none;
}

@media (max-width: 1055px) {
  .mobile-menu-trigger {
    display: inline-flex;
  }
}

.header-user-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.75rem;
  height: 3rem;
  color: var(--cds-text-primary);
  text-decoration: none;
  font-size: 0.875rem;
}

.header-user-pill:hover {
  background-color: var(--cds-background-hover);
}

.header-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.header-avatar-fallback {
  flex-shrink: 0;
}

/* Em telas muito estreitas (< 480px), esconde o nome para não espremer os botões */
@media (max-width: 480px) {
  .header-username {
    display: none;
  }

  .header-user-pill {
    padding: 0 0.5rem;
  }
}

/* Mobile Side Navigation Drawer */
.mobile-nav-overlay {
  position: fixed;
  inset: 3rem 0 0 0;
  background-color: rgba(0, 0, 0, 0.55);
  z-index: 7999;
}

.mobile-nav-drawer {
  position: fixed;
  top: 3rem;
  left: 0;
  bottom: 0;
  width: 16rem;
  background-color: var(--cds-layer);
  border-right: 1px solid var(--cds-border-subtle);
  z-index: 8000;
  padding-top: 0.5rem;
}

.mobile-nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  color: var(--cds-text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  border-left: 3px solid transparent;
}

.mobile-nav-link:hover {
  background-color: var(--cds-background-hover);
  color: var(--cds-text-primary);
}

.mobile-nav-link.active {
  background-color: var(--cds-layer-selected);
  color: var(--cds-text-primary);
  border-left-color: var(--cds-border-interactive);
}
</style>