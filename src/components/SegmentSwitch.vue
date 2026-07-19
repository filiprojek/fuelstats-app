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

const indicatorStyle = computed(() => {
  const count = Math.max(1, props.options.length)
  const index = activeIndex.value
  return {
    left: `calc(${(index * 100) / count}% + var(--space-xs))`,
    width: `calc(${100 / count}% - (var(--space-xs) * 2))`,
  }
})

function select(value: string) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div
    class="segmented"
    role="tablist"
    :aria-label="ariaLabel ?? 'Select option'"
    :style="{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }"
  >
    <span class="indicator" :style="indicatorStyle" aria-hidden="true" />

    <button
      v-for="opt in options"
      :key="opt.value"
      class="btn"
      :class="[{ active: opt.value === modelValue }, opt.accent ? `accent-${opt.accent}` : null]"
      type="button"
      role="tab"
      :aria-selected="opt.value === modelValue"
      :title="opt.label"
      @click="select(opt.value)"
    >
      <span v-if="opt.icon" class="material-symbols-outlined" aria-hidden="true">
        {{ opt.icon }}
      </span>
      <span class="label-text">{{ opt.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.segmented {
  position: relative;
  display: grid;
  gap: var(--space-xs);
  padding: var(--space-xs);
  width: 100%;

  border-radius: var(--radius-round);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  overflow: hidden;
}

.indicator {
  position: absolute;
  top: var(--space-xs);
  bottom: var(--space-xs);
  border-radius: var(--radius-round);

  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-sm);

  transition:
    left 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
    width 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: left, width;
  z-index: 0;
}

.btn {
  position: relative;
  z-index: 1;

  appearance: none;
  border: 0;
  background: transparent;
  color: var(--text-secondary);

  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-round);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);

  font-weight: 650;
  font-size: 0.9rem;
  cursor: pointer;
  min-height: 42px;
  white-space: nowrap;

  transition:
    color 180ms ease,
    transform 120ms ease;
}

.label-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  transform: scale(0.97);
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

/* Responsive adjustments for Mobile screens */
@media (max-width: 640px) {
  .segmented {
    padding: 3px;
    border-radius: 12px;
  }

  .indicator {
    top: 3px;
    bottom: 3px;
    border-radius: 9px;
  }

  .btn {
    padding: 6px 2px;
    min-height: 40px;
    font-size: 0.75rem;
    gap: 2px;
    flex-direction: column;
    border-radius: 9px;
  }

  .btn .material-symbols-outlined {
    font-size: 18px;
  }

  .label-text {
    font-size: 0.68rem;
    line-height: 1;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
}

@media (max-width: 380px) {
  .btn {
    padding: 4px 1px;
    min-height: 38px;
  }

  .btn .material-symbols-outlined {
    font-size: 16px;
  }

  .label-text {
    font-size: 0.62rem;
    letter-spacing: -0.02em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .indicator,
  .btn,
  .btn .material-symbols-outlined {
    transition: none !important;
  }
}
</style>
