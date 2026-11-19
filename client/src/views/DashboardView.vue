<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTaskStore } from '../stores/tasks'
import { useTagStore } from '../stores/tags'
import Add from '@carbon/icons-vue/es/add/16'
import TrashCan from '@carbon/icons-vue/es/trash-can/16'
import Edit from '@carbon/icons-vue/es/edit/16'
import View from '@carbon/icons-vue/es/view/16'
import ChevronLeft from '@carbon/icons-vue/es/chevron--left/16'
import ChevronRight from '@carbon/icons-vue/es/chevron--right/16'
import TagIcon from '@carbon/icons-vue/es/tag/16'
import TableSplit from '@carbon/icons-vue/es/table--split/16'
import Column from '@carbon/icons-vue/es/column/16'
import ManageTagsModal from '../components/ManageTagsModal.vue'
import TaskModal from '../components/TaskModal.vue'
import KanbanBoard from '../components/KanbanBoard.vue'

/**
 * DashboardView.vue
 * Main dashboard displaying KPIs, quick actions, and a switchable Table / Kanban workspace
 * for managing tasks, tags, priorities, and subtasks.
 */
const taskStore = useTaskStore()
const tagStore = useTagStore()

/**
 * Reactive state variables for controlling the visibility of modals and the current task being edited/viewed.
 * - isTagsModalOpen: Controls the visibility of the ManageTagsModal.
 * - isTaskModalOpen: Controls the visibility of the TaskModal.
 * - taskModalMode: Determines the mode of the TaskModal ('create', 'edit', or 'view').
 * - activeTask: Holds the currently selected task for viewing or editing.
 */
const isTagsModalOpen = ref(false)
const isTaskModalOpen = ref(false)
const taskModalMode = ref('create') // 'create' | 'edit' | 'view'
const activeTask = ref(null)

/**
 * Maps task priorities to their display labels for the Table view and Kanban board.
 * Ensures consistent labeling across different components of the dashboard.
 */
const priorityLabelMap = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High'
}

/**
 * Maps task stages to their display labels for the Kanban board and table view.
 * Ensures consistent labeling across different components of the dashboard.
 */
const stageLabelMap = {
  todo: 'TO-DO',
  wip: 'WIP',
  done: 'DONE'
}

/**
 * Fetches initial data for tasks and tags when the component is mounted.
 * Ensures that the dashboard has the latest tasks and tag information.
 */
onMounted(() => {
  taskStore.fetchTasks()
  tagStore.fetchAllTags()
})

/**
 * Computes the total number of pages based on the total tasks and the limit per page.
 * Ensures that there is at least one page even if there are no tasks.
 */
const totalPages = computed(() => Math.max(1, Math.ceil(taskStore.total / taskStore.limit)))

/**
 * Resolves the stage of a task based on its status and completion state.
 * If the task has a valid status ('todo', 'wip', 'done'), it returns that status.
 * Otherwise, it determines the stage based on whether the task is completed or not.
 * @param {Object} task - The task object to evaluate.
 * @returns {string} - The resolved stage ('todo', 'wip', or 'done').
 */
const resolveTaskStage = (task) => {
  if (task.status && ['todo', 'wip', 'done'].includes(task.status)) {
    return task.status
  }
  return task.completed ? 'done' : 'todo'
}

/**
 * Opens the TaskModal in create mode.
 * Resets the activeTask to null and updates the modal mode to 'create'.
 */
const openCreateTask = () => {
  activeTask.value = null
  taskModalMode.value = 'create'
  isTaskModalOpen.value = true
}

/**
 * Opens the TaskModal in view mode for the specified task.
 * Sets the activeTask to the provided task and updates the modal mode to 'view'.
 * @param {Object} task - The task object to be viewed.
 */
const openViewTask = (task) => {
  activeTask.value = task
  taskModalMode.value = 'view'
  isTaskModalOpen.value = true
}

/**
 * Opens the TaskModal in edit mode for the specified task.
 * Sets the activeTask to the provided task and updates the modal mode to 'edit'.
 * @param {Object} task - The task object to be edited.
 */
const openEditTask = (task) => {
  activeTask.value = task
  taskModalMode.value = 'edit'
  isTaskModalOpen.value = true
}

/**
 * Handles the event when tags are changed in the ManageTagsModal.
 * Fetches all tags again and checks if the currently selected tag filter is still valid.
 * If the selected tag no longer exists, it resets the selected tag filter to an empty string.
 * Finally, it fetches tasks based on the updated tag list and current filters.
 */
const handleTagsChanged = () => {
  tagStore.fetchAllTags()
  if (
    taskStore.selectedTag &&
    !tagStore.allTags.some((t) => t._id === taskStore.selectedTag)
  ) {
    taskStore.selectedTag = ''
  }
  taskStore.fetchTasks()
}

/**
 * Handles the movement of a task between stages in the Kanban board.
 * Calls the task store to update the task's status based on the new stage.
 * @param {Object} payload - The payload containing the task and new status.
 * @param {Object} payload.task - The task being moved.
 * @param {string} payload.status - The new status ('todo', 'wip', 'done').
 */
const handleKanbanMove = ({ task, status }) => {
  taskStore.moveTaskStage(task, status)
}

/**
 * Sets the task filter (all, pending, completed) and resets the page to 1.
 * Fetches tasks based on the new filter.
 * @param {string} filter - The filter to apply ('all', 'pending', 'completed').
 */
const setFilter = (filter) => {
  taskStore.filter = filter
  taskStore.page = 1
  taskStore.fetchTasks()
}

/**
 * Changes the selected tag filter for tasks based on user selection.
 * Resets the current page to 1 and fetches tasks with the new tag filter applied.
 * @param {Event} e - The change event from the tag select dropdown.
 */
const changeTagFilter = (e) => {
  taskStore.selectedTag = e.target.value
  taskStore.page = 1
  taskStore.fetchTasks()
}

/**
 * Changes the priority filter for tasks based on user selection.
 * Resets the current page to 1 and fetches tasks with the new priority filter applied.
 * @param {Event} e - The change event from the priority select dropdown.
 */
const changePriorityFilter = (e) => {
  taskStore.selectedPriority = e.target.value
  taskStore.page = 1
  taskStore.fetchTasks()
}

/**
 * Changes the sorting criteria for tasks based on user selection.
 * Resets the current page to 1 and fetches tasks with the new sorting applied.
 * @param {Event} e - The change event from the sort select dropdown.
 */
const changeSort = (e) => {
  taskStore.sortBy = e.target.value
  taskStore.page = 1
  taskStore.fetchTasks()
}

/**
 * Changes the current page of tasks by a given delta.
 * Ensures that the new page number is within valid bounds (1 to totalPages).
 * Fetches tasks for the new page if the change is valid.
 * @param {number} delta - The change in page number (e.g., -1 for previous, +1 for next).
 */
const changePage = (delta) => {
  const next = taskStore.page + delta
  if (next >= 1 && next <= totalPages.value) {
    taskStore.page = next
    taskStore.fetchTasks()
  }
}

/**
 * Formats an ISO date string into a human-readable format.
 * If the input is null or undefined, returns a placeholder '—'.
 * @param {string} iso - The ISO date string to format.
 * @param {boolean} useUtc - Whether to format the date in UTC or local time.
 * @returns {string} - The formatted date string or '—' if input is invalid.
 */
const formatDate = (iso, useUtc = false) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(useUtc ? { timeZone: 'UTC' } : {})
  })
}

/**
 * Determines if a task is overdue based on its due date and completion status.
 * A task is considered overdue if it has a due date in the past and is not completed.
 * @param {Object} task - The task object to evaluate.
 * @returns {boolean} - True if the task is overdue, false otherwise.
 */
const isOverdue = (task) => {
  if (!task.dueDate || task.completed) return false
  const todayUtc = new Date().toISOString().split('T')[0]
  const dueUtc = new Date(task.dueDate).toISOString().split('T')[0]
  return dueUtc < todayUtc
}
</script>

<template>
  <div class="page-container">
    <!-- Top KPI Summary Tiles -->
    <div class="kpi-grid">
      <div class="cds--tile kpi-tile">
        <span class="cds--type-label-01">TOTAL TASKS</span>
        <p class="kpi-value">{{ taskStore.stats.total }}</p>
      </div>
      <div class="cds--tile kpi-tile">
        <span class="cds--type-label-01">PENDING</span>
        <p class="kpi-value kpi-pending">{{ taskStore.stats.pending }}</p>
      </div>
      <div class="cds--tile kpi-tile">
        <span class="cds--type-label-01">COMPLETED</span>
        <p class="kpi-value kpi-completed">{{ taskStore.stats.completed }}</p>
      </div>
    </div>

    <!-- Action Bar: Add Task & Manage Tags -->
    <div class="cds--tile action-bar">
      <div class="action-bar-info">
        <span class="cds--type-productive-heading-02">Quick Actions</span>
        <span class="cds--type-body-compact-01 action-bar-subtitle">
          Create new tasks or organize your personal tag catalog.
        </span>
      </div>
      <div class="action-bar-buttons">
        <button
          type="button"
          class="cds--btn cds--btn--secondary"
          @click="isTagsModalOpen = true"
        >
          <span>Manage Tags</span>
          <TagIcon class="cds--btn__icon" />
        </button>
        <button
          type="button"
          class="cds--btn cds--btn--primary"
          @click="openCreateTask"
        >
          <span>Add Task</span>
          <Add class="cds--btn__icon" />
        </button>
      </div>
    </div>

    <!-- Manage Tags Modal -->
    <ManageTagsModal
      :open="isTagsModalOpen"
      @close="isTagsModalOpen = false"
      @tags-changed="handleTagsChanged"
    />

    <!-- Create / Edit / View Task Modal -->
    <TaskModal
      :open="isTaskModalOpen"
      :mode="taskModalMode"
      :task="activeTask"
      @update:mode="taskModalMode = $event"
      @close="isTaskModalOpen = false"
      @open-tags="isTagsModalOpen = true"
    />

    <!-- Workspace Container (Table or Kanban) -->
    <div class="cds--data-table-container">
      <div class="cds--data-table-header workspace-header-row">
        <div>
          <h4 class="cds--data-table-header__title">Tasks</h4>
          <p class="cds--data-table-header__description">
            Manage, filter, and track status across your personal backlog.
          </p>
        </div>

        <!-- View Mode Switcher: Table vs Kanban -->
        <div class="view-switcher" role="group" aria-label="Workspace view mode">
          <button
            type="button"
            class="cds--btn cds--btn--sm"
            :class="taskStore.viewMode === 'table' ? 'cds--btn--primary' : 'cds--btn--tertiary'"
            @click="taskStore.setViewMode('table')"
          >
            <span>Table</span>
            <TableSplit class="cds--btn__icon" />
          </button>
          <button
            type="button"
            class="cds--btn cds--btn--sm"
            :class="taskStore.viewMode === 'kanban' ? 'cds--btn--primary' : 'cds--btn--tertiary'"
            @click="taskStore.setViewMode('kanban')"
          >
            <span>Kanban</span>
            <Column class="cds--btn__icon" />
          </button>
        </div>
      </div>

      <!-- Toolbar (Status Filters in Table mode + Priority Filter + Tag Filter + Sorting) -->
      <div class="table-controls-bar">
        <div v-if="taskStore.viewMode === 'table'" class="filter-tabs">
          <button
            type="button"
            class="cds--btn cds--btn--sm"
            :class="taskStore.filter === 'all' ? 'cds--btn--primary' : 'cds--btn--ghost'"
            @click="setFilter('all')"
          >
            All ({{ taskStore.stats.total }})
          </button>
          <button
            type="button"
            class="cds--btn cds--btn--sm"
            :class="taskStore.filter === 'pending' ? 'cds--btn--primary' : 'cds--btn--ghost'"
            @click="setFilter('pending')"
          >
            Pending ({{ taskStore.stats.pending }})
          </button>
          <button
            type="button"
            class="cds--btn cds--btn--sm"
            :class="taskStore.filter === 'completed' ? 'cds--btn--primary' : 'cds--btn--ghost'"
            @click="setFilter('completed')"
          >
            Completed ({{ taskStore.stats.completed }})
          </button>
        </div>
        <div v-else class="kanban-legend">
          <span class="cds--type-label-01">3-STAGE BOARD: TO-DO • WIP • DONE</span>
        </div>

        <div class="toolbar-selects">
          <div class="sort-box">
            <label for="priority-filter-select" class="sort-label">Priority:</label>
            <select
              id="priority-filter-select"
              :value="taskStore.selectedPriority"
              class="cds--select-input cds--select-input--sm sort-select"
              @change="changePriorityFilter"
            >
              <option value="">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="none">None</option>
            </select>
          </div>

          <div class="sort-box">
            <label for="tag-filter-select" class="sort-label">Tag:</label>
            <select
              id="tag-filter-select"
              :value="taskStore.selectedTag"
              class="cds--select-input cds--select-input--sm sort-select"
              @change="changeTagFilter"
            >
              <option value="">All tags</option>
              <option v-for="tag in tagStore.allTags" :key="tag._id" :value="tag._id">
                {{ tag.name }}
              </option>
            </select>
          </div>

          <div class="sort-box">
            <label for="sort-select" class="sort-label">Sort by:</label>
            <select
              id="sort-select"
              :value="taskStore.sortBy"
              class="cds--select-input cds--select-input--sm sort-select"
              @change="changeSort"
            >
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
              <option value="priority:desc">Priority (high → low)</option>
              <option value="priority:asc">Priority (low → high)</option>
              <option value="dueDate:asc">Due date (earliest)</option>
              <option value="dueDate:desc">Due date (latest)</option>
              <option value="completed:asc">Pending first</option>
              <option value="completed:desc">Completed first</option>
            </select>
          </div>
        </div>
      </div>

      <!-- KANBAN VIEW -->
      <KanbanBoard
        v-if="taskStore.viewMode === 'kanban'"
        :tasks="taskStore.items"
        :loading="taskStore.loading"
        @move-task="handleKanbanMove"
        @view-task="openViewTask"
        @edit-task="openEditTask"
        @delete-task="taskStore.deleteTask"
      />

      <!-- TABLE VIEW -->
      <template v-else>
        <div class="table-scroll-wrapper">
          <table class="cds--data-table cds--data-table--zebra">
            <thead>
              <tr>
                <th style="width: 56px">Done</th>
                <th>Task</th>
                <th style="width: 110px">Priority</th>
                <th style="width: 210px">Tags</th>
                <th style="width: 130px">Due Date</th>
                <th style="width: 115px">Stage</th>
                <th style="width: 130px; text-align: right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="taskStore.loading">
                <td colspan="7" class="empty-cell">Loading tasks...</td>
              </tr>
              <tr v-else-if="taskStore.items.length === 0">
                <td colspan="7" class="empty-cell">
                  No tasks found for the current filter. Create one above!
                </td>
              </tr>
              <tr v-for="task in taskStore.items" :key="task._id">
                <td>
                  <input
                    type="checkbox"
                    :checked="task.completed"
                    aria-label="Toggle task status"
                    class="task-checkbox"
                    @change="taskStore.toggleTask(task)"
                  />
                </td>
                <td>
                  <div class="task-title-row">
                    <button
                      type="button"
                      class="task-title-btn"
                      :class="{ 'task-done-text': task.completed }"
                      @click="openViewTask(task)"
                    >
                      {{ task.description }}
                    </button>
                    <span
                      v-if="task.subtasks && task.subtasks.length > 0"
                      class="subtask-counter-badge"
                      title="Subtasks progress"
                    >
                      {{ task.subtasks.filter((s) => s.completed).length }}/{{ task.subtasks.length }}
                    </span>
                  </div>
                  <p v-if="task.details" class="task-details-preview">
                    {{ task.details }}
                  </p>
                </td>
                <td>
                  <span
                    class="cds--tag cds--tag--sm priority-pill"
                    :class="`priority-pill--${task.priority || 'none'}`"
                  >
                    <span class="cds--tag__label">
                      {{ priorityLabelMap[task.priority || 'none'] }}
                    </span>
                  </span>
                </td>
                <td>
                  <div v-if="task.tags && task.tags.length > 0" class="row-tags-wrap">
                    <span
                      v-for="tag in task.tags"
                      :key="tag._id"
                      class="cds--tag cds--tag--sm"
                      :class="`cds--tag--${tag.color || 'blue'}`"
                    >
                      <span class="cds--tag__label">{{ tag.name }}</span>
                    </span>
                  </div>
                  <span v-else class="muted-dash">—</span>
                </td>
                <td>
                  <span :class="{ 'overdue-text': isOverdue(task) }">
                    {{ formatDate(task.dueDate, true) }}
                  </span>
                </td>
                <td>
                  <span
                    class="cds--tag cds--tag--sm stage-pill"
                    :class="`stage-pill--${resolveTaskStage(task)}`"
                  >
                    <span class="cds--tag__label">
                      {{ stageLabelMap[resolveTaskStage(task)] }}
                    </span>
                  </span>
                </td>
                <td class="actions-cell">
                  <button
                    type="button"
                    class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
                    title="View details"
                    @click="openViewTask(task)"
                  >
                    <View />
                  </button>
                  <button
                    type="button"
                    class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
                    title="Edit task"
                    @click="openEditTask(task)"
                  >
                    <Edit />
                  </button>
                  <button
                    type="button"
                    class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
                    title="Delete task"
                    @click="taskStore.deleteTask(task._id)"
                  >
                    <TrashCan />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Responsive Pagination Footer -->
        <div class="table-pagination-bar">
          <span class="pagination-info">
            Showing {{ taskStore.items.length }} of {{ taskStore.total }} items
          </span>

          <div class="pagination-controls">
            <span class="pagination-info">Page {{ taskStore.page }} of {{ totalPages }}</span>
            <button
              type="button"
              class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm pagination-btn"
              :disabled="taskStore.page <= 1"
              aria-label="Previous page"
              @click="changePage(-1)"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm pagination-btn"
              :disabled="taskStore.page >= totalPages"
              aria-label="Next page"
              @click="changePage(1)"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.kpi-tile {
  border: 1px solid var(--cds-border-subtle);
  padding: 1.25rem;
}

.kpi-value {
  font-size: 2rem;
  font-weight: 300;
  margin-top: 0.5rem;
}

.kpi-completed {
  color: var(--cds-support-success);
}

.kpi-pending {
  color: var(--cds-support-warning);
}

.action-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--cds-border-subtle);
}

.action-bar-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.action-bar-subtitle {
  color: var(--cds-text-secondary);
}

.action-bar-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.workspace-header-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.view-switcher {
  display: inline-flex;
  gap: 0.25rem;
}

.kanban-legend {
  color: var(--cds-text-secondary);
}

.table-controls-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: var(--cds-layer);
  border-top: 1px solid var(--cds-border-subtle);
  border-bottom: 1px solid var(--cds-border-subtle);
}

.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.toolbar-selects {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.sort-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-label {
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
  white-space: nowrap;
}

.sort-select {
  width: auto;
  min-width: 140px;
}

.table-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
}

.task-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  vertical-align: middle;
}

.task-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.subtask-counter-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.05rem 0.4rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--cds-text-secondary);
  background-color: var(--cds-layer-accent);
  border: 1px solid var(--cds-border-subtle);
  border-radius: 999px;
}

.task-title-btn {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-weight: 500;
  color: var(--cds-text-primary);
  text-align: left;
  cursor: pointer;
}

.task-title-btn:hover {
  color: var(--cds-link-primary);
  text-decoration: underline;
}

.task-done-text {
  text-decoration: line-through;
  color: var(--cds-text-secondary);
}

.task-details-preview {
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
  margin-top: 0.15rem;
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Kanban Stage Badges: Black (TO-DO) / Dark Blue (WIP) / Bright Green (DONE) */
.stage-pill--todo {
  background-color: #161616;
  color: #ffffff;
}

.stage-pill--wip {
  background-color: #002d9c;
  color: #ffffff;
}

.stage-pill--done {
  background-color: #24a148;
  color: #ffffff;
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

.row-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.muted-dash {
  color: var(--cds-text-secondary);
}

.overdue-text {
  color: var(--cds-text-error);
  font-weight: 500;
}

.actions-cell {
  text-align: right;
  white-space: nowrap;
}

.actions-cell .cds--btn--icon-only {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.empty-cell {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--cds-text-secondary);
}

.table-pagination-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 1rem;
  background-color: var(--cds-layer);
  border-top: 1px solid var(--cds-border-subtle);
}

.pagination-info {
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
}

.pagination-controls {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: auto;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 480px) {
  .action-bar-buttons {
    width: 100%;
  }

  .action-bar-buttons .cds--btn {
    flex: 1;
    justify-content: space-between;
  }
}
</style>