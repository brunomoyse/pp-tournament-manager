<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-4 shadow-xl border border-pp-border" style="background-color: #24242a !important;">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-pp-accent-gold/20 rounded-lg flex items-center justify-center">
          <IonIcon :icon="timeOutline" class="w-4 h-4 text-pp-accent-gold" />
        </div>
        <h3 class="text-lg font-bold text-pp-text-primary">{{ t('headings.tournamentClock') }}</h3>
      </div>
      <div v-if="clock?.status === 'RUNNING'" class="flex items-center gap-2 px-3 py-1 bg-pp-accent-gold/10 rounded-full">
        <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span class="text-pp-accent-gold font-semibold text-xs">{{ t('status.live') }}</span>
      </div>
    </div>
    
    <!-- Main Timer Display -->
    <div class="bg-pp-bg-primary/40 rounded-xl p-4 mb-4 border border-pp-border/50">
      <div class="text-center space-y-1">
        <div :class="[
          'text-4xl font-mono font-black tracking-wider',
          clock?.status === 'RUNNING' ? 'text-pp-accent-gold' : 'text-pp-text-primary'
        ]">
          {{ formatDuration(timeRemaining) || '00:00' }}
        </div>
        <div class="text-white/50 font-medium text-xs uppercase tracking-wider">
          {{ currentStructure?.isBreak ? t('labels.breakTime') : `${t('labels.level')} ${clock?.currentLevel || 1}` }}
        </div>
      </div>
    </div>

    <!-- Blinds Information -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <!-- Current Blinds -->
      <div class="relative">
        <div class="absolute -top-2 left-4 bg-pp-bg-secondary px-2 z-10">
          <span class="text-pp-accent-gold text-xs font-bold uppercase tracking-wider">{{ t('labels.current') }}</span>
        </div>
        <div class="bg-gradient-to-br from-pp-accent-gold/20 to-pp-accent-gold/5 rounded-lg p-3 border-2 border-pp-accent-gold/50">
          <div class="text-center">
            <div class="text-lg font-black text-pp-text-primary">
              {{ currentStructure?.isBreak ? t('labels.break') : formatBlinds(currentStructure) || '0/0' }}
            </div>
            <div v-if="currentStructure?.ante && !currentStructure?.isBreak" class="text-white/60 text-xs font-medium mt-1">
              {{ t('labels.ante') }}: {{ currentStructure.ante }}
            </div>
          </div>
        </div>
      </div>

      <!-- Next Blinds -->
      <div class="relative">
        <div class="absolute -top-2 left-4 bg-pp-bg-secondary px-2 z-10">
          <span class="text-white/60 text-xs font-bold uppercase tracking-wider">{{ t('labels.next') }}</span>
        </div>
        <div class="bg-pp-bg-primary/30 rounded-lg p-3 border-2 border-pp-border/50">
          <div class="text-center">
            <div class="text-lg font-black text-white/70">
              {{ nextStructure?.isBreak ? t('labels.break') : formatBlinds(nextStructure) || '0/0' }}
            </div>
            <div v-if="nextStructure?.ante && !nextStructure?.isBreak" class="text-white/40 text-xs font-medium mt-1">
              {{ t('labels.ante') }}: {{ nextStructure.ante }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Control Buttons -->
    <div class="space-y-4">
      <!-- Main Control Button -->
      <button 
        @click="handleClockToggle"
        :class="[
          'w-full py-3 rounded-xl font-bold text-lg uppercase tracking-wide transition-all duration-300',
          'flex items-center justify-center gap-3 shadow-xl min-h-[48px]',
          'transform hover:scale-[1.01] active:scale-[0.99]',
          clock?.status === 'RUNNING'
            ? 'bg-gradient-to-r from-pp-bg-primary to-pp-border border-2 border-pp-accent-gold text-pp-accent-gold hover:shadow-pp-accent-gold/20' 
            : 'bg-gradient-to-r from-pp-accent-gold to-pp-accent-gold/80 text-pp-bg-primary hover:shadow-pp-accent-gold/40'
        ]"
      >
        <IonIcon :icon="getClockButtonIcon()" class="w-5 h-5 flex-shrink-0" />
        <span class="whitespace-nowrap">{{ getClockButtonText() }}</span>
      </button>

      <!-- Secondary Controls -->
      <div class="grid grid-cols-3 gap-2">
        <button
          @click="revertLevel"
          :disabled="isReverting"
          class="pp-action-button pp-action-button--secondary flex-col py-2 text-xs"
        >
          <IonIcon :icon="isReverting ? refreshOutline : playSkipBackOutline" :class="['w-4 h-4', isReverting && 'animate-spin']" />
          <span class="text-xs mt-0.5">{{ t('buttons.previous') }}</span>
        </button>

        <button
          @click="startClock"
          class="pp-action-button pp-action-button--secondary flex-col py-2 text-xs"
        >
          <IonIcon :icon="refreshOutline" class="w-4 h-4" />
          <span class="text-xs mt-0.5">{{ t('buttons.reset') }}</span>
        </button>

        <button
          @click="advanceLevel"
          :disabled="isAdvancing"
          class="pp-action-button pp-action-button--secondary flex-col py-2 text-xs"
        >
          <IonIcon :icon="isAdvancing ? refreshOutline : playSkipForwardOutline" :class="['w-4 h-4', isAdvancing && 'animate-spin']" />
          <span class="text-xs mt-0.5">{{ t('buttons.next') }}</span>
        </button>
      </div>
    </div>

    <!-- Connection Status -->
    <div v-if="!clock" class="mt-4 bg-pp-bg-primary/40 border border-pp-border/50 rounded-xl p-3">
      <div class="flex items-center justify-center gap-2">
        <div class="w-2 h-2 bg-white/30 rounded-full"></div>
        <span class="text-white/50 text-sm font-medium">{{ t('messages.clockDisconnected') }}</span>
      </div>
    </div>

    <!-- Start Tournament Confirmation Dialog -->
    <div v-if="showStartConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showStartConfirm = false"></div>
      <div class="relative bg-pp-bg-secondary rounded-2xl w-full max-w-sm border border-pp-border shadow-2xl p-6" style="background-color: #24242a !important;">
        <h3 class="text-lg font-bold text-pp-text-primary mb-3">{{ t('clock.startConfirmTitle') }}</h3>
        <p class="text-white/70 mb-6">{{ t('clock.startConfirmMessage') }}</p>
        <div class="flex items-center justify-end gap-3">
          <button @click="showStartConfirm = false" class="pp-action-button pp-action-button--secondary">
            {{ t('buttons.cancel') }}
          </button>
          <button @click="confirmStartTournament" :disabled="isStarting" class="pp-action-button pp-action-button--primary">
            <IonIcon v-if="isStarting" :icon="refreshOutline" class="w-4 h-4 animate-spin" />
            {{ t('clock.startConfirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { timeOutline, playOutline, pauseOutline, playSkipForwardOutline, playSkipBackOutline, refreshOutline } from 'ionicons/icons'
import {formatBlinds, formatDuration} from "~/utils";
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n()
const toast = useToast()
const route = useRoute()
const tournamentStore = useTournamentStore();
const clock = computed(() => tournamentStore.clock);
const structure = computed(() => tournamentStore.structure);

// Local timer state for countdown
const localTimeRemaining = ref<number | null>(null);
let timerInterval: ReturnType<typeof setInterval> | null = null;

// Get current structure with fallback to first level when clock hasn't started
const currentStructure = computed(() => {
  if (clock.value?.currentStructure) return clock.value.currentStructure;
  // Fallback to first level from structure
  if (structure.value?.length) {
    const level1 = structure.value.find(s => s.levelNumber === 1);
    return level1 || structure.value[0];
  }
  return null;
});

// Get next structure with fallback to second level when clock hasn't started
const nextStructure = computed(() => {
  if (clock.value?.nextStructure) return clock.value.nextStructure;
  // Fallback to second level from structure
  if (structure.value?.length) {
    const level2 = structure.value.find(s => s.levelNumber === 2);
    return level2 || structure.value[1];
  }
  return null;
});

// Calculate remaining time from levelEndTime
const calculateRemainingTime = (): number => {
  if (!clock.value?.levelEndTime) return 0;

  if (clock.value?.status === 'RUNNING') {
    // When running: remaining = levelEndTime - now
    const endTime = new Date(clock.value.levelEndTime).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((endTime - now) / 1000));
  }

  return 0;
};

// Calculate remaining time when paused (using levelEndTime and pause time from server)
const calculatePausedTime = (): number | null => {
  // When paused, server should provide timeRemainingSeconds
  // But if not, we can't calculate locally since we don't have pauseStartedAt
  if (clock.value?.timeRemainingSeconds !== undefined && clock.value?.timeRemainingSeconds !== null) {
    return clock.value.timeRemainingSeconds;
  }
  return null;
};

// Start local countdown timer
const startLocalTimer = () => {
  stopLocalTimer();
  // Initial calculation
  localTimeRemaining.value = calculateRemainingTime();
  // Update every second
  timerInterval = setInterval(() => {
    localTimeRemaining.value = calculateRemainingTime();
  }, 1000);
};

// Stop local countdown timer
const stopLocalTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

// Watch clock status to start/stop local timer
watch(() => clock.value?.status, (newStatus, oldStatus) => {
  console.log('[ClockCard] Status changed:', oldStatus, '->', newStatus)
  console.log('[ClockCard] Clock data:', clock.value)
  if (newStatus === 'RUNNING') {
    startLocalTimer();
  } else if (newStatus === 'PAUSED') {
    // When paused, stop timer but preserve last known value as fallback
    stopLocalTimer();
    // Don't set localTimeRemaining to null - preserve it as fallback
    console.log('[ClockCard] Paused - timeRemainingSeconds from server:', clock.value?.timeRemainingSeconds)
  } else {
    // When stopped, reset everything
    stopLocalTimer();
    localTimeRemaining.value = null;
  }
}, { immediate: true });

// Resync timer when levelEndTime changes (server update)
watch(() => clock.value?.levelEndTime, () => {
  if (clock.value?.status === 'RUNNING') {
    localTimeRemaining.value = calculateRemainingTime();
  }
});

// Cleanup on unmount
onUnmounted(() => {
  stopLocalTimer();
});

// Get time remaining: use local timer when running, otherwise fall back to server value or structure
const timeRemaining = computed(() => {
  const status = clock.value?.status;

  // When running, use local countdown for smooth updates
  if (status === 'RUNNING' && localTimeRemaining.value !== null) {
    return localTimeRemaining.value;
  }

  // When paused, use server-provided remaining time
  if (status === 'PAUSED') {
    const pausedTime = calculatePausedTime();
    if (pausedTime !== null) {
      return pausedTime;
    }
    // If server didn't provide time, try to preserve last known local time
    if (localTimeRemaining.value !== null) {
      return localTimeRemaining.value;
    }
  }

  // For any status, try server-provided time first
  if (clock.value?.timeRemainingSeconds !== undefined && clock.value?.timeRemainingSeconds !== null) {
    return clock.value.timeRemainingSeconds;
  }

  // Fallback to current level duration when stopped or no data
  if (currentStructure.value?.durationMinutes) {
    return currentStructure.value.durationMinutes * 60;
  }

  return 0;
});

// Clock subscription is now handled globally in the main tournament page
const selectedTournamentId = route.params.id as string

// Loading state for secondary controls
const isAdvancing = ref(false)
const isReverting = ref(false)

// Clock control functions with optimistic UI updates
const startClock = async () => {
  const response = await GqlStartTournamentClock({ tournamentId: selectedTournamentId })
  if (response?.startTournamentClock) {
    tournamentStore.setSelectedTournamentClock(response.startTournamentClock)
  }
}

const pauseClock = async () => {
  const prev = clock.value ? { ...clock.value } : null
  if (clock.value) {
    // Optimistic: immediately show paused state
    const remaining = localTimeRemaining.value ?? calculateRemainingTime()
    tournamentStore.setSelectedTournamentClock({
      ...clock.value,
      status: 'PAUSED',
      timeRemainingSeconds: remaining,
    })
  }
  try {
    const response = await GqlPauseTournamentClock({ tournamentId: selectedTournamentId })
    if (response?.pauseTournamentClock) {
      tournamentStore.setSelectedTournamentClock(response.pauseTournamentClock)
    }
  } catch (error) {
    // Revert on failure
    if (prev) tournamentStore.setSelectedTournamentClock(prev)
    console.error('Failed to pause clock:', error)
  }
}

const resumeClock = async () => {
  const prev = clock.value ? { ...clock.value } : null
  if (clock.value) {
    // Optimistic: immediately show running state
    const remaining = clock.value.timeRemainingSeconds ?? localTimeRemaining.value ?? 0
    const newEndTime = new Date(Date.now() + remaining * 1000).toISOString()
    tournamentStore.setSelectedTournamentClock({
      ...clock.value,
      status: 'RUNNING',
      levelEndTime: newEndTime,
      timeRemainingSeconds: null,
    })
  }
  try {
    const response = await GqlResumeTournamentClock({ tournamentId: selectedTournamentId })
    if (response?.resumeTournamentClock) {
      tournamentStore.setSelectedTournamentClock(response.resumeTournamentClock)
    }
  } catch (error) {
    // Revert on failure
    if (prev) tournamentStore.setSelectedTournamentClock(prev)
    console.error('Failed to resume clock:', error)
  }
}

const advanceLevel = async () => {
  isAdvancing.value = true
  try {
    const response = await GqlAdvanceTournamentLevel({ tournamentId: selectedTournamentId })
    if (response?.advanceTournamentLevel) {
      tournamentStore.setSelectedTournamentClock(response.advanceTournamentLevel)
    }
  } catch (error) {
    console.error('Failed to advance level:', error)
  } finally {
    isAdvancing.value = false
  }
}

const revertLevel = async () => {
  isReverting.value = true
  try {
    const response = await GqlRevertTournamentLevel({ tournamentId: selectedTournamentId })
    if (response?.revertTournamentLevel) {
      tournamentStore.setSelectedTournamentClock(response.revertTournamentLevel)
    }
  } catch (error) {
    console.error('Failed to revert level:', error)
  } finally {
    isReverting.value = false
  }
}

// Confirmation modal state
const showStartConfirm = ref(false)
const isStarting = ref(false)
const tournament = computed(() => tournamentStore.tournament)

// Check if tournament needs to be started first (not yet in a live state)
const tournamentNeedsStart = computed(() => {
  const status = tournament.value?.liveStatus
  return status === 'NOT_STARTED' || status === 'REGISTRATION_OPEN'
})

// Confirm start: transition tournament to LATE_REGISTRATION then start clock
const confirmStartTournament = async () => {
  if (!tournament.value) return
  isStarting.value = true
  try {
    // Transition tournament to LATE_REGISTRATION
    await GqlUpdateTournamentStatus({
      input: {
        tournamentId: tournament.value.id,
        liveStatus: 'LATE_REGISTRATION'
      }
    })
    // Refresh tournament data
    const response = await GqlGetTournament({ id: tournament.value.id })
    if (response.tournament) {
      tournamentStore.setSelectedTournament(response.tournament)
    }
    // Start the clock
    await startClock()
    showStartConfirm.value = false
  } catch (error) {
    console.error('Failed to start tournament:', error)
  } finally {
    isStarting.value = false
  }
}

// Check if tournament has tables assigned
const checkTablesAssigned = async (): Promise<boolean> => {
  try {
    const response = await GqlGetTournamentSeatingChart({ tournamentId: selectedTournamentId })
    const tables = response?.tournamentSeatingChart?.tables || []
    return tables.length > 0
  } catch {
    return false
  }
}

// Helper functions for template
const handleClockToggle = async () => {
    if (!clock.value) return

    if (clock.value.status === 'RUNNING') {
        await pauseClock()
    } else if (clock.value.status === 'PAUSED') {
        await resumeClock()
    } else {
        // If tournament hasn't started yet, check tables and show confirmation
        if (tournamentNeedsStart.value) {
            const hasTables = await checkTablesAssigned()
            if (!hasTables) {
                toast.error(t('toast.noTablesAssigned'))
                return
            }
            showStartConfirm.value = true
        } else {
            await startClock()
        }
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
    if (!clock.value) return t('buttons.start')

    switch (clock.value.status) {
        case 'RUNNING':
            return t('buttons.pause')
        case 'PAUSED':
            return t('buttons.resume')
        default:
            return t('buttons.start')
    }
}

</script>