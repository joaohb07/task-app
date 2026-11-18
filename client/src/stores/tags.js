import { defineStore } from 'pinia'
import api from '../api/client'

export const useTagStore = defineStore('tags', {
  state: () => ({
    items: [],
    allTags: [],
    total: 0,
    page: 1,
    limit: 5,
    loading: false,
    error: null
  }),

  actions: {
    async fetchTags() {
      this.loading = true
      this.error = null
      try {
        const params = {
          limit: this.limit,
          skip: (this.page - 1) * this.limit
        }
        const { data } = await api.get('/tags', { params })
        this.items = data.tags
        this.total = data.total
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to load tags.'
      } finally {
        this.loading = false
      }
    },

    async fetchAllTags() {
      try {
        const { data } = await api.get('/tags', { params: { limit: 100, skip: 0 } })
        this.allTags = data.tags
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to load tags.'
      }
    },

    async createTag(payload) {
      this.error = null
      try {
        await api.post('/tags', payload)
        this.page = 1
        await Promise.all([this.fetchTags(), this.fetchAllTags()])
        return true
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to create tag.'
        return false
      }
    },

    async updateTag(id, payload) {
      this.error = null
      try {
        await api.patch(`/tags/${id}`, payload)
        await Promise.all([this.fetchTags(), this.fetchAllTags()])
        return true
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to update tag.'
        return false
      }
    },

    async deleteTag(id) {
      this.error = null
      try {
        await api.delete(`/tags/${id}`)
        if (this.items.length === 1 && this.page > 1) {
          this.page -= 1
        }
        await Promise.all([this.fetchTags(), this.fetchAllTags()])
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to delete tag.'
      }
    }
  }
})