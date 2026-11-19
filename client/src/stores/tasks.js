import { defineStore } from 'pinia'
import api from '../api/client'

/**
 * Task Store
 * Manages task state, table pagination, Kanban board staging (todo/wip/done),
 * filtering, sorting, and CRUD operations.
 */
export const useTaskStore = defineStore('tasks', {
  /**
   * State definition for the task store.
   * Includes task list, pagination, filtering, sorting, and loading/error states.
   * @returns {Object} State object for the task store.
   */
  state: () => ({
    items: [],
    total: 0,
    stats: {
      total: 0,
      completed: 0,
      pending: 0
    },
    viewMode: 'table', // 'table' | 'kanban'
    filter: 'all', // 'all' | 'pending' | 'completed'
    selectedTag: '', // '' | tagId
    selectedPriority: '', // '' | 'none' | 'low' | 'medium' | 'high'
    sortBy: 'createdAt:desc',
    page: 1,
    limit: 8,
    loading: false,
    error: null
  }),

  actions: {
    /**
     * Fetch tasks from the API using current viewMode, filters, and sort order.
     * Updates the task list, total count, and statistics in the store.
     * Handles loading and error states.
     * @returns {Promise<void>}
     */
    async fetchTasks() {
      this.loading = true
      this.error = null
      try {
        const isKanban = this.viewMode === 'kanban'
        const params = {
          limit: isKanban ? 200 : this.limit,
          skip: isKanban ? 0 : (this.page - 1) * this.limit,
          sortBy: this.sortBy
        }
        if (!isKanban) {
          if (this.filter === 'completed') params.completed = 'true'
          if (this.filter === 'pending') params.completed = 'false'
        }
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
     * Switch between 'table' and 'kanban' views and refresh task list.
     * @param {'table'|'kanban'} mode - Target view mode.
     * @returns {Promise<void>}
     */
    async setViewMode(mode) {
      if (this.viewMode === mode) return
      this.viewMode = mode
      this.page = 1
      await this.fetchTasks()
    },

    /**
     * Create a new task.
     * @param {Object} payload - Task creation payload.
     * @returns {Promise<boolean>}
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
     * Update an existing task by ID.
     * @param {string} id - Task ID.
     * @param {Object} payload - Fields to update.
     * @returns {Promise<Object|boolean>}
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
     * Move a task to a target Kanban stage ('todo' | 'wip' | 'done').
     * @param {Object} task - Task object to move.
     * @param {'todo'|'wip'|'done'} status - Destination stage.
     */
    async moveTaskStage(task, status) {
      const currentStatus = task.status || (task.completed ? 'done' : 'todo')
      if (currentStatus === status) return
      await this.updateTask(task._id, {
        status,
        completed: status === 'done'
      })
    },

    /**
     * Toggle the completion status of a task.
     * @param {Object} task - Task to toggle.
     */
    async toggleTask(task) {
      const nextCompleted = !task.completed
      await this.updateTask(task._id, {
        completed: nextCompleted,
        status: nextCompleted ? 'done' : 'todo'
      })
    },

    /**
     * Toggle the completion status of a subtask.
     * @param {Object} task - Parent task object.
     * @param {number} subtaskIndex - Index of the subtask to toggle.
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
     * @param {string} id - Task ID to delete.
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