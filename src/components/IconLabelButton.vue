<template>
  <div class="icon-label-button">
    <span v-if="icon" class="material-symbols-outlined">{{ icon }}</span>

    <slot v-else name="icon" />

    <span v-if="label" class="label">
      <slot>{{ label }}</slot>
    </span>
  </div>
</template>
<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: null,
  },
})
</script>
<style scoped>
.icon-label-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
