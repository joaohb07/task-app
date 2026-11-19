<script setup>
import { ref, watch, computed } from 'vue'
import { useTaskStore } from '../stores/tasks'
import { useTagStore } from '../stores/tags'
import Close from '@carbon/icons-vue/es/close/16'
import Edit from '@carbon/icons-vue/es/edit/16'
import Checkmark from '@carbon/icons-vue/es/checkmark/16'
import Calendar from '@carbon/icons-vue/es/calendar/16'
import Add from '@carbon/icons-vue/es/add/16'
import TrashCan from '@carbon/icons-vue/es/trash-can/16'

/**
 * Props for the TaskModal component.
 * - open: Boolean indicating whether the modal is open.
 * - mode: String indicating the mode of the modal ('create', 'edit', or 'view').
 * - task: Object representing the task to be edited or viewed (optional).
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

/**
 * Emits events from the TaskModal component.
 * - close: Emitted when the modal is closed.
 * - update:mode: Emitted to update the mode of the modal (e.g., switching to 'edit' mode).
 * - open-tags: Emitted to trigger the opening of the tag management interface.
 */
const emit = defineEmits(['close', 'update:mode', 'open-tags'])

/**
 * Local state variables for the TaskModal component.
 * These variables are used to manage the form fields and their values.
 */
const taskStore = useTaskStore()
const tagStore = useTagStore()

/**
 * Reactive references for form fields and state.
 * - description: The title/description of the task.
 * - details: Additional details or notes for the task.
 * - dueDate: The due date of the task in YYYY-MM-DD format.
 * - priority: The priority level of the task ('none', 'low', 'medium', 'high').
 * - subtasks: An array of subtasks associated with the task.
 * - newSubtaskTitle: The title of a new subtask being added.
 * - selectedTagIds: An array of selected tag IDs for the task.
 * - completed: Boolean indicating whether the task is completed (used in edit mode).
 * - submitting: Boolean indicating whether the form is currently being submitted.
 */
const description = ref('')
const details = ref('')
const dueDate = ref('')
const priority = ref('none')
const subtasks = ref([])
const newSubtaskTitle = ref('')
const selectedTagIds = ref([])
const completed = ref(false)
const submitting = ref(false)

/**
 * Options for the priority select input.
 * Each option has a value and a label for display.
 */
const priorityOptions = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
]

/**
 * Mapping of priority values to their corresponding display labels.
 * Used for displaying the priority in view mode.
 */
const priorityLabelMap = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High'
}

/**
 * Computed properties for available tags, read-only mode, completed subtasks count, subtask progress percentage, modal heading, and modal label.
 * These properties are derived from the current state of the component and props.
 */
const availableTags = computed(() => tagStore.allTags || [])
/**
 * Determines if the modal is in read-only mode based on the current mode prop.
 * Returns true if the mode is 'view', indicating that the form fields should be disabled.
 */
const isReadOnly = computed(() => props.mode === 'view')
/**
 * Computes the number of completed subtasks from the subtasks array.
 * Filters the subtasks to count how many have their 'completed' property set to true.
 */
const completedSubtasksCount = computed(
  () => subtasks.value.filter((st) => st.completed).length
)
/**
 * Computes the percentage of completed subtasks relative to the total number of subtasks.
 * Returns 0 if there are no subtasks to avoid division by zero.
 * The result is rounded to the nearest whole number for display purposes.
 */
const subtaskProgressPercent = computed(() => {
  if (subtasks.value.length === 0) return 0
  return Math.round((completedSubtasksCount.value / subtasks.value.length) * 100)
})
/**
 * Computes the heading text for the modal based on the current mode prop.
 * Returns 'Task Details' for view mode, 'Edit Task' for edit mode, and 'New Task' for create mode.
 */
const modalHeading = computed(() => {
  if (props.mode === 'view') return 'Task Details'
  if (props.mode === 'edit') return 'Edit Task'
  return 'New Task'
})
/**
 * Computes the label text for the modal based on the current mode prop.
 * Returns 'INSPECT' for view mode, 'UPDATE' for edit mode, and 'CREATE' for create mode.
 */
const modalLabel = computed(() => {
  if (props.mode === 'view') return 'INSPECT'
  if (props.mode === 'edit') return 'UPDATE'
  return 'CREATE'
})

/**
 * Converts an ISO date string to a format suitable for the HTML date input.
 * If the input is null or undefined, returns an empty string.
 * @param {string} isoString - The ISO date string to convert.
 * @returns {string} - The formatted date string (YYYY-MM-DD) or an empty string.
 */
const toInputDate = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toISOString().split('T')[0]
}

/**
 * Formats an ISO date string into a human-readable format for display.
 * If the input is null or undefined, returns 'No due date'.
 * @param {string} isoString - The ISO date string to format.
 * @returns {string} - The formatted date string or 'No due date'.
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
 * Synchronizes the form fields with the provided task data when the modal is opened.
 * If a task is provided and the mode is 'edit' or 'view', it populates the form fields with the task's details.
 * If no task is provided or the mode is 'create', it resets the form fields to their default values.
 */
const syncFormFromProps = () => {
  taskStore.error = null
  newSubtaskTitle.value = ''
  if (props.task && (props.mode === 'edit' || props.mode === 'view')) {
    description.value = props.task.description || ''
    details.value = props.task.details || ''
    dueDate.value = toInputDate(props.task.dueDate)
    priority.value = props.task.priority || 'none'
    subtasks.value = (props.task.subtasks || []).map((st) => ({
      ...(st._id ? { _id: st._id } : {}),
      title: st.title,
      completed: Boolean(st.completed)
    }))
    selectedTagIds.value = (props.task.tags || []).map((t) =>
      typeof t === 'object' ? t._id : t
    )
    completed.value = Boolean(props.task.completed)
  } else {
    description.value = ''
    details.value = ''
    dueDate.value = ''
    priority.value = 'none'
    subtasks.value = []
    selectedTagIds.value = []
    completed.value = false
  }
}

/**
 * Watches for changes in the modal's open state.
 * When the modal is opened, it fetches all available tags from the store.
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
 * Watches for changes in the modal's open state, mode, or task prop.
 * When the modal is opened, it synchronizes the form fields with the provided task data.
 * This ensures that the form reflects the current task details when editing or viewing.
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
 * Adds a new subtask to the list if the input is not empty and the form is not in read-only mode.
 * Trims the input value before adding and clears the input field after adding.
 */
const addSubtask = () => {
  const trimmed = newSubtaskTitle.value.trim()
  if (!trimmed || isReadOnly.value) return
  subtasks.value.push({ title: trimmed, completed: false })
  newSubtaskTitle.value = ''
}

/**
 * Removes a subtask from the list by its index.
 * Does nothing if the form is in read-only mode.
 * @param {number} index - The index of the subtask to remove.
 */
const removeSubtask = (index) => {
  if (isReadOnly.value) return
  subtasks.value.splice(index, 1)
}

/**
 * Handles the toggling of a subtask's completed status in view mode.
 * Updates the local state and calls the store method to persist the change.
 * Does nothing if the form is in read-only mode or if no task is provided.
 * @param {number} index - The index of the subtask to toggle.
 */
const handleViewSubtaskToggle = async (index) => {
  if (!props.task) return
  subtasks.value[index].completed = !subtasks.value[index].completed
  await taskStore.toggleSubtask(props.task, index)
}

/**
 * Toggles the selection of a tag in the form.
 * If the tag is already selected, it will be removed from the selection.
 * If the tag is not selected, it will be added to the selection.
 * Does nothing if the form is in read-only mode.
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
 * Validates the input fields and constructs the payload for the API request.
 * If in edit mode, includes the completed status in the payload.
 * Calls the appropriate store method to create or update the task.
 * Closes the modal on successful submission.
 */
const handleSubmit = async () => {
  const trimmedDesc = description.value.trim()
  if (!trimmedDesc || isReadOnly.value) return

  // If user typed a subtask in the input and clicked Save/Create directly, include it
  if (newSubtaskTitle.value.trim()) {
    addSubtask()
  }

  submitting.value = true
  const payload = {
    description: trimmedDesc,
    details: details.value.trim(),
    dueDate: dueDate.value ? new Date(`${dueDate.value}T00:00:00.000Z`).toISOString() : null,
    priority: priority.value,
    subtasks: subtasks.value.map((st) => ({
      ...(st._id ? { _id: st._id } : {}),
      title: st.title.trim(),
      completed: Boolean(st.completed)
    })),
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

          <!-- Subtasks Checklist in View Mode -->
          <div class="view-field">
            <div class="subtasks-header-row">
              <span class="cds--label">
                Subtasks ({{ completedSubtasksCount }}/{{ subtasks.length }})
              </span>
              <span v-if="subtasks.length > 0" class="subtask-pct-label">
                {{ subtaskProgressPercent }}%
              </span>
            </div>

            <div v-if="subtasks.length > 0" class="subtask-progress-track">
              <div
                class="subtask-progress-fill"
                :style="{ width: `${subtaskProgressPercent}%` }"
              />
            </div>

            <ul v-if="subtasks.length > 0" class="subtasks-list">
              <li
                v-for="(st, idx) in subtasks"
                :key="st._id || idx"
                class="subtask-item"
              >
                <label class="subtask-check-label">
                  <input
                    type="checkbox"
                    :checked="st.completed"
                    class="task-checkbox"
                    @change="handleViewSubtaskToggle(idx)"
                  />
                  <span :class="{ 'subtask-done-text': st.completed }">{{ st.title }}</span>
                </label>
              </li>
            </ul>
            <p v-else class="muted-hint">No subtasks added.</p>
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
              rows="3"
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

          <!-- Subtasks Builder -->
          <div class="cds--form-item">
            <label for="new-subtask-input" class="cds--label">
              Subtasks ({{ completedSubtasksCount }}/{{ subtasks.length }})
            </label>
            <div class="subtask-add-row">
              <input
                id="new-subtask-input"
                v-model="newSubtaskTitle"
                type="text"
                maxlength="150"
                placeholder="Add a step or checklist item..."
                class="cds--text-input cds--text-input--sm"
                @keydown.enter.prevent="addSubtask"
              />
              <button
                type="button"
                class="cds--btn cds--btn--tertiary cds--btn--sm add-subtask-btn"
                @click="addSubtask"
              >
                <span>Add</span>
                <Add class="cds--btn__icon" />
              </button>
            </div>

            <ul v-if="subtasks.length > 0" class="subtasks-list">
              <li
                v-for="(st, idx) in subtasks"
                :key="st._id || idx"
                class="subtask-item"
              >
                <label class="subtask-check-label">
                  <input v-model="st.completed" type="checkbox" class="task-checkbox" />
                  <span :class="{ 'subtask-done-text': st.completed }">{{ st.title }}</span>
                </label>
                <button
                  type="button"
                  class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
                  title="Remove subtask"
                  @click="removeSubtask(idx)"
                >
                  <TrashCan />
                </button>
              </li>
            </ul>
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
  max-width: 600px;
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
  min-height: 76px;
}

.form-row-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.subtask-add-row {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.add-subtask-btn {
  flex-shrink: 0;
}

.subtasks-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.subtask-pct-label {
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
}

.subtask-progress-track {
  width: 100%;
  height: 4px;
  background-color: var(--cds-border-subtle);
  margin: 0.25rem 0 0.5rem;
}

.subtask-progress-fill {
  height: 100%;
  background-color: var(--cds-support-success);
  transition: width 0.2s ease;
}

.subtasks-list {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
}

.subtask-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  background: var(--cds-layer);
  border: 1px solid var(--cds-border-subtle);
}

.subtask-check-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--cds-text-primary);
  cursor: pointer;
  flex: 1;
}

.subtask-done-text {
  text-decoration: line-through;
  color: var(--cds-text-secondary);
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
  flex-shrink: 0;
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