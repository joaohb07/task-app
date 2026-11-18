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
import ManageTagsModal from '../components/ManageTagsModal.vue'
import TaskModal from '../components/TaskModal.vue'

const taskStore = useTaskStore()
const tagStore = useTagStore()

const isTagsModalOpen = ref(false)
const isTaskModalOpen = ref(false)
const taskModalMode = ref('create') // 'create' | 'edit' | 'view'
const activeTask = ref(null)

onMounted(() => {
  taskStore.fetchTasks()
  tagStore.fetchAllTags()
})

const totalPages = computed(() => Math.max(1, Math.ceil(taskStore.total / taskStore.limit)))

const openCreateTask = () => {
  activeTask.value = null
  taskModalMode.value = 'create'
  isTaskModalOpen.value = true
}

const openViewTask = (task) => {
  activeTask.value = task
  taskModalMode.value = 'view'
  isTaskModalOpen.value = true
}

const openEditTask = (task) => {
  activeTask.value = task
  taskModalMode.value = 'edit'
  isTaskModalOpen.value = true
}

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

const setFilter = (filter) => {
  taskStore.filter = filter
  taskStore.page = 1
  taskStore.fetchTasks()
}

const changeTagFilter = (e) => {
  taskStore.selectedTag = e.target.value
  taskStore.page = 1
  taskStore.fetchTasks()
}

const changeSort = (e) => {
  taskStore.sortBy = e.target.value
  taskStore.page = 1
  taskStore.fetchTasks()
}

const changePage = (delta) => {
  const next = taskStore.page + delta
  if (next >= 1 && next <= totalPages.value) {
    taskStore.page = next
    taskStore.fetchTasks()
  }
}

const formatDate = (iso, useUtc = false) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(useUtc ? { timeZone: 'UTC' } : {})
  })
}

const isOverdue = (task) => {
  if (!task.dueDate || task.completed) return false
  const todayUtc = new Date().toISOString().split('T')[0]
  const dueUtc = new Date(task.dueDate).toISOString().split('T')[0]
  return dueUtc < todayUtc
}
</script>

<template>
  <div class="page-container">
    <!-- Top KPI Summary Tiles (Carbon Grid Pattern) -->
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

    <!-- Carbon Data Table Container -->
    <div class="cds--data-table-container">
      <div class="cds--data-table-header">
        <div>
          <h4 class="cds--data-table-header__title">Tasks</h4>
          <p class="cds--data-table-header__description">
            Manage, filter, and track status across your personal backlog.
          </p>
        </div>
      </div>

      <!-- Table Toolbar (Status Filters + Tag Filter + Sorting) -->
      <div class="table-controls-bar">
        <div class="filter-tabs">
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

        <div class="toolbar-selects">
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
              <option value="dueDate:asc">Due date (earliest)</option>
              <option value="dueDate:desc">Due date (latest)</option>
              <option value="completed:asc">Pending first</option>
              <option value="completed:desc">Completed first</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Data Table with horizontal scroll wrapper -->
      <div class="table-scroll-wrapper">
        <table class="cds--data-table cds--data-table--zebra">
          <thead>
            <tr>
              <th style="width: 56px">Done</th>
              <th>Task</th>
              <th style="width: 220px">Tags</th>
              <th style="width: 135px">Due Date</th>
              <th style="width: 120px">Status</th>
              <th style="width: 130px; text-align: right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="taskStore.loading">
              <td colspan="6" class="empty-cell">Loading tasks...</td>
            </tr>
            <tr v-else-if="taskStore.items.length === 0">
              <td colspan="6" class="empty-cell">
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
                <button
                  type="button"
                  class="task-title-btn"
                  :class="{ 'task-done-text': task.completed }"
                  @click="openViewTask(task)"
                >
                  {{ task.description }}
                </button>
                <p v-if="task.details" class="task-details-preview">
                  {{ task.details }}
                </p>
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
                  class="cds--tag cds--tag--sm"
                  :class="task.completed ? 'cds--tag--green' : 'cds--tag--warm-gray'"
                >
                  <span class="cds--tag__label">{{ task.completed ? 'Completed' : 'Pending' }}</span>
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
  min-width: 145px;
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
  max-width: 340px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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