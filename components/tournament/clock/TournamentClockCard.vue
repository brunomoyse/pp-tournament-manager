<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-semibold text-pp-text-primary">Tournament Clock</h3>
      <div class="flex items-center gap-2">
        <div v-if="clock?.running" class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <IonIcon :icon="timeOutline" class="w-6 h-6 text-white" />
      </div>
    </div>
    
    <div class="space-y-8">
      <!-- Time Display -->
      <div class="text-center">
        <div :class="[
          'text-6xl font-mono font-bold mb-2',
          clock?.running ? 'text-red-400 animate-pulse' : 'text-pp-text-primary'
        ]">
          {{ clock?.timeRemaining || '15:00' }}
        </div>
        <div class="text-white/60">{{ clock?.isBreak ? 'Break Time' : 'Level Time' }}</div>
      </div>

      <!-- Current & Next Blinds -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-pp-bg-primary/50 rounded-xl p-4 text-center border border-pp-border">
          <div class="text-2xl font-bold text-pp-text-primary mb-1">{{ clock?.blinds || '25/50' }}</div>
          <div class="text-white/60 text-sm">Current Blinds</div>
        </div>
        <div class="bg-pp-bg-primary/30 rounded-xl p-4 text-center border border-pp-border/50">
          <div class="text-2xl font-bold text-white/80 mb-1">{{ clock?.nextBlinds || '50/100' }}</div>
          <div class="text-white/60 text-sm">Next Blinds</div>
        </div>
      </div>

      <!-- Clock Controls -->
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <button 
            @click="$emit('toggleClock')"
            :class="[
              'py-4 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
              clock?.running 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-pp-accent-gold hover:bg-pp-accent-gold/90 text-pp-bg-primary'
            ]"
            :disabled="clock?.loading"
          >
            <IonIcon :icon="clock?.running ? pauseOutline : playOutline" class="w-5 h-5" />
            {{ clock?.running ? 'Pause' : 'Start' }}
          </button>
          
          <button 
            @click="$emit('advanceLevel')"
            class="py-4 px-6 border border-pp-border text-white rounded-xl font-medium hover:bg-pp-border/20 transition-colors flex items-center justify-center gap-2"
            :disabled="clock?.loading"
          >
            <IonIcon :icon="playSkipForwardOutline" class="w-5 h-5" />
            Next Level
          </button>
        </div>

        <button 
          @click="$emit('startBreak')"
          class="w-full py-3 border border-pp-border text-white rounded-xl font-medium hover:bg-pp-border/20 transition-colors flex items-center justify-center gap-2"
          :disabled="clock?.loading"
        >
          <IonIcon :icon="cafeOutline" class="w-5 h-5" />
          Start Break
        </button>
      </div>

      <!-- Connection Status -->
      <div v-if="!clock?.connected" class="text-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <div class="text-red-400 text-sm">Clock disconnected - using local time</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { timeOutline, playOutline, pauseOutline, playSkipForwardOutline, cafeOutline } from 'ionicons/icons'

// Props for clock data
defineProps<{
  clock?: {
    timeRemaining: string
    running: boolean
    blinds: string
    nextBlinds: string
    isBreak: boolean
    connected: boolean
    loading: boolean
  }
}>()
</script>