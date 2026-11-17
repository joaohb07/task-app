<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Upload from '@carbon/icons-vue/es/upload/16'
import TrashCan from '@carbon/icons-vue/es/trash-can/16'
import Save from '@carbon/icons-vue/es/save/16'
import UserAvatar from '@carbon/icons-vue/es/user--avatar/32'

const router = useRouter()
const auth = useAuthStore()

const name = ref('')
const email = ref('')
const age = ref(0)
const password = ref('')
const feedback = ref('')
const fileInput = ref(null)

onMounted(async () => {
  await auth.fetchProfile()
  if (auth.user) {
    name.value = auth.user.name
    email.value = auth.user.email
    age.value = auth.user.age || 0
  }
})

const handleUpdate = async () => {
  feedback.value = ''
  const updates = {
    name: name.value,
    email: email.value,
    age: Number(age.value)
  }
  if (password.value.trim()) {
    updates.password = password.value.trim()
  }

  const ok = await auth.updateProfile(updates)
  if (ok) {
    password.value = ''
    feedback.value = 'Profile updated successfully.'
  }
}

const handleFileChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    await auth.uploadAvatar(file)
    feedback.value = 'Avatar updated.'
  } catch (err) {
    auth.error = err.response?.data?.error || 'Avatar upload failed (max 1MB PNG/JPG).'
  }
}

const handleLogoutAll = async () => {
  await auth.logout(true)
  router.push('/login')
}

const handleDeleteAccount = async () => {
  if (!window.confirm('Are you sure you want to permanently delete your account and all tasks?')) {
    return
  }
  await auth.deleteAccount()
  router.push('/login')
}
</script>

<template>
  <div class="page-container profile-grid">
    <!-- Left Card: Avatar Management -->
    <div class="cds--tile profile-card avatar-section">
      <h3 class="cds--type-productive-heading-03">Profile Avatar</h3>
      <p class="cds--type-body-short-01 subtitle">PNG or JPEG up to 1 MB (auto-resized to 250×250).</p>

      <div class="avatar-preview">
        <img v-if="auth.avatarUrl" :src="auth.avatarUrl" alt="User avatar" class="avatar-img" />
        <UserAvatar class="avatar-placeholder" />
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/png, image/jpeg"
        hidden
        @change="handleFileChange"
      />

      <div class="avatar-actions">
        <button type="button" class="cds--btn cds--btn--tertiary cds--btn--sm" @click="fileInput.click()">
          <span>Upload Image</span>
          <Upload class="cds--btn__icon" />
        </button>
        <button
          v-if="auth.user?.hasAvatar"
          type="button"
          class="cds--btn cds--btn--danger--ghost cds--btn--sm"
          @click="auth.deleteAvatar()"
        >
          <span>Remove</span>
          <TrashCan class="cds--btn__icon" />
        </button>
      </div>
    </div>

    <!-- Right Card: Account Details & Security -->
    <div class="cds--tile profile-card">
      <h3 class="cds--type-productive-heading-03">Account Details</h3>

      <div v-if="feedback" class="cds--inline-notification cds--inline-notification--success msg-box">
        <div class="cds--inline-notification__details">
          <div class="cds--inline-notification__text-wrapper">
            <p class="cds--inline-notification__title">{{ feedback }}</p>
          </div>
        </div>
      </div>

      <div v-if="auth.error" class="cds--inline-notification cds--inline-notification--error msg-box">
        <div class="cds--inline-notification__details">
          <div class="cds--inline-notification__text-wrapper">
            <p class="cds--inline-notification__title">{{ auth.error }}</p>
          </div>
        </div>
      </div>

      <form class="cds--form profile-form" @submit.prevent="handleUpdate">
        <div class="cds--form-item">
          <label for="prof-name" class="cds--label">Name</label>
          <input id="prof-name" v-model="name" type="text" required class="cds--text-input" />
        </div>

        <div class="cds--form-item">
          <label for="prof-email" class="cds--label">Email</label>
          <input id="prof-email" v-model="email" type="email" required class="cds--text-input" />
        </div>

        <div class="cds--form-item">
          <label for="prof-age" class="cds--label">Age</label>
          <input id="prof-age" v-model="age" type="number" min="0" class="cds--text-input" />
        </div>

        <div class="cds--form-item">
          <label for="prof-pass" class="cds--label">New Password (leave blank to keep current)</label>
          <input
            id="prof-pass"
            v-model="password"
            type="password"
            minlength="7"
            placeholder="•••••••"
            class="cds--text-input"
          />
        </div>

        <button type="submit" class="cds--btn cds--btn--primary" :disabled="auth.loading">
          <span>Save Changes</span>
          <Save class="cds--btn__icon" />
        </button>
      </form>

      <div class="danger-zone">
        <h4 class="cds--type-productive-heading-02">Session & Danger Zone</h4>
        <div class="danger-buttons">
          <button type="button" class="cds--btn cds--btn--secondary cds--btn--sm" @click="handleLogoutAll">
            Log out from all devices
          </button>
          <button type="button" class="cds--btn cds--btn--danger cds--btn--sm" @click="handleDeleteAccount">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}

.profile-card {
  padding: 1.75rem;
  border: 1px solid var(--cds-border-subtle);
}

.subtitle {
  color: var(--cds-text-secondary);
  margin-top: 0.35rem;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.avatar-preview {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: var(--cds-layer-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1.5rem 0;
  overflow: hidden;
  border: 2px solid var(--cds-border-strong);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-actions {
  display: flex;
  gap: 0.5rem;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.25rem;
}

.msg-box {
  margin-top: 1rem;
  max-width: 100%;
}

.danger-zone {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--cds-border-subtle);
}

.danger-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}
</style>