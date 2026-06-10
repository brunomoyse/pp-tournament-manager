<script setup lang="ts">
import { computed } from 'vue'
import { Motion } from 'motion-v'
import { IonIcon } from '@ionic/vue'
import { arrowForwardOutline, arrowBackOutline, checkmarkOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { spring } from '~/composables/useMotionTokens'
import { prefersReducedMotion } from '~/utils/tourPositioning'

/**
 * TourPopover: the step card of the guided tour. Purely presentational;
 * <TourOverlay> owns positioning and passes the current step in.
 */
const props = defineProps<{
  stepId: string
  stepIndex: number
  total: number
  isLast: boolean
}>()

const emit = defineEmits<{ next: []; prev: []; skip: [] }>()

const { t } = useI18n()

const reduced = prefersReducedMotion()

const title = computed(() => t(`tour.steps.${props.stepId}.title`))
const description = computed(() => t(`tour.steps.${props.stepId}.desc`))

// Per-block entrance stagger, re-run on every step via :key on the root.
const blockMotion = (order: number) => ({
  initial: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { ...spring.gentle, delay: reduced ? 0 : 0.05 * order },
})
</script>

<template>
  <div :key="stepId" class="tour-popover pp-glass" role="document">
    <Motion v-bind="blockMotion(0)" class="popover-top">
      <span class="popover-eyebrow">
        {{ t('tour.progress', { current: stepIndex + 1, total }) }}
      </span>
      <button type="button" class="popover-skip" @click="emit('skip')">
        {{ t('tour.skipTour') }}
      </button>
    </Motion>

    <Motion v-bind="blockMotion(1)">
      <h3 class="popover-title">{{ title }}</h3>
    </Motion>

    <Motion v-bind="blockMotion(2)">
      <p class="popover-desc">{{ description }}</p>
    </Motion>

    <Motion v-bind="blockMotion(3)" class="popover-footer">
      <div class="popover-dots" aria-hidden="true">
        <span
          v-for="i in total"
          :key="i"
          :class="[
            'dot',
            i - 1 === stepIndex ? 'dot--active' : i - 1 < stepIndex ? 'dot--done' : '',
          ]"
        />
      </div>
      <div class="popover-actions">
        <PpButton v-if="stepIndex > 0" variant="ghost" size="sm" @click="emit('prev')">
          <IonIcon :icon="arrowBackOutline" class="btn-icon" />
          {{ t('tour.back') }}
        </PpButton>
        <PpButton size="sm" @click="emit('next')">
          {{ isLast ? t('tour.finish') : t('tour.next') }}
          <IonIcon :icon="isLast ? checkmarkOutline : arrowForwardOutline" class="btn-icon" />
        </PpButton>
      </div>
    </Motion>
  </div>
</template>

<style scoped>
.tour-popover {
  width: 21rem;
  max-width: calc(100vw - 2rem);
  padding: 1.25rem 1.4rem 1.2rem;
  border-radius: 1.25rem;
  border: 1px solid var(--color-pp-border-strong);
  box-shadow:
    0 0 0 1px rgba(254, 231, 138, 0.06),
    0 24px 60px -16px rgba(0, 0, 0, 0.8);
}

.popover-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.7rem;
}

.popover-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-pp-gold);
}

.popover-skip {
  font-size: 0.72rem;
  color: var(--color-pp-text-dim);
  cursor: pointer;
  transition: color 0.15s ease;
  white-space: nowrap;
}

.popover-skip:hover {
  color: var(--color-pp-text-muted);
}

.popover-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-pp-text);
  margin-bottom: 0.45rem;
}

.popover-desc {
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--color-pp-text-muted);
  margin-bottom: 1.1rem;
}

.popover-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.popover-dots {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.dot {
  width: 0.32rem;
  height: 0.32rem;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.18);
  transition:
    background-color 0.3s ease,
    transform 0.3s ease;
}

.dot--active {
  background-color: var(--color-pp-gold);
  transform: scale(1.35);
  box-shadow: 0 0 8px rgba(254, 231, 138, 0.6);
}

.dot--done {
  background-color: rgba(254, 231, 138, 0.45);
}

.popover-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.btn-icon {
  width: 0.95rem;
  height: 0.95rem;
}
</style>
