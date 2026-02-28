<template>
  <div class="table-card" data-table-card>
    <!-- Table Header -->
    <div class="table-card__header">
      <div class="table-card__header-left">
        <h3 class="table-card__title">{{ t('labels.table') }} {{ table.tableNumber }}</h3>
        <span class="table-card__active-badge">
          {{ t('labels.active').toLowerCase() }}
        </span>
      </div>
      <div class="table-card__seat-count">
        {{ occupiedSeats }}/{{ table.maxSeats }} {{ t('labels.seatsOccupied') }}
      </div>
    </div>

    <!-- Table Visualization -->
    <div class="table-card__visualization" :style="{ aspectRatio: tableAspectRatio }">
      <!-- Table rail (dark padded edge) -->
      <div class="table-card__rail">
        <!-- Table felt (green playing surface) with texture -->
        <div class="table-card__felt felt-texture">
          <!-- Inner felt line -->
          <div class="table-card__felt-inner"></div>
          <!-- Center label -->
          <div class="table-card__center-label">
            <div class="table-card__center-number">T{{ table.tableNumber }}</div>
            <div class="table-card__center-seats">{{ occupiedSeats }}/{{ table.maxSeats }}</div>
          </div>
        </div>
      </div>

      <!-- Dealer tray (top center, embedded in the rail) -->
      <div class="table-card__dealer-tray-wrapper">
        <div class="table-card__dealer-tray">
          <div class="table-card__dealer-tray-line"></div>
        </div>
      </div>

      <!-- Seat positions -->
      <div
        v-for="seatNumber in table.maxSeats"
        :key="seatNumber"
        :style="getSeatStyle(seatNumber)"
        class="table-card__seat-wrapper"
      >
        <!-- Seat circle -->
        <div
          :class="[
            'table-card__seat',
            getSeatPlayer(seatNumber)
              ? 'table-card__seat--occupied'
              : 'table-card__seat--empty'
          ]"
          @click="handleSeatClick(seatNumber)"
        >
          {{ seatNumber }}
        </div>

        <!-- Player name label -->
        <div
          v-if="getSeatPlayer(seatNumber)"
          :class="[
            'table-card__player-label',
            isTopHalf(seatNumber) ? 'table-card__player-label--top' : 'table-card__player-label--bottom'
          ]"
        >
          {{ getPlayerDisplayName(getSeatPlayer(seatNumber)) }}
        </div>
      </div>
    </div>

    <!-- Seated Players List -->
    <div class="table-card__players-list">
      <h4 class="table-card__players-title">{{ t('labels.seatedPlayers') }}</h4>
      <div v-if="seatedPlayers.length > 0" class="table-card__players-items">
        <button
          v-for="seatData in seatedPlayers"
          :key="seatData.assignment.seatNumber"
          class="table-card__player-row"
          @click="openPlayerModal(seatData.assignment.seatNumber)"
        >
          <div class="table-card__player-info">
            <span class="table-card__player-seat">{{ t('labels.seat') }} {{ seatData.assignment.seatNumber }}:</span>
            <span class="table-card__player-name">{{ getPlayerFullName(seatData.player) }}</span>
          </div>
          <IonIcon :icon="chevronForwardOutline" class="table-card__player-chevron" />
        </button>
      </div>
      <div v-else class="table-card__no-players">
        {{ t('messages.noPlayersSeated') }}
      </div>
    </div>

    <!-- Player Action Modal -->
    <PlayerActionModal
      :is-open="showPlayerModal"
      :player="selectedPlayer"
      :table-number="table.tableNumber"
      :seat-number="selectedSeatNumber"
      :current-status="selectedPlayerStatus"
      @close="closePlayerModal"
      @status-changed="handleStatusChanged"
      @move-player="handleMovePlayer"
    />
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { chevronForwardOutline } from 'ionicons/icons'
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
    userId: string
    seatNumber: number
    stackSize?: number | null
  }
  player: {
    id: string
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
  statusChanged: [data: { playerId: string, status: string }]
  movePlayer: [data: { playerId: string, fromTable: number, fromSeat: number }]
  selectPlayerForSeat: [data: { tableId: string, seatNumber: number }]
}>()

// Modal state
const showPlayerModal = ref(false)
const selectedPlayer = ref<any>(null)
const selectedSeatNumber = ref(0)
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
const openPlayerModal = (seatNumber: number) => {
  const seatData = props.seats?.find(s => s.assignment.seatNumber === seatNumber)
  const player = seatData?.player
  if (!player) return

  selectedPlayer.value = player
  selectedSeatNumber.value = seatNumber
  selectedPlayerStatus.value = 'SEATED'
  showPlayerModal.value = true
}

const handleSeatClick = (seatNumber: number) => {
  const player = getSeatPlayer(seatNumber)

  if (player) {
    openPlayerModal(seatNumber)
  } else {
    emit('selectPlayerForSeat', { tableId: props.table.id, seatNumber })
  }
}

const closePlayerModal = () => {
  showPlayerModal.value = false
  selectedPlayer.value = null
  selectedSeatNumber.value = 0
  selectedPlayerStatus.value = 'SEATED'
}

const handleStatusChanged = (data: { playerId: string, status: string }) => {
  emit('statusChanged', data)
  closePlayerModal()
}

const handleMovePlayer = (data: { playerId: string, fromTable: number, fromSeat: number }) => {
  emit('movePlayer', data)
  closePlayerModal()
}
</script>

<style scoped>
.table-card {
  background-color: var(--pp-bg-secondary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--pp-shadow-sm);
  border: 1px solid var(--pp-border);
}

/* Header */
.table-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.table-card__header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.table-card__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--pp-text-primary);
}

.table-card__active-badge {
  padding: 0.25rem 0.5rem;
  background-color: rgba(34, 197, 94, 0.2);
  color: var(--pp-green-400);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.table-card__seat-count {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Table Visualization */
.table-card__visualization {
  position: relative;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.table-card__rail {
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  background: linear-gradient(to bottom, #4a4a52, #38383f);
  box-shadow: var(--pp-shadow-xl);
  border: 1px solid rgba(90, 90, 98, 0.3);
}

.table-card__felt {
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: linear-gradient(to bottom right, #2d8a40, #1f6830);
  box-shadow: var(--pp-shadow-inner);
}

.table-card__felt-inner {
  position: absolute;
  inset: 1rem;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.table-card__center-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-card__center-label > div {
  text-align: center;
}

.table-card__center-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.15);
}

.table-card__center-seats {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.1);
}

/* Dealer tray */
.table-card__dealer-tray-wrapper {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  top: 5%;
}

.table-card__dealer-tray {
  width: 3.5rem;
  height: 1.5rem;
  border-radius: 0 0 0.5rem 0.5rem;
  background-color: #2a2a32;
  border: 1px solid rgba(90, 90, 98, 0.4);
  border-top: 0;
  box-shadow: var(--pp-shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-card__dealer-tray-line {
  width: 2rem;
  height: 2px;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.1);
}

/* Seat positions */
.table-card__seat-wrapper {
  position: absolute;
  z-index: 10;
}

.table-card__seat {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  transition: all 0.3s ease;
  cursor: pointer;
}

.table-card__seat--occupied {
  background-color: var(--pp-accent-gold);
  color: var(--pp-bg-primary);
  border-color: var(--pp-accent-gold);
  box-shadow: 0 0 12px rgba(254, 231, 138, 0.4);
  transform: scale(1.05);
}

.table-card__seat--empty {
  background-color: #2a2a32;
  border-color: #5a5a62;
  color: rgba(255, 255, 255, 0.7);
  box-shadow: var(--pp-shadow-md);
}

@media (hover: hover) {
  .table-card__seat--empty:hover {
    border-color: rgba(254, 231, 138, 0.5);
    box-shadow: var(--pp-shadow-lg);
  }
}

/* Player name labels */
.table-card__player-label {
  position: absolute;
  font-size: 10px;
  font-weight: 600;
  color: var(--pp-text-primary);
  white-space: nowrap;
  left: 50%;
  transform: translateX(-50%);
}

.table-card__player-label--top {
  bottom: 100%;
  margin-bottom: 0.25rem;
}

.table-card__player-label--bottom {
  top: 100%;
  margin-top: 0.25rem;
}

/* Seated Players List */
.table-card__players-list {
  margin-top: 1rem;
}

.table-card__players-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.75rem;
}

.table-card__players-items > * + * {
  margin-top: 0.5rem;
}

.table-card__player-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  transition: background-color 0.15s ease;
  cursor: pointer;
  text-align: left;
}

@media (hover: hover) {
  .table-card__player-row:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

.table-card__player-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.table-card__player-seat {
  color: var(--pp-accent-gold);
  font-weight: 500;
}

.table-card__player-name {
  color: #ffffff;
}

.table-card__player-chevron {
  width: 1rem;
  height: 1rem;
  color: rgba(255, 255, 255, 0.4);
}

.table-card__no-players {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
}

/* Subtle felt noise texture overlay */
.felt-texture::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0.15;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  background-size: 100px 100px;
  pointer-events: none;
}
</style>
