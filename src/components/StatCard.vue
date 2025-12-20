<template>
  <div class="stat-card">
    <b class="title">{{ value }}</b>
    <p class="label">{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.stat-card {
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
</style>
