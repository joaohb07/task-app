<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ArrowRight from '@carbon/icons-vue/es/arrow--right/16'
import WarningFilled from '@carbon/icons-vue/es/warning--filled/16'

const router = useRouter()
const auth = useAuthStore()

const isRegister = ref(false)
const name = ref('')
const email = ref('')
const password = ref('')
const age = ref('')

const toggleMode = () => {
  isRegister.value = !isRegister.value
  auth.error = null
}

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

<style scoped>
.auth-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 3rem);
  padding: 1.5rem;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  padding: 2rem;
  border: 1px solid var(--cds-border-subtle);
}

.auth-header {
  margin-bottom: 1.5rem;
}

.auth-header h1 {
  margin: 0.35rem 0 0.5rem;
}

.subtitle {
  color: var(--cds-text-secondary);
}

.auth-alert {
  margin-bottom: 1.25rem;
  max-width: 100%;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.submit-btn {
  width: 100%;
  max-width: 100%;
  justify-content: space-between;
  margin-top: 0.5rem;
}

.auth-footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--cds-border-subtle);
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--cds-text-secondary);
}

.switch-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 0.875rem;
}
</style>