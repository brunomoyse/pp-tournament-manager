<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-6 shadow-xl border border-pp-border" style="background-color: #24242a !important;">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-pp-accent-gold/20 rounded-xl flex items-center justify-center">
          <IonIcon :icon="timeOutline" class="w-6 h-6 text-pp-accent-gold" />
        </div>
        <h3 class="text-xl font-bold text-pp-text-primary">Tournament Clock</h3>
      </div>
      <div v-if="clock?.status === 'RUNNING'" class="flex items-center gap-2 px-3 py-1 bg-pp-accent-gold/10 rounded-full">
        <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span class="text-pp-accent-gold font-semibold text-xs">LIVE</span>
      </div>
    </div>
    
    <!-- Main Timer Display -->
    <div class="bg-pp-bg-primary/40 rounded-2xl p-6 mb-5 border border-pp-border/50">
      <div class="text-center space-y-2">
        <div :class="[
          'text-6xl font-mono font-black tracking-wider',
          clock?.status === 'RUNNING' ? 'text-pp-accent-gold' : 'text-pp-text-primary'
        ]">
          {{ formatTime(clock?.timeRemainingSeconds) || '00:00' }}
        </div>
        <div class="text-white/50 font-medium text-sm uppercase tracking-wider">
          {{ clock?.currentStructure?.isBreak ? 'Break Time' : `Level ${clock?.currentLevel || 1}` }}
        </div>
      </div>
    </div>

    <!-- Blinds Information -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <!-- Current Blinds -->
      <div class="relative">
        <div class="absolute -top-2 left-4 bg-pp-bg-secondary px-2 z-10">
          <span class="text-pp-accent-gold text-xs font-bold uppercase tracking-wider">Current</span>
        </div>
        <div class="bg-gradient-to-br from-pp-accent-gold/20 to-pp-accent-gold/5 rounded-xl p-4 border-2 border-pp-accent-gold/50">
          <div class="text-center">
            <div class="text-2xl font-black text-pp-text-primary">
              {{ clock?.currentStructure?.isBreak ? 'BREAK' : formatBlinds(clock?.currentStructure) || '0/0' }}
            </div>
            <div v-if="clock?.currentStructure?.ante && !clock?.currentStructure?.isBreak" class="text-white/60 text-xs font-medium mt-1">
              Ante: {{ clock.currentStructure.ante }}
            </div>
          </div>
        </div>
      </div>

      <!-- Next Blinds -->
      <div class="relative">
        <div class="absolute -top-2 left-4 bg-pp-bg-secondary px-2 z-10">
          <span class="text-white/60 text-xs font-bold uppercase tracking-wider">Next</span>
        </div>
        <div class="bg-pp-bg-primary/30 rounded-xl p-4 border-2 border-pp-border/50">
          <div class="text-center">
            <div class="text-2xl font-black text-white/70">
              {{ clock?.nextStructure?.isBreak ? 'BREAK' : formatBlinds(clock?.nextStructure) || '0/0' }}
            </div>
            <div v-if="clock?.nextStructure?.ante && !clock?.nextStructure?.isBreak" class="text-white/40 text-xs font-medium mt-1">
              Ante: {{ clock.nextStructure.ante }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Control Buttons -->
    <div class="space-y-6">
      <!-- Main Control Button -->
      <button 
        @click="handleClockToggle"
        :class="[
          'w-full py-5 rounded-2xl font-bold text-xl uppercase tracking-wide transition-all duration-300',
          'flex items-center justify-center gap-4 shadow-xl min-h-[64px]',
          'transform hover:scale-[1.01] active:scale-[0.99]',
          clock?.status === 'RUNNING'
            ? 'bg-gradient-to-r from-pp-bg-primary to-pp-border border-2 border-pp-accent-gold text-pp-accent-gold hover:shadow-pp-accent-gold/20' 
            : 'bg-gradient-to-r from-pp-accent-gold to-pp-accent-gold/80 text-pp-bg-primary hover:shadow-pp-accent-gold/40'
        ]"
      >
        <IonIcon :icon="getClockButtonIcon()" class="w-7 h-7 flex-shrink-0" />
        <span class="whitespace-nowrap">{{ getClockButtonText() }}</span>
      </button>

      <!-- Secondary Controls -->
      <div class="grid grid-cols-3 gap-3">
        <button 
          @click="revertLevel"
          class="pp-action-button pp-action-button--secondary flex-col py-3"
        >
          <IonIcon :icon="playSkipBackOutline" class="w-5 h-5" />
          <span class="text-xs mt-1">Previous</span>
        </button>
        
        <button 
          @click="startClock"
          class="pp-action-button pp-action-button--secondary flex-col py-3"
        >
          <IonIcon :icon="refreshOutline" class="w-5 h-5" />
          <span class="text-xs mt-1">Reset</span>
        </button>
        
        <button 
          @click="advanceLevel"
          class="pp-action-button pp-action-button--secondary flex-col py-3"
        >
          <IonIcon :icon="playSkipForwardOutline" class="w-5 h-5" />
          <span class="text-xs mt-1">Next</span>
        </button>
      </div>
    </div>

    <!-- Connection Status -->
    <div v-if="!clock" class="mt-4 bg-pp-bg-primary/40 border border-pp-border/50 rounded-xl p-3">
      <div class="flex items-center justify-center gap-2">
        <div class="w-2 h-2 bg-white/30 rounded-full"></div>
        <span class="text-white/50 text-sm font-medium">Clock Disconnected</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { timeOutline, playOutline, pauseOutline, playSkipForwardOutline, playSkipBackOutline, refreshOutline } from 'ionicons/icons'
import {formatBlinds, formatTime} from "~/utils";

const route = useRoute()
const tournamentStore = useTournamentStore();
const clock = computed(() => tournamentStore.clock);

// Clock subscription is now handled globally in the main tournament page
const selectedTournamentId = route.params.id as string

// Clock control functions
const startClock = async () => await GqlStartTournamentClock({ tournamentId: selectedTournamentId })

const pauseClock = async () => await GqlPauseTournamentClock({ tournamentId: selectedTournamentId })

const resumeClock = async () => await GqlResumeTournamentClock({ tournamentId: selectedTournamentId })

const advanceLevel = async () => await GqlAdvanceTournamentLevel({ tournamentId: selectedTournamentId })

const revertLevel = async () => await GqlRevertTournamentLevel({ tournamentId: selectedTournamentId })

// Helper functions for template
const handleClockToggle = async () => {
    if (!clock.value) return
    
    if (clock.value.status === 'RUNNING') {
        await pauseClock()
    } else if (clock.value.status === 'PAUSED') {
        await resumeClock()
    } else {
        await startClock()
    }
}

const getClockButtonIcon = () => {
    if (!clock.value) return playOutline
    
    switch (clock.value.status) {
        case 'RUNNING':
            return pauseOutline
        case 'PAUSED':
            return playOutline
        default:
            return playOutline
    }
}

const getClockButtonText = () => {
    if (!clock.value) return 'Start'
    
    switch (clock.value.status) {
        case 'RUNNING':
            return 'Pause'
        case 'PAUSED':
            return 'Resume'
        default:
            return 'Start'
    }
}

</script>