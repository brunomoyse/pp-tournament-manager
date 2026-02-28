<template>
  <div class="status-card">
    <div class="status-card__header">
      <h3 class="status-card__title">{{ t('statusWorkflow.title') }}</h3>
      <IonIcon :icon="trophyOutline" class="status-card__icon" />
    </div>

    <!-- Status Stepper -->
    <div ref="stepperContainer" class="status-stepper">
      <template v-for="(status, index) in statusFlow" :key="status">
        <div
          :ref="el => { if (currentStatusIndex === index) currentStatusEl = el as HTMLElement }"
          :class="[
            'status-stepper__step',
            currentStatusIndex === index
              ? getTournamentStatusClass(status)
              : currentStatusIndex > index
                ? 'status-stepper__step--completed'
                : 'status-stepper__step--upcoming'
          ]"
        >
          {{ getTournamentStatusLabel(status, t) }}
        </div>
        <IonIcon
          v-if="index < statusFlow.length - 1"
          :icon="chevronForwardOutline"
          :class="[
            'status-stepper__chevron',
            currentStatusIndex > index ? 'status-stepper__chevron--completed' : ''
          ]"
        />
      </template>
    </div>

    <!-- Late Registration Info -->
    <div v-if="tournament?.lateRegistrationLevel" class="late-reg-info">
      <IonIcon :icon="timeOutline" class="late-reg-info__icon" />
      <span class="late-reg-info__text">{{ t('labels.lateRegThroughLevel', { level: tournament.lateRegistrationLevel }) }}</span>
    </div>

    <!-- Action Buttons -->
    <div v-if="availableActions.length > 0" class="status-actions">
      <button
        v-for="action in availableActions"
        :key="action.targetStatus || action.key"
        @click="action.handler()"
        :disabled="isUpdating"
        :class="[
          'status-actions__button pp-action-button',
          action.variant === 'primary' ? 'pp-action-button--primary' :
          action.variant === 'success' ? 'pp-action-button--success' :
          action.variant === 'warning' ? 'pp-action-button--warning' :
          action.variant === 'danger' ? 'pp-action-button--danger' :
          'pp-action-button--secondary'
        ]"
      >
        <IonIcon v-if="isUpdating && action.targetStatus" :icon="refreshOutline" class="status-actions__spinner pp-animate-spin" />
        {{ action.label }}
      </button>
    </div>

    <!-- Confirmation Dialog -->
    <div v-if="showConfirmDialog" class="pp-modal-overlay">
      <div class="pp-modal-backdrop" @click="showConfirmDialog = false"></div>
      <div class="pp-modal-content pp-modal-content--sm confirm-dialog">
        <h3 class="confirm-dialog__title">{{ t('statusWorkflow.confirmTitle') }}</h3>
        <p class="confirm-dialog__message">
          {{ t('statusWorkflow.confirmMessage', { status: pendingAction?.label || '' }) }}
        </p>
        <div class="confirm-dialog__actions">
          <button @click="showConfirmDialog = false" class="pp-action-button pp-action-button--secondary">
            {{ t('buttons.cancel') }}
          </button>
          <button @click="executeStatusChange" :disabled="isUpdating" class="pp-action-button pp-action-button--primary">
            <IonIcon v-if="isUpdating" :icon="refreshOutline" class="status-actions__spinner pp-animate-spin" />
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
import { TournamentLiveStatus } from '#gql/default'

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
  TournamentLiveStatus.NOT_STARTED,
  TournamentLiveStatus.REGISTRATION_OPEN,
  TournamentLiveStatus.LATE_REGISTRATION,
  TournamentLiveStatus.IN_PROGRESS,
  TournamentLiveStatus.BREAK,
  TournamentLiveStatus.FINAL_TABLE,
  TournamentLiveStatus.FINISHED,
]

const currentStatusIndex = computed(() => {
  const status = tournament.value?.liveStatus as TournamentLiveStatus | undefined
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

  const pushAction = (action: StatusAction) => {
    action.handler = () => confirmStatusChange(action)
    actions.push(action)
  }

  switch (status) {
    case TournamentLiveStatus.NOT_STARTED:
      pushAction({ label: t('statusWorkflow.actions.openRegistration'), targetStatus: TournamentLiveStatus.REGISTRATION_OPEN, variant: 'primary', handler: () => {} })
      break
    case TournamentLiveStatus.REGISTRATION_OPEN:
      pushAction({ label: t('statusWorkflow.actions.startTournament'), targetStatus: TournamentLiveStatus.LATE_REGISTRATION, variant: 'primary', handler: () => {} })
      break
    case TournamentLiveStatus.LATE_REGISTRATION:
      pushAction({ label: t('statusWorkflow.actions.closeLateRegAndStart'), targetStatus: TournamentLiveStatus.IN_PROGRESS, variant: 'warning', handler: () => {} })
      break
    case TournamentLiveStatus.IN_PROGRESS:
      pushAction({ label: t('statusWorkflow.actions.callBreak'), targetStatus: TournamentLiveStatus.BREAK, variant: 'warning', handler: () => {} })
      break
    case TournamentLiveStatus.BREAK:
      pushAction({ label: t('statusWorkflow.actions.resumePlay'), targetStatus: TournamentLiveStatus.IN_PROGRESS, variant: 'success', handler: () => {} })
      break
    case TournamentLiveStatus.FINAL_TABLE:
      {
        const seatedCount = tournamentStore.registrations?.filter(r => r.status === 'SEATED').length || 0
        if (seatedCount > 1) {
          actions.push(
            { label: t('statusWorkflow.actions.endTournament'), key: 'end-tournament', variant: 'danger', handler: () => emit('enter-results') }
          )
        } else {
          pushAction({ label: t('statusWorkflow.actions.endTournament'), targetStatus: TournamentLiveStatus.FINISHED, variant: 'danger', handler: () => {} })
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

<style scoped>
.status-card {
  background-color: var(--pp-bg-secondary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--pp-shadow-sm);
  border: 1px solid var(--pp-border);
}

.status-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.status-card__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--pp-text-primary);
}

.status-card__icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #ffffff;
}

/* Status Stepper */
.status-stepper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  overflow-x: auto;
  flex-wrap: nowrap;
  padding-bottom: 0.5rem;
}

.status-stepper__step {
  flex-shrink: 0;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
  transition: all 0.2s ease;
}

.status-stepper__step--completed {
  background-color: rgba(34, 197, 94, 0.1);
  color: rgba(74, 222, 128, 0.6);
  border-color: rgba(34, 197, 94, 0.2);
}

.status-stepper__step--upcoming {
  background-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.1);
}

.status-stepper__chevron {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.2);
}

.status-stepper__chevron--completed {
  color: rgba(74, 222, 128, 0.4);
}

/* Late Registration Info */
.late-reg-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.5rem 0.75rem;
  background-color: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.2);
  border-radius: 0.5rem;
}

.late-reg-info__icon {
  width: 1rem;
  height: 1rem;
  color: var(--pp-orange-400);
  flex-shrink: 0;
}

.late-reg-info__text {
  font-size: 0.875rem;
  color: #fdba74;
}

/* Action Buttons */
.status-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.status-actions__button {
  width: 100%;
  font-size: 0.875rem;
}

.status-actions__spinner {
  width: 1rem;
  height: 1rem;
}

/* Confirmation Dialog */
.confirm-dialog {
  padding: 1.5rem;
}

.confirm-dialog__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--pp-text-primary);
  margin-bottom: 0.75rem;
}

.confirm-dialog__message {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
}

.confirm-dialog__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
