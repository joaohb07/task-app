<script setup>
import { ref, computed, watch } from 'vue'
import { useTagStore } from '../stores/tags'
import Add from '@carbon/icons-vue/es/add/16'
import Edit from '@carbon/icons-vue/es/edit/16'
import TrashCan from '@carbon/icons-vue/es/trash-can/16'
import Checkmark from '@carbon/icons-vue/es/checkmark/16'
import Close from '@carbon/icons-vue/es/close/16'
import ChevronLeft from '@carbon/icons-vue/es/chevron--left/16'
import ChevronRight from '@carbon/icons-vue/es/chevron--right/16'

/**
 * Props for the ManageTagsModal component.
 * - 'open': A boolean indicating whether the modal is open or closed.
 */
const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

/**
 * Emits events for the ManageTagsModal component.
 * - 'close': Emitted when the modal is requested to close.
 * - 'tags-changed': Emitted when tags are created, updated, or deleted.
 */
const emit = defineEmits(['close', 'tags-changed'])

/**
 * Reactive references for managing tag creation and editing.
 * - 'newTagName': The name of the new tag being created.
 * - 'newTagColor': The color of the new tag being created.
 * - 'editingId': The ID of the tag currently being edited.
 * - 'editingName': The name of the tag currently being edited.
 * - 'editingColor': The color of the tag currently being edited.
 */
const tagStore = useTagStore()
const newTagName = ref('')
const newTagColor = ref('blue')
const editingId = ref(null)
const editingName = ref('')
const editingColor = ref('blue')

/**
 * Predefined color options for tags.
 * Each option has a 'value' used in the data model and a 'label' for display.
 */
const colorOptions = [
  { value: 'blue', label: 'Blue' },
  { value: 'teal', label: 'Teal' },
  { value: 'purple', label: 'Purple' },
  { value: 'magenta', label: 'Magenta' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'green', label: 'Green' },
  { value: 'warm-gray', label: 'Warm Gray' },
  { value: 'cool-gray', label: 'Cool Gray' }
]

/**
 * Computed properties for managing the list of tags and pagination.
 * - 'tagItems': The current list of tags from the store.
 * - 'totalTags': The total number of tags available.
 * - 'currentPage': The current page number in the pagination.
 * - 'pageLimit': The number of tags displayed per page.
 * - 'totalPages': The total number of pages based on the total tags and page limit.
 */
const tagItems = computed(() => tagStore.items || [])
const totalTags = computed(() => tagStore.total ?? tagItems.value.length)
const currentPage = computed(() => tagStore.page || 1)
const pageLimit = computed(() => tagStore.limit || 10)
const totalPages = computed(() => Math.max(1, Math.ceil(totalTags.value / pageLimit.value)))

/**
 * Start editing a tag.
 * Sets the editing state to the selected tag's ID, name, and color.
 * @param {Object} tag - The tag object to edit.
 */
const startEdit = (tag) => {
  editingId.value = tag._id
  editingName.value = tag.name
  editingColor.value = tag.color || 'blue'
}

/**
 * Cancel the current edit operation.
 * Resets the editing state to null and clears the editing name and color.
 */
const cancelEdit = () => {
  editingId.value = null
  editingName.value = ''
  editingColor.value = 'blue'
}

/**
 * Watch for changes to the 'open' prop.
 * When the modal is opened, fetch the tags and reset any errors.
 * When the modal is closed, cancel any ongoing edits.
 */
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      tagStore.error = null
      tagStore.page = 1
      tagStore.fetchTags()
    } else {
      cancelEdit()
    }
  },
  { immediate: true }
)

/**
 * Handle the creation of a new tag.
 * Validates the input, creates the tag via the store, and resets the form on success.
 * Emits 'tags-changed' event to notify parent components of the change.
 */
const handleCreateTag = async () => {
  const trimmed = newTagName.value.trim()
  if (!trimmed) return

  const ok = await tagStore.createTag({
    name: trimmed,
    color: newTagColor.value
  })

  if (ok) {
    newTagName.value = ''
    newTagColor.value = 'blue'
    emit('tags-changed')
  }
}

/**
 * Save the edits made to a tag.
 * Validates the input, updates the tag via the store, and resets the editing state on success.
 * Emits 'tags-changed' event to notify parent components of the change.
 * @param {string} id - The ID of the tag being edited.
 */
const saveEdit = async (id) => {
  const trimmed = editingName.value.trim()
  if (!trimmed) return

  const ok = await tagStore.updateTag(id, {
    name: trimmed,
    color: editingColor.value
  })

  if (ok) {
    cancelEdit()
    emit('tags-changed')
  }
}

/**
 * Handle the deletion of a tag.
 * Deletes the tag via the store and emits 'tags-changed' event to notify parent components.
 * @param {string} id - The ID of the tag to delete.
 */
const handleDelete = async (id) => {
  await tagStore.deleteTag(id)
  emit('tags-changed')
}

/**
 * Change the current page in the pagination.
 * Cancels any ongoing edits and fetches the tags for the new page.
 * @param {number} delta - The change in page number (e.g., -1 for previous, 1 for next).
 */
const changePage = (delta) => {
  const next = currentPage.value + delta
  if (next >= 1 && next <= totalPages.value) {
    cancelEdit()
    tagStore.page = next
    tagStore.fetchTags()
  }
}
</script>

<template>
  <div
    v-if="open"
    class="cds--modal is-visible tags-modal-layer"
    role="dialog"
    aria-modal="true"
    aria-labelledby="manage-tags-modal-title"
    @click.self="emit('close')"
  >
    <div class="cds--modal-container modal-box">
      <div class="cds--modal-header">
        <button
          type="button"
          class="cds--modal-close"
          aria-label="Close modal"
          @click="emit('close')"
        >
          <Close class="cds--modal-close__icon" />
        </button>
        <p class="cds--modal-header__label cds--type-label-01">TAG CATALOG</p>
        <h3 id="manage-tags-modal-title" class="cds--modal-header__heading">Manage Tags</h3>
      </div>

      <div class="cds--modal-content modal-body">
        <!-- Create Tag Form -->
        <form class="tag-create-row" @submit.prevent="handleCreateTag">
          <input
            v-model="newTagName"
            type="text"
            maxlength="30"
            placeholder="New tag name (e.g., Backend, Urgent)..."
            class="cds--text-input"
            required
          />
          <select
            v-model="newTagColor"
            aria-label="Tag color"
            class="cds--select-input color-select"
          >
            <option v-for="opt in colorOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <button type="submit" class="cds--btn cds--btn--primary">
            <span>Add Tag</span>
            <Add class="cds--btn__icon" />
          </button>
        </form>

        <p v-if="tagStore.error" class="tag-error-msg">{{ tagStore.error }}</p>

        <!-- Paginated Tags List -->
        <div class="tag-table-wrapper">
          <table class="cds--data-table cds--data-table--sm cds--data-table--zebra">
            <thead>
              <tr>
                <th>Tag</th>
                <th style="width: 110px; text-align: right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="tagStore.loading">
                <td colspan="2" class="tag-empty-cell">Loading tags...</td>
              </tr>
              <tr v-else-if="tagItems.length === 0">
                <td colspan="2" class="tag-empty-cell">
                  No tags created yet. Add your first tag above!
                </td>
              </tr>
              <tr v-for="tag in tagItems" :key="tag._id">
                <td>
                  <div v-if="editingId === tag._id" class="inline-edit-row">
                    <input
                      v-model="editingName"
                      type="text"
                      maxlength="30"
                      class="cds--text-input cds--text-input--sm"
                      @keyup.enter="saveEdit(tag._id)"
                      @keyup.esc="cancelEdit"
                    />
                    <select
                      v-model="editingColor"
                      aria-label="Edit tag color"
                      class="cds--select-input cds--select-input--sm color-select"
                    >
                      <option v-for="opt in colorOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                      </option>
                    </select>
                  </div>
                  <span
                    v-else
                    class="cds--tag cds--tag--sm"
                    :class="`cds--tag--${tag.color || 'blue'}`"
                  >
                    <span class="cds--tag__label">{{ tag.name }}</span>
                  </span>
                </td>
                <td class="tag-actions-cell">
                  <template v-if="editingId === tag._id">
                    <button
                      type="button"
                      class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
                      title="Save tag"
                      @click="saveEdit(tag._id)"
                    >
                      <Checkmark />
                    </button>
                    <button
                      type="button"
                      class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
                      title="Cancel edit"
                      @click="cancelEdit"
                    >
                      <Close />
                    </button>
                  </template>
                  <template v-else>
                    <button
                      type="button"
                      class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
                      title="Edit tag"
                      @click="startEdit(tag)"
                    >
                      <Edit />
                    </button>
                    <button
                      type="button"
                      class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
                      title="Delete tag"
                      @click="handleDelete(tag._id)"
                    >
                      <TrashCan />
                    </button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div class="tag-pagination-bar">
          <span class="pagination-info">
            Showing {{ tagItems.length }} of {{ totalTags }} tags
          </span>
          <div class="pagination-controls">
            <span class="pagination-info">Page {{ currentPage }} of {{ totalPages }}</span>
            <button
              type="button"
              class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
              :disabled="currentPage <= 1"
              aria-label="Previous tags page"
              @click="changePage(-1)"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
              :disabled="currentPage >= totalPages"
              aria-label="Next tags page"
              @click="changePage(1)"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>

      <div class="cds--modal-footer">
        <button type="button" class="cds--btn cds--btn--secondary" @click="emit('close')">
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tags-modal-layer {
  z-index: 9100;
}

.modal-box {
  max-width: 560px;
}

.modal-body {
  padding-right: 1rem;
}

.tag-create-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.color-select {
  width: auto;
  min-width: 115px;
}

.tag-error-msg {
  color: var(--cds-text-error);
  font-size: 0.75rem;
  margin-bottom: 0.75rem;
}

.tag-table-wrapper {
  border: 1px solid var(--cds-border-subtle);
  overflow-x: auto;
}

.inline-edit-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.tag-actions-cell {
  text-align: right;
  white-space: nowrap;
}

.tag-actions-cell .cds--btn--icon-only {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tag-empty-cell {
  text-align: center;
  padding: 1.5rem 1rem;
  color: var(--cds-text-secondary);
}

.tag-pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background-color: var(--cds-layer);
  border: 1px solid var(--cds-border-subtle);
  border-top: none;
}

.pagination-info {
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
}

.pagination-controls {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

@media (max-width: 520px) {
  .tag-create-row {
    flex-direction: column;
  }

  .tag-create-row .cds--btn {
    width: 100%;
    max-width: 100%;
    justify-content: space-between;
  }
}
</style>