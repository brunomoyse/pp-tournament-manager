<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-6 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
    <!-- Table Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <h3 class="text-lg font-bold text-pp-text-primary">Table {{ table.tableNumber }}</h3>
        <span class="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
          active
        </span>
      </div>
      <div class="text-sm text-white/60">
        {{ occupiedSeats }}/{{ table.maxSeats }} seats occupied
      </div>
    </div>

    <!-- Table Visualization -->
    <div class="relative mb-6">
      <!-- Poker Table Background -->
      <div :class="[
        'w-full bg-gradient-to-br from-green-800/40 to-green-900/40 border-4 border-pp-border/50 relative',
        'rounded-[50%] shadow-inner',
        table.maxSeats <= 6 ? 'h-40' : table.maxSeats <= 8 ? 'h-48' : 'h-56'
      ]">
        <!-- Table Center Label -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <div class="text-2xl font-bold text-pp-text-primary">T{{ table.tableNumber }}</div>
            <div class="text-xs text-white/60">{{ occupiedSeats }}/{{ table.maxSeats }}</div>
          </div>
        </div>
        
        <!-- Seat Positions -->
        <div 
          v-for="seatNumber in table.maxSeats"
          :key="seatNumber"
          :style="getSeatPosition(seatNumber)"
          class="absolute"
        >
          <!-- Seat Circle -->
          <div 
            :class="[
              'w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all cursor-pointer shadow-md',
              getSeatPlayer(seatNumber) 
                ? 'bg-pp-accent-gold text-pp-bg-primary border-pp-accent-gold shadow-pp-accent-gold/30' 
                : 'bg-pp-bg-primary border-pp-border text-white/70 hover:border-pp-accent-gold/50 hover:bg-pp-bg-primary/80'
            ]"
            @click="handleSeatClick(seatNumber)"
          >
            {{ seatNumber }}
          </div>
          
          <!-- Player Name - Positioned Dynamically -->
          <div 
            v-if="getSeatPlayer(seatNumber)"
            :class="[
              'absolute text-xs font-semibold text-pp-text-primary whitespace-nowrap px-2 py-1 bg-pp-bg-secondary/90 rounded backdrop-blur-sm border border-pp-border/50',
              getNamePosition(seatNumber)
            ]"
          >
            {{ getPlayerDisplayName(getSeatPlayer(seatNumber)) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Seated Players List -->
    <div>
      <h4 class="text-sm font-semibold text-white mb-3">Seated Players:</h4>
      <div v-if="seatedPlayers.length > 0" class="space-y-2">
        <div 
          v-for="seatData in seatedPlayers" 
          :key="seatData.assignment.seatNumber"
          class="flex items-center justify-between text-sm"
        >
          <div class="flex items-center gap-2">
            <span class="text-pp-accent-gold font-medium">Seat {{ seatData.assignment.seatNumber }}:</span>
            <span class="text-white">{{ getPlayerFullName(seatData.player) }}</span>
          </div>
          <button 
            @click="removeSeatPlayer(seatData.assignment.seatNumber)"
            class="p-1 text-white/60 hover:text-red-400 rounded"
          >
            <IonIcon :icon="removeCircleOutline" class="w-4 h-4" />
          </button>
        </div>
      </div>
      <div v-else class="text-white/60 text-sm">
        No players seated
      </div>
    </div>

    <!-- Player Action Modal -->
    <PlayerActionModal 
      :is-open="showPlayerModal"
      :player="selectedPlayer"
      :table-number="table.tableNumber"
      :seat-number="selectedSeatNumber"
      :stack-size="selectedPlayerStackSize"
      :current-status="selectedPlayerStatus"
      @close="closePlayerModal"
      @status-changed="handleStatusChanged"
      @move-player="handleMovePlayer"
    />
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { removeCircleOutline } from 'ionicons/icons'
import PlayerActionModal from './PlayerActionModal.vue'

interface Table {
  id: string
  tableNumber: number
  maxSeats: number
}

interface SeatAssignment {
  assignment: {
    seatNumber: number
    stackSize?: number
  }
  player: {
    firstName: string
    lastName?: string | null
  }
}

interface Props {
  table: Table
  seats: SeatAssignment[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  seatPlayer: [data: { tableId: string, seatNumber: number, playerId: string }]
  removePlayer: [data: { tableId: string, seatNumber: number }]
  statusChanged: [data: { playerId: string, status: string, stackSize?: number }]
  movePlayer: [data: { playerId: string, fromTable: number, fromSeat: number }]
  selectPlayerForSeat: [data: { tableId: string, seatNumber: number }]
}>()

// Modal state
const showPlayerModal = ref(false)
const selectedPlayer = ref<any>(null)
const selectedSeatNumber = ref(0)
const selectedPlayerStackSize = ref<number | undefined>(undefined)
const selectedPlayerStatus = ref('SEATED')

// Computed properties
const occupiedSeats = computed(() => props.seats?.length || 0)

const seatedPlayers = computed(() => props.seats || [])

// Helper functions
const getSeatPlayer = (seatNumber: number) => {
  return props.seats?.find(s => s.assignment.seatNumber === seatNumber)?.player
}

const getPlayerDisplayName = (player: any) => {
  if (!player) return ''
  const firstName = player.firstName || ''
  const lastName = player.lastName || ''
  
  // Format as "John D." to save space
  if (firstName && lastName) {
    return `${firstName} ${lastName.charAt(0)}.`
  } else if (firstName) {
    return firstName
  } else if (lastName) {
    return lastName
  }
  return 'Unknown'
}

const getPlayerFullName = (player: any) => {
  if (!player) return ''
  const firstName = player.firstName || ''
  const lastName = player.lastName || ''
  
  // Return full name for the list
  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  } else if (firstName) {
    return firstName
  } else if (lastName) {
    return lastName
  }
  return 'Unknown'
}

const getSeatPosition = (seatNumber: number) => {
  const maxSeats = props.table.maxSeats
  const centerX = 50
  const centerY = 50
  
  // Poker table specific positioning - more rectangular/oval like real poker tables
  let x, y
  
  if (maxSeats === 6) {
    // 6-handed table layout
    const positions = [
      { x: 50, y: 15 },  // Seat 1 - Top center
      { x: 75, y: 35 },  // Seat 2 - Right top
      { x: 75, y: 65 },  // Seat 3 - Right bottom
      { x: 50, y: 85 },  // Seat 4 - Bottom center
      { x: 25, y: 65 },  // Seat 5 - Left bottom
      { x: 25, y: 35 },  // Seat 6 - Left top
    ]
    const pos = positions[(seatNumber - 1) % 6]
    x = pos.x
    y = pos.y
  } else if (maxSeats === 8) {
    // 8-handed table layout
    const positions = [
      { x: 50, y: 12 },  // Seat 1 - Top center
      { x: 72, y: 22 },  // Seat 2 - Top right
      { x: 85, y: 40 },  // Seat 3 - Right top
      { x: 85, y: 60 },  // Seat 4 - Right bottom
      { x: 72, y: 78 },  // Seat 5 - Bottom right
      { x: 50, y: 88 },  // Seat 6 - Bottom center
      { x: 28, y: 78 },  // Seat 7 - Bottom left
      { x: 15, y: 60 },  // Seat 8 - Left bottom
    ]
    const pos = positions[(seatNumber - 1) % 8]
    x = pos.x
    y = pos.y
  } else if (maxSeats === 9) {
    // 9-handed table layout (full ring)
    const positions = [
      { x: 50, y: 12 },  // Seat 1 - Top center
      { x: 70, y: 18 },  // Seat 2 - Top right
      { x: 85, y: 35 },  // Seat 3 - Right top
      { x: 85, y: 65 },  // Seat 4 - Right bottom
      { x: 70, y: 82 },  // Seat 5 - Bottom right
      { x: 50, y: 88 },  // Seat 6 - Bottom center
      { x: 30, y: 82 },  // Seat 7 - Bottom left
      { x: 15, y: 65 },  // Seat 8 - Left bottom
      { x: 15, y: 35 },  // Seat 9 - Left top
    ]
    const pos = positions[(seatNumber - 1) % 9]
    x = pos.x
    y = pos.y
  } else if (maxSeats === 10) {
    // 10-handed table layout
    const positions = [
      { x: 50, y: 10 },  // Seat 1 - Top center
      { x: 68, y: 15 },  // Seat 2 - Top right
      { x: 82, y: 28 },  // Seat 3 - Right top
      { x: 88, y: 50 },  // Seat 4 - Right middle
      { x: 82, y: 72 },  // Seat 5 - Right bottom
      { x: 68, y: 85 },  // Seat 6 - Bottom right
      { x: 50, y: 90 },  // Seat 7 - Bottom center
      { x: 32, y: 85 },  // Seat 8 - Bottom left
      { x: 18, y: 72 },  // Seat 9 - Left bottom
      { x: 12, y: 50 },  // Seat 10 - Left middle
    ]
    const pos = positions[(seatNumber - 1) % 10]
    x = pos.x
    y = pos.y
  } else {
    // Default circular layout for other seat counts
    const angle = ((seatNumber - 1) / maxSeats) * 2 * Math.PI - Math.PI / 2
    const radiusX = 42
    const radiusY = 35
    x = centerX + radiusX * Math.cos(angle)
    y = centerY + radiusY * Math.sin(angle)
  }
  
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)'
  }
}

const getNamePosition = (seatNumber: number) => {
  const maxSeats = props.table.maxSeats
  
  // For poker table layouts, position names based on seat location
  if (maxSeats === 6 || maxSeats === 8 || maxSeats === 9 || maxSeats === 10) {
    // Top seats (1, 2 for most layouts)
    if (seatNumber === 1 || (seatNumber === 2 && maxSeats >= 9)) {
      return '-top-12 left-1/2 transform -translate-x-1/2'
    }
    // Right side seats
    else if (
      (maxSeats === 6 && (seatNumber === 2 || seatNumber === 3)) ||
      (maxSeats === 8 && (seatNumber === 3 || seatNumber === 4)) ||
      (maxSeats === 9 && (seatNumber === 3 || seatNumber === 4)) ||
      (maxSeats === 10 && (seatNumber === 3 || seatNumber === 4 || seatNumber === 5))
    ) {
      return 'top-1/2 -right-16 transform -translate-y-1/2'
    }
    // Bottom seats
    else if (
      (maxSeats === 6 && seatNumber === 4) ||
      (maxSeats === 8 && seatNumber === 6) ||
      (maxSeats === 9 && seatNumber === 6) ||
      (maxSeats === 10 && seatNumber === 7)
    ) {
      return '-bottom-12 left-1/2 transform -translate-x-1/2'
    }
    // Left side seats
    else {
      return 'top-1/2 -left-16 transform -translate-y-1/2'
    }
  }
  
  // Default positioning for circular layouts
  const angle = ((seatNumber - 1) / maxSeats) * 2 * Math.PI - Math.PI / 2
  const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  
  if (normalizedAngle >= 0 && normalizedAngle <= Math.PI) {
    return '-top-12 left-1/2 transform -translate-x-1/2'
  } else {
    return '-bottom-12 left-1/2 transform -translate-x-1/2'
  }
}

// Event handlers
const handleSeatClick = (seatNumber: number) => {
  const seatData = props.seats?.find(s => s.assignment.seatNumber === seatNumber)
  const player = seatData?.player

  if (player) {
    // Open player action modal
    selectedPlayer.value = player
    selectedSeatNumber.value = seatNumber
    selectedPlayerStackSize.value = seatData?.assignment?.stackSize
    selectedPlayerStatus.value = 'SEATED' // Default status for seated players
    showPlayerModal.value = true
  } else {
    // Emit event to parent to show player selection
    emit('selectPlayerForSeat', {
      tableId: props.table.id,
      seatNumber
    })
  }
}

const removeSeatPlayer = (seatNumber: number) => {
  emit('removePlayer', { 
    tableId: props.table.id, 
    seatNumber 
  })
}

// Modal event handlers
const closePlayerModal = () => {
  showPlayerModal.value = false
  selectedPlayer.value = null
  selectedSeatNumber.value = 0
  selectedPlayerStackSize.value = undefined
  selectedPlayerStatus.value = 'SEATED'
}

const handleStatusChanged = (data: { playerId: string, status: string, stackSize?: number }) => {
  emit('statusChanged', data)
  closePlayerModal()
}

const handleMovePlayer = (data: { playerId: string, fromTable: number, fromSeat: number }) => {
  emit('movePlayer', data)
  closePlayerModal()
}
</script>