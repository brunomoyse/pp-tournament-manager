<template>
  <div class="structure-card">
    <div class="structure-header">
      <div class="structure-header-left">
        <div class="structure-icon-wrapper">
          <IonIcon :icon="layersOutline" class="structure-icon" />
        </div>
        <h3 class="structure-title">{{ t('headings.blindStructure') }}</h3>
      </div>
    </div>

    <div ref="scrollContainer" class="structure-levels">
      <div v-for="(level, index) in tournamentLevels" :key="index"
           :ref="el => setCurrentLevelElement(el, index)"
           :class="[
             'structure-level',
             index === currentLevelIndex ? 'structure-level--active' : 'structure-level--inactive'
           ]">
        <div class="structure-level-left">
          <div :class="[
            'structure-level-number',
            index === currentLevelIndex ? 'structure-level-number--active' : 'structure-level-number--inactive'
          ]">
            {{ index + 1 }}
          </div>
          <div>
            <div class="structure-level-blinds">
              {{ level.isBreak ? t('labels.break') : `${level.smallBlind}/${level.bigBlind}` }}
            </div>
            <div class="structure-level-duration">
              {{ level.isBreak ? `${level.breakDurationMinutes || level.durationMinutes} ${t('labels.minutes')}` : `${level.durationMinutes} ${t('labels.minutes')}` }}
            </div>
          </div>
        </div>

        <div class="structure-level-right">
          <span
            v-if="lateRegLevel && (index + 1) === lateRegLevel"
            class="structure-late-reg-badge"
          >
            {{ t('labels.lateRegCutoff') }}
          </span>
          <div v-if="level.ante" class="structure-ante">
            <div class="structure-ante-label">{{ t('labels.ante') }}</div>
            <div class="structure-ante-value">{{ level.ante }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="tournamentLevels && tournamentLevels.length === 0" class="structure-empty">
      {{ t('messages.noBlindStructure') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { layersOutline } from 'ionicons/icons'
import { useTournamentStore } from '~/stores/useTournamentStore'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n()
import type { ComponentPublicInstance } from 'vue'

const tournamentStore = useTournamentStore()
const tournamentLevels = computed(() => tournamentStore.structure)
const lateRegLevel = computed(() => tournamentStore.tournament?.lateRegistrationLevel ?? null)

const scrollContainer = ref<HTMLElement>()
const currentLevelElement = ref<HTMLElement>()

const currentLevelIndex = computed(() => {
    if (tournamentStore.clock?.currentLevel) {
        return tournamentStore.clock.currentLevel - 1
    }
    return 0
})

// Function to set the current level element ref
const setCurrentLevelElement = (el: Element | ComponentPublicInstance | null, index: number) => {
    if (el && index === currentLevelIndex.value) {
        currentLevelElement.value = el as HTMLElement
    }
}

// Auto-scroll to current level when it changes
const scrollToCurrentLevel = () => {
    if (scrollContainer.value && currentLevelElement.value) {
        const container = scrollContainer.value
        const element = currentLevelElement.value

        // Calculate the optimal scroll position to keep current level near the top
        const elementTop = element.offsetTop - container.offsetTop

        // Smooth scroll to position the current level near the top with some padding
        container.scrollTo({
            top: Math.max(0, elementTop - 20), // 20px offset from top, never negative
            behavior: 'smooth'
        })
    }
}

// Watch for changes in current level and scroll accordingly
watch(currentLevelIndex, () => {
    // Use nextTick to ensure DOM has updated before scrolling
    nextTick(() => {
        scrollToCurrentLevel()
    })
}, { flush: 'post' })

// Also scroll on mount if there's already a current level
onMounted(() => {
    nextTick(() => {
        scrollToCurrentLevel()
    })
})
</script>

<style scoped>
.structure-card {
  background-color: var(--pp-bg-secondary);
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: var(--pp-shadow-sm);
  border: 1px solid var(--pp-border);
}

.structure-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.structure-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.structure-icon-wrapper {
  width: 2rem;
  height: 2rem;
  background-color: rgba(254, 231, 138, 0.2);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.structure-icon {
  width: 1rem;
  height: 1rem;
  color: var(--pp-accent-gold);
}

.structure-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--pp-text-primary);
}

.structure-levels {
  max-height: 24rem;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.structure-levels > * + * {
  margin-top: 1rem;
}

.structure-level {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-radius: 0.75rem;
  transition: all 150ms;
}

.structure-level--active {
  background-color: rgba(254, 231, 138, 0.2);
  border: 1px solid var(--pp-accent-gold);
}

.structure-level--inactive {
  background-color: rgba(24, 24, 26, 0.3);
  border: 1px solid rgba(84, 84, 95, 0.5);
}

.structure-level-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.structure-level-number {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
}

.structure-level-number--active {
  background-color: var(--pp-accent-gold);
  color: var(--pp-bg-primary);
}

.structure-level-number--inactive {
  background-color: var(--pp-border);
  color: #ffffff;
}

.structure-level-blinds {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--pp-text-primary);
}

.structure-level-duration {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.structure-level-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.structure-late-reg-badge {
  padding: 0.125rem 0.5rem;
  background-color: rgba(249, 115, 22, 0.2);
  color: var(--pp-orange-400);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.structure-ante {
  text-align: right;
}

.structure-ante-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.structure-ante-value {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--pp-text-primary);
}

.structure-empty {
  text-align: center;
  padding: 2rem 0;
  color: rgba(255, 255, 255, 0.6);
}
</style>
