import { defineStore } from 'pinia'
import api from '../api/client'

/** 
 * Pinia store for managing tasks state.
 * Provides state, getters, and actions for fetching, creating, updating, toggling, and deleting tasks.
 */
export const useTaskStore = defineStore('tasks', {
  /**
   * State of the tasks store.
   * Includes task items, total count, statistics, filters, sorting, pagination, loading status, and error messages.
   */
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
    selectedPriority: '', // '' | 'none' | 'low' | 'medium' | 'high'
    sortBy: 'createdAt:desc',
    page: 1,
    limit: 8,
    loading: false,
    error: null
  }),

  /**
   * Getters for the tasks store.
   * Provides computed properties for filtered and sorted tasks, total pages, and current page items.
   */
  actions: {
    /**
     * Fetch tasks from the API with current filters, sorting, and pagination.
     * Updates the store state with fetched tasks, total count, and statistics.
     */
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
        if (this.selectedPriority) params.priority = this.selectedPriority

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

    /**
     * Create a new task with the provided payload.
     * On success, resets to the first page and fetches updated tasks.
     * Returns true on success, false on failure with error message set in state.
     * @param {Object} payload - The task data to create.
     * @returns {Promise<boolean>} - True if creation was successful, false otherwise.
     */
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

    /**
     * Update an existing task by ID with the provided payload.
     * On success, fetches updated tasks.
     * Returns true on success, false on failure with error message set in state.
     * @param {string} id - The ID of the task to update.
     * @param {Object} payload - The updated task data.
     * @returns {Promise<boolean>} - True if update was successful, false otherwise.
     */
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

    /**
     * Toggle the completion status of a task.
     * Calls updateTask with the opposite of the current completed status.
     * @param {Object} task - The task object to toggle.
     */
    async toggleTask(task) {
      await this.updateTask(task._id, { completed: !task.completed })
    },

    /**
     * Delete a task by ID.
     * On success, adjusts the current page if necessary and fetches updated tasks.
     * Sets error message in state on failure.
     * @param {string} id - The ID of the task to delete.
     */
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