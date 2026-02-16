<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-6 shadow-sm border border-pp-border" style="background-color: #24242a !important;" data-table-card>
    <!-- Table Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <h3 class="text-lg font-bold text-pp-text-primary">{{ t('labels.table') }} {{ table.tableNumber }}</h3>
        <span class="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
          {{ t('labels.active').toLowerCase() }}
        </span>
      </div>
      <div class="text-sm text-white/60">
        {{ occupiedSeats }}/{{ table.maxSeats }} {{ t('labels.seatsOccupied') }}
      </div>
    </div>

    <!-- Table Visualization -->
    <div class="relative w-full mx-auto" :style="{ aspectRatio: tableAspectRatio }">
      <!-- Table rail (dark padded edge) -->
      <div class="absolute inset-[8%] rounded-[50%] bg-gradient-to-b from-[#4a4a52] to-[#38383f] shadow-xl border border-[#5a5a62]/30">
        <!-- Table felt (green playing surface) -->
        <div class="absolute inset-[8px] rounded-[50%] bg-gradient-to-br from-[#2d8a40] to-[#1f6830] shadow-inner">
          <!-- Inner felt line -->
          <div class="absolute inset-4 rounded-[50%] border border-white/[0.06]"></div>
          <!-- Center label -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <div class="text-2xl font-bold text-white/15">T{{ table.tableNumber }}</div>
              <div class="text-xs text-white/10">{{ occupiedSeats }}/{{ table.maxSeats }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dealer tray (top center, embedded in the rail) -->
      <div class="absolute left-1/2 -translate-x-1/2 z-20" style="top: 5%;">
        <div class="w-14 h-6 rounded-b-lg bg-[#2a2a32] border border-[#5a5a62]/40 border-t-0 shadow-md flex items-center justify-center">
          <div class="w-8 h-[2px] rounded-full bg-white/10"></div>
        </div>
      </div>

      <!-- Seat positions -->
      <div
        v-for="seatNumber in table.maxSeats"
        :key="seatNumber"
        :style="getSeatStyle(seatNumber)"
        class="absolute z-10"
      >
        <!-- Seat circle -->
        <div
          :class="[
            'w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all cursor-pointer shadow-md',
            getSeatPlayer(seatNumber)
              ? 'bg-pp-accent-gold text-pp-bg-primary border-pp-accent-gold shadow-pp-accent-gold/30'
              : 'bg-[#2a2a32] border-[#5a5a62] text-white/70 hover:border-pp-accent-gold/50'
          ]"
          @click="handleSeatClick(seatNumber)"
        >
          {{ seatNumber }}
        </div>

        <!-- Player name label -->
        <div
          v-if="getSeatPlayer(seatNumber)"
          :class="[
            'absolute text-[10px] font-semibold text-pp-text-primary whitespace-nowrap',
            isTopHalf(seatNumber) ? 'bottom-full mb-1 left-1/2 -translate-x-1/2' : 'top-full mt-1 left-1/2 -translate-x-1/2'
          ]"
        >
          {{ getPlayerDisplayName(getSeatPlayer(seatNumber)) }}
        </div>
      </div>
    </div>

    <!-- Seated Players List -->
    <div class="mt-4">
      <h4 class="text-sm font-semibold text-white mb-3">{{ t('labels.seatedPlayers') }}</h4>
      <div v-if="seatedPlayers.length > 0" class="space-y-2">
        <div
          v-for="seatData in seatedPlayers"
          :key="seatData.assignment.seatNumber"
          class="flex items-center justify-between text-sm"
        >
          <div class="flex items-center gap-2">
            <span class="text-pp-accent-gold font-medium">{{ t('labels.seat') }} {{ seatData.assignment.seatNumber }}:</span>
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
        {{ t('messages.noPlayersSeated') }}
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
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n()

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

// Table aspect ratio
const tableAspectRatio = computed(() => {
  const n = props.table.maxSeats
  if (n <= 6) return '1.8 / 1'
  if (n <= 8) return '2 / 1'
  return '2.2 / 1'
})

// --- Seat position math ---
// Seats are evenly distributed around an ellipse.
// The dealer tray sits at the top center; seats leave a gap there.
// Seat 1 is just clockwise from the dealer (upper-right area).

const seatAngle = (seatNumber: number): number => {
  const n = props.table.maxSeats
  const step = (2 * Math.PI) / n
  // Offset by half-step so no seat sits at top center (dealer tray)
  const startAngle = -Math.PI / 2 + step / 2
  return startAngle + (seatNumber - 1) * step
}

const getSeatStyle = (seatNumber: number) => {
  const angle = seatAngle(seatNumber)
  // Radii match the rail edge (inset-[8%] → 42% from center)
  const rx = 42
  const ry = 42
  const x = 50 + rx * Math.cos(angle)
  const y = 50 + ry * Math.sin(angle)
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)'
  }
}

// Determine if a seat is in the upper half (for name label placement)
const isTopHalf = (seatNumber: number): boolean => {
  const angle = seatAngle(seatNumber)
  const y = Math.sin(angle)
  return y < 0 // negative y = above center in CSS
}

// Helper functions
const getSeatPlayer = (seatNumber: number) => {
  return props.seats?.find(s => s.assignment.seatNumber === seatNumber)?.player
}

const getPlayerDisplayName = (player: any) => {
  if (!player) return ''
  const firstName = player.firstName || ''
  const lastName = player.lastName || ''
  if (firstName && lastName) return `${firstName} ${lastName.charAt(0)}.`
  return firstName || lastName || 'Unknown'
}

const getPlayerFullName = (player: any) => {
  if (!player) return ''
  const firstName = player.firstName || ''
  const lastName = player.lastName || ''
  if (firstName && lastName) return `${firstName} ${lastName}`
  return firstName || lastName || 'Unknown'
}

// Event handlers
const handleSeatClick = (seatNumber: number) => {
  const seatData = props.seats?.find(s => s.assignment.seatNumber === seatNumber)
  const player = seatData?.player

  if (player) {
    selectedPlayer.value = player
    selectedSeatNumber.value = seatNumber
    selectedPlayerStackSize.value = seatData?.assignment?.stackSize
    selectedPlayerStatus.value = 'SEATED'
    showPlayerModal.value = true
  } else {
    emit('selectPlayerForSeat', { tableId: props.table.id, seatNumber })
  }
}

const removeSeatPlayer = (seatNumber: number) => {
  emit('removePlayer', { tableId: props.table.id, seatNumber })
}

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
