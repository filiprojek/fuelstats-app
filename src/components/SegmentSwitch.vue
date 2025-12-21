<script setup lang="ts">
import { computed } from 'vue'

export type SegmentOption<T extends string = string> = {
  value: T
  label: string
  icon?: string
  accent?: 'success' | 'warning' | 'danger' | 'primary' | 'primary-light' // optional
}

const props = defineProps<{
  modelValue: string
  options: SegmentOption[]
  ariaLabel?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const activeIndex = computed(() =>
  Math.max(
    0,
    props.options.findIndex((o) => o.value === props.modelValue),
  ),
)

const indicatorStyle = computed(() => ({
  transform: `translateX(${activeIndex.value * 100}%)`,
  width: `calc(${100 / Math.max(1, props.options.length)}% - var(--space-xs))`,
}))

function select(value: string) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="segmented" role="tablist" :aria-label="ariaLabel ?? 'Select option'"
    :style="{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }">
    <span class="indicator" :style="indicatorStyle" aria-hidden="true" />

    <button v-for="opt in options" :key="opt.value" class="btn"
      :class="[{ active: opt.value === modelValue }, opt.accent ? `accent-${opt.accent}` : null]" type="button"
      role="tab" :aria-selected="opt.value === modelValue" @click="select(opt.value)">
      <span v-if="opt.icon" class="material-symbols-outlined" aria-hidden="true">
        {{ opt.icon }}
      </span>
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.segmented {
  position: relative;
  display: grid;
  gap: var(--space-xs);
  padding: var(--space-xs);

  border-radius: var(--radius-round);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  overflow: hidden;
}

.indicator {
  position: absolute;
  inset: var(--space-xs);
  border-radius: var(--radius-round);

  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-sm);

  transform: translateX(0%);
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: transform;
  z-index: 0;
}

.btn {
  position: relative;
  z-index: 1;

  appearance: none;
  border: 0;
  background: transparent;
  color: var(--text-secondary);

  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-round);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);

  font-weight: 650;
  cursor: pointer;
  min-height: 44px;

  transition:
    color 180ms ease,
    transform 120ms ease;
}

.btn .material-symbols-outlined {
  font-size: 20px;
  color: currentColor;
  opacity: 0.85;
  transition:
    transform 180ms ease,
    opacity 180ms ease;
}

.btn.active {
  color: var(--text-primary);
}

.btn.active .material-symbols-outlined {
  opacity: 1;
  transform: translateY(-1px);
}

.btn:active {
  transform: scale(0.98);
}

.btn:hover {
  color: var(--text-primary);
}

.btn:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* accent colors only when active */
.btn.active.accent-success {
  color: var(--color-success);
}

.btn.active.accent-warning {
  color: var(--color-warning);
}

.btn.active.accent-danger {
  color: var(--color-danger);
}

.btn.active.accent-primary {
  color: var(--color-primary);
}

.btn.active.accent-primary-light {
  color: var(--color-primary-light);
}

@media (prefers-reduced-motion: reduce) {

  .indicator,
  .btn,
  .btn .material-symbols-outlined {
    transition: none !important;
  }
}
</style>
