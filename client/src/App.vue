<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import AppHeader from './components/AppHeader.vue'

const auth = useAuthStore()

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