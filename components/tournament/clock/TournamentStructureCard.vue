<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-4 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-pp-accent-gold/20 rounded-lg flex items-center justify-center">
          <IonIcon :icon="layersOutline" class="w-4 h-4 text-pp-accent-gold" />
        </div>
        <h3 class="text-lg font-bold text-pp-text-primary">{{ t('headings.blindStructure') }}</h3>
      </div>
    </div>
    
    <div ref="scrollContainer" class="space-y-4 max-h-96 overflow-y-auto scroll-smooth">
      <div v-for="(level, index) in tournamentLevels" :key="index"
           :ref="el => setCurrentLevelElement(el, index)"
           :class="[
             'flex items-center justify-between p-4 rounded-xl transition-all',
             index === currentLevelIndex 
               ? 'bg-pp-accent-gold/20 border border-pp-accent-gold' 
               : 'bg-pp-bg-primary/30 border border-pp-border/50'
           ]">
        <div class="flex items-center gap-4">
          <div :class="[
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
            index === currentLevelIndex 
              ? 'bg-pp-accent-gold text-pp-bg-primary' 
              : 'bg-pp-border text-white'
          ]">
            {{ index + 1 }}
          </div>
          <div>
            <div class="text-lg font-semibold text-pp-text-primary">
              {{ level.isBreak ? t('labels.break') : `${level.smallBlind}/${level.bigBlind}` }}
            </div>
            <div class="text-sm text-white/60">
              {{ level.isBreak ? `${level.breakDurationMinutes || level.durationMinutes} ${t('labels.minutes')}` : `${level.durationMinutes} ${t('labels.minutes')}` }}
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <span
            v-if="lateRegLevel && (index + 1) === lateRegLevel"
            class="px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-[10px] font-semibold whitespace-nowrap"
          >
            {{ t('labels.lateRegCutoff') }}
          </span>
          <div v-if="level.ante" class="text-right">
            <div class="text-sm text-white/60">{{ t('labels.ante') }}</div>
            <div class="text-lg font-medium text-pp-text-primary">{{ level.ante }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="tournamentLevels && tournamentLevels.length === 0" class="text-center py-8 text-white/60">
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