<template>
  <button class="icon-label-button" :class="{ inline: inline, elevated: elevated }" v-bind="$attrs">
    <span v-if="icon" :class="['material-symbols-outlined', { 'material-fill': !outlined }]">{{ icon }}</span>

    <slot v-else name="icon" />

    <span v-if="label" class="label">{{ label }}</span>

    <slot v-else name="label" />
  </button>
</template>
<script setup lang="ts">
defineOptions({ inheritAttrs: false })
withDefaults(
  defineProps<{
    label?: string
    icon?: string | null
    outlined?: boolean
    inline?: boolean
    elevated?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    icon: null,
    outlined: false,
    inline: false,
    elevated: false,
    type: 'button',
  },
)
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
