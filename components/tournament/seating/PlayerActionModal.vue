<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      @click="$emit('close')"
    ></div>
    
    <!-- Modal Content -->
    <div class="relative bg-pp-bg-secondary rounded-2xl w-full max-w-lg border border-pp-border shadow-2xl" style="background-color: #24242a !important;">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-pp-border/50">
        <h2 class="text-2xl font-bold text-pp-text-primary">{{ t('playerAction.title') }}</h2>
        <button 
          @click="$emit('close')"
          class="p-2 text-white/60 hover:text-white rounded-lg hover:bg-pp-bg-primary/50 transition-colors"
        >
          <IonIcon :icon="closeOutline" class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6">
        <!-- Player Info Header -->
        <div v-if="player" class="bg-pp-bg-primary/30 rounded-xl p-4 mb-6 border border-pp-border/30">
          <div class="flex items-center gap-4 mb-3">
            <div class="w-14 h-14 bg-gradient-to-br from-pp-accent-gold/20 to-pp-accent-gold/40 rounded-full flex items-center justify-center border-2 border-pp-accent-gold/50">
              <span class="text-lg font-bold text-pp-accent-gold">{{ getInitials(player.firstName, player.lastName) }}</span>
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-semibold text-pp-text-primary">{{ getPlayerDisplayName(player) }}</h3>
              <div class="flex items-center gap-3 text-sm text-white/70 mt-1">
                <span class="flex items-center gap-1">
                  <IonIcon :icon="locationOutline" class="w-4 h-4" />
                  {{ t('labels.table') }} {{ tableNumber }}, {{ t('labels.seat') }} {{ seatNumber }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <span class="text-sm text-white/60">{{ t('labels.status') }}:</span>
            <span :class="[
              'px-3 py-1 rounded-full text-sm font-medium border',
              getRegistrationStatusClass(currentStatus)
            ]">
              {{ getRegistrationStatusLabel(currentStatus, t) }}
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <h4 class="text-lg font-semibold text-pp-text-primary mb-4">{{ t('playerAction.availableActions') }}</h4>
          
          <!-- Action Grid -->
          <div class="grid grid-cols-1 gap-3">
            <!-- Bust Player -->
            <button
              @click="handleStatusChange('ELIMINATED')"
              :disabled="processing"
              class="pp-action-button pp-action-button--danger w-full justify-start"
            >
              <IonIcon :icon="skullOutline" class="w-5 h-5" />
              <div class="flex-1 text-left">
                <div class="font-medium">{{ t('playerAction.bustPlayer') }}</div>
                <div class="text-xs opacity-80">{{ t('playerAction.removeFromTournament') }}</div>
              </div>
            </button>

            <!-- Move to Different Table -->
            <button 
              @click="handleTableMove"
              :disabled="processing"
              class="pp-action-button pp-action-button--secondary w-full justify-start"
            >
              <IonIcon :icon="swapHorizontalOutline" class="w-5 h-5" />
              <div class="flex-1 text-left">
                <div class="font-medium">{{ t('playerAction.moveTable') }}</div>
                <div class="text-xs opacity-80">{{ t('playerAction.relocateToAnother') }}</div>
              </div>
            </button>

            <!-- Away from Table -->
            <button 
              @click="handleStatusChange('AWAY')"
              :disabled="processing"
              class="pp-action-button pp-action-button--warning w-full justify-start"
            >
              <IonIcon :icon="walkOutline" class="w-5 h-5" />
              <div class="flex-1 text-left">
                <div class="font-medium">{{ t('playerAction.markAway') }}</div>
                <div class="text-xs opacity-80">{{ t('playerAction.temporarilyAway') }}</div>
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
ion-modal {
  --background: #18181a;
}

ion-header ion-toolbar {
  --background: #24242a;
  --color: #fee78a;
}

ion-content {
  --background: #18181a;
}
</style>