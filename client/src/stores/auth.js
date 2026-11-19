import { defineStore } from 'pinia'
import api from '../api/client'

/**
 * Pinia store for managing user authentication and profile state.
 * Provides state, getters, and actions for user session management, including login, logout, registration,
 * profile fetching/updating, and avatar handling.
 */
export const useAuthStore = defineStore('auth', {
  /**
   * State properties for the authentication store.
   * - user: The authenticated user's data, retrieved from localStorage or null if not authenticated.
   * - token: The authentication token, retrieved from localStorage or null if not authenticated.
   * - avatarUrl: The URL of the user's avatar image, or null if not available.
   * - loading: A boolean indicating whether an authentication-related operation is in progress.
   * - error: An error message string for any authentication-related errors, or null if no error.
   */
  state: () => ({
    user: JSON.parse(localStorage.getItem('task_app_user') || 'null'),
    token: localStorage.getItem('task_app_token') || null,
    avatarUrl: null,
    loading: false,
    error: null
  }),

  /**
   * Getter to determine if the user is currently authenticated.
   * Returns true if a valid authentication token exists, false otherwise.
   */
  getters: {
    isAuthenticated: (state) => Boolean(state.token)
  },

  /**
   * Actions for managing user authentication and profile state.
   * Includes methods for setting/clearing the session, registering, logging in/out,
   * fetching/updating the profile, and handling avatar upload/deletion.
   */
  actions: {
    /**
     * Sets the user session by storing the user data and token in state and localStorage.
     * @param {Object} user - The authenticated user's data.
     * @param {string} token - The authentication token.
     */
    setSession(user, token) {
      this.user = user
      this.token = token
      localStorage.setItem('task_app_user', JSON.stringify(user))
      localStorage.setItem('task_app_token', token)
    },

    /**
     * Clears the user session by removing user data and token from state and localStorage.
     * Also revokes the avatar URL if it exists.
     */
    clearSession() {
      this.user = null
      this.token = null
      if (this.avatarUrl) {
        URL.revokeObjectURL(this.avatarUrl)
        this.avatarUrl = null
      }
      localStorage.removeItem('task_app_user')
      localStorage.removeItem('task_app_token')
    },

    /**
     * Registers a new user account with the provided payload.
     * On success, sets the session with the returned user data and token.
     * @param {Object} payload - The registration data (e.g., name, email, password).
     * @returns {Promise<boolean>} - Returns true on success, false on failure.
     * @throws {Error} - Throws an error if the API request fails.
     */
    async register(payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/users', payload)
        this.setSession(data.user, data.token)
        return true
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to register account.'
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Logs in a user with the provided email and password.
     * On success, sets the session with the returned user data and token, and fetches the user's avatar.
     * @param {string} email - The user's email address.
     * @param {string} password - The user's password.
     * @returns {Promise<boolean>} - Returns true on success, false on failure.
     * @throws {Error} - Throws an error if the API request fails.
     */
    async login(email, password) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/users/login', { email, password })
        this.setSession(data.user, data.token)
        await this.fetchAvatar()
        return true
      } catch (err) {
        this.error = err.response?.data?.error || 'Invalid credentials.'
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetches the authenticated user's profile data from the server.
     * Updates the user state and localStorage with the fetched data.
     * If the user has an avatar, fetches the avatar image as well.
     * If the request fails (e.g., due to an invalid token), clears the session.
     * @async
     * @throws {Error} - Throws an error if the API request fails.
     */
    async fetchProfile() {
      if (!this.token) return
      try {
        const { data } = await api.get('/users/me')
        this.user = data
        localStorage.setItem('task_app_user', JSON.stringify(data))
        if (data.hasAvatar) {
          await this.fetchAvatar()
        }
      } catch {
        this.clearSession()
      }
    },

    /**
     * Updates the authenticated user's profile with the provided updates.
     * On success, updates the user state and localStorage with the new data.
     * @param {Object} updates - The profile updates (e.g., name, email, password).
     * @returns {Promise<boolean>} - Returns true on success, false on failure.
     * @throws {Error} - Throws an error if the API request fails.
     */
    async updateProfile(updates) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.patch('/users/me', updates)
        this.user = data
        localStorage.setItem('task_app_user', JSON.stringify(data))
        return true
      } catch (err) {
        this.error = err.response?.data?.error || 'Unable to update profile.'
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetches the authenticated user's avatar image from the server.
     * If the user does not have an avatar, sets the avatarUrl to null.
     * If the request fails, sets the avatarUrl to null.
     * @async
     * @throws {Error} - Throws an error if the API request fails.
     */
    async fetchAvatar() {
      if (!this.user?.hasAvatar) {
        this.avatarUrl = null
        return
      }
      try {
        const response = await api.get('/users/me/avatar', { responseType: 'blob' })
        if (this.avatarUrl) URL.revokeObjectURL(this.avatarUrl)
        this.avatarUrl = URL.createObjectURL(response.data)
      } catch {
        this.avatarUrl = null
      }
    },

    /**
     * Uploads a new avatar image for the authenticated user.
     * On success, updates the user's hasAvatar property and fetches the new avatar image.
     * @param {File} file - The avatar image file to upload.
     * @async
     * @throws {Error} - Throws an error if the API request fails.
     */
    async uploadAvatar(file) {
      const formData = new FormData()
      formData.append('avatar', file)
      await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (this.user) {
        this.user.hasAvatar = true
        localStorage.setItem('task_app_user', JSON.stringify(this.user))
      }
      await this.fetchAvatar()
    },

    /**
     * Deletes the authenticated user's avatar image from the server.
     * On success, revokes the avatar URL, sets it to null, and updates the user's hasAvatar property.
     * @async
     * @throws {Error} - Throws an error if the API request fails.
     */
    async deleteAvatar() {
      await api.delete('/users/me/avatar')
      if (this.avatarUrl) {
        URL.revokeObjectURL(this.avatarUrl)
        this.avatarUrl = null
      }
      if (this.user) {
        this.user.hasAvatar = false
        localStorage.setItem('task_app_user', JSON.stringify(this.user))
      }
    },

    /**
     * Logs out the authenticated user.
     * If allSessions is true, logs out from all sessions; otherwise, logs out from the current session only.
     * Clears the user session after logging out.
     * @param {boolean} allSessions - Whether to log out from all sessions (default: false).
     * @async
     * @throws {Error} - Throws an error if the API request fails.
     */
    async logout(allSessions = false) {
      try {
        await api.post(allSessions ? '/users/logoutAll' : '/users/logout')
      } finally {
        this.clearSession()
      }
    },

    /**
     * Deletes the authenticated user's account from the server.
     * Clears the user session after account deletion.
     * @async
     * @throws {Error} - Throws an error if the API request fails.
     */
    async deleteAccount() {
      await api.delete('/users/me')
      this.clearSession()
    }
  }
})