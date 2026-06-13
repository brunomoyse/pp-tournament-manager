<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { trophyOutline } from 'ionicons/icons'
import { Motion } from 'motion-v'
import { useI18n } from '~/composables/useI18n'
import { useMotionTokens } from '~/composables/useMotionTokens'

/**
 * Celebratory moment shown once when a tournament reaches FINISHED — a gold
 * trophy flourish over the final results (Delight: mark the defining moment).
 * Champion name is optional; the full standings already render on the page.
 */
defineProps<{
  open: boolean
  tournamentTitle?: string
  championName?: string
}>()
defineEmits<{ close: [] }>()

const { t } = useI18n()
const { spring } = useMotionTokens()
</script>

<template>
  <PpModal :open="open" size="lg" @close="$emit('close')">
    <div class="celebration">
      <Motion
        :initial="{ scale: 0.6, opacity: 0 }"
        :animate="{ scale: 1, opacity: 1 }"
        :transition="spring.bouncy"
      >
        <div class="celebration__trophy">
          <IonIcon :icon="trophyOutline" class="celebration__trophy-icon" />
          <span class="celebration__spark celebration__spark--1" />
          <span class="celebration__spark celebration__spark--2" />
          <span class="celebration__spark celebration__spark--3" />
        </div>
      </Motion>

      <Motion
        :initial="{ opacity: 0, y: 12 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.15, duration: 0.5 }"
      >
        <div class="celebration__text">
          <p class="celebration__eyebrow">{{ t('celebration.eyebrow') }}</p>
          <h2 class="celebration__title">{{ t('celebration.completeTitle') }}</h2>
          <p v-if="tournamentTitle" class="celebration__subtitle">{{ tournamentTitle }}</p>

          <div v-if="championName" class="celebration__champion">
            <span class="celebration__champion-label">{{ t('celebration.champion') }}</span>
            <span class="celebration__champion-name">{{ championName }}</span>
          </div>
          <p v-else class="celebration__hint">{{ t('celebration.completeSubtitle') }}</p>
        </div>
      </Motion>
    </div>

    <template #footer>
      <PpButton class="celebration__action" @click="$emit('close')">
        {{ t('celebration.viewResults') }}
      </PpButton>
    </template>
  </PpModal>
</template>

<style scoped>
.celebration {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 0 0.5rem;
}

.celebration__trophy {
  position: relative;
  width: 6rem;
  height: 6rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
    circle at 50% 35%,
    rgba(254, 231, 138, 0.28),
    rgba(254, 231, 138, 0.06)
  );
  border: 1px solid rgba(254, 231, 138, 0.35);
  box-shadow: var(--shadow-glow);
}

.celebration__trophy-icon {
  width: 3rem;
  height: 3rem;
  color: var(--color-pp-gold);
}

.celebration__spark {
  position: absolute;
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 9999px;
  background-color: var(--color-pp-gold);
  opacity: 0.8;
}

.celebration__spark--1 {
  top: -0.2rem;
  left: 1rem;
}
.celebration__spark--2 {
  top: 0.6rem;
  right: -0.3rem;
}
.celebration__spark--3 {
  bottom: 0.2rem;
  left: -0.2rem;
}

@media (prefers-reduced-motion: no-preference) {
  .celebration__spark {
    animation: celebration-twinkle 1.6s ease-in-out infinite;
  }
  .celebration__spark--2 {
    animation-delay: 0.4s;
  }
  .celebration__spark--3 {
    animation-delay: 0.8s;
  }
}

@keyframes celebration-twinkle {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(0.7);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.15);
  }
}

.celebration__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-pp-gold-deep);
  margin-bottom: 0.5rem;
}

.celebration__title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-pp-text);
}

.celebration__subtitle {
  color: var(--color-pp-text-muted);
  margin-top: 0.25rem;
}

.celebration__hint {
  color: var(--color-pp-text-muted);
  margin-top: 0.75rem;
}

.celebration__champion {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.celebration__champion-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-pp-text-muted);
}

.celebration__champion-name {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-pp-gold);
}

.celebration__action {
  flex: 1;
  justify-content: center;
}
</style>
