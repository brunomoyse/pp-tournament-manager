<template>
  <div v-if="isOpen" class="pp-modal-overlay">
    <!-- Backdrop -->
    <div
      class="pp-modal-backdrop"
      @click="$emit('close')"
    ></div>

    <!-- Modal Content -->
    <div class="pp-modal-content pp-modal-content--lg">
      <!-- Header -->
      <div class="pp-modal-header">
        <h3 class="modal-title">{{ t('playerAction.title') }}</h3>
        <button
          @click="$emit('close')"
          class="pp-close-button"
        >
          <IonIcon :icon="closeOutline" class="icon-md" />
        </button>
      </div>

      <div class="pp-modal-body">
        <!-- Player Info Header -->
        <div v-if="player" class="player-info-card">
          <div class="player-info-header">
            <div class="player-avatar">
              <span class="player-avatar-text">{{ getInitials(player.firstName, player.lastName) }}</span>
            </div>
            <div class="player-details">
              <h3 class="player-name">{{ getPlayerDisplayName(player) }}</h3>
              <div class="player-location">
                <span class="location-item">
                  <IonIcon :icon="locationOutline" class="icon-sm" />
                  {{ t('labels.table') }} {{ tableNumber }}, {{ t('labels.seat') }} {{ seatNumber }}
                </span>
              </div>
            </div>
          </div>

          <div class="player-status-row">
            <span class="status-label">{{ t('labels.status') }}:</span>
            <span :class="[
              'pp-status-badge',
              getRegistrationStatusClass(currentStatus)
            ]">
              {{ getRegistrationStatusLabel(currentStatus, t) }}
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="actions-section">
          <h4 class="actions-title">{{ t('playerAction.availableActions') }}</h4>

          <!-- Action Grid -->
          <div class="actions-grid">
            <!-- Bust Player -->
            <button
              @click="handleStatusChange('ELIMINATED')"
              :disabled="processing"
              class="pp-action-button pp-action-button--danger action-button-full"
            >
              <IonIcon :icon="skullOutline" class="icon-md" />
              <div class="action-button-content">
                <div class="action-button-label">{{ t('playerAction.bustPlayer') }}</div>
                <div class="action-button-desc">{{ t('playerAction.removeFromTournament') }}</div>
              </div>
            </button>

            <!-- Move to Different Table -->
            <button
              @click="handleTableMove"
              :disabled="processing"
              class="pp-action-button pp-action-button--secondary action-button-full"
            >
              <IonIcon :icon="swapHorizontalOutline" class="icon-md" />
              <div class="action-button-content">
                <div class="action-button-label">{{ t('playerAction.moveTable') }}</div>
                <div class="action-button-desc">{{ t('playerAction.relocateToAnother') }}</div>
              </div>
            </button>

            <!-- Away from Table -->
            <button
              @click="handleStatusChange('AWAY')"
              :disabled="processing"
              class="pp-action-button pp-action-button--warning action-button-full"
            >
              <IonIcon :icon="walkOutline" class="icon-md" />
              <div class="action-button-content">
                <div class="action-button-label">{{ t('playerAction.markAway') }}</div>
                <div class="action-button-desc">{{ t('playerAction.temporarilyAway') }}</div>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  skullOutline, swapHorizontalOutline, walkOutline,
  closeOutline, locationOutline
} from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { getRegistrationStatusLabel, getRegistrationStatusClass } from '~/utils/registrationStatus'

const { t } = useI18n()

interface Player {
  id: string
  firstName: string
  lastName?: string | null
}

interface Props {
  isOpen: boolean
  player: Player | null
  tableNumber: number
  seatNumber: number
  currentStatus: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'status-changed': [data: { playerId: string, status: string }]
  'move-player': [data: { playerId: string, fromTable: number, fromSeat: number }]
}>()

// State
const processing = ref(false)

// Helper functions
const getInitials = (firstName: string, lastName?: string | null) => {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return `${first}${last}` || '?'
}

const getPlayerDisplayName = (player: Player) => {
  if (!player) return ''
  const firstName = player.firstName || ''
  const lastName = player.lastName || ''

  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  } else if (firstName) {
    return firstName
  } else if (lastName) {
    return lastName
  }
  return 'Unknown Player'
}

// Action handlers
const handleStatusChange = async (newStatus: string) => {
  if (!props.player) return

  processing.value = true
  try {
    emit('status-changed', {
      playerId: props.player.id,
      status: newStatus
    })
  } finally {
    processing.value = false
  }
}

const handleTableMove = () => {
  if (!props.player) return

  emit('move-player', {
    playerId: props.player.id,
    fromTable: props.tableNumber,
    fromSeat: props.seatNumber
  })
}

// Reset state when modal closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    processing.value = false
  }
})
</script>

<style scoped>
.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--pp-text-primary);
}

.player-info-card {
  background-color: rgba(24, 24, 26, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(84, 84, 95, 0.3);
}

.player-info-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.player-avatar {
  width: 3.5rem;
  height: 3.5rem;
  background: linear-gradient(to bottom right, rgba(254, 231, 138, 0.2), rgba(254, 231, 138, 0.4));
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(254, 231, 138, 0.5);
}

.player-avatar-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--pp-accent-gold);
}

.player-details {
  flex: 1;
}

.player-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--pp-text-primary);
}

.player-location {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.25rem;
}

.location-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.player-status-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.actions-section > * + * {
  margin-top: 0.75rem;
}

.actions-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--pp-text-primary);
  margin-bottom: 1rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.action-button-full {
  width: 100%;
  justify-content: flex-start;
}

.action-button-content {
  flex: 1;
  text-align: left;
}

.action-button-label {
  font-weight: 500;
}

.action-button-desc {
  font-size: 0.75rem;
  opacity: 0.8;
}

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

.icon-sm {
  width: 1rem;
  height: 1rem;
}
</style>
