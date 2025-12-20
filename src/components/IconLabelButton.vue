<template>
  <div class="icon-label-button" :class="{ inline: inline, elevated: elevated }">
    <span v-if="icon" :class="['material-symbols-outlined', { 'material-fill': !outlined }]">{{
      icon
      }}</span>

    <slot v-else name="icon" />

    <span v-if="label" class="label">
      <slot>{{ label }}</slot>
    </span>
  </div>
</template>
<script setup lang="ts">
defineProps({
  label: {
    type: String,
  },
  icon: {
    type: String,
    default: null,
  },
  outlined: {
    type: Boolean,
    default: false,
  },
  inline: {
    type: Boolean,
    default: false,
  },
  elevated: {
    type: Boolean,
    default: false,
  },
})
</script>
<style scoped>
.icon-label-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.inline {
  flex-direction: row;
  gap: var(--space-sm);
}

.elevated {
  background-color: var(--color-primary);
  padding: var(--space-sm);
  border-radius: var(--radius-lg);
}
</style>
