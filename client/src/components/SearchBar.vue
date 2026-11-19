<script setup>
import Search from '@carbon/icons-vue/es/search/16'
import Close from '@carbon/icons-vue/es/close/16'

defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Search tasks by title, details, tag, or subtask...'
  },
  resultCount: {
    type: Number,
    default: null
  },
  totalCount: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'clear'])

const onInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<template>
  <div class="cds--tile search-bar-tile" role="search" aria-label="Search loaded tasks">
    <div class="search-input-wrapper">
      <Search class="search-leading-icon" aria-hidden="true" />
      <input
        :value="modelValue"
        type="search"
        class="cds--text-input search-input"
        :placeholder="placeholder"
        aria-label="Search tasks"
        @input="onInput"
        @keydown.esc="handleClear"
      />
      <button
        v-if="modelValue"
        type="button"
        class="cds--btn cds--btn--ghost cds--btn--icon-only cds--btn--sm search-clear-btn"
        title="Clear search"
        aria-label="Clear search"
        @click="handleClear"
      >
        <Close />
      </button>
    </div>

    <span
      v-if="modelValue && modelValue.trim() && resultCount !== null && totalCount !== null"
      class="search-counter"
    >
      {{ resultCount }} of {{ totalCount }} shown
    </span>
  </div>
</template>

<style scoped>
.search-bar-tile {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--cds-border-subtle);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 240px;
}

.search-leading-icon {
  position: absolute;
  left: 0.85rem;
  color: var(--cds-text-secondary);
  pointer-events: none;
  flex-shrink: 0;
}

.search-input {
  padding-left: 2.35rem;
  padding-right: 2.25rem;
}

.search-clear-btn {
  position: absolute;
  right: 0.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.search-counter {
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
  white-space: nowrap;
}
</style>