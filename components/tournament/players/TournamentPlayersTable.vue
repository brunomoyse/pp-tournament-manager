<template>
  <div class="space-y-6">
    <!-- Players Toolbar -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <!-- Search Input -->
        <div class="relative">
          <IonIcon :icon="searchOutline" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white" />
          <input 
            v-model="playerSearch"
            type="text" 
            :placeholder="t('placeholders.searchPlayers')"
            class="pl-10 pr-4 py-2 border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
          />
        </div>
        
        <!-- Filter Dropdown -->
        <div class="relative">
          <ion-select 
            v-model="playerFilter"
            :placeholder="t('filters.allPlayers')"
            interface="action-sheet"
            class="min-w-32"
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
      <div class="flex items-center gap-3">
        <button
          v-if="registeredPlayers.length > 0"
          @click="checkInAllPlayers"
          :disabled="checkingInAll"
          class="pp-action-button pp-action-button--secondary"
        >
          <IonIcon
            :icon="checkingInAll ? refreshOutline : checkmarkDoneOutline"
            :class="['w-4 h-4', checkingInAll && 'animate-spin']"
          />
          {{ checkingInAll ? `${checkInProgress}/${registeredPlayers.length}` : t('buttons.checkInAll') }}
        </button>
        <button
          v-if="canRegisterPlayers"
          @click="$emit('registerPlayer')"
          class="pp-action-button pp-action-button--primary"
        >
          <IonIcon :icon="personAddOutline" class="w-4 h-4" />
          {{ t('buttons.registerPlayer') }}
        </button>
      </div>
    </div>

    <!-- Players List -->
    <div class="bg-pp-bg-secondary rounded-2xl shadow-sm border border-pp-border" style="background-color: #24242a !important;">
      <!-- Column Headers -->
      <div class="grid grid-cols-[1fr_7.5rem_7rem_auto] items-center gap-2 px-4 py-2 border-b border-pp-border text-xs font-medium text-pp-text-secondary uppercase tracking-wider">
        <button
          @click="sortBy = sortBy === 'name' ? 'status' : 'name'"
          class="flex items-center gap-1 hover:text-white transition-colors"
          :class="sortBy === 'name' && 'text-pp-accent-gold'"
        >
          {{ t('labels.name') }}
          <IonIcon :icon="swapVerticalOutline" class="w-3.5 h-3.5" />
        </button>
        <button
          @click="sortBy = sortBy === 'table' ? 'status' : 'table'"
          class="flex items-center gap-1 justify-center hover:text-white transition-colors"
          :class="sortBy === 'table' && 'text-pp-accent-gold'"
        >
          {{ t('labels.tableSeat') }}
          <IonIcon :icon="swapVerticalOutline" class="w-3.5 h-3.5" />
        </button>
        <span class="text-center">{{ t('labels.status') }}</span>
        <span class="text-right">{{ t('labels.actions') }}</span>
      </div>

      <!-- Player Rows -->
      <div class="divide-y divide-pp-border">
        <div
          v-for="player in filteredPlayers"
          :key="player.id"
          class="grid grid-cols-[1fr_7.5rem_7rem_auto] items-center gap-2 px-4 py-2"
        >
          <!-- Name Column -->
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 shrink-0 bg-pp-text-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">
              {{ getInitials(player.name) }}
            </div>
            <h3 class="font-semibold text-white text-sm truncate">{{ player.name }}</h3>
          </div>

          <!-- Table / Seat Column -->
          <div class="flex justify-center">
            <span
              v-if="player.tableNumber !== null"
              class="px-2 py-0.5 rounded-full text-xs font-medium border bg-pp-accent-gold/10 text-pp-accent-gold border-pp-accent-gold/30"
            >
              T{{ player.tableNumber }} / S{{ player.seatNumber }}
            </span>
            <button
              v-else-if="player.status === 'CHECKED_IN'"
              @click="handleSeatPlayer(player)"
              :disabled="seatingPlayer === player.id"
              class="pp-action-button pp-action-button--primary text-xs px-2 py-1"
            >
              <IonIcon
                :icon="seatingPlayer === player.id ? refreshOutline : locationOutline"
                :class="['w-3 h-3', seatingPlayer === player.id && 'animate-spin']"
              />
              {{ t('buttons.seat') }}
            </button>
            <span v-else class="text-xs text-pp-text-secondary">&mdash;</span>
          </div>

          <!-- Status Column -->
          <div class="flex justify-center">
            <span :class="[
              'px-2 py-0.5 rounded-full text-xs font-medium border',
              getRegistrationStatusClass(player.status)
            ]">
              {{ getRegistrationStatusLabel(player.status, t) }}
            </span>
          </div>

          <!-- Actions Column -->
          <div class="flex items-center justify-end gap-1">
            <!-- Check In Button -->
            <button
              v-if="player.status === 'REGISTERED'"
              @click="checkInPlayer(player.id)"
              :disabled="checkingIn === player.id"
              class="pp-action-button pp-action-button--secondary text-xs px-2 py-1"
            >
              <IonIcon
                :icon="checkingIn === player.id ? refreshOutline : checkmarkCircleOutline"
                :class="['w-3 h-3', checkingIn === player.id && 'animate-spin']"
              />
              {{ checkingIn === player.id ? t('status.checkingIn') : t('buttons.checkIn') }}
            </button>

            <!-- Waitlist Position Badge -->
            <span
              v-if="player.status === 'WAITLISTED' && player.waitlistPosition"
              class="text-xs text-amber-400"
            >
              #{{ player.waitlistPosition }}
            </span>

            <!-- More Actions Dropdown -->
            <div class="relative">
              <button
                @click="toggleMenu(player.id)"
                class="pp-action-button pp-action-button--ghost p-3 text-xs"
              >
                <IonIcon :icon="ellipsisVerticalOutline" class="w-5 h-5" />
              </button>
              <div
                v-if="openMenuId === player.id"
                class="absolute right-0 top-full mt-1 z-50 bg-pp-bg-secondary border border-pp-border rounded-xl shadow-xl min-w-[180px] py-2"
              >
                <button
                  @click="cancelRegistration(player)"
                  :disabled="cancelling === player.id"
                  class="w-full flex items-center gap-3 px-4 py-3 text-base text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
                >
                  <IonIcon
                    :icon="cancelling === player.id ? refreshOutline : trashOutline"
                    :class="['w-5 h-5', cancelling === player.id && 'animate-spin']"
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
            entryType: 'INITIAL'
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
            entryType: 'INITIAL'
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