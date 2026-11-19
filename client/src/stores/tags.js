import { defineStore } from 'pinia'
import api from '../api/client'

/**
 * Pinia store for managing tags state.
 * Provides state, getters, and actions for fetching, creating, updating, and deleting tags.
 */
export const useTagStore = defineStore('tags', {
  /**
   * State properties for the tags store.
   * - items: The current page of tags.
   * - allTags: All tags available in the system.
   * - total: Total number of tags.
   * - page: Current page number for pagination.
   * - limit: Number of tags per page.
   * - loading: A boolean indicating whether a tag-related operation is in progress.
   * - error: An error message string for any tag-related errors, or null if no error.
   */
  state: () => ({
    items: [],
    allTags: [],
    total: 0,
    page: 1,
    limit: 5,
    loading: false,
    error: null
  }),

  /**
   * Actions for managing tags state.
   * Includes methods for fetching tags, creating, updating, and deleting tags.
   */
  actions: {
    /**
     * Fetches a paginated list of tags from the server.
     * Updates the items and total state properties with the fetched data.
     * Handles loading and error states during the fetch operation.
     */
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

    /**
     * Fetches all tags from the server without pagination.
     * Updates the allTags state property with the fetched data.
     * Handles error state during the fetch operation.
     */
    async fetchAllTags() {
      try {
        const { data } = await api.get('/tags', { params: { limit: 100, skip: 0 } })
        this.allTags = data.tags
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to load tags.'
      }
    },

    /**
     * Creates a new tag on the server with the provided payload.
     * On success, resets the page to 1 and fetches the updated list of tags.
     * Handles error state during the create operation.
     * @param {Object} payload - The data for the new tag (e.g., name, color).
     * @returns {Promise<boolean>} - Returns true on success, false on failure.
     */
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

    /**
     * Updates an existing tag on the server with the provided payload.
     * On success, fetches the updated list of tags.
     * Handles error state during the update operation.
     * @param {string} id - The ID of the tag to update.
     * @param {Object} payload - The updated data for the tag (e.g., name, color).
     * @returns {Promise<boolean>} - Returns true on success, false on failure.
     */
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

    /**
     * Deletes a tag from the server by its ID.
     * On success, adjusts the current page if necessary and fetches the updated list of tags.
     * Handles error state during the delete operation.
     * @param {string} id - The ID of the tag to delete.
     * @returns {Promise<boolean>} - Returns true on success, false on failure.
     */
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