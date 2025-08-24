<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-semibold text-pp-text-primary">Players</h3>
      <IonIcon :icon="peopleOutline" class="w-6 h-6 text-white" />
    </div>
    <div class="space-y-6">
      <div class="grid grid-cols-2 gap-6">
        <div class="text-center">
          <div class="text-3xl font-bold text-pp-text-primary mb-1">{{ totalRegistered }}</div>
          <div class="text-white/60 text-sm">Registered</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-pp-text-primary mb-1">{{ remainingPlayers }}</div>
          <div class="text-white/60 text-sm">Remaining</div>
        </div>
      </div>
      
      <div class="space-y-3">
        <div class="flex justify-between items-center text-sm">
          <span class="text-white/60">Active</span>
          <span class="text-pp-text-primary font-medium">{{ remainingPlayers }}</span>
        </div>
        <div class="flex justify-between items-center text-sm">
          <span class="text-white/60">Eliminated</span>
          <span class="text-pp-text-primary font-medium">{{ totalRegistered - remainingPlayers }}</span>
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="text-white/60">Progress</span>
          <span class="text-white/60">{{ Math.round((totalRegistered - remainingPlayers) / totalRegistered * 100) || 0 }}%</span>
        </div>
        <div class="w-full bg-pp-bg-primary rounded-full h-2">
          <div 
            class="bg-pp-accent-gold h-2 rounded-full transition-all duration-300"
            :style="{ width: `${Math.round((totalRegistered - remainingPlayers) / totalRegistered * 100) || 0}%` }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { peopleOutline } from 'ionicons/icons'
import { useTournamentStore } from '~/stores/useTournamentStore'

const tournamentStore = useTournamentStore()

// Store data
const totalRegistered = computed(() => tournamentStore.registrations?.filter(r => r.status !== 'PENDING').length || 0)
const remainingPlayers = computed(() => tournamentStore.registrations?.filter(r => r.status !== 'PENDING').length || 0)
</script>