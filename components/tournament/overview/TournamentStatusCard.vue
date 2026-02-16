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

    <!-- Late Registration Info -->
    <div v-if="tournament?.lateRegistrationLevel" class="flex items-center gap-2 mb-4 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
      <IonIcon :icon="timeOutline" class="w-4 h-4 text-orange-400 flex-shrink-0" />
      <span class="text-sm text-orange-300">{{ t('labels.lateRegThroughLevel', { level: tournament.lateRegistrationLevel }) }}</span>
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
import { trophyOutline, chevronForwardOutline, refreshOutline, timeOutline } from 'ionicons/icons'
import { useTournamentStore } from '~/stores/useTournamentStore'
import { useI18n } from '~/composables/useI18n'
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

// Auto-scroll refs
const stepperContainer = ref<HTMLElement | null>(null)
const currentStatusEl = ref<HTMLElement | null>(null)

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
        { label: t('statusWorkflow.actions.startTournament'), targetStatus: 'LATE_REGISTRATION', variant: 'primary', handler: () => confirmStatusChange(actions[0]) }
      )
      break
    case 'LATE_REGISTRATION':
      actions.push(
        { label: t('statusWorkflow.actions.closeLateRegAndStart'), targetStatus: 'IN_PROGRESS', variant: 'warning', handler: () => confirmStatusChange(actions[0]) }
      )
      break
    case 'IN_PROGRESS':
      actions.push(
        { label: t('statusWorkflow.actions.callBreak'), targetStatus: 'BREAK', variant: 'warning', handler: () => confirmStatusChange(actions[0]) }
      )
      break
    case 'BREAK':
      actions.push({ label: t('statusWorkflow.actions.resumePlay'), targetStatus: 'IN_PROGRESS', variant: 'success', handler: () => confirmStatusChange(actions[0]) })
      break
    case 'FINAL_TABLE':
      {
        const seatedCount = tournamentStore.registrations?.filter(r => r.status === 'SEATED').length || 0
        if (seatedCount > 1) {
          actions.push(
            { label: t('statusWorkflow.actions.endTournament'), key: 'end-tournament', variant: 'danger', handler: () => emit('enter-results') }
          )
        } else {
          actions.push(
            { label: t('statusWorkflow.actions.endTournament'), targetStatus: 'FINISHED', variant: 'danger', handler: () => confirmStatusChange(actions[0]) }
          )
        }
      }
      break
  }

  return actions
})

// Status change logic
const isUpdating = ref(false)
const showConfirmDialog = ref(false)
const pendingAction = ref<StatusAction | null>(null)

// Check if tournament has tables assigned
const checkTablesAssigned = async (): Promise<boolean> => {
  try {
    const tournamentId = tournament.value?.id
    if (!tournamentId) return false
    const response = await GqlGetTournamentSeatingChart({ tournamentId })
    const tables = response?.tournamentSeatingChart?.tables || []
    return tables.length > 0
  } catch {
    return false
  }
}

const confirmStatusChange = async (action: StatusAction) => {
  // Block starting tournament if no tables are assigned
  if (action.targetStatus === 'LATE_REGISTRATION') {
    const hasTables = await checkTablesAssigned()
    if (!hasTables) {
      toast.error(t('toast.noTablesAssigned'))
      return
    }
  }
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
  } catch (error) {
    console.error('Failed to update tournament status:', error)
    toast.error(t('toast.statusUpdateFailed'))
  } finally {
    isUpdating.value = false
    pendingAction.value = null
  }
}
</script>
