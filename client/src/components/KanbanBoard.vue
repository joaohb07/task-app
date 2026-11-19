<script setup>
import { ref, computed } from 'vue'
import Edit from '@carbon/icons-vue/es/edit/16'
import View from '@carbon/icons-vue/es/view/16'
import TrashCan from '@carbon/icons-vue/es/trash-can/16'
import Calendar from '@carbon/icons-vue/es/calendar/16'
import ArrowLeft from '@carbon/icons-vue/es/arrow--left/16'
import ArrowRight from '@carbon/icons-vue/es/arrow--right/16'

/**
 * KanbanBoard.vue
 * Renders a 3-stage Kanban board (TO-DO / WIP / DONE) with Black, Dark Blue,
 * and Bright Green column headers, HTML5 drag-and-drop, and quick stage controls.
 */
const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['move-task', 'view-task', 'edit-task', 'delete-task'])

const draggedTask = ref(null)
const dragOverStage = ref(null)

/**
 * Three fixed Kanban stages with their respective color themes.
 */
const stages = [
  { key: 'todo', label: 'TO-DO', themeClass: 'kanban-col--todo' },
  { key: 'wip', label: 'WIP', themeClass: 'kanban-col--wip' },
  { key: 'done', label: 'DONE', themeClass: 'kanban-col--done' }
]

const priorityLabelMap = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High'
}

/**
 * Resolves a task's effective Kanban stage, preserving compatibility with legacy completed tasks.
 * @param {Object} task - Task object.
 * @returns {'todo'|'wip'|'done'}
 */
const resolveStage = (task) => {
  if (task.status && ['todo', 'wip', 'done'].includes(task.status)) {
    return task.status
  }
  return task.completed ? 'done' : 'todo'
}

/**
 * Groups tasks into the three Kanban columns.
 */
const tasksByStage = computed(() => {
  const grouped = { todo: [], wip: [], done: [] }
  for (const task of props.tasks) {
    grouped[resolveStage(task)].push(task)
  }
  return grouped
})

const onDragStart = (event, task) => {
  draggedTask.value = task
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', task._id)
  }
}

const onDragOver = (stageKey) => {
  dragOverStage.value = stageKey
}

const onDragLeave = (stageKey) => {
  if (dragOverStage.value === stageKey) {
    dragOverStage.value = null
  }
}

const onDrop = (stageKey) => {
  dragOverStage.value = null
  if (!draggedTask.value) return
  const task = draggedTask.value
  draggedTask.value = null
  if (resolveStage(task) !== stageKey) {
    emit('move-task', { task, status: stageKey })
  }
}

const onDragEnd = () => {
  draggedTask.value = null
  dragOverStage.value = null
}

const getPrevStage = (stageKey) => {
  if (stageKey === 'wip') return 'todo'
  if (stageKey === 'done') return 'wip'
  return null
}

const getNextStage = (stageKey) => {
  if (stageKey === 'todo') return 'wip'
  if (stageKey === 'wip') return 'done'
  return null
}

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  })
}

const isOverdue = (task) => {
  if (!task.dueDate || resolveStage(task) === 'done') return false
  const todayUtc = new Date().toISOString().split('T')[0]
  const dueUtc = new Date(task.dueDate).toISOString().split('T')[0]
  return dueUtc < todayUtc
}
</script>

<template>
  <div class="kanban-board" data-testid="kanban-board">
    <div
      v-for="stage in stages"
      :key="stage.key"
      class="kanban-column"
      :class="[stage.themeClass, { 'is-drag-over': dragOverStage === stage.key }]"
      :data-stage="stage.key"
      @dragover.prevent="onDragOver(stage.key)"
      @dragleave="onDragLeave(stage.key)"
      @drop.prevent="onDrop(stage.key)"
    >
      <!-- Colored Column Header: Black (TO-DO) / Dark Blue (WIP) / Bright Green (DONE) -->
      <div class="kanban-column-header">
        <span class="kanban-column-title">{{ stage.label }}</span>
        <span class="kanban-column-count">{{ tasksByStage[stage.key].length }}</span>
      </div>

      <!-- Column Card List -->
      <div class="kanban-column-body">
        <p v-if="loading" class="kanban-empty-msg">Loading tasks...</p>
        <p v-else-if="tasksByStage[stage.key].length === 0" class="kanban-empty-msg">
          Drop tasks here or create a new one.
        </p>

        <article
          v-for="task in tasksByStage[stage.key]"
          :key="task._id"
          class="kanban-card"
          :class="{ 'is-dragging': draggedTask?._id === task._id }"
          draggable="true"
          @dragstart="onDragStart($event, task)"
          @dragend="onDragEnd"
        >
          <!-- Top Meta: Priority + Subtasks Progress -->
          <div class="kanban-card-top">
            <span
              class="cds--tag cds--tag--sm priority-pill"
              :class="`priority-pill--${task.priority || 'none'}`"
            >
              <span class="cds--tag__label">
                {{ priorityLabelMap[task.priority || 'none'] }}
              </span>
            </span>

            <span
              v-if="task.subtasks && task.subtasks.length > 0"
              class="subtask-counter-badge"
              title="Subtasks progress"
            >
              {{ task.subtasks.filter((s) => s.completed).length }}/{{ task.subtasks.length }}
            </span>
          </div>

          <!-- Card Title & Preview -->
          <button
            type="button"
            class="kanban-card-title"
            :class="{ 'kanban-done-title': stage.key === 'done' }"
            @click="emit('view-task', task)"
          >
            {{ task.description }}
          </button>

          <p v-if="task.details" class="kanban-card-details">
            {{ task.details }}
          </p>

          <!-- Tags -->
          <div v-if="task.tags && task.tags.length > 0" class="kanban-card-tags">
            <span
              v-for="tag in task.tags"
              :key="tag._id"
              class="cds--tag cds--tag--sm"
              :class="`cds--tag--${tag.color || 'blue'}`"
            >
              <span class="cds--tag__label">{{ tag.name }}</span>
            </span>
          </div>

          <!-- Card Footer: Due Date, Stage Shift Arrows & CRUD Icons -->
          <div class="kanban-card-footer">
            <span
              v-if="task.dueDate"
              class="kanban-due-date"
              :class="{ 'overdue-text': isOverdue(task) }"
            >
              <Calendar />
              <span>{{ formatDate(task.dueDate) }}</span>
            </span>
            <span v-else class="kanban-due-date muted-dash">No due date</span>

            <div class="kanban-card-actions">
              <button
                v-if="getPrevStage(stage.key)"
                type="button"
                class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
                :title="`Move to ${getPrevStage(stage.key).toUpperCase()}`"
                @click="emit('move-task', { task, status: getPrevStage(stage.key) })"
              >
                <ArrowLeft />
              </button>
              <button
                v-if="getNextStage(stage.key)"
                type="button"
                class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
                :title="`Move to ${getNextStage(stage.key).toUpperCase()}`"
                @click="emit('move-task', { task, status: getNextStage(stage.key) })"
              >
                <ArrowRight />
              </button>
              <button
                type="button"
                class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
                title="View details"
                @click="emit('view-task', task)"
              >
                <View />
              </button>
              <button
                type="button"
                class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
                title="Edit task"
                @click="emit('edit-task', task)"
              >
                <Edit />
              </button>
              <button
                type="button"
                class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
                title="Delete task"
                @click="emit('delete-task', task._id)"
              >
                <TrashCan />
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(260px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background-color: var(--cds-background);
  border-top: 1px solid var(--cds-border-subtle);
  overflow-x: auto;
}

.kanban-column {
  display: flex;
  flex-direction: column;
  min-height: 440px;
  background-color: var(--cds-layer);
  border: 1px solid var(--cds-border-subtle);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.kanban-column.is-drag-over {
  border-color: var(--cds-focus);
  box-shadow: inset 0 0 0 2px var(--cds-focus);
}

/* Column Header Colors: Black (TO-DO) / Dark Blue (WIP) / Bright Green (DONE) */
.kanban-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.kanban-col--todo .kanban-column-header {
  background-color: #161616;
  color: #ffffff;
  border-bottom: 3px solid #393939;
}

.kanban-col--wip .kanban-column-header {
  background-color: #002d9c;
  color: #ffffff;
  border-bottom: 3px solid #0f62fe;
}

.kanban-col--done .kanban-column-header {
  background-color: #24a148;
  color: #ffffff;
  border-bottom: 3px solid #42be65;
}

.kanban-column-title {
  font-size: 0.875rem;
}

.kanban-column-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.35rem;
  padding: 0 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  border-radius: 999px;
}

.kanban-column-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  flex: 1;
}

.kanban-empty-msg {
  text-align: center;
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
  padding: 2rem 0.75rem;
  border: 1px dashed var(--cds-border-subtle);
}

.kanban-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.85rem;
  background-color: var(--cds-layer-accent);
  border: 1px solid var(--cds-border-subtle);
  cursor: grab;
  transition: transform 0.12s ease, border-color 0.15s ease;
}

.kanban-card:hover {
  border-color: var(--cds-border-strong);
}

.kanban-card:active {
  cursor: grabbing;
}

.kanban-card.is-dragging {
  opacity: 0.5;
}

.kanban-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.kanban-card-title {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--cds-text-primary);
  text-align: left;
  cursor: pointer;
}

.kanban-card-title:hover {
  color: var(--cds-link-primary);
  text-decoration: underline;
}

.kanban-done-title {
  text-decoration: line-through;
  color: var(--cds-text-secondary);
}

.kanban-card-details {
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kanban-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.kanban-card-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  padding-top: 0.5rem;
  margin-top: 0.25rem;
  border-top: 1px solid var(--cds-border-subtle);
}

.kanban-due-date {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
}

.kanban-card-actions {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
}

.kanban-card-actions .cds--btn--icon-only {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.35rem;
}

.subtask-counter-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.05rem 0.4rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--cds-text-secondary);
  background-color: var(--cds-layer);
  border: 1px solid var(--cds-border-subtle);
  border-radius: 999px;
}

/* Priority Color Tokens */
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

.overdue-text {
  color: var(--cds-text-error);
  font-weight: 500;
}

.muted-dash {
  color: var(--cds-text-secondary);
}

@media (max-width: 900px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }

  .kanban-column {
    min-height: 240px;
  }
}
</style>