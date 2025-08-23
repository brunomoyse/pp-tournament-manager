<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-semibold text-pp-text-primary">Blind Structure</h3>
      <IonIcon :icon="layersOutline" class="w-6 h-6 text-white" />
    </div>
    
    <div class="space-y-4 max-h-96 overflow-y-auto">
      <div v-for="(level, index) in blindLevels" :key="index" 
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
              {{ level.smallBlind }}/{{ level.bigBlind }}
            </div>
            <div class="text-sm text-white/60">
              {{ level.duration }} minutes
            </div>
          </div>
        </div>
        
        <div v-if="level.ante" class="text-right">
          <div class="text-sm text-white/60">Ante</div>
          <div class="text-lg font-medium text-pp-text-primary">{{ level.ante }}</div>
        </div>
      </div>
    </div>

    <div v-if="blindLevels.length === 0" class="text-center py-8 text-white/60">
      No blind structure available
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { layersOutline } from 'ionicons/icons'
import { useTournamentStore } from '~/stores/useTournamentStore'

const tournamentStore = useTournamentStore()

const props = defineProps<{
  currentLevelIndex?: number
}>()

interface BlindLevel {
  smallBlind: number
  bigBlind: number
  duration: number
  ante?: number
}

const blindLevels = computed(() => {
  const tournament = tournamentStore.tournamentData
  if (!tournament?.blindStructure) return []
  
  return tournament.blindStructure.levels.map((level: any) => ({
    smallBlind: level.smallBlind,
    bigBlind: level.bigBlind,
    duration: level.duration,
    ante: level.ante
  }))
})

const currentLevelIndex = computed(() => {
  return props.currentLevelIndex ?? tournamentStore.liveState?.currentLevel - 1 ?? 0
})
</script>