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
import '../styles/components/task-modal.scss'

/**
 * Props definition for TaskModal component.
 * @property {boolean} open - Whether the modal is open.
 * @property {string} mode - Mode of the modal: 'create', 'edit', or 'view'.
 * @property {Object|null} task - Task object for edit/view modes; null for create mode.
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
 * Emits events from TaskModal component.
 * @event close - Emitted when the modal is requested to close.
 * @event update:mode - Emitted to request a mode change (e.g., from 'view' to 'edit').
 * @event open-tags - Emitted to request opening the tag management interface.
 */
const emit = defineEmits(['close', 'update:mode', 'open-tags'])

/**
 * Reactive state and computed properties for TaskModal component.
 * Includes form fields, subtasks, tags, and computed labels for priority and stage.
 */
const taskStore = useTaskStore()
const tagStore = useTagStore()

/**
 * Reactive form fields for task creation/editing.
 * Includes description, details, due date, priority, status, subtasks, and tags.
 */
const description = ref('')
const details = ref('')
const dueDate = ref('')
const priority = ref('none')
const status = ref('todo')
const subtasks = ref([])
const newSubtaskTitle = ref('')
const selectedTagIds = ref([])
const completed = ref(false)
const submitting = ref(false)

/**
 * Options for task priority and stage selection.
 * Used in select dropdowns for user-friendly labels.
 */
const priorityOptions = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
]

/**
 * Options for task stage selection.
 * Used in select dropdowns for user-friendly labels.
 */
const stageOptions = [
  { value: 'todo', label: 'TO-DO' },
  { value: 'wip', label: 'WIP' },
  { value: 'done', label: 'DONE' }
]

/**
 * Maps for displaying user-friendly labels for priority and stage.
 * Used in view mode to show readable text instead of raw values.
 */
const priorityLabelMap = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High'
}

/**
 * Maps for displaying user-friendly labels for task stages.
 * Used in view mode to show readable text instead of raw values.
 */
const stageLabelMap = {
  todo: 'TO-DO',
  wip: 'WIP',
  done: 'DONE'
}

/**
 * Computed property for available tags.
 * Returns all tags from the tag store or an empty array.
 */
const availableTags = computed(() => tagStore.allTags || [])
const isReadOnly = computed(() => props.mode === 'view')

/**
 * Computed property for resolving the task stage.
 * Returns the appropriate stage based on task properties.
 */
const resolvedTaskStage = computed(() => {
  if (!props.task) return 'todo'
  if (props.task.status && ['todo', 'wip', 'done'].includes(props.task.status)) {
    return props.task.status
  }
  return props.task.completed ? 'done' : 'todo'
})

/**
 * Computed property for counting completed subtasks.
 * Filters the subtasks array to count how many are marked as completed.
 */
const completedSubtasksCount = computed(
  () => subtasks.value.filter((st) => st.completed).length
)
/**
 * Computed property for calculating the percentage of completed subtasks.
 * Returns 0 if there are no subtasks; otherwise, calculates the percentage.
 */
const subtaskProgressPercent = computed(() => {
  if (subtasks.value.length === 0) return 0
  return Math.round((completedSubtasksCount.value / subtasks.value.length) * 100)
})

/**
 * Computed property for determining the modal heading based on mode.
 * Returns 'Task Details' for view mode, 'Edit Task' for edit mode, and 'New Task' for create mode.
 */
const modalHeading = computed(() => {
  if (props.mode === 'view') return 'Task Details'
  if (props.mode === 'edit') return 'Edit Task'
  return 'New Task'
})

/**
 * Computed property for determining the modal label based on mode.
 * Returns 'INSPECT' for view mode, 'UPDATE' for edit mode, and 'CREATE' for create mode.
 */
const modalLabel = computed(() => {
  if (props.mode === 'view') return 'INSPECT'
  if (props.mode === 'edit') return 'UPDATE'
  return 'CREATE'
})

/**
 * Converts an ISO date string to a format suitable for HTML date input fields (YYYY-MM-DD).
 * Returns an empty string if the input is falsy.
 * @param {string} isoString - The ISO date string to convert.
 * @returns {string} Formatted date string for input fields.
 */
const toInputDate = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toISOString().split('T')[0]
}

/**
 * Formats an ISO date string for display in a user-friendly format (e.g., "Jan 1, 2024").
 * Returns 'No due date' if the input is falsy.
 * @param {string} isoString - The ISO date string to format.
 * @returns {string} Formatted display date string.
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
 * Synchronizes the form fields with the provided task props.
 * Resets error state and initializes form fields based on the task object and mode.
 * Clears fields for create mode or populates them for edit/view modes.
 */
const syncFormFromProps = () => {
  taskStore.error = null
  newSubtaskTitle.value = ''
  if (props.task && (props.mode === 'edit' || props.mode === 'view')) {
    description.value = props.task.description || ''
    details.value = props.task.details || ''
    dueDate.value = toInputDate(props.task.dueDate)
    priority.value = props.task.priority || 'none'
    status.value = resolvedTaskStage.value
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
    status.value = 'todo'
    subtasks.value = []
    selectedTagIds.value = []
    completed.value = false
  }
}

/**
 * Watches for changes in the 'open' prop to fetch all tags when the modal is opened.
 * Ensures that the tag list is up-to-date whenever the modal becomes visible.
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
 * Watches for changes in the 'open', 'mode', and 'task' props to synchronize form fields.
 * Resets the form whenever the modal is opened or when the mode/task changes.
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
 * Watches for changes in the 'status' field to update the 'completed' state.
 * If the status is set to 'done', marks the task as completed; otherwise, marks it as not completed.
 */
watch(status, (nextStatus) => {
  completed.value = nextStatus === 'done'
})

/**
 * Watches for changes in the 'completed' state to update the 'status' field.
 * If the task is marked as completed, sets the status to 'done'; otherwise, sets it to 'todo'.
 */
watch(completed, (isDone) => {
  if (isDone && status.value !== 'done') {
    status.value = 'done'
  } else if (!isDone && status.value === 'done') {
    status.value = 'todo'
  }
})

/**
 * Adds a new subtask to the subtasks list.
 * Trims the input title and prevents adding empty or read-only subtasks.
 * Resets the new subtask input field after adding.
 */
const addSubtask = () => {
  const trimmed = newSubtaskTitle.value.trim()
  if (!trimmed || isReadOnly.value) return
  subtasks.value.push({ title: trimmed, completed: false })
  newSubtaskTitle.value = ''
}

/**
 * Removes a subtask from the subtasks list by index.
 * Prevents removal if the modal is in read-only mode.
 * @param {number} index - The index of the subtask to remove.
 */
const removeSubtask = (index) => {
  if (isReadOnly.value) return
  subtasks.value.splice(index, 1)
}

/**
 * Toggles the completion status of a subtask in view mode.
 * Updates the local state and calls the task store to persist the change.
 * @param {number} index - The index of the subtask to toggle.
 * @returns {Promise<void>}
 */
const handleViewSubtaskToggle = async (index) => {
  if (!props.task) return

  const currentSubtasksSnapshot = subtasks.value.map((st) => ({
    ...(st._id ? { _id: st._id } : {}),
    title: st.title,
    completed: Boolean(st.completed)
  }))

  subtasks.value[index].completed = !subtasks.value[index].completed

  const syncedTask = {
    ...props.task,
    subtasks: currentSubtasksSnapshot
  }

  await taskStore.toggleSubtask(syncedTask, index)
}
/**
 * Toggles the selection of a tag in the tag selector.
 * Adds or removes the tag ID from the selectedTagIds array based on its current state.
 * Prevents toggling if the modal is in read-only mode.
 * @param {string} tagId - The ID of the tag to toggle.
 * @returns {void}
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
 * Handles the submission of the task form.
 * Validates input, constructs the payload, and calls the appropriate store action
 * to create or update the task. Closes the modal on success.
 * @returns {Promise<void>}
 */
const handleSubmit = async () => {
  const trimmedDesc = description.value.trim()
  if (!trimmedDesc || isReadOnly.value) return

  if (newSubtaskTitle.value.trim()) {
    addSubtask()
  }

  submitting.value = true
  const payload = {
    description: trimmedDesc,
    details: details.value.trim(),
    dueDate: dueDate.value ? new Date(`${dueDate.value}T00:00:00.000Z`).toISOString() : null,
    priority: priority.value,
    status: status.value,
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
                class="cds--tag cds--tag--sm stage-pill"
                :class="`stage-pill--${resolvedTaskStage}`"
              >
                <span class="cds--tag__label">{{ stageLabelMap[resolvedTaskStage] }}</span>
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

          <div class="form-row-triple">
            <div class="cds--form-item">
              <label for="task-stage-select" class="cds--label">Stage</label>
              <select
                id="task-stage-select"
                v-model="status"
                class="cds--select-input"
              >
                <option v-for="opt in stageOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

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