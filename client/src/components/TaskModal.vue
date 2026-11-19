<script setup>
import { ref, watch, computed } from 'vue'
import { useTaskStore } from '../stores/tasks'
import { useTagStore } from '../stores/tags'
import Close from '@carbon/icons-vue/es/close/16'
import Edit from '@carbon/icons-vue/es/edit/16'
import Checkmark from '@carbon/icons-vue/es/checkmark/16'
import Calendar from '@carbon/icons-vue/es/calendar/16'

/**
 * Props:
 * - open: Boolean indicating if the modal is open.
 * - mode: String indicating the modal mode ('create', 'edit', 'view').
 * - task: Object representing the task to edit or view (optional).
 *
 * Emits:
 * - close: Emitted when the modal should be closed.
 * - update:mode: Emitted to change the modal mode (e.g., from 'view' to 'edit').
 * - open-tags: Emitted to open the tag management interface.
 */
const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'create' // 'create' | 'edit' | 'view'
  },
  task: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'update:mode', 'open-tags'])

const taskStore = useTaskStore()
const tagStore = useTagStore()

/**
 * Reactive state variables for the task form.
 * - description: The task title.
 * - details: Additional notes or details for the task.
 * - dueDate: The due date in 'YYYY-MM-DD' format.
 * - priority: The task priority ('none', 'low', 'medium', 'high').
 * - selectedTagIds: Array of selected tag IDs for the task.
 * - completed: Boolean indicating if the task is completed (only for edit mode).
 * - submitting: Boolean indicating if the form submission is in progress.
 */
const description = ref('')
const details = ref('')
const dueDate = ref('')
const priority = ref('none')
const selectedTagIds = ref([])
const completed = ref(false)
const submitting = ref(false)

/**
 * Priority options for the task form.
 * Each option has a value and a label for display.
 */
const priorityOptions = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
]

/**
 * Mapping of priority values to display labels for the view mode.
 */
const priorityLabelMap = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High'
}

/**
 * Computed properties for the modal.
 * - availableTags: List of all tags from the tag store.
 * - isReadOnly: Boolean indicating if the modal is in view mode.
 * - modalHeading: The heading text based on the modal mode.
 * - modalLabel: The label text for the modal based on the mode.
 */
const availableTags = computed(() => tagStore.allTags || [])
const isReadOnly = computed(() => props.mode === 'view')

const modalHeading = computed(() => {
  if (props.mode === 'view') return 'Task Details'
  if (props.mode === 'edit') return 'Edit Task'
  return 'New Task'
})

const modalLabel = computed(() => {
  if (props.mode === 'view') return 'INSPECT'
  if (props.mode === 'edit') return 'UPDATE'
  return 'CREATE'
})

/**
 * Converts an ISO date string to 'YYYY-MM-DD' format for input fields.
 * @param {string} isoString - The ISO date string to convert.
 * @returns {string} - The formatted date string or an empty string if input is invalid.
 */
const toInputDate = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toISOString().split('T')[0]
}

/**
 * Formats an ISO date string for display in the view mode.
 * @param {string} isoString - The ISO date string to format.
 * @returns {string} - The formatted date string or 'No due date' if input is invalid.
 */
const formatDisplayDate = (isoString) => {
  if (!isoString) return 'No due date'
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  })
}

/**
 * Synchronizes the form fields with the provided task prop when in edit or view mode.
 * Resets the form fields to default values when creating a new task.
 */
const syncFormFromProps = () => {
  taskStore.error = null
  if (props.task && (props.mode === 'edit' || props.mode === 'view')) {
    description.value = props.task.description || ''
    details.value = props.task.details || ''
    dueDate.value = toInputDate(props.task.dueDate)
    priority.value = props.task.priority || 'none'
    selectedTagIds.value = (props.task.tags || []).map((t) =>
      typeof t === 'object' ? t._id : t
    )
    completed.value = Boolean(props.task.completed)
  } else {
    description.value = ''
    details.value = ''
    dueDate.value = ''
    priority.value = 'none'
    selectedTagIds.value = []
    completed.value = false
  }
}

/**
 * Watches for changes in the 'open' prop to fetch all tags when the modal is opened.
 * This ensures that the tag list is up-to-date whenever the modal is displayed.
 */
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      tagStore.fetchAllTags()
    }
  },
  { immediate: true }
)

/**
 * Watches for changes in the 'open', 'mode', and 'task' props to synchronize the form fields.
 * When the modal is opened, it populates the form with the task data if in edit or view mode.
 */
watch(
  () => [props.open, props.mode, props.task],
  ([isOpen]) => {
    if (isOpen) {
      syncFormFromProps()
    }
  },
  { immediate: true }
)

/**
 * Toggles the selection of a tag by its ID.
 * If the tag is already selected, it will be removed from the selection.
 * If the tag is not selected, it will be added to the selection.
 * This function does nothing if the modal is in read-only mode.
 * @param {string} tagId - The ID of the tag to toggle.
 */
const toggleTagSelection = (tagId) => {
  if (isReadOnly.value) return
  if (selectedTagIds.value.includes(tagId)) {
    selectedTagIds.value = selectedTagIds.value.filter((id) => id !== tagId)
  } else {
    selectedTagIds.value = [...selectedTagIds.value, tagId]
  }
}

/**
 * Handles the form submission for creating or updating a task.
 * Validates the input, constructs the payload, and calls the appropriate store action.
 * On success, emits the 'close' event to close the modal.
 */
const handleSubmit = async () => {
  const trimmedDesc = description.value.trim()
  if (!trimmedDesc || isReadOnly.value) return

  submitting.value = true
  const payload = {
    description: trimmedDesc,
    details: details.value.trim(),
    dueDate: dueDate.value ? new Date(`${dueDate.value}T00:00:00.000Z`).toISOString() : null,
    priority: priority.value,
    tags: selectedTagIds.value
  }

  if (props.mode === 'edit' && props.task) {
    payload.completed = completed.value
  }

  const ok =
    props.mode === 'edit' && props.task
      ? await taskStore.updateTask(props.task._id, payload)
      : await taskStore.createTask(payload)

  submitting.value = false
  if (ok) {
    emit('close')
  }
}
</script>

<template>
  <div
    v-if="open"
    class="cds--modal is-visible"
    role="dialog"
    aria-modal="true"
    aria-labelledby="task-modal-title"
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
        <p class="cds--modal-header__label cds--type-label-01">{{ modalLabel }}</p>
        <h3 id="task-modal-title" class="cds--modal-header__heading">{{ modalHeading }}</h3>
      </div>

      <div class="cds--modal-content modal-body">
        <p v-if="taskStore.error" class="form-error-msg">{{ taskStore.error }}</p>

        <!-- VIEW MODE -->
        <div v-if="isReadOnly && task" class="view-container">
          <div class="view-status-row">
            <div class="view-badges-group">
              <span
                class="cds--tag cds--tag--sm"
                :class="task.completed ? 'cds--tag--green' : 'cds--tag--warm-gray'"
              >
                <span class="cds--tag__label">{{ task.completed ? 'Completed' : 'Pending' }}</span>
              </span>
              <span
                class="cds--tag cds--tag--sm priority-pill"
                :class="`priority-pill--${task.priority || 'none'}`"
              >
                <span class="cds--tag__label">
                  Priority: {{ priorityLabelMap[task.priority || 'none'] }}
                </span>
              </span>
            </div>
            <span class="view-date-badge">
              <Calendar />
              <span>Due: {{ formatDisplayDate(task.dueDate) }}</span>
            </span>
          </div>

          <div class="view-field">
            <span class="cds--label">Title</span>
            <p class="view-title-text">{{ task.description }}</p>
          </div>

          <div class="view-field">
            <span class="cds--label">Details</span>
            <p class="view-details-text">
              {{ task.details || 'No additional details provided.' }}
            </p>
          </div>

          <div class="view-field">
            <span class="cds--label">Tags</span>
            <div v-if="task.tags && task.tags.length > 0" class="tags-list">
              <span
                v-for="tag in task.tags"
                :key="tag._id"
                class="cds--tag cds--tag--sm"
                :class="`cds--tag--${tag.color || 'blue'}`"
              >
                <span class="cds--tag__label">{{ tag.name }}</span>
              </span>
            </div>
            <p v-else class="muted-hint">No tags attached.</p>
          </div>
        </div>

        <!-- CREATE / EDIT FORM -->
        <form v-else id="task-modal-form" class="task-form" @submit.prevent="handleSubmit">
          <div class="cds--form-item">
            <label for="task-desc-input" class="cds--label">Title *</label>
            <input
              id="task-desc-input"
              v-model="description"
              type="text"
              maxlength="200"
              placeholder="e.g., Prepare Q4 architecture review"
              class="cds--text-input"
              required
            />
          </div>

          <div class="cds--form-item">
            <label for="task-details-input" class="cds--label">Details / Notes</label>
            <textarea
              id="task-details-input"
              v-model="details"
              rows="4"
              maxlength="2000"
              placeholder="Add acceptance criteria, links, or notes..."
              class="cds--text-area"
            />
          </div>

          <div class="form-row-split">
            <div class="cds--form-item">
              <label for="task-priority-select" class="cds--label">Priority</label>
              <select
                id="task-priority-select"
                v-model="priority"
                class="cds--select-input"
              >
                <option v-for="opt in priorityOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <div class="cds--form-item">
              <label for="task-due-input" class="cds--label">Due Date</label>
              <input
                id="task-due-input"
                v-model="dueDate"
                type="date"
                class="cds--text-input"
              />
            </div>
          </div>

          <div v-if="mode === 'edit'" class="cds--form-item status-toggle-box">
            <label class="checkbox-inline">
              <input v-model="completed" type="checkbox" class="task-checkbox" />
              <span>Mark as completed</span>
            </label>
          </div>

          <div class="cds--form-item">
            <div class="tags-label-row">
              <label class="cds--label">Tags</label>
              <button
                type="button"
                class="cds--btn cds--btn--ghost cds--btn--sm manage-inline-btn"
                @click="emit('open-tags')"
              >
                + Manage Tags
              </button>
            </div>

            <div v-if="availableTags.length === 0" class="muted-hint">
              No tags created yet. Click "+ Manage Tags" to create one.
            </div>
            <div v-else class="tag-selector-grid">
              <button
                v-for="tag in availableTags"
                :key="tag._id"
                type="button"
                class="tag-option-pill"
                :class="{ 'is-selected': selectedTagIds.includes(tag._id) }"
                @click="toggleTagSelection(tag._id)"
              >
                <span
                  class="cds--tag cds--tag--sm"
                  :class="`cds--tag--${tag.color || 'blue'}`"
                >
                  <span class="cds--tag__label">{{ tag.name }}</span>
                </span>
                <Checkmark v-if="selectedTagIds.includes(tag._id)" class="selected-icon" />
              </button>
            </div>
          </div>
        </form>
      </div>

      <div class="cds--modal-footer">
        <button type="button" class="cds--btn cds--btn--secondary" @click="emit('close')">
          {{ isReadOnly ? 'Close' : 'Cancel' }}
        </button>

        <button
          v-if="isReadOnly"
          type="button"
          class="cds--btn cds--btn--primary"
          @click="emit('update:mode', 'edit')"
        >
          <span>Edit Task</span>
          <Edit class="cds--btn__icon" />
        </button>

        <button
          v-else
          type="submit"
          form="task-modal-form"
          class="cds--btn cds--btn--primary"
          :disabled="submitting"
        >
          <span>{{ mode === 'edit' ? 'Save Changes' : 'Create Task' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-box {
  max-width: 580px;
}

.modal-body {
  padding-right: 1rem;
}

.form-error-msg {
  color: var(--cds-text-error);
  font-size: 0.75rem;
  margin-bottom: 0.75rem;
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-form .cds--form-item {
  width: 100%;
}

.task-form .cds--text-input,
.task-form .cds--text-area,
.task-form .cds--select-input {
  width: 100%;
  max-width: 100%;
}

.task-form .cds--text-area {
  resize: vertical;
  min-height: 96px;
}

.form-row-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.checkbox-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.task-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.tags-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 0.35rem;
}

.manage-inline-btn {
  min-height: 24px;
  padding: 0 0.5rem;
}

.tag-selector-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-option-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.45rem 0.2rem 0.2rem;
  background: var(--cds-layer);
  border: 1px solid var(--cds-border-subtle);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.tag-option-pill:hover {
  border-color: var(--cds-border-strong);
}

.tag-option-pill.is-selected {
  border-color: var(--cds-focus);
  background: var(--cds-layer-selected);
}

.selected-icon {
  color: var(--cds-link-primary);
}

.view-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.view-status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--cds-border-subtle);
}

.view-badges-group {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

/* Priority Color Tokens: White / Yellow / Orange / Red */
.priority-pill--none {
  background-color: #ffffff;
  color: #161616;
  border: 1px solid #8d8d8d;
}

.priority-pill--low {
  background-color: #f1c21b;
  color: #161616;
}

.priority-pill--medium {
  background-color: #ff832b;
  color: #161616;
}

.priority-pill--high {
  background-color: #da1e28;
  color: #ffffff;
}

.view-date-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
}

.view-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.view-title-text {
  font-size: 1rem;
  font-weight: 500;
  color: var(--cds-text-primary);
}

.view-details-text {
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  color: var(--cds-text-secondary);
  background: var(--cds-layer);
  padding: 0.75rem;
  border: 1px solid var(--cds-border-subtle);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.muted-hint {
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
}

@media (max-width: 520px) {
  .form-row-split {
    grid-template-columns: 1fr;
  }
}
</style>