<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import AppHeader from './components/AppHeader.vue'

const auth = useAuthStore()

/**
 * On component mount, check if the user is authenticated.
 * If authenticated, fetch the user's profile information.
 */
onMounted(() => {
  if (auth.isAuthenticated) {
    auth.fetchProfile()
  }
})
</script>

<template>
  <AppHeader />
  <main class="app-shell">
    <router-view />
  </main>
</template>