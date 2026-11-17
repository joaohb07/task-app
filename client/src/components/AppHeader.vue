<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import TaskComplete from '@carbon/icons-vue/es/task--complete/16'
import UserAvatar from '@carbon/icons-vue/es/user--avatar/20'
import Logout from '@carbon/icons-vue/es/logout/16'
import Light from '@carbon/icons-vue/es/light/16'
import Asleep from '@carbon/icons-vue/es/asleep/16'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const isLight = ref(false)

const toggleTheme = () => {
  isLight.value = !isLight.value
  document.documentElement.setAttribute('data-carbon-theme', isLight.value ? 'g10' : 'g100')
}

const handleLogout = async () => {
  await auth.logout(false)
  router.push('/login')
}
</script>

<template>
  <header class="cds--header" role="banner" aria-label="Task Manager Platform">
    <a class="cds--header__name" href="#/dashboard">
      <span class="cds--header__name--prefix">IBM Carbon&nbsp;</span>
      Task Manager
    </a>

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
}

.cds--header__action svg {
  fill: currentColor;
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
}
</style>