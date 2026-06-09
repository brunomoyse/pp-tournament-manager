<script setup lang="ts">
import { Motion } from 'motion-v'
import { IonIcon } from '@ionic/vue'
import { trophyOutline, peopleOutline, statsChartOutline } from 'ionicons/icons'
import { useTourStore } from '~/stores/useTourStore'
import { useI18n } from '~/composables/useI18n'
import { spring, easing, duration } from '~/composables/useMotionTokens'
import { prefersReducedMotion } from '~/utils/tourPositioning'

/**
 * TourWelcomeModal: cinematic first-login welcome. Offers the guided tour or
 * lets the user skip; either way the welcome never auto-shows again.
 */
const tourStore = useTourStore()
const { t } = useI18n()

const reduced = prefersReducedMotion()

const points = [
  { icon: trophyOutline, key: 'tour.welcome.point1' },
  { icon: peopleOutline, key: 'tour.welcome.point2' },
  { icon: statsChartOutline, key: 'tour.welcome.point3' },
]

const enter = (order: number, fromY = 14) => ({
  initial: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: fromY },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: duration.standard,
    ease: easing as unknown as number[],
    delay: reduced ? 0 : 0.15 + 0.1 * order,
  },
})
</script>

<template>
  <PpModal
    :open="tourStore.welcomeOpen"
    size="lg"
    :close-on-backdrop="false"
    @close="tourStore.dismissWelcome"
  >
    <div class="welcome-body">
      <Motion
        class="welcome-logo-wrap"
        :initial="reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }"
        :animate="{ opacity: 1, scale: 1 }"
        :transition="reduced ? { duration: 0 } : { ...spring.bouncy, delay: 0.1 }"
      >
        <div class="welcome-logo-glow" aria-hidden="true" />
        <img src="/assets/icon-no-bg.png" alt="PocketPair" class="welcome-logo" />
      </Motion>

      <Motion v-bind="enter(1)">
        <p class="welcome-eyebrow">{{ t('tour.welcome.eyebrow') }}</p>
      </Motion>

      <Motion v-bind="enter(2)">
        <h2 class="welcome-title pp-gold-text">{{ t('tour.welcome.title') }}</h2>
      </Motion>

      <Motion v-bind="enter(3)">
        <p class="welcome-subtitle">{{ t('tour.welcome.subtitle') }}</p>
      </Motion>

      <div class="welcome-points">
        <Motion
          v-for="(point, i) in points"
          :key="point.key"
          v-bind="enter(4 + i, 10)"
          class="welcome-point"
        >
          <span class="welcome-point-icon">
            <IonIcon :icon="point.icon" />
          </span>
          <span class="welcome-point-text">{{ t(point.key) }}</span>
        </Motion>
      </div>

      <Motion v-bind="enter(7)" class="welcome-actions">
        <PpButton magnetic size="lg" block @click="tourStore.acceptWelcome">
          {{ t('tour.welcome.start') }}
        </PpButton>
        <PpButton variant="ghost" size="md" block @click="tourStore.dismissWelcome">
          {{ t('tour.welcome.skip') }}
        </PpButton>
      </Motion>
    </div>
  </PpModal>
</template>

<style scoped>
.welcome-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.75rem 0.5rem 0.25rem;
}

.welcome-logo-wrap {
  position: relative;
  margin-bottom: 1.1rem;
}

.welcome-logo {
  position: relative;
  width: 4.25rem;
  height: 4.25rem;
}

.welcome-logo-glow {
  position: absolute;
  inset: -1.75rem;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(254, 231, 138, 0.22) 0%, transparent 70%);
  animation: welcome-glow 3s ease-in-out infinite;
}

@keyframes welcome-glow {
  0%,
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.12);
  }
}

@media (prefers-reduced-motion: reduce) {
  .welcome-logo-glow {
    animation: none;
  }
}

.welcome-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-pp-gold-deep);
  margin-bottom: 0.5rem;
}

.welcome-title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}

.welcome-subtitle {
  font-size: 0.95rem;
  color: var(--color-pp-text-muted);
  margin-bottom: 1.6rem;
}

.welcome-points {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
  margin-bottom: 1.75rem;
}

.welcome-point {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem 0.9rem;
  border-radius: 0.9rem;
  background-color: var(--color-pp-surface);
  border: 1px solid var(--color-pp-border);
  text-align: left;
}

.welcome-point-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border-radius: 9999px;
  background-color: rgba(254, 231, 138, 0.1);
  color: var(--color-pp-gold);
}

.welcome-point-icon ion-icon {
  width: 1.05rem;
  height: 1.05rem;
}

.welcome-point-text {
  font-size: 0.85rem;
  color: var(--color-pp-text);
}

.welcome-actions {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
}
</style>
