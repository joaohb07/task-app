<script setup>
import Search from '@carbon/icons-vue/es/search/16'
import Close from '@carbon/icons-vue/es/close/16'
import '../styles/components/search-bar.scss'

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