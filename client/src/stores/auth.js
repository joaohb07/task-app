import { defineStore } from 'pinia'
import api from '../api/client'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('task_app_user') || 'null'),
    token: localStorage.getItem('task_app_token') || null,
    avatarUrl: null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token)
  },

  actions: {
    setSession(user, token) {
      this.user = user
      this.token = token
      localStorage.setItem('task_app_user', JSON.stringify(user))
      localStorage.setItem('task_app_token', token)
    },

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

    async logout(allSessions = false) {
      try {
        await api.post(allSessions ? '/users/logoutAll' : '/users/logout')
      } finally {
        this.clearSession()
      }
    },

    async deleteAccount() {
      await api.delete('/users/me')
      this.clearSession()
    }
  }
})