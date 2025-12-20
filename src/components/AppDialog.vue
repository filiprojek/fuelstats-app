<template>
  <div class="app-dialog" :class="props.variant">
    <b class="title">{{ props.title }}</b>
    <p v-if="description" class="description">{{ props.description }}</p>
  </div>
</template>

<script setup lang="ts">
export type VariantType = 'success' | 'danger' | 'warning' | 'info'

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    variant?: VariantType
  }>(),
  {
    title: 'text',
    description: '',
    variant: 'info',
  },
)
</script>

<style lang="scss" scoped>
.app-dialog {
  position: absolute;
  top: var(--space-md);
  left: 50%;
  transform: translate(-50%, 0);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-elevated);
  border-radius: var(--radius-md);
  padding: var(--space-md);

  .title {
    font-size: var(--font-size-xl);
  }

  .label {
    text-align: center;
  }
}

.info {
  background-color: var(--bg-elevated);
}

.warning {
  background-color: var(--color-warning);
}

.danger {
  background-color: var(--color-danger);
}

.success {
  background-color: var(--color-success);
}
</style>
