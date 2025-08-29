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
        <h2 class="text-2xl font-bold text-pp-text-primary">Player Actions</h2>
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
                  Table {{ tableNumber }}, Seat {{ seatNumber }}
                </span>
                <span v-if="stackSize" class="flex items-center gap-1">
                  <IonIcon :icon="cashOutline" class="w-4 h-4" />
                  {{ formatChips(stackSize) }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <span class="text-sm text-white/60">Status:</span>
            <span :class="[
              'px-3 py-1 rounded-full text-sm font-medium border',
              getStatusBadgeClass(currentStatus)
            ]">
              {{ getStatusLabel(currentStatus) }}
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <h4 class="text-lg font-semibold text-pp-text-primary mb-4">Available Actions</h4>
          
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
                <div class="font-medium">Bust Player</div>
                <div class="text-xs opacity-80">Remove from tournament</div>
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
                <div class="font-medium">Move Table</div>
                <div class="text-xs opacity-80">Relocate to another table</div>
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
                <div class="font-medium">Update Stack</div>
                <div class="text-xs opacity-80">Modify chip count</div>
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
                <div class="font-medium">Mark Away</div>
                <div class="text-xs opacity-80">Temporarily away from table</div>
              </div>
            </button>
          </div>
        </div>

        <!-- Stack Update Section -->
        <div v-if="showStackUpdate" class="mt-6 p-4 bg-pp-bg-secondary rounded-xl border border-pp-border" style="background-color: #24242a !important;">
          <h5 class="text-white font-semibold mb-3">Update Stack Size</h5>
          <div class="space-y-3">
            <div>
              <label class="block text-sm text-white/70 mb-2">New Stack Size</label>
              <input 
                v-model="newStackSize"
                type="number"
                placeholder="Enter chip count"
                class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
              />
            </div>
            <div class="flex gap-3">
              <button 
                @click="handleStackUpdate"
                :disabled="!newStackSize || processing"
                class="pp-action-button pp-action-button--primary flex-1 justify-center"
              >
                Update Stack
              </button>
              <button 
                @click="showStackUpdate = false; newStackSize = ''"
                class="pp-action-button pp-action-button--secondary flex-1 justify-center"
              >
                Cancel
              </button>
            </div>
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
  closeOutline, locationOutline, checkmarkOutline 
} from 'ionicons/icons'

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

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    'SEATED': 'Active',
    'ELIMINATED': 'Busted',
    'AWAY': 'Away',
    'CHECKED_IN': 'Checked In'
  }
  return statusMap[status] || status
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'SEATED':
      return 'bg-green-500/20 text-green-400'
    case 'ELIMINATED':
      return 'bg-red-500/20 text-red-400'
    case 'AWAY':
      return 'bg-orange-500/20 text-orange-400'
    case 'CHECKED_IN':
      return 'bg-blue-500/20 text-blue-400'
    default:
      return 'bg-pp-border text-pp-text-primary'
  }
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

// Reset state when modal closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    showStackUpdate.value = false
    newStackSize.value = ''
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