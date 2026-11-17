<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTaskStore } from '../stores/tasks'
import Add from '@carbon/icons-vue/es/add/16'
import TrashCan from '@carbon/icons-vue/es/trash-can/16'
import Edit from '@carbon/icons-vue/es/edit/16'
import Checkmark from '@carbon/icons-vue/es/checkmark/16'
import Close from '@carbon/icons-vue/es/close/16'
import ChevronLeft from '@carbon/icons-vue/es/chevron--left/16'
import ChevronRight from '@carbon/icons-vue/es/chevron--right/16'

const taskStore = useTaskStore()
const newDescription = ref('')
const editingId = ref(null)
const editingText = ref('')

onMounted(() => {
  taskStore.fetchTasks()
})

const totalPages = computed(() => Math.max(1, Math.ceil(taskStore.total / taskStore.limit)))

const handleCreate = async () => {
  const trimmed = newDescription.value.trim()
  if (!trimmed) return
  await taskStore.createTask(trimmed)
  newDescription.value = ''
}

const startEdit = (task) => {
  editingId.value = task._id
  editingText.value = task.description
}

const cancelEdit = () => {
  editingId.value = null
  editingText.value = ''
}

const saveEdit = async (id) => {
  const trimmed = editingText.value.trim()
  if (!trimmed) return
  await taskStore.updateTaskDescription(id, trimmed)
  cancelEdit()
}

const setFilter = (filter) => {
  taskStore.filter = filter
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

const formatDate = (iso) => {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
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

    <!-- Create Task Bar -->
    <form class="cds--tile create-bar" @submit.prevent="handleCreate">
      <input
        v-model="newDescription"
        type="text"
        placeholder="What needs to be done? Type a task description..."
        class="cds--text-input"
        required
      />
      <button type="submit" class="cds--btn cds--btn--primary">
        <span>Add Task</span>
        <Add class="cds--btn__icon" />
      </button>
    </form>

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

      <!-- Table Toolbar (Filters + Sorting) -->
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
            <option value="completed:asc">Pending first</option>
            <option value="completed:desc">Completed first</option>
          </select>
        </div>
      </div>

      <!-- Data Table with horizontal scroll wrapper -->
      <div class="table-scroll-wrapper">
        <table class="cds--data-table cds--data-table--zebra">
          <thead>
            <tr>
              <th style="width: 64px">Done</th>
              <th>Description</th>
              <th style="width: 130px">Status</th>
              <th style="width: 140px">Created</th>
              <th style="width: 120px; text-align: right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="taskStore.loading">
              <td colspan="5" class="empty-cell">Loading tasks...</td>
            </tr>
            <tr v-else-if="taskStore.items.length === 0">
              <td colspan="5" class="empty-cell">
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
                <template v-if="editingId === task._id">
                  <input
                    v-model="editingText"
                    type="text"
                    class="cds--text-input cds--text-input--sm"
                    @keyup.enter="saveEdit(task._id)"
                    @keyup.esc="cancelEdit"
                  />
                </template>
                <span v-else :class="{ 'task-done-text': task.completed }">
                  {{ task.description }}
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
              <td>{{ formatDate(task.createdAt) }}</td>
              <td class="actions-cell">
                <template v-if="editingId === task._id">
                  <button
                    type="button"
                    class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
                    title="Save"
                    @click="saveEdit(task._id)"
                  >
                    <Checkmark />
                  </button>
                  <button
                    type="button"
                    class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
                    title="Cancel"
                    @click="cancelEdit"
                  >
                    <Close />
                  </button>
                </template>
                <template v-else>
                  <button
                    type="button"
                    class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm"
                    title="Edit description"
                    @click="startEdit(task)"
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
                </template>
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

.create-bar {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--cds-border-subtle);
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
  min-width: 160px;
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

.task-done-text {
  text-decoration: line-through;
  color: var(--cds-text-secondary);
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
  .create-bar {
    flex-direction: column;
  }

  .create-bar .cds--btn {
    width: 100%;
    max-width: 100%;
    justify-content: space-between;
  }
}
</style>