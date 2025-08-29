<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-semibold text-pp-text-primary">Tournament Status</h3>
      <IonIcon :icon="trophyOutline" class="w-6 h-6 text-white" />
    </div>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <span class="text-white">Status</span>
        <span :class="[
          'px-3 py-1 rounded-full text-sm font-medium border',
          getTournamentStatusClass(tournament?.liveStatus || 'UNKNOWN')
        ]">
          {{ getTournamentStatusLabel(tournament?.liveStatus || 'UNKNOWN') }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-white">Current Level</span>
        <span class="font-semibold text-white">{{ currentLevel }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-white">Level duration</span>
        <span class="font-semibold text-white">{{ formatTime(levelTimeRemaining) }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-white">Blinds</span>
        <span class="font-semibold text-white">{{ formatBlinds(currentStructure) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { trophyOutline } from 'ionicons/icons'
import { useTournamentStore } from '~/stores/useTournamentStore'
import {formatBlinds, formatTime} from "~/utils";
import { getTournamentStatusLabel, getTournamentStatusClass } from '~/utils/tournamentStatus'

const tournamentStore = useTournamentStore()

// Use store data
const tournament = computed(() => tournamentStore.tournament)
const clock = computed(() => tournamentStore.clock)

// Computed values
const currentLevel = computed(() => clock.value?.currentLevel || 0)
const levelTimeRemaining = computed(() => clock.value?.timeRemainingSeconds || 0)
const currentStructure = computed(() => clock.value?.currentStructure ?? undefined)
</script>