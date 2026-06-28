<script setup lang="ts">
import { computed } from 'vue'

/**
 * PpFillBar: a thin progress / fill bar (registration fill, payout share,
 * ITM rate, ...). The track is a faint hairline; the fill is tone-coloured and
 * animates its width. Pass `value` / `max`; tone picks the fill colour.
 */
type Tone = 'gold' | 'live' | 'danger' | 'success' | 'info' | 'warning' | 'neutral'

const props = withDefaults(
  defineProps<{
    value: number
    max?: number
    tone?: Tone
    /** Track thickness in px. */
    height?: number
  }>(),
  {
    max: 100,
    tone: 'gold',
    height: 6,
  },
)

const pct = computed(() => {
  if (!props.max || props.max <= 0) return 0
  return Math.min(100, Math.max(0, (props.value / props.max) * 100))
})
</script>

<template>
  <div
    class="pp-fillbar"
    :class="`pp-fillbar--${tone}`"
    :style="{ height: `${height}px` }"
    role="progressbar"
    :aria-valuenow="Math.round(pct)"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div class="pp-fillbar__fill" :style="{ width: `${pct}%` }" />
  </div>
</template>

<style scoped>
.pp-fillbar {
  --fill-rgb: var(--pp-accent-rgb);
  --fill-color: var(--color-pp-gold);
  width: 100%;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.pp-fillbar__fill {
  height: 100%;
  border-radius: inherit;
  background: var(--fill-color);
  box-shadow: 0 0 12px -2px rgba(var(--fill-rgb), 0.5);
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.pp-fillbar--gold {
  --fill-rgb: var(--pp-accent-rgb);
  --fill-color: var(--color-pp-gold);
}
.pp-fillbar--live,
.pp-fillbar--danger {
  --fill-rgb: var(--pp-danger-rgb);
  --fill-color: #f87171;
}
.pp-fillbar--success {
  --fill-rgb: var(--pp-success-rgb);
  --fill-color: #34d399;
}
.pp-fillbar--info {
  --fill-rgb: var(--pp-info-rgb);
  --fill-color: var(--color-pp-info);
}
.pp-fillbar--warning {
  --fill-rgb: var(--pp-warning-rgb);
  --fill-color: var(--color-pp-warning);
}
.pp-fillbar--neutral {
  --fill-rgb: 161, 161, 170;
  --fill-color: var(--color-pp-text-muted);
}
</style>
