<script setup lang="ts">
export type InputType = 'text' | 'password' | 'email' | 'number' | 'date'

const props = withDefaults(
  defineProps<{
    id?: string
    type?: InputType
    placeholder?: string
    modelValue: string | number
  }>(),
  {
    type: 'text',
    placeholder: '',
    id: 'input',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div class="text-input">
    <label :for="id">{{ props.placeholder }}</label>
    <input :id="props.id" :type="props.type" :placeholder="props.placeholder" :value="props.modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
  </div>
</template>

<style lang="scss" scoped>
.text-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  text-align: left;
}

label {
  color: var(--text-primary);
  user-select: none;
}

input {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);

  background-color: var(--bg-secondary);
  color: var(--text-primary);

  border: 1px solid var(--bg-elevated);
  outline: none;

  transition:
    border-color 150ms ease,
    background-color 150ms ease,
    box-shadow 150ms ease;
}

/* Hover (desktop only, harmless on mobile) */
input:hover {
  background-color: var(--bg-elevated);
}

/* Focus */
input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
  background-color: var(--bg-primary);
}

/* Placeholder */
input::placeholder {
  color: var(--text-muted);
  opacity: 0.7;
}

/* Disabled (future-proof) */
input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
