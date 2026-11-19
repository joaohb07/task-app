<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Upload from '@carbon/icons-vue/es/upload/16'
import TrashCan from '@carbon/icons-vue/es/trash-can/16'
import Save from '@carbon/icons-vue/es/save/16'
import UserAvatar from '@carbon/icons-vue/es/user--avatar/32'
import '../styles/views/profile-view.scss'

const router = useRouter()
const auth = useAuthStore()

/**
 * Reactive state variables for the profile form.
 * - name: User's full name.
 * - email: User's email address.
 * - age: User's age (default 0).
 * - password: New password (optional).
 * - feedback: Feedback message for successful updates.
 * - fileInput: Reference to the hidden file input for avatar upload.
 */
const name = ref('')
const email = ref('')
const age = ref(0)
const password = ref('')
const feedback = ref('')
const fileInput = ref(null)

/**
 * Fetches the user's profile information on component mount.
 * Populates the form fields with the current user data if available.
 */
onMounted(async () => {
  await auth.fetchProfile()
  if (auth.user) {
    name.value = auth.user.name
    email.value = auth.user.email
    age.value = auth.user.age || 0
  }
})

/**
 * Handles the profile update form submission.
 * Sends updated user information to the server and provides feedback on success.
 */
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

/**
 * Handles the avatar file input change event.
 * Uploads the selected image file as the user's new avatar.
 * Provides feedback on success or error.
 * @param {Event} event - The change event from the file input.
 */
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

/**
 * Logs the user out from all devices and redirects to the login page.
 */
const handleLogoutAll = async () => {
  await auth.logout(true)
  router.push('/login')
}

/**
 * Deletes the user's account after confirmation and redirects to the login page.
 * Prompts the user for confirmation before proceeding with the deletion.
 */
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
        <UserAvatar v-else class="avatar-placeholder" />
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