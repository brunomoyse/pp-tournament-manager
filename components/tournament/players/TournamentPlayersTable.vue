<template>
  <div class="players-container">
    <!-- Players Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <!-- Search Input -->
        <div class="search-wrapper">
          <IonIcon :icon="searchOutline" class="search-icon" />
          <input
            v-model="playerSearch"
            type="text"
            :placeholder="t('placeholders.searchPlayers')"
            class="search-input"
          />
        </div>

        <!-- Filter Dropdown -->
        <div class="filter-wrapper">
          <ion-select
            v-model="playerFilter"
            :placeholder="t('filters.allPlayers')"
            interface="action-sheet"
            class="filter-select"
          >
            <ion-select-option value="all">{{ t('filters.allPlayers') }}</ion-select-option>
            <ion-select-option value="REGISTERED">{{ t('filters.registered') }}</ion-select-option>
            <ion-select-option value="CHECKED_IN">{{ t('filters.checkedIn') }}</ion-select-option>
            <ion-select-option value="SEATED">{{ t('filters.seated') }}</ion-select-option>
            <ion-select-option value="BUSTED">{{ t('filters.eliminated') }}</ion-select-option>
            <ion-select-option value="WAITLISTED">{{ t('filters.waitlisted') }}</ion-select-option>
          </ion-select>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="toolbar-right">
        <PpButton
          v-if="clubPlayers.length > 0"
          variant="secondary"
          :disabled="checkingInAll"
          :loading="checkingInAll"
          @click="checkInAllPlayers"
        >
          <IonIcon v-if="!checkingInAll" :icon="checkmarkDoneOutline" class="icon-sm" />
          {{ checkingInAll ? `${checkInProgress}/${clubPlayers.length}` : t('buttons.checkInAll') }}
        </PpButton>
        <PpButton v-if="canRegisterPlayers" @click="$emit('registerPlayer')">
          <IonIcon :icon="personAddOutline" class="icon-sm" />
          {{ t('buttons.registerPlayer') }}
        </PpButton>
      </div>
    </div>

    <!-- Players List -->
    <div class="players-list" role="table" :aria-label="t('tabs.players')">
      <!-- Column Headers -->
      <div class="column-headers" role="row">
        <button
          @click="sortBy = sortBy === 'name' ? 'status' : 'name'"
          :class="['sort-button', sortBy === 'name' && 'sort-button--active']"
        >
          {{ t('labels.name') }}
          <IonIcon :icon="swapVerticalOutline" class="icon-xs" />
        </button>
        <button
          @click="sortBy = sortBy === 'table' ? 'status' : 'table'"
          :class="['sort-button sort-button--center', sortBy === 'table' && 'sort-button--active']"
        >
          {{ t('labels.tableSeat') }}
          <IonIcon :icon="swapVerticalOutline" class="icon-xs" />
        </button>
        <span role="columnheader" class="column-header--center">{{ t('labels.status') }}</span>
        <span role="columnheader" class="column-header--right">{{ t('labels.actions') }}</span>
      </div>

      <!-- Player Rows -->
      <div class="player-rows" role="rowgroup">
        <div v-for="player in filteredPlayers" :key="player.id" class="player-row" role="row">
          <!-- Name Column -->
          <div class="player-name-col" role="cell">
            <div class="player-avatar">
              {{ getInitials(player.name) }}
            </div>
            <h3 class="player-name">{{ player.name }}</h3>
          </div>

          <!-- Table / Seat Column -->
          <div class="table-seat-col" role="cell">
            <PpBadge v-if="player.tableNumber !== null" variant="gold">
              T{{ player.tableNumber }} / S{{ player.seatNumber }}
            </PpBadge>
            <PpButton
              v-else-if="player.status === 'CHECKED_IN'"
              size="sm"
              :disabled="seatingPlayer === player.id"
              :loading="seatingPlayer === player.id"
              @click="handleSeatPlayer(player)"
            >
              <IonIcon v-if="seatingPlayer !== player.id" :icon="locationOutline" class="icon-xs" />
              {{ t('buttons.seat') }}
            </PpButton>
            <span v-else class="table-seat-empty">&mdash;</span>
          </div>

          <!-- Status Column -->
          <div class="status-col" role="cell">
            <PpBadge :variant="getRegistrationStatusVariant(player.status)">
              {{ getRegistrationStatusLabel(player.status, t) }}
            </PpBadge>
          </div>

          <!-- Actions Column -->
          <div class="actions-col" role="cell">
            <!-- Check In Button -->
            <PpButton
              v-if="player.status === 'REGISTERED'"
              variant="secondary"
              size="sm"
              :disabled="checkingIn === player.id"
              :loading="checkingIn === player.id"
              @click="checkInPlayer(player.id)"
            >
              <IonIcon
                v-if="checkingIn !== player.id"
                :icon="checkmarkCircleOutline"
                class="icon-xs"
              />
              {{ checkingIn === player.id ? t('status.checkingIn') : t('buttons.checkIn') }}
            </PpButton>

            <!-- Waitlist Position Badge -->
            <span
              v-if="player.status === 'WAITLISTED' && player.waitlistPosition"
              class="waitlist-position"
            >
              #{{ player.waitlistPosition }}
            </span>

            <!-- More Actions Dropdown -->
            <div class="dropdown-wrapper">
              <button
                @click="toggleMenu(player.id)"
                class="menu-button"
                :aria-label="t('labels.actions')"
                :aria-expanded="openMenuId === player.id"
              >
                <IonIcon :icon="ellipsisVerticalOutline" class="icon-md" />
              </button>
              <div v-if="openMenuId === player.id" class="dropdown-menu">
                <button
                  @click="requestCancelRegistration(player)"
                  :disabled="cancelling === player.id"
                  class="dropdown-item dropdown-item--danger"
                >
                  <IonIcon
                    :icon="cancelling === player.id ? refreshOutline : trashOutline"
                    :class="['icon-md', cancelling === player.id && 'pp-animate-spin']"
                  />
                  {{ t('buttons.remove') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel registration confirmation -->
    <CancelRegistrationConfirmModal
      :is-open="!!playerToCancel"
      :player-name="playerToCancel?.name ?? ''"
      :processing="cancelling === playerToCancel?.id"
      @close="playerToCancel = null"
      @confirmed="confirmCancelRegistration"
    />
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  searchOutline,
  personAddOutline,
  checkmarkCircleOutline,
  checkmarkDoneOutline,
  refreshOutline,
  locationOutline,
  ellipsisVerticalOutline,
  trashOutline,
  swapVerticalOutline,
} from 'ionicons/icons'
import { AssignmentStrategy } from '@/types/seating'
import { useI18n } from '~/composables/useI18n'
import {
  getRegistrationStatusLabel,
  getRegistrationStatusVariant,
} from '~/utils/registrationStatus'
import { EntryType } from '~/types/enums'
import CancelRegistrationConfirmModal from './CancelRegistrationConfirmModal.vue'

const { t } = useI18n()
const toast = useToast()
const tournamentStore = useTournamentStore()

const route = useRoute()

// Define emits
const $emit = defineEmits<{
  'player-checked-in': [data: { playerId: string; result: any }]
  registerPlayer: []
  'entry-added': []
}>()

// Registration is only allowed up to and including LATE_REGISTRATION
const canRegisterPlayers = computed(() => {
  const status = tournamentStore.tournament?.liveStatus
  if (!status) return true
  const registrationStatuses = ['NOT_STARTED', 'REGISTRATION_OPEN', 'LATE_REGISTRATION']
  return registrationStatuses.includes(status)
})

// State
const checkingIn = ref<string | null>(null)
const checkingInAll = ref(false)
const checkInProgress = ref(0)
const cancelling = ref<string | null>(null)
const openMenuId = ref<string | null>(null)
const playerToCancel = ref<{ id: string; name: string } | null>(null)

const toggleMenu = (playerId: string) => {
  openMenuId.value = openMenuId.value === playerId ? null : playerId
}

// Close menu on click outside
onMounted(() => {
  document.addEventListener('click', (e: MouseEvent) => {
    if (openMenuId.value && !(e.target as HTMLElement).closest('.relative')) {
      openMenuId.value = null
    }
  })
})

// Fetch tournament players with reactive data
const selectedTournamentId = route.params.id as string
const { data: playersData, refresh: refreshPlayersData } = await useLazyAsyncData(
  `players-${selectedTournamentId}`,
  () => GqlGetTournamentPlayers({ tournamentId: selectedTournamentId }),
)

// Fetch seating chart to build userId -> seat lookup
const { data: seatingData, refresh: refreshSeating } = await useLazyAsyncData(
  `players-seating-${selectedTournamentId}`,
  () => GqlGetTournamentSeatingChart({ tournamentId: selectedTournamentId }),
)

// Build lookup map: userId or clubPlayerId -> { tableNumber, seatNumber }
const seatLookup = computed(() => {
  const map = new Map<string, { tableNumber: number; seatNumber: number }>()
  const tables = seatingData.value?.tournamentSeatingChart?.tables || []
  for (const tableData of tables) {
    for (const seat of tableData.seats) {
      // Try userId first, fall back to clubPlayerId (always present)
      const key = seat.assignment?.userId || seat.assignment?.clubPlayerId
      if (key) {
        map.set(key, {
          tableNumber: tableData.table.tableNumber,
          seatNumber: seat.assignment.seatNumber,
        })
      }
    }
  }
  return map
})

// Refresh both players and seating data
const refreshPlayers = async () => {
  await Promise.all([refreshPlayersData(), refreshSeating()])
}

// Get tournament players from the GraphQL response
const tournamentPlayers = computed(() => playersData.value?.tournamentPlayers?.items || [])

// Get registered players for "Check In All" button
const clubPlayers = computed(() =>
  tournamentPlayers.value.filter((tp: any) => tp.registration.status === 'REGISTERED'),
)

// Filters and sorting
const playerSearch = ref('')
const playerFilter = ref('all')
const sortBy = ref<'status' | 'table' | 'name'>('status')

const statusPriority: Record<string, number> = {
  SEATED: 0,
  CHECKED_IN: 1,
  REGISTERED: 2,
}

const filteredPlayers = computed(() => {
  return tournamentPlayers.value
    .filter((tp) => {
      // Prefer displayName, fall back to user fields if available
      const displayName =
        tp.displayName ||
        (tp.user
          ? tp.user.lastName && tp.user.firstName
            ? `${tp.user.lastName} ${tp.user.firstName}`
            : `${tp.user.firstName || ''} ${tp.user.lastName || ''}`.trim()
          : '')
      const username = tp.user?.username || ''
      const email = tp.user?.email || ''

      const matchesSearch =
        (displayName || username).toLowerCase().includes(playerSearch.value.toLowerCase()) ||
        email.toLowerCase().includes(playerSearch.value.toLowerCase())
      const matchesFilter =
        playerFilter.value === 'all' || tp.registration.status === playerFilter.value
      return matchesSearch && matchesFilter
    })
    .map((tp) => {
      // Use displayName directly, fall back to building from user fields
      const displayNameFinal =
        tp.displayName ||
        (tp.user
          ? tp.user.lastName && tp.user.firstName
            ? `${tp.user.lastName} ${tp.user.firstName}`
            : `${tp.user.firstName || ''} ${tp.user.lastName || ''}`.trim()
          : '')
      const firstName = tp.user?.firstName || ''
      const lastName = tp.user?.lastName || ''
      const username = tp.user?.username || ''
      const email = tp.user?.email || ''

      // Use userId if available, otherwise use clubPlayerId (always present)
      const playerId = tp.user?.id || tp.registration.clubPlayerId
      const seat = seatLookup.value.get(playerId)

      return {
        id: playerId,
        registrationId: tp.registration.id,
        lastName,
        firstName,
        name: displayNameFinal || username || email || 'Unknown',
        email,
        status: tp.registration.status,
        registrationTime: tp.registration.registrationTime,
        notes: tp.registration.notes,
        waitlistPosition: tp.registration.waitlistPosition,
        tableNumber: seat?.tableNumber ?? null,
        seatNumber: seat?.seatNumber ?? null,
      }
    })
    .toSorted((a, b) => {
      if (sortBy.value === 'name') {
        const lastNameCmp = a.lastName.localeCompare(b.lastName)
        if (lastNameCmp !== 0) return lastNameCmp
        return a.firstName.localeCompare(b.firstName)
      }
      if (sortBy.value === 'table') {
        const aSeated = a.tableNumber !== null ? 0 : 1
        const bSeated = b.tableNumber !== null ? 0 : 1
        if (aSeated !== bSeated) return aSeated - bSeated
        if (a.tableNumber !== b.tableNumber) return (a.tableNumber ?? 99) - (b.tableNumber ?? 99)
        if (a.seatNumber !== b.seatNumber) return (a.seatNumber ?? 99) - (b.seatNumber ?? 99)
        return a.lastName.localeCompare(b.lastName)
      }
      const statusDiff = (statusPriority[a.status] ?? 3) - (statusPriority[b.status] ?? 3)
      if (statusDiff !== 0) return statusDiff
      const lastNameCmp = a.lastName.localeCompare(b.lastName)
      if (lastNameCmp !== 0) return lastNameCmp
      return a.firstName.localeCompare(b.firstName)
    })
})

// Helper functions
const getInitials = (name: string | null | undefined) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Check in player function
const checkInPlayer = async (playerId: string) => {
  try {
    checkingIn.value = playerId

    // playerId here is either userId or clubPlayerId; pass it as userId for the mutation
    const result = await GqlCheckInPlayer({
      input: {
        tournamentId: selectedTournamentId,
        userId: playerId,
        autoAssign: true,
        assignmentStrategy: AssignmentStrategy.BALANCED,
      },
    })

    if (result?.checkInPlayer) {
      const wasSeated = !!result.checkInPlayer.seatAssignment

      // Refresh the players data to get updated information
      await refreshPlayers()

      // Auto-create initial entry
      let entrySuccess = true
      try {
        await GqlAddTournamentEntry({
          input: {
            tournamentId: selectedTournamentId,
            userId: playerId,
            entryType: EntryType.INITIAL,
          },
        })
      } catch {
        entrySuccess = false
      }

      // Notify prize pool to refresh when entry was created
      if (entrySuccess) {
        $emit('entry-added')
      }

      if (!wasSeated) {
        toast.warning(t('toast.checkInNoSeat'))
      } else if (entrySuccess) {
        toast.success(t('toast.checkInAndEntrySuccess'))
      } else {
        toast.warning(t('toast.checkInSuccessEntryFailed'))
      }

      // Emit event to notify parent components that players data has changed
      $emit('player-checked-in', { playerId, result: result.checkInPlayer })
    }
  } catch (error) {
    console.error('Failed to check in player:', error)
    toast.error(t('toast.checkInFailed'))
  } finally {
    checkingIn.value = null
  }
}

// Handle seat player button click - auto-assign to best available seat
const seatingPlayer = ref<string | null>(null)

const handleSeatPlayer = async (player: any) => {
  const tables = seatingData.value?.tournamentSeatingChart?.tables || []

  if (tables.length === 0) {
    toast.error(t('toast.noTablesForSeating'))
    return
  }

  // Find best table (balanced: fewest players)
  let bestTable: any = null
  let bestCount = Infinity

  for (const tableData of tables) {
    const occupiedCount = tableData.seats.length
    const maxSeats = tableData.table.maxSeats
    if (occupiedCount < maxSeats && occupiedCount < bestCount) {
      bestCount = occupiedCount
      bestTable = tableData
    }
  }

  if (!bestTable) {
    toast.error(t('toast.noSeatsAvailable'))
    return
  }

  // Find available seat number
  const occupiedSeats = new Set(bestTable.seats.map((s: any) => s.assignment.seatNumber))
  let seatNumber: number | null = null
  for (let i = 1; i <= bestTable.table.maxSeats; i++) {
    if (!occupiedSeats.has(i)) {
      seatNumber = i
      break
    }
  }

  if (seatNumber === null) {
    toast.error(t('toast.noSeatsAvailable'))
    return
  }

  try {
    seatingPlayer.value = player.id
    await GqlAssignPlayerToSeat({
      input: {
        tournamentId: selectedTournamentId,
        clubTableId: bestTable.table.id,
        userId: player.id,
        seatNumber,
      },
    })

    await refreshPlayers()

    toast.success(
      t('toast.seatPlayerSuccess', {
        name: player.name,
        table: bestTable.table.tableNumber,
        seat: seatNumber,
      }),
    )

    // Notify parent to refresh tournament data (updates overview card counts)
    $emit('player-checked-in', { playerId: player.id, result: null })
  } catch (error) {
    console.error('Failed to seat player:', error)
    toast.error(t('toast.seatPlayerFailed'))
  } finally {
    seatingPlayer.value = null
  }
}

// Cancel/remove registration - open the confirmation modal first (Agency: double-check
// before a destructive action) instead of mutating straight from the dropdown.
const requestCancelRegistration = (player: { id: string; name: string }) => {
  openMenuId.value = null
  playerToCancel.value = { id: player.id, name: player.name }
}

const confirmCancelRegistration = async () => {
  const player = playerToCancel.value
  if (!player) return
  try {
    cancelling.value = player.id
    await GqlCancelRegistration({
      input: {
        tournamentId: selectedTournamentId,
        userId: player.id,
      },
    })
    await refreshPlayers()
    toast.success(t('toast.cancelSuccess'))
    $emit('player-checked-in', { playerId: player.id, result: null })
    playerToCancel.value = null
  } catch (error) {
    console.error('Failed to cancel registration:', error)
    toast.error(t('toast.cancelFailed'))
  } finally {
    cancelling.value = null
  }
}

// Expose refresh methods so parent can trigger a refresh
defineExpose({ refreshPlayers })

// Check in all registered players
const checkInAllPlayers = async () => {
  if (checkingInAll.value) return

  const players = clubPlayers.value
  if (players.length === 0) return

  checkingInAll.value = true
  checkInProgress.value = 0
  let successCount = 0
  let seatedCount = 0
  let failCount = 0

  for (const tp of players) {
    try {
      // Use userId if available, otherwise use clubPlayerId
      const playerId = tp.user?.id || tp.registration.clubPlayerId
      const result = await GqlCheckInPlayer({
        input: {
          tournamentId: selectedTournamentId,
          userId: playerId,
          autoAssign: true,
          assignmentStrategy: AssignmentStrategy.BALANCED,
        },
      })

      if (result?.checkInPlayer?.seatAssignment) {
        seatedCount++
      }

      // Auto-create initial entry
      try {
        await GqlAddTournamentEntry({
          input: {
            tournamentId: selectedTournamentId,
            userId: playerId,
            entryType: EntryType.INITIAL,
          },
        })
      } catch {
        // Entry failure is non-blocking
      }

      successCount++
    } catch {
      failCount++
    }
    checkInProgress.value++
  }

  await refreshPlayers()

  if (failCount > 0) {
    toast.warning(
      t('toast.checkInAllPartial', {
        success: successCount,
        total: players.length,
        failed: failCount,
      }),
    )
  } else if (seatedCount < successCount) {
    const unseated = successCount - seatedCount
    toast.warning(
      t('toast.checkInAllSomeUnseated', { seated: seatedCount, count: successCount, unseated }),
    )
  } else {
    toast.success(t('toast.checkInAllSuccess', { count: successCount }))
  }

  $emit('player-checked-in', { playerId: '', result: null })
  $emit('entry-added')
  checkingInAll.value = false
}
</script>

<style scoped>
/* Icon sizes */
.icon-xs {
  width: 0.75rem;
  height: 0.75rem;
}

.icon-sm {
  width: 1rem;
  height: 1rem;
}

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

/* Container */
.players-container > * + * {
  margin-top: 1.5rem;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Search */
.search-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: #ffffff;
}

.search-input {
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  border: 1px solid var(--color-pp-border-strong);
  border-radius: 0.5rem;
  color: #ffffff;
  width: 100%;
  background: transparent;
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--pp-accent-rgb), 0.4);
  border-color: var(--color-pp-gold);
}

@media (min-width: 640px) {
  .search-input {
    width: 16rem;
  }
}

/* Filter */
.filter-wrapper {
  position: relative;
}

.filter-select {
  min-width: 8rem;
}

/* Players List */
.players-list {
  background-color: var(--color-pp-surface-2);
  border-radius: 1rem;
  box-shadow: var(--pp-shadow-sm);
  border: 1px solid var(--color-pp-border-strong);
}

/* Column Headers */
.column-headers {
  display: grid;
  grid-template-columns: 1fr 7.5rem 7rem auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--color-pp-border-strong);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-pp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sort-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: inherit;
  cursor: pointer;
  transition: color 0.15s ease;
}

.sort-button:hover {
  color: #ffffff;
}

.sort-button--center {
  justify-content: center;
}

.sort-button--active {
  color: var(--color-pp-gold);
}

.column-header--center {
  text-align: center;
}

.column-header--right {
  text-align: right;
}

/* Player Rows */
.player-rows > * + * {
  border-top: 1px solid var(--color-pp-border-strong);
}

.player-row {
  display: grid;
  grid-template-columns: 1fr 7.5rem 7rem auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
}

/* Name Column */
.player-name-col {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.player-avatar {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  background-color: var(--color-pp-text-muted);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.875rem;
}

.player-name {
  font-weight: 600;
  color: #ffffff;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Table / Seat Column */
.table-seat-col {
  display: flex;
  justify-content: center;
}

.table-seat-empty {
  font-size: 0.75rem;
  color: var(--color-pp-text-muted);
}

/* Status Column */
.status-col {
  display: flex;
  justify-content: center;
}

/* Actions Column */
.actions-col {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
}

.waitlist-position {
  font-size: 0.75rem;
  color: var(--pp-amber-400);
}

/* Dropdown */
.dropdown-wrapper {
  position: relative;
}

.menu-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  border-radius: 9999px;
  color: var(--color-pp-text-muted);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.menu-button:hover {
  color: var(--color-pp-text);
  background-color: rgba(255, 255, 255, 0.05);
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.25rem;
  z-index: 50;
  background-color: var(--color-pp-surface-2);
  border: 1px solid var(--color-pp-border-strong);
  border-radius: 0.75rem;
  box-shadow: var(--pp-shadow-xl);
  min-width: 180px;
  padding: 0.5rem 0;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: background-color 0.15s ease;
  cursor: pointer;
}

.dropdown-item--danger {
  color: var(--pp-red-400);
}

.dropdown-item--danger:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.dropdown-item--danger:active {
  background-color: rgba(239, 68, 68, 0.2);
}
</style>
