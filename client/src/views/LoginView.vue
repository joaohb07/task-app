<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ArrowRight from '@carbon/icons-vue/es/arrow--right/16'
import WarningFilled from '@carbon/icons-vue/es/warning--filled/16'
import '../styles/views/login-view.scss'

const router = useRouter()
const auth = useAuthStore()

/**
 * Reactive state variables for the authentication form.
 * - isRegister: Boolean indicating whether the form is in registration mode.
 * - name: User's full name (used only in registration).
 * - email: User's email address.
 * - password: User's password.
 * - age: User's age (optional, used only in registration).
 */
const isRegister = ref(false)
const name = ref('')
const email = ref('')
const password = ref('')
const age = ref('')

/**
 * Toggles the authentication form between login and registration modes.
 * Resets any existing authentication errors when switching modes.
 */
const toggleMode = () => {
  isRegister.value = !isRegister.value
  auth.error = null
}

/**
 * Handles the form submission for both login and registration.
 * Calls the appropriate method from the auth store based on the current mode.
 * On successful authentication, navigates to the dashboard.
 */
const handleSubmit = async () => {
  let success = false
  if (isRegister.value) {
    success = await auth.register({
      name: name.value,
      email: email.value,
      password: password.value,
      age: age.value ? Number(age.value) : 0
    })
  } else {
    success = await auth.login(email.value, password.value)
  }

  if (success) {
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="auth-wrapper">
    <div class="cds--tile auth-card">
      <div class="auth-header">
        <span class="cds--type-label-01">SELF-HOSTED WORKSPACE</span>
        <h1 class="cds--type-productive-heading-04">
          {{ isRegister ? 'Create an account' : 'Log in to Task Manager' }}
        </h1>
        <p class="cds--type-body-short-01 subtitle">
          {{
            isRegister
              ? 'Register to manage tasks, track completion metrics, and sync across sessions.'
              : 'Enter your credentials to access your personal task workspace.'
          }}
        </p>
      </div>

      <div v-if="auth.error" class="cds--inline-notification cds--inline-notification--error auth-alert" role="alert">
        <div class="cds--inline-notification__details">
          <WarningFilled class="cds--inline-notification__icon" />
          <div class="cds--inline-notification__text-wrapper">
            <p class="cds--inline-notification__title">Authentication Error</p>
            <p class="cds--inline-notification__subtitle">{{ auth.error }}</p>
          </div>
        </div>
      </div>

      <form class="cds--form auth-form" @submit.prevent="handleSubmit">
        <div v-if="isRegister" class="cds--form-item">
          <label for="name" class="cds--label">Full Name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            required
            placeholder="Jhon Doe"
            class="cds--text-input"
          />
        </div>

        <div class="cds--form-item">
          <label for="email" class="cds--label">Email Address</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="name@example.com"
            class="cds--text-input"
          />
        </div>

        <div class="cds--form-item">
          <label for="password" class="cds--label">Password (min. 7 characters)</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="7"
            placeholder="••••••••"
            class="cds--text-input"
          />
        </div>

        <div v-if="isRegister" class="cds--form-item">
          <label for="age" class="cds--label">Age (optional)</label>
          <input
            id="age"
            v-model="age"
            type="number"
            min="0"
            placeholder="25"
            class="cds--text-input"
          />
        </div>

        <button
          type="submit"
          class="cds--btn cds--btn--primary submit-btn"
          :disabled="auth.loading"
        >
          <span>{{ auth.loading ? 'Processing...' : isRegister ? 'Register' : 'Continue' }}</span>
          <ArrowRight class="cds--btn__icon" />
        </button>
      </form>

      <div class="auth-footer">
        <span>{{ isRegister ? 'Already have an account?' : "Don't have an account?" }}</span>
        <button type="button" class="cds--link switch-btn" @click="toggleMode">
          {{ isRegister ? 'Log in' : 'Create an account' }}
        </button>
      </div>
    </div>
  </div>
</template>