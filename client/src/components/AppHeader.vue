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
import Help from '@carbon/icons-vue/es/help/20'
import '../styles/components/app-header.scss'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const isLight = ref(false)
const mobileMenuOpen = ref(false)

/**
 * Watch for route changes to automatically close the mobile menu.
 * This ensures that the mobile menu is closed when navigating to a new route.
 */
watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false
  }
)

/**
 * Toggle the theme between light and dark.
 * Updates the document element's theme attribute accordingly.
 */
const toggleTheme = () => {
  isLight.value = !isLight.value
  document.documentElement.setAttribute('data-carbon-theme', isLight.value ? 'g10' : 'g100')
}

/**
 * Handle user logout.
 * Closes the mobile menu, logs out the user, and redirects to the login page.
 */
const handleLogout = async () => {
  mobileMenuOpen.value = false
  await auth.logout(false)
  router.push('/login')
}
</script>

<template>
  <header class="cds--header" role="banner" aria-label="Task App">
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

    <!-- Desktop navigation -->
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
        <li>
          <router-link
            to="/about"
            class="cds--header__menu-item"
            :class="{ 'cds--header__menu-item--current': route.path === '/about' }"
          >
            <Help class="icon-inline" />
            <span>About</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Global Actions -->
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

  <!-- Collapsible Drawer (Mobile / Tablet) -->
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
        <li>
          <router-link
            to="/about"
            class="mobile-nav-link"
            :class="{ active: route.path === '/about' }"
          >
            <Help />
            <span>About</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </template>
</template>