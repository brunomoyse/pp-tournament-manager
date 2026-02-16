<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-semibold text-pp-text-primary">{{ t('statusWorkflow.title') }}</h3>
      <IonIcon :icon="trophyOutline" class="w-6 h-6 text-white" />
    </div>

    <!-- Status Stepper -->
    <div ref="stepperContainer" class="flex items-center gap-1 mb-8 overflow-x-auto flex-nowrap pb-2">
      <template v-for="(status, index) in statusFlow" :key="status">
        <div
          :ref="el => { if (currentStatusIndex === index) currentStatusEl = el as HTMLElement }"
          :class="[
            'flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
            currentStatusIndex === index
              ? getTournamentStatusClass(status)
              : currentStatusIndex > index
                ? 'bg-green-500/10 text-green-400/60 border-green-500/20'
                : 'bg-white/5 text-white/30 border-white/10'
          ]"
        >
          {{ getTournamentStatusLabel(status, t) }}
        </div>
        <IonIcon
          v-if="index < statusFlow.length - 1"
          :icon="chevronForwardOutline"
          :class="[
            'w-3 h-3 flex-shrink-0',
            currentStatusIndex > index ? 'text-green-400/40' : 'text-white/20'
          ]"
        />
      </template>
    </div>

    <!-- Current Status Info -->
    <div class="space-y-6 mb-8">
      <div class="flex items-center justify-between">
        <span class="text-white">{{ t('labels.status') }}</span>
        <span :class="[
          'px-3 py-1 rounded-full text-sm font-medium border',
          getTournamentStatusClass(tournament?.liveStatus || 'UNKNOWN')
        ]">
          {{ getTournamentStatusLabel(tournament?.liveStatus || 'UNKNOWN', t) }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-white">{{ t('labels.currentLevel') }}</span>
        <span class="font-semibold text-white">{{ displayLevel }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-white">{{ t('labels.levelDuration') }}</span>
        <span class="font-semibold text-white">{{ displayDuration }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-white">{{ t('labels.blinds') }}</span>
        <span class="font-semibold text-white">{{ displayBlinds }}</span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div v-if="availableActions.length > 0" class="flex flex-wrap gap-2">
      <button
        v-for="action in availableActions"
        :key="action.targetStatus || action.key"
        @click="action.handler()"
        :disabled="isUpdating"
        :class="[
          'w-full pp-action-button text-sm',
          action.variant === 'primary' ? 'pp-action-button--primary' :
          action.variant === 'success' ? 'pp-action-button--success' :
          action.variant === 'warning' ? 'pp-action-button--warning' :
          action.variant === 'danger' ? 'pp-action-button--danger' :
          'pp-action-button--secondary'
        ]"
      >
        <IonIcon v-if="isUpdating && action.targetStatus" :icon="refreshOutline" class="w-4 h-4 animate-spin" />
        {{ action.label }}
      </button>
    </div>

    <!-- Confirmation Dialog -->
    <div v-if="showConfirmDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showConfirmDialog = false"></div>
      <div class="relative bg-pp-bg-secondary rounded-2xl w-full max-w-sm border border-pp-border shadow-2xl p-6" style="background-color: #24242a !important;">
        <h3 class="text-lg font-bold text-pp-text-primary mb-3">{{ t('statusWorkflow.confirmTitle') }}</h3>
        <p class="text-white/70 mb-6">
          {{ t('statusWorkflow.confirmMessage', { status: pendingAction?.label || '' }) }}
        </p>
        <div class="flex items-center justify-end gap-3">
          <button @click="showConfirmDialog = false" class="pp-action-button pp-action-button--secondary">
            {{ t('buttons.cancel') }}
          </button>
          <button @click="executeStatusChange" :disabled="isUpdating" class="pp-action-button pp-action-button--primary">
            <IonIcon v-if="isUpdating" :icon="refreshOutline" class="w-4 h-4 animate-spin" />
            {{ t('statusWorkflow.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { trophyOutline, chevronForwardOutline, refreshOutline } from 'ionicons/icons'
import { useTournamentStore } from '~/stores/useTournamentStore'
import { useI18n } from '~/composables/useI18n'
import { formatBlinds, formatDuration } from '~/utils'
import { getTournamentStatusLabel, getTournamentStatusClass } from '~/utils/tournamentStatus'
import type { TournamentLiveStatus } from '~/types/tournament'

const { t } = useI18n()
const toast = useToast()
const tournamentStore = useTournamentStore()

const emit = defineEmits<{
  'enter-results': []
  'status-changed': [status: string]
}>()

// Use store data
const tournament = computed(() => tournamentStore.tournament)
const clock = computed(() => tournamentStore.clock)
const structure = computed(() => tournamentStore.structure)

// Auto-scroll refs
const stepperContainer = ref<HTMLElement | null>(null)
const currentStatusEl = ref<HTMLElement | null>(null)

// Computed values with fallback to tournament structure
const currentLevel = computed(() => clock.value?.currentLevel || 1)

const currentStructureFromLevel = computed(() => {
  if (clock.value?.currentStructure) return clock.value.currentStructure
  // Fallback: look up from tournament structure array by level number
  const level = currentLevel.value
  if (structure.value && level > 0) {
    return structure.value.find(s => s.levelNumber === level) ?? undefined
  }
  return undefined
})

const levelTimeRemaining = computed(() => {
  if (clock.value?.timeRemainingSeconds != null && clock.value.timeRemainingSeconds > 0) {
    return clock.value.timeRemainingSeconds
  }
  // Fallback: show full duration in seconds from structure
  const s = currentStructureFromLevel.value
  if (s?.durationMinutes) return s.durationMinutes * 60
  return 0
})

const displayLevel = computed(() => currentLevel.value)
const displayDuration = computed(() => formatDuration(levelTimeRemaining.value))
const displayBlinds = computed(() => formatBlinds(currentStructureFromLevel.value))

// Status flow
const statusFlow: TournamentLiveStatus[] = [
  'NOT_STARTED',
  'REGISTRATION_OPEN',
  'LATE_REGISTRATION',
  'IN_PROGRESS',
  'BREAK',
  'FINAL_TABLE',
  'FINISHED'
]

const currentStatusIndex = computed(() => {
  const status = tournament.value?.liveStatus
  if (!status) return -1
  return statusFlow.indexOf(status)
})

// Auto-scroll stepper to current status
const scrollToCurrentStatus = () => {
  nextTick(() => {
    if (currentStatusEl.value && stepperContainer.value) {
      const container = stepperContainer.value
      const el = currentStatusEl.value
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      // Scroll so the current status is centered in the container
      const scrollLeft = el.offsetLeft - container.offsetLeft - (containerRect.width / 2) + (elRect.width / 2)
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' })
    }
  })
}

onMounted(scrollToCurrentStatus)
watch(currentStatusIndex, scrollToCurrentStatus)

interface StatusAction {
  label: string
  targetStatus?: TournamentLiveStatus
  key?: string
  variant: 'primary' | 'success' | 'warning' | 'danger' | 'secondary'
  handler: () => void
}

const availableActions = computed<StatusAction[]>(() => {
  const status = tournament.value?.liveStatus
  if (!status) return []

  const actions: StatusAction[] = []

  switch (status) {
    case 'NOT_STARTED':
      actions.push({ label: t('statusWorkflow.actions.openRegistration'), targetStatus: 'REGISTRATION_OPEN', variant: 'primary', handler: () => confirmStatusChange(actions[0]) })
      break
    case 'REGISTRATION_OPEN':
      actions.push(
        { label: t('statusWorkflow.actions.startLateRegistration'), targetStatus: 'LATE_REGISTRATION', variant: 'secondary', handler: () => confirmStatusChange(actions[0]) },
        { label: t('statusWorkflow.actions.startTournament'), targetStatus: 'IN_PROGRESS', variant: 'primary', handler: () => confirmStatusChange(actions[1]) }
      )
      break
    case 'LATE_REGISTRATION':
      actions.push({ label: t('statusWorkflow.actions.closeLateRegAndStart'), targetStatus: 'IN_PROGRESS', variant: 'primary', handler: () => confirmStatusChange(actions[0]) })
      break
    case 'IN_PROGRESS':
      actions.push(
        { label: t('statusWorkflow.actions.callBreak'), targetStatus: 'BREAK', variant: 'warning', handler: () => confirmStatusChange(actions[0]) },
        { label: t('statusWorkflow.actions.announceFinalTable'), targetStatus: 'FINAL_TABLE', variant: 'primary', handler: () => confirmStatusChange(actions[1]) }
      )
      break
    case 'BREAK':
      actions.push({ label: t('statusWorkflow.actions.resumePlay'), targetStatus: 'IN_PROGRESS', variant: 'success', handler: () => confirmStatusChange(actions[0]) })
      break
    case 'FINAL_TABLE':
      actions.push(
        { label: t('results.enterResults'), key: 'enter-results', variant: 'primary', handler: () => emit('enter-results') },
        { label: t('statusWorkflow.actions.endTournament'), targetStatus: 'FINISHED', variant: 'danger', handler: () => confirmStatusChange(actions[1]) }
      )
      break
  }

  return actions
})

// Status change logic
const isUpdating = ref(false)
const showConfirmDialog = ref(false)
const pendingAction = ref<StatusAction | null>(null)

const confirmStatusChange = (action: StatusAction) => {
  pendingAction.value = action
  showConfirmDialog.value = true
}

const executeStatusChange = async () => {
  if (!pendingAction.value?.targetStatus || !tournament.value) return

  isUpdating.value = true
  showConfirmDialog.value = false

  try {
    await GqlUpdateTournamentStatus({
      input: {
        tournamentId: tournament.value.id,
        liveStatus: pendingAction.value.targetStatus
      }
    })

    // Refresh tournament data
    const response = await GqlGetTournament({ id: tournament.value.id })
    if (response.tournament) {
      tournamentStore.setSelectedTournament(response.tournament)
    }

    toast.success(t('toast.statusUpdateSuccess'))
    emit('status-changed', pendingAction.value.targetStatus)

    // If entering FINAL_TABLE, emit enter-results event
    if (pendingAction.value.targetStatus === 'FINAL_TABLE') {
      emit('enter-results')
    }
  } catch (error) {
    console.error('Failed to update tournament status:', error)
    toast.error(t('toast.statusUpdateFailed'))
  } finally {
    isUpdating.value = false
    pendingAction.value = null
  }
}
</script>
