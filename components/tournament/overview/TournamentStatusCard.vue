<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-semibold text-pp-text-primary">Tournament Status</h3>
      <IonIcon :icon="trophyOutline" class="w-6 h-6 text-white" />
    </div>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <span class="text-white">Status</span>
        <span class="px-3 py-1 bg-pp-accent-gold/20 text-pp-accent-gold rounded-full text-sm font-medium">
          {{ tournament?.liveStatus || 'Unknown' }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-white">Current Level</span>
        <span class="font-semibold text-white">{{ currentLevel }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-white">Level duration</span>
        <span class="font-semibold text-white">{{ `${levelDuration}:00` }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-white">Blinds</span>
        <span class="font-semibold text-white">{{ blindsText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { trophyOutline } from 'ionicons/icons'
import { useTournamentStore } from '~/stores/useTournamentStore'

const tournamentStore = useTournamentStore()

// Use store data
const tournament = computed(() => tournamentStore.tournament)
const liveState = computed(() => tournamentStore.liveState)

// Computed values
const currentLevel = computed(() => liveState.value?.currentLevel || 0)
const levelDuration = computed(() => liveState.value?.levelDurationMinutes || 0)
const blindsText = computed(() =>
  `${liveState.value?.currentSmallBlind || 0}/${liveState.value?.currentBigBlind || 0}` // Replace with GQL subscription clock when available
)
</script>