import { defineStore } from 'pinia'
import api from '../api/client'

/**
 * Task Store
 * This store manages the state and actions related to tasks in the application.
 * It provides functionality to fetch, create, update, toggle, and delete tasks,
 * as well as manage task filtering, sorting, and pagination.
 */
export const useTaskStore = defineStore('tasks', {
  /**
   * State of the Task Store
   * @returns {Object} - The initial state of the task store.
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
   * Actions of the Task Store
   * These actions handle asynchronous operations related to tasks, including API calls.
   */
  actions: {
    /**
     * Fetch tasks from the API with current filters, sorting, and pagination.
     * Updates the store's state with the fetched tasks and statistics.
     * @async
     * @throws {Error} - Throws an error if the API request fails.
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
     * Create a new task.
     * @async
     * @param {Object} payload - The task data to create.
     * @returns {Promise<boolean>} - A promise resolving to true if the task was created successfully, false otherwise.
     * @throws {Error} - Throws an error if the API request fails.
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
     * Update an existing task.
     * @async
     * @param {string} id - The ID of the task to update.
     * @param {Object} payload - The updated task data.
     * @returns {Promise<Object|boolean>} - A promise resolving to the updated task data if successful, false otherwise.
     * @throws {Error} - Throws an error if the API request fails.
     */
    async updateTask(id, payload) {
      this.error = null
      try {
        const { data } = await api.patch(`/tasks/${id}`, payload)
        await this.fetchTasks()
        return data
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to update task.'
        return false
      }
    },

    /**
     * Toggle the completion status of a task.
     * @async
     * @param {Object} task - The task to toggle.
     * @returns {Promise<void>} - A promise resolving when the task is toggled.
     * @throws {Error} - Throws an error if the API request fails.
     */
    async toggleTask(task) {
      await this.updateTask(task._id, { completed: !task.completed })
    },

    /**
     * Toggle the completion status of a subtask.
     * @async
     * @param {Object} task - The task containing the subtask.
     * @param {number} subtaskIndex - The index of the subtask to toggle.
     * @returns {Promise<Object|boolean>} - A promise resolving to the updated task data if successful, false otherwise.
     * @throws {Error} - Throws an error if the API request fails.
     */
    async toggleSubtask(task, subtaskIndex) {
      const updatedSubtasks = (task.subtasks || []).map((st, idx) => ({
        ...(st._id ? { _id: st._id } : {}),
        title: st.title,
        completed: idx === subtaskIndex ? !st.completed : Boolean(st.completed)
      }))
      return await this.updateTask(task._id, { subtasks: updatedSubtasks })
    },

    /**
     * Delete a task by ID.
     * @async
     * @param {string} id - The ID of the task to delete.
     * @returns {Promise<void>} - A promise resolving when the task is deleted.
     * @throws {Error} - Throws an error if the API request fails.
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