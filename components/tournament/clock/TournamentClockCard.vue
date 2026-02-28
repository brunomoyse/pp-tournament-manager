<template>
  <div :class="[
    'clock-card',
    currentStructure?.isBreak ? 'clock-card--break' : '',
  ]">
    <!-- Header -->
    <div class="clock-card__header">
      <div class="clock-card__header-left">
        <h3 class="clock-card__title">{{ t('headings.tournamentClock') }}</h3>
      </div>
      <div v-if="clock?.status === 'RUNNING'" class="clock-card__live-badge">
        <div class="clock-card__live-dot pp-animate-pulse"></div>
        <span class="clock-card__live-text">{{ t('status.live') }}</span>
      </div>
      <div v-else-if="currentStructure?.isBreak && clock?.status" class="clock-card__break-badge">
        <span class="clock-card__break-text">{{ t('labels.breakTime') }}</span>
      </div>
    </div>

    <!-- Main Timer Display with Circular Progress Ring -->
    <div class="clock-card__timer-container">
      <!-- Circular SVG Progress Ring -->
      <div class="clock-card__ring">
        <svg class="clock-card__ring-svg" viewBox="0 0 200 200">
          <!-- Background track -->
          <circle cx="100" cy="100" r="92" stroke-width="4" fill="none" class="clock-card__ring-track" />
          <!-- Progress arc -->
          <circle
            cx="100" cy="100" r="92"
            :stroke="timerColor"
            stroke-width="4"
            fill="none"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="progressOffset"
            class="clock-card__ring-progress"
          />
        </svg>

        <!-- Timer content centered inside the ring -->
        <div class="clock-card__ring-content">
          <!-- Level label -->
          <div :class="[
            'clock-card__level-label',
            currentStructure?.isBreak ? 'clock-card__level-label--break' : ''
          ]">
            {{ currentStructure?.isBreak ? t('labels.breakTime') : `${t('labels.level')} ${clock?.currentLevel || 1}` }}
          </div>

          <!-- Timer -->
          <div :class="[
            'clock-card__timer-display',
            timerColorClass
          ]">
            {{ formatDuration(timeRemaining) || '00:00' }}
          </div>
        </div>
      </div>
    </div>

    <div class="clock-card__body">
      <!-- Blinds Information -->
      <div class="clock-card__blinds-grid">
        <!-- Current Blinds -->
        <div :class="[
          'clock-card__blinds-current',
          currentStructure?.isBreak ? 'clock-card__blinds-current--break' : ''
        ]">
          <div :class="[
            'clock-card__blinds-label',
            currentStructure?.isBreak ? 'clock-card__blinds-label--break' : ''
          ]">
            {{ t('labels.current') }}
          </div>
          <div :class="[
            'clock-card__blinds-value',
            currentStructure?.isBreak ? 'clock-card__blinds-value--break' : ''
          ]">
            {{ currentStructure?.isBreak ? t('labels.break') : formatBlinds(currentStructure) || '0/0' }}
          </div>
          <div v-if="currentStructure?.ante && !currentStructure?.isBreak" class="clock-card__ante">
            {{ t('labels.ante') }}: {{ currentStructure.ante }}
          </div>
        </div>

        <!-- Next Blinds -->
        <div class="clock-card__blinds-next">
          <div class="clock-card__blinds-label clock-card__blinds-label--next">{{ t('labels.next') }}</div>
          <div class="clock-card__blinds-value clock-card__blinds-value--next">
            {{ nextStructure?.isBreak ? t('labels.break') : formatBlinds(nextStructure) || '0/0' }}
          </div>
          <div v-if="nextStructure?.ante && !nextStructure?.isBreak" class="clock-card__ante clock-card__ante--next">
            {{ t('labels.ante') }}: {{ nextStructure.ante }}
          </div>
        </div>
      </div>

      <!-- Control Buttons -->
      <div class="clock-card__controls">
        <!-- Main Control Button -->
        <button
          @click="handleClockToggle"
          :class="[
            'clock-card__main-button',
            clock?.status === 'RUNNING'
              ? 'clock-card__main-button--running'
              : 'clock-card__main-button--stopped'
          ]"
        >
          <IonIcon :icon="getClockButtonIcon()" class="clock-card__main-button-icon" />
          <span class="clock-card__main-button-text">{{ getClockButtonText() }}</span>
        </button>

        <!-- Secondary Controls -->
        <div class="clock-card__secondary-controls">
          <button
            @click="revertLevel"
            :disabled="isReverting"
            class="pp-action-button pp-action-button--secondary clock-card__secondary-button"
          >
            <IonIcon :icon="isReverting ? refreshOutline : playSkipBackOutline" :class="['clock-card__secondary-icon', isReverting && 'pp-animate-spin']" />
            <span class="clock-card__secondary-label">{{ t('buttons.previous') }}</span>
          </button>

          <button
            @click="startClock"
            class="pp-action-button pp-action-button--secondary clock-card__secondary-button"
          >
            <IonIcon :icon="refreshOutline" class="clock-card__secondary-icon" />
            <span class="clock-card__secondary-label">{{ t('buttons.reset') }}</span>
          </button>

          <button
            @click="advanceLevel"
            :disabled="isAdvancing"
            class="pp-action-button pp-action-button--secondary clock-card__secondary-button"
          >
            <IonIcon :icon="isAdvancing ? refreshOutline : playSkipForwardOutline" :class="['clock-card__secondary-icon', isAdvancing && 'pp-animate-spin']" />
            <span class="clock-card__secondary-label">{{ t('buttons.next') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Connection Status -->
    <div v-if="!clock" class="clock-card__disconnected">
      <div class="clock-card__disconnected-inner">
        <div class="clock-card__disconnected-dot"></div>
        <span class="clock-card__disconnected-text">{{ t('messages.clockDisconnected') }}</span>
      </div>
    </div>

    <!-- Start Tournament Confirmation Dialog -->
    <div v-if="showStartConfirm" class="pp-modal-overlay">
      <div class="pp-modal-backdrop" @click="showStartConfirm = false"></div>
      <div class="pp-modal-content pp-modal-content--sm clock-card__confirm-dialog">
        <h3 class="clock-card__confirm-title">{{ t('clock.startConfirmTitle') }}</h3>
        <p class="clock-card__confirm-message">{{ t('clock.startConfirmMessage') }}</p>
        <div class="clock-card__confirm-actions">
          <button @click="showStartConfirm = false" class="pp-action-button pp-action-button--secondary">
            {{ t('buttons.cancel') }}
          </button>
          <button @click="confirmStartTournament" :disabled="isStarting" class="pp-action-button pp-action-button--primary">
            <IonIcon v-if="isStarting" :icon="refreshOutline" class="clock-card__secondary-icon pp-animate-spin" />
            {{ t('clock.startConfirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { playOutline, pauseOutline, playSkipForwardOutline, playSkipBackOutline, refreshOutline } from 'ionicons/icons'
import {formatBlinds, formatDuration} from "~/utils";
import { useI18n } from '~/composables/useI18n'
import { TournamentLiveStatus } from '#gql/default'
import type { TournamentClock } from '~/types/clock'

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

// Progress ring computed properties
const circumference = computed(() => {
  // Circle with r=92 (matches SVG)
  return 2 * Math.PI * 92
})

const progressOffset = computed(() => {
  const totalDuration = (currentStructure.value?.durationMinutes || 0) * 60
  if (totalDuration <= 0) return 0
  const progress = Math.min(timeRemaining.value / totalDuration, 1)
  return circumference.value * (1 - progress)
})

const timerColor = computed(() => {
  if (currentStructure.value?.isBreak) return '#c084fc' // purple-400
  const remaining = timeRemaining.value
  if (remaining <= 30) return '#ef4444'  // red-500
  if (remaining <= 120) return '#eab308' // yellow-500
  return '#fee78a' // accent gold
})

const timerColorClass = computed(() => {
  if (currentStructure.value?.isBreak) return 'timer-color--purple'
  const remaining = timeRemaining.value
  if (remaining <= 30) return 'timer-color--red timer-pulse'
  if (remaining <= 120) return 'timer-color--yellow'
  return 'timer-color--white'
})

// Clock subscription is now handled globally in the main tournament page
const selectedTournamentId = route.params.id as string

// Loading state for secondary controls
const isAdvancing = ref(false)
const isReverting = ref(false)

// Clock control functions with optimistic UI updates
const startClock = async () => {
  const response = await GqlStartTournamentClock({ tournamentId: selectedTournamentId })
  if (response?.startTournamentClock) {
    tournamentStore.setSelectedTournamentClock(response.startTournamentClock as TournamentClock)
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
      tournamentStore.setSelectedTournamentClock(response.pauseTournamentClock as TournamentClock)
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
      tournamentStore.setSelectedTournamentClock(response.resumeTournamentClock as TournamentClock)
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
      tournamentStore.setSelectedTournamentClock(response.advanceTournamentLevel as TournamentClock)
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
      tournamentStore.setSelectedTournamentClock(response.revertTournamentLevel as TournamentClock)
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
        liveStatus: TournamentLiveStatus.LATE_REGISTRATION
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

<style scoped>
.clock-card {
  background-color: var(--pp-bg-secondary);
  border-radius: 1rem;
  box-shadow: var(--pp-shadow-xl);
  border: 1px solid var(--pp-border);
  transition: all 0.5s ease;
}

.clock-card--break {
  border-color: rgba(168, 85, 247, 0.4);
}

/* Header */
.clock-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.25rem 0.5rem;
}

.clock-card__header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.clock-card__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--pp-text-primary);
}

.clock-card__live-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background-color: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 9999px;
}

.clock-card__live-dot {
  width: 0.5rem;
  height: 0.5rem;
  background-color: var(--pp-red-500);
  border-radius: 9999px;
}

.clock-card__live-text {
  color: var(--pp-red-400);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.clock-card__break-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background-color: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 9999px;
}

.clock-card__break-text {
  color: var(--pp-purple-400);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Timer Display */
.clock-card__timer-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.25rem;
}

.clock-card__ring {
  position: relative;
  width: 11rem;
  height: 11rem;
}

@media (min-width: 640px) {
  .clock-card__ring {
    width: 13rem;
    height: 13rem;
  }
}

@media (min-width: 768px) {
  .clock-card__ring {
    width: 14rem;
    height: 14rem;
  }
}

@media (min-width: 1024px) {
  .clock-card__ring {
    width: 15rem;
    height: 15rem;
  }
}

.clock-card__ring-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.clock-card__ring-track {
  stroke: rgba(255, 255, 255, 0.06);
}

.clock-card__ring-progress {
  transition: all 1s linear;
}

.clock-card__ring-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.clock-card__level-label {
  font-weight: 500;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 0.25rem;
  color: rgba(255, 255, 255, 0.5);
}

.clock-card__level-label--break {
  color: var(--pp-purple-400);
}

.clock-card__timer-display {
  font-size: 3rem;
  font-family: var(--pp-font-mono);
  font-weight: 900;
  letter-spacing: 0.05em;
  line-height: 1;
  transition: color 0.5s ease;
}

/* Timer color classes */
.timer-color--purple {
  color: var(--pp-purple-400);
}

.timer-color--red {
  color: var(--pp-red-500);
}

.timer-pulse {
  animation: pp-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.timer-color--yellow {
  color: var(--pp-yellow-500);
}

.timer-color--white {
  color: #ffffff;
}

/* Body */
.clock-card__body {
  padding: 0 1.25rem 1.25rem;
}

.clock-card__body > * + * {
  margin-top: 1rem;
}

/* Blinds Grid */
.clock-card__blinds-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.clock-card__blinds-current {
  border-radius: 0.75rem;
  padding: 0.75rem;
  border: 2px solid rgba(254, 231, 138, 0.4);
  background: linear-gradient(to bottom right, rgba(254, 231, 138, 0.15), rgba(254, 231, 138, 0.05));
  transition: all 0.5s ease;
}

.clock-card__blinds-current--break {
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.3);
}

.clock-card__blinds-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
  color: var(--pp-accent-gold);
}

.clock-card__blinds-label--break {
  color: var(--pp-purple-400);
}

.clock-card__blinds-label--next {
  color: rgba(255, 255, 255, 0.4);
}

.clock-card__blinds-value {
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--pp-accent-gold);
}

.clock-card__blinds-value--break {
  color: #d8b4fe;
}

.clock-card__blinds-value--next {
  color: rgba(255, 255, 255, 0.6);
}

.clock-card__blinds-next {
  border-radius: 0.75rem;
  padding: 0.75rem;
  border: 2px solid rgba(84, 84, 95, 0.3);
  background-color: rgba(24, 24, 26, 0.2);
}

.clock-card__ante {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.125rem;
}

.clock-card__ante--next {
  color: rgba(255, 255, 255, 0.3);
}

/* Controls */
.clock-card__controls > * + * {
  margin-top: 0.75rem;
}

.clock-card__main-button {
  width: 100%;
  padding: 0.875rem;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 52px;
  cursor: pointer;
}

.clock-card__main-button:active {
  transform: scale(0.98);
}

.clock-card__main-button--running {
  background-color: var(--pp-bg-primary);
  border: 2px solid rgba(254, 231, 138, 0.6);
  color: var(--pp-accent-gold);
  box-shadow: 0 0 20px rgba(254, 231, 138, 0.15);
}

.clock-card__main-button--stopped {
  background: linear-gradient(to right, var(--pp-accent-gold), rgba(254, 231, 138, 0.8));
  color: var(--pp-bg-primary);
  box-shadow: 0 4px 20px rgba(254, 231, 138, 0.3);
}

@media (hover: hover) {
  .clock-card__main-button--running:hover {
    box-shadow: 0 0 30px rgba(254, 231, 138, 0.25);
  }

  .clock-card__main-button--stopped:hover {
    box-shadow: 0 4px 30px rgba(254, 231, 138, 0.45);
  }
}

.clock-card__main-button-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.clock-card__main-button-text {
  white-space: nowrap;
}

.clock-card__secondary-controls {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.clock-card__secondary-button {
  display: flex;
  flex-direction: column;
  padding: 0.625rem 0;
  min-height: 44px;
  font-size: 0.75rem;
}

.clock-card__secondary-icon {
  width: 1rem;
  height: 1rem;
}

.clock-card__secondary-label {
  font-size: 10px;
  margin-top: 0.125rem;
  font-weight: 500;
}

/* Connection Status */
.clock-card__disconnected {
  margin: 0 1.25rem 1.25rem;
  background-color: rgba(24, 24, 26, 0.4);
  border: 1px solid rgba(84, 84, 95, 0.5);
  border-radius: 0.75rem;
  padding: 0.75rem;
}

.clock-card__disconnected-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.clock-card__disconnected-dot {
  width: 0.5rem;
  height: 0.5rem;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
}

.clock-card__disconnected-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
  font-weight: 500;
}

/* Confirmation Dialog */
.clock-card__confirm-dialog {
  padding: 1.5rem;
}

.clock-card__confirm-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--pp-text-primary);
  margin-bottom: 0.75rem;
}

.clock-card__confirm-message {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
}

.clock-card__confirm-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
