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
        <button
          v-if="registeredPlayers.length > 0"
          @click="checkInAllPlayers"
          :disabled="checkingInAll"
          class="pp-action-button pp-action-button--secondary"
        >
          <IonIcon
            :icon="checkingInAll ? refreshOutline : checkmarkDoneOutline"
            :class="['icon-sm', checkingInAll && 'pp-animate-spin']"
          />
          {{ checkingInAll ? `${checkInProgress}/${registeredPlayers.length}` : t('buttons.checkInAll') }}
        </button>
        <button
          v-if="canRegisterPlayers"
          @click="$emit('registerPlayer')"
          class="pp-action-button pp-action-button--primary"
        >
          <IonIcon :icon="personAddOutline" class="icon-sm" />
          {{ t('buttons.registerPlayer') }}
        </button>
      </div>
    </div>

    <!-- Players List -->
    <div class="players-list">
      <!-- Column Headers -->
      <div class="column-headers">
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
        <span class="column-header--center">{{ t('labels.status') }}</span>
        <span class="column-header--right">{{ t('labels.actions') }}</span>
      </div>

      <!-- Player Rows -->
      <div class="player-rows">
        <div
          v-for="player in filteredPlayers"
          :key="player.id"
          class="player-row"
        >
          <!-- Name Column -->
          <div class="player-name-col">
            <div class="player-avatar">
              {{ getInitials(player.name) }}
            </div>
            <h3 class="player-name">{{ player.name }}</h3>
          </div>

          <!-- Table / Seat Column -->
          <div class="table-seat-col">
            <span
              v-if="player.tableNumber !== null"
              class="table-seat-badge"
            >
              T{{ player.tableNumber }} / S{{ player.seatNumber }}
            </span>
            <button
              v-else-if="player.status === 'CHECKED_IN'"
              @click="handleSeatPlayer(player)"
              :disabled="seatingPlayer === player.id"
              class="pp-action-button pp-action-button--primary seat-button"
            >
              <IonIcon
                :icon="seatingPlayer === player.id ? refreshOutline : locationOutline"
                :class="['icon-xs', seatingPlayer === player.id && 'pp-animate-spin']"
              />
              {{ t('buttons.seat') }}
            </button>
            <span v-else class="table-seat-empty">&mdash;</span>
          </div>

          <!-- Status Column -->
          <div class="status-col">
            <span :class="['pp-status-badge', getRegistrationStatusClass(player.status)]">
              {{ getRegistrationStatusLabel(player.status, t) }}
            </span>
          </div>

          <!-- Actions Column -->
          <div class="actions-col">
            <!-- Check In Button -->
            <button
              v-if="player.status === 'REGISTERED'"
              @click="checkInPlayer(player.id)"
              :disabled="checkingIn === player.id"
              class="pp-action-button pp-action-button--secondary checkin-button"
            >
              <IonIcon
                :icon="checkingIn === player.id ? refreshOutline : checkmarkCircleOutline"
                :class="['icon-xs', checkingIn === player.id && 'pp-animate-spin']"
              />
              {{ checkingIn === player.id ? t('status.checkingIn') : t('buttons.checkIn') }}
            </button>

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
                class="pp-action-button pp-action-button--ghost menu-button"
              >
                <IonIcon :icon="ellipsisVerticalOutline" class="icon-md" />
              </button>
              <div
                v-if="openMenuId === player.id"
                class="dropdown-menu"
              >
                <button
                  @click="cancelRegistration(player)"
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

  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { searchOutline, personAddOutline, checkmarkCircleOutline, checkmarkDoneOutline, refreshOutline, locationOutline, ellipsisVerticalOutline, trashOutline, swapVerticalOutline } from 'ionicons/icons'
import { AssignmentStrategy } from '@/types/seating'
import { useI18n } from '~/composables/useI18n'
import { getRegistrationStatusLabel, getRegistrationStatusClass } from '~/utils/registrationStatus'
import { EntryType } from '#gql/default'

const { t } = useI18n()
const toast = useToast()
const tournamentStore = useTournamentStore()

const route = useRoute()

// Define emits
const $emit = defineEmits<{
  'player-checked-in': [data: { playerId: string, result: any }]
  'registerPlayer': []
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
  () => GqlGetTournamentPlayers({ tournamentId: selectedTournamentId })
)

// Fetch seating chart to build userId -> seat lookup
const { data: seatingData, refresh: refreshSeating } = await useLazyAsyncData(
  `players-seating-${selectedTournamentId}`,
  () => GqlGetTournamentSeatingChart({ tournamentId: selectedTournamentId })
)

// Build lookup map: userId -> { tableNumber, seatNumber }
const seatLookup = computed(() => {
  const map = new Map<string, { tableNumber: number, seatNumber: number }>()
  const tables = seatingData.value?.tournamentSeatingChart?.tables || []
  for (const tableData of tables) {
    for (const seat of tableData.seats) {
      const userId = seat.assignment?.userId || seat.player?.id
      if (userId) {
        map.set(userId, {
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
const tournamentPlayers = computed(() =>
  playersData.value?.tournamentPlayers?.items || []
)

// Get registered players for "Check In All" button
const registeredPlayers = computed(() =>
  tournamentPlayers.value.filter((tp: any) => tp.registration.status === 'REGISTERED')
)

// Filters and sorting
const playerSearch = ref('')
const playerFilter = ref('all')
const sortBy = ref<'status' | 'table' | 'name'>('status')

const statusPriority: Record<string, number> = {
  'SEATED': 0,
  'CHECKED_IN': 1,
  'REGISTERED': 2,
}

const filteredPlayers = computed(() => {
  return tournamentPlayers.value.filter(tp => {
    const firstName = tp.user.firstName || ''
    const lastName = tp.user.lastName || ''
    const username = tp.user.username || ''
    const displayName = lastName && firstName ? `${lastName} ${firstName}` : `${firstName} ${lastName}`.trim()

    const matchesSearch =
      (displayName || username).toLowerCase().includes(playerSearch.value.toLowerCase()) ||
      tp.user.email.toLowerCase().includes(playerSearch.value.toLowerCase())
    const matchesFilter = playerFilter.value === 'all' || tp.registration.status === playerFilter.value
    return matchesSearch && matchesFilter
  }).map(tp => {
    const firstName = tp.user.firstName || ''
    const lastName = tp.user.lastName || ''
    const username = tp.user.username || ''
    const displayName = lastName && firstName ? `${lastName} ${firstName}` : `${firstName} ${lastName}`.trim()
    const seat = seatLookup.value.get(tp.user.id)
    return {
      id: tp.user.id,
      registrationId: tp.registration.id,
      lastName,
      firstName,
      name: displayName || username || 'Unknown',
      email: tp.user.email,
      status: tp.registration.status,
      registrationTime: tp.registration.registrationTime,
      notes: tp.registration.notes,
      waitlistPosition: tp.registration.waitlistPosition,
      tableNumber: seat?.tableNumber ?? null,
      seatNumber: seat?.seatNumber ?? null,
    }
  }).sort((a, b) => {
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
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// Check in player function
const checkInPlayer = async (playerId: string) => {
  try {
    checkingIn.value = playerId

    const result = await GqlCheckInPlayer({
      input: {
        tournamentId: selectedTournamentId,
        userId: playerId,
        autoAssign: true,
        assignmentStrategy: AssignmentStrategy.BALANCED
      }
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
            entryType: EntryType.INITIAL
          }
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
      }
    })

    await refreshPlayers()

    toast.success(t('toast.seatPlayerSuccess', {
      name: player.name,
      table: bestTable.table.tableNumber,
      seat: seatNumber
    }))

    // Notify parent to refresh tournament data (updates overview card counts)
    $emit('player-checked-in', { playerId: player.id, result: null })
  } catch (error) {
    console.error('Failed to seat player:', error)
    toast.error(t('toast.seatPlayerFailed'))
  } finally {
    seatingPlayer.value = null
  }
}

// Cancel/remove registration
const cancelRegistration = async (player: any) => {
  openMenuId.value = null
  try {
    cancelling.value = player.id
    await GqlCancelRegistration({
      input: {
        tournamentId: selectedTournamentId,
        userId: player.id
      }
    })
    await refreshPlayers()
    toast.success(t('toast.cancelSuccess'))
    $emit('player-checked-in', { playerId: player.id, result: null })
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

  const players = registeredPlayers.value
  if (players.length === 0) return

  checkingInAll.value = true
  checkInProgress.value = 0
  let successCount = 0
  let seatedCount = 0
  let failCount = 0

  for (const tp of players) {
    try {
      const result = await GqlCheckInPlayer({
        input: {
          tournamentId: selectedTournamentId,
          userId: tp.user.id,
          autoAssign: true,
          assignmentStrategy: AssignmentStrategy.BALANCED
        }
      })

      if (result?.checkInPlayer?.seatAssignment) {
        seatedCount++
      }

      // Auto-create initial entry
      try {
        await GqlAddTournamentEntry({
          input: {
            tournamentId: selectedTournamentId,
            userId: tp.user.id,
            entryType: EntryType.INITIAL
          }
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
    toast.warning(t('toast.checkInAllPartial', { success: successCount, total: players.length, failed: failCount }))
  } else if (seatedCount < successCount) {
    const unseated = successCount - seatedCount
    toast.warning(t('toast.checkInAllSomeUnseated', { seated: seatedCount, count: successCount, unseated }))
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
  border: 1px solid var(--pp-border);
  border-radius: 0.5rem;
  color: #ffffff;
  width: 100%;
  background: transparent;
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(254, 231, 138, 0.5);
  border-color: rgba(254, 231, 138, 0.5);
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
  background-color: var(--pp-bg-secondary);
  border-radius: 1rem;
  box-shadow: var(--pp-shadow-sm);
  border: 1px solid var(--pp-border);
}

/* Column Headers */
.column-headers {
  display: grid;
  grid-template-columns: 1fr 7.5rem 7rem auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--pp-border);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--pp-text-secondary);
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
  color: var(--pp-accent-gold);
}

.column-header--center {
  text-align: center;
}

.column-header--right {
  text-align: right;
}

/* Player Rows */
.player-rows > * + * {
  border-top: 1px solid var(--pp-border);
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
  background-color: var(--pp-text-secondary);
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

.table-seat-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid rgba(254, 231, 138, 0.3);
  background-color: rgba(254, 231, 138, 0.1);
  color: var(--pp-accent-gold);
}

.seat-button {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.table-seat-empty {
  font-size: 0.75rem;
  color: var(--pp-text-secondary);
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

.checkin-button {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
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
  padding: 0.75rem;
  font-size: 0.75rem;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.25rem;
  z-index: 50;
  background-color: var(--pp-bg-secondary);
  border: 1px solid var(--pp-border);
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
