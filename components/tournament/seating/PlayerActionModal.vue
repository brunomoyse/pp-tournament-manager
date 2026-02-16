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
                <span v-if="stackSize" class="flex items-center gap-1">
                  <IonIcon :icon="cashOutline" class="w-4 h-4" />
                  {{ formatChips(stackSize) }}
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
            <!-- Show QR Code for Check-in -->
            <button
              @click="showQRCode = true"
              :disabled="processing"
              class="pp-action-button pp-action-button--primary w-full justify-start"
            >
              <IonIcon :icon="qrCodeOutline" class="w-5 h-5" />
              <div class="flex-1 text-left">
                <div class="font-medium">{{ t('playerAction.showCheckInQR') }}</div>
                <div class="text-xs opacity-80">{{ t('playerAction.generateQRForPlayer') }}</div>
              </div>
            </button>

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

            <!-- Update Stack Size -->
            <button 
              @click="showStackUpdate = true"
              :disabled="processing"
              class="pp-action-button pp-action-button--primary w-full justify-start"
            >
              <IonIcon :icon="ellipseOutline" class="w-5 h-5" />
              <div class="flex-1 text-left">
                <div class="font-medium">{{ t('playerAction.updateStack') }}</div>
                <div class="text-xs opacity-80">{{ t('playerAction.modifyChipCount') }}</div>
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

        <!-- Stack Update Section -->
        <div v-if="showStackUpdate" class="mt-6 p-4 bg-pp-bg-secondary rounded-xl border border-pp-border" style="background-color: #24242a !important;">
          <h5 class="text-white font-semibold mb-3">{{ t('playerAction.updateStackSize') }}</h5>
          <div class="space-y-3">
            <div>
              <label class="block text-sm text-white/70 mb-2">{{ t('playerAction.newStackSize') }}</label>
              <input
                v-model="newStackSize"
                type="number"
                :placeholder="t('playerAction.enterChipCount')"
                class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
              />
            </div>
            <div class="flex gap-3">
              <button
                @click="handleStackUpdate"
                :disabled="!newStackSize || processing"
                class="pp-action-button pp-action-button--primary flex-1 justify-center"
              >
                {{ t('buttons.updateStack') }}
              </button>
              <button
                @click="showStackUpdate = false; newStackSize = ''"
                class="pp-action-button pp-action-button--secondary flex-1 justify-center"
              >
                {{ t('buttons.cancel') }}
              </button>
            </div>
          </div>
        </div>

        <!-- QR Code Display Section -->
        <div v-if="showQRCode" class="mt-6 p-6 bg-pp-bg-secondary rounded-xl border border-pp-accent-gold/30" style="background-color: #24242a !important;">
          <div class="text-center">
            <h5 class="text-white font-semibold mb-4">{{ t('qr.generate.title') }}</h5>

            <!-- QR Code Image -->
            <div v-if="qrCodeDataUrl" class="bg-white rounded-xl p-4 inline-block mb-4">
              <img :src="qrCodeDataUrl" :alt="t('qr.generate.qrCodeAlt')" class="w-64 h-64" />
            </div>

            <div v-else-if="qrCodeError" class="text-red-400 mb-4">
              <p>{{ t('playerAction.failedToGenerateQR') }}</p>
            </div>

            <div v-else class="mb-4">
              <p class="text-white/60">{{ t('qr.generate.generating') }}</p>
            </div>

            <!-- Manual Code Display -->
            <div class="bg-pp-bg-primary/50 rounded-lg p-3 mb-4 border border-pp-border">
              <p class="text-white/60 text-xs mb-1">{{ t('qr.generate.manualCode') }}</p>
              <p class="text-pp-accent-gold font-mono text-lg font-semibold">{{ checkInCode }}</p>
            </div>

            <!-- Instructions -->
            <p class="text-white/70 text-sm mb-4">
              {{ t('playerAction.scanQRToCheckIn') }}
            </p>

            <!-- Close Button -->
            <button
              @click="showQRCode = false"
              class="pp-action-button pp-action-button--secondary w-full justify-center"
            >
              {{ t('common.close') }}
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
  skullOutline, swapHorizontalOutline, ellipseOutline, walkOutline,
  closeOutline, locationOutline, checkmarkOutline, qrCodeOutline,
  cashOutline
} from 'ionicons/icons'
import QRCode from 'qrcode'
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
  stackSize?: number
  currentStatus: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'status-changed': [data: { playerId: string, status: string, stackSize?: number }]
  'move-player': [data: { playerId: string, fromTable: number, fromSeat: number }]
}>()

// State
const processing = ref(false)
const showStackUpdate = ref(false)
const newStackSize = ref('')
const showQRCode = ref(false)
const qrCodeDataUrl = ref<string | null>(null)
const qrCodeError = ref(false)
const checkInCode = ref('')

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

const formatChips = (amount: number) => {
  return amount.toLocaleString()
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

const handleStackUpdate = async () => {
  if (!props.player || !newStackSize.value) return
  
  processing.value = true
  try {
    emit('status-changed', {
      playerId: props.player.id,
      status: props.currentStatus, // Keep current status
      stackSize: parseInt(newStackSize.value)
    })
    
    showStackUpdate.value = false
    newStackSize.value = ''
  } finally {
    processing.value = false
  }
}

// Generate QR code when showQRCode becomes true
watch(showQRCode, async (show) => {
  if (show && props.player) {
    await generateQRCode()
  } else {
    qrCodeDataUrl.value = null
    qrCodeError.value = false
    checkInCode.value = ''
  }
})

// Generate QR code for player check-in
const generateQRCode = async () => {
  if (!props.player) return

  try {
    qrCodeError.value = false
    // Generate check-in code: CHECKIN:{playerId}
    checkInCode.value = `CHECKIN:${props.player.id}`

    // Generate QR code as data URL
    qrCodeDataUrl.value = await QRCode.toDataURL(checkInCode.value, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    qrCodeError.value = true
    qrCodeDataUrl.value = null
  }
}

// Reset state when modal closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    showStackUpdate.value = false
    newStackSize.value = ''
    showQRCode.value = false
    qrCodeDataUrl.value = null
    qrCodeError.value = false
    checkInCode.value = ''
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