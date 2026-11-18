import { defineStore } from 'pinia'
import api from '../api/client'

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    items: [],
    total: 0,
    stats: {
      total: 0,
      completed: 0,
      pending: 0
    },
    filter: 'all', // 'all' | 'pending' | 'completed'
    selectedTag: '', // '' | tagId
    sortBy: 'createdAt:desc',
    page: 1,
    limit: 8,
    loading: false,
    error: null
  }),

  actions: {
    async fetchTasks() {
      this.loading = true
      this.error = null
      try {
        const params = {
          limit: this.limit,
          skip: (this.page - 1) * this.limit,
          sortBy: this.sortBy
        }
        if (this.filter === 'completed') params.completed = 'true'
        if (this.filter === 'pending') params.completed = 'false'
        if (this.selectedTag) params.tag = this.selectedTag

        const { data } = await api.get('/tasks', { params })
        this.items = data.tasks
        this.total = data.total
        if (data.stats) {
          this.stats = data.stats
        }
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to load tasks.'
      } finally {
        this.loading = false
      }
    },

    async createTask(payload) {
      this.error = null
      try {
        await api.post('/tasks', payload)
        this.page = 1
        await this.fetchTasks()
        return true
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to create task.'
        return false
      }
    },

    async updateTask(id, payload) {
      this.error = null
      try {
        await api.patch(`/tasks/${id}`, payload)
        await this.fetchTasks()
        return true
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to update task.'
        return false
      }
    },

    async toggleTask(task) {
      await this.updateTask(task._id, { completed: !task.completed })
    },

    async deleteTask(id) {
      this.error = null
      try {
        await api.delete(`/tasks/${id}`)
        if (this.items.length === 1 && this.page > 1) {
          this.page -= 1
        }
        await this.fetchTasks()
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to delete task.'
      }
    }
  }
})