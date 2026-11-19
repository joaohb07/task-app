import { defineStore } from 'pinia'
import api from '../api/client'

/** 
 * Pinia store for managing tasks state.
 * Provides state, getters, and actions for fetching, creating, updating, toggling, and deleting tasks.
 */
export const useTaskStore = defineStore('tasks', {
  /**
   * State properties for the tasks store.
   * - items: The current page of tasks.
   * - total: Total number of tasks.
   * - stats: Statistics about tasks (total, completed, pending).
   * - filter: Current filter for tasks ('all', 'pending', 'completed').
   * - selectedTag: ID of the selected tag for filtering tasks.
   * - sortBy: Sorting criteria for tasks (e.g., 'createdAt:desc').
   * - page: Current page number for pagination.
   * - limit: Number of tasks per page.
   * - loading: A boolean indicating whether a task-related operation is in progress.
   * - error: An error message string for any task-related errors, or null if no error.
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
    sortBy: 'createdAt:desc',
    page: 1,
    limit: 8,
    loading: false,
    error: null
  }),

  /**
   * Actions for managing tasks state.
   * Includes methods for fetching tasks, creating, updating, toggling completion, and deleting tasks.
   */
  actions: {
    /**
     * Fetches a paginated list of tasks from the server based on the current filter, selected tag, and sorting criteria.
     * Updates the items, total, and stats state properties with the fetched data.
     * Handles loading and error states during the fetch operation.
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
     * Creates a new task on the server with the provided payload.
     * On success, resets the page to 1 and fetches the updated list of tasks.
     * Handles error state during the create operation.
     * @param {Object} payload - The data for the new task (e.g., title, description, dueDate, tags).
     * @returns {Promise<boolean>} - Returns true on success, false on failure.
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
     * Updates an existing task on the server with the provided payload.
     * On success, fetches the updated list of tasks.
     * Handles error state during the update operation.
     * @param {string} id - The ID of the task to update.
     * @param {Object} payload - The updated data for the task (e.g., title, description, dueDate, tags).
     * @returns {Promise<boolean>} - Returns true on success, false on failure.
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
     * Toggles the completion status of a task.
     * Calls updateTask with the opposite of the current completed status.
     * @param {Object} task - The task object to toggle.
     */
    async toggleTask(task) {
      await this.updateTask(task._id, { completed: !task.completed })
    },

    /**
     * Deletes a task from the server by its ID.
     * On success, adjusts the current page if necessary and fetches the updated list of tasks.
     * Handles error state during the delete operation.
     * @param {string} id - The ID of the task to delete.
     * @returns {Promise<void>}
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