<script setup lang="ts">
import { computed } from 'vue'
import { formatDuration } from '~/utils'

/**
 * PpCountdownRing: presentational circular countdown. The owner keeps all the
 * clock time-math (TournamentClockCard's local timer / store sync) and passes
 * the already-computed `remaining` and `total` seconds in; this component only
 * draws the ring, colours the stroke by urgency, and stacks level + time +
 * percent in the centre. Deliberately stateless so it can sit on the live page
 * and the TV display without duplicating the countdown logic.
 *
 * Urgency: gold normally, orange under 3 min, red under 1 min, info on breaks.
 */
const props = withDefaults(
  defineProps<{
    /** Seconds left in the current level. */
    remaining: number
    /** Full duration of the current level, in seconds. */
    total: number
    /** Centre label above the time (e.g. "Niveau 6" or "Pause"). */
    levelLabel?: string
    isBreak?: boolean
    /** SVG diameter is fixed; size the rendered ring via CSS on the wrapper. */
  }>(),
  {
    isBreak: false,
  },
)

const R = 92
const circumference = 2 * Math.PI * R

const progress = computed(() => {
  if (!props.total || props.total <= 0) return 0
  return Math.min(1, Math.max(0, props.remaining / props.total))
})

const dashOffset = computed(() => circumference * (1 - progress.value))

const percent = computed(() => Math.round(progress.value * 100))

const urgency = computed(() => {
  if (props.isBreak) return 'break'
  if (props.remaining <= 60) return 'red'
  if (props.remaining <= 180) return 'orange'
  return 'gold'
})

const timeLabel = computed(() => formatDuration(props.remaining) || '00:00')
</script>

<template>
  <div class="pp-ring" :class="`pp-ring--${urgency}`">
    <svg class="pp-ring__svg" viewBox="0 0 200 200" aria-hidden="true">
      <circle class="pp-ring__track" cx="100" cy="100" :r="R" fill="none" stroke-width="6" />
      <circle
        class="pp-ring__progress"
        cx="100"
        cy="100"
        :r="R"
        fill="none"
        stroke-width="6"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
      />
    </svg>

    <div class="pp-ring__content">
      <span v-if="levelLabel" class="pp-ring__level">{{ levelLabel }}</span>
      <span class="pp-ring__time">{{ timeLabel }}</span>
      <span class="pp-ring__percent">{{ percent }}%</span>
    </div>
  </div>
</template>

<style scoped>
.pp-ring {
  --ring: var(--color-pp-gold);
  --ring-rgb: var(--pp-accent-rgb);
  position: relative;
  width: 100%;
  aspect-ratio: 1;
}

.pp-ring--orange {
  --ring: var(--color-pp-warning);
  --ring-rgb: var(--pp-warning-rgb);
}
.pp-ring--red {
  --ring: #f87171;
  --ring-rgb: var(--pp-danger-rgb);
}
.pp-ring--break {
  --ring: var(--color-pp-info);
  --ring-rgb: var(--pp-info-rgb);
}

.pp-ring__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.pp-ring__track {
  stroke: rgba(255, 255, 255, 0.06);
}

.pp-ring__progress {
  stroke: var(--ring);
  filter: drop-shadow(0 0 6px rgba(var(--ring-rgb), 0.45));
  transition:
    stroke-dashoffset 1s linear,
    stroke 0.5s ease;
}

.pp-ring__content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.pp-ring__level {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-text-muted);
}

.pp-ring__time {
  font-family: var(--font-display);
  font-size: clamp(2.25rem, 6vw, 3.25rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
  color: var(--ring);
}

.pp-ring--red .pp-ring__time {
  animation: pp-ring-pulse 1.6s ease-in-out infinite;
}

.pp-ring__percent {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: var(--color-pp-text-dim);
}

@keyframes pp-ring-pulse {
  50% {
    opacity: 0.55;
  }
}
</style>
