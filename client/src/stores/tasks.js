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
    sortBy: 'createdAt:desc',
    page: 1,
    limit: 10,
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

        const { data } = await api.get('/tasks', { params })
        this.items = data.tasks
        this.total = data.total
        this.stats = data.stats
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to load tasks.'
      } finally {
        this.loading = false
      }
    },

    async createTask(description) {
      await api.post('/tasks', { description, completed: false })
      this.page = 1
      await this.fetchTasks()
    },

    async toggleTask(task) {
      await api.patch(`/tasks/${task._id}`, { completed: !task.completed })
      await this.fetchTasks()
    },

    async updateTaskDescription(id, description) {
      await api.patch(`/tasks/${id}`, { description })
      await this.fetchTasks()
    },

    async deleteTask(id) {
      await api.delete(`/tasks/${id}`)
      if (this.items.length === 1 && this.page > 1) {
        this.page -= 1
      }
      await this.fetchTasks()
    }
  }
})