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
      <div class="divide-y divide-pp-border">
        <div 
          v-for="player in filteredPlayers" 
          :key="player.id"
          class="p-2 flex items-center justify-between"
        >
          <!-- Player Info -->
          <div class="flex items-center gap-3">
            <!-- Avatar -->
            <div class="w-8 h-8 bg-pp-text-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">
              {{ getInitials(player.name) }}
            </div>
            
            <!-- Player Details -->
            <div>
              <h3 class="font-semibold text-white text-sm">{{ player.name }}</h3>
            </div>
          </div>

          <!-- Status and Actions -->
          <div class="flex items-center gap-3">
            <!-- Status Badge -->
            <span :class="[
              'px-2 py-0.5 rounded-full text-xs font-medium border',
              getRegistrationStatusClass(player.status)
            ]">
              {{ getRegistrationStatusLabel(player.status, t) }}
            </span>

            <!-- Action Buttons -->
            <div class="flex items-center gap-1">
              <!-- QR Code Button for REGISTERED players -->
              <button
                v-if="player.status === 'REGISTERED'"
                @click="$emit('showQRCode', player)"
                class="pp-action-button pp-action-button--primary text-xs px-2 py-1"
              >
                <IonIcon :icon="qrCodeOutline" class="w-3 h-3" />
                {{ t('buttons.qrCode') }}
              </button>

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
              
              <!-- Undo and Seat Buttons -->
              <template v-else-if="player.status === 'CHECKED_IN'">
                <button class="pp-action-button pp-action-button--secondary text-xs px-2 py-1">
                  <IonIcon :icon="refreshOutline" class="w-3 h-3" />
                  {{ t('buttons.undo') }}
                </button>
                <button
                  @click="handleSeatPlayer(player)"
                  class="pp-action-button pp-action-button--primary text-xs px-2 py-1"
                >
                  <IonIcon :icon="locationOutline" class="w-3 h-3" />
                  {{ t('buttons.seat') }}
                </button>
              </template>

              <!-- Rebuy / Add-on Buttons for SEATED players -->
              <template v-if="player.status === 'SEATED'">
                <button
                  @click="openEntryModal(player, 'REBUY')"
                  class="pp-action-button pp-action-button--secondary text-xs px-2 py-1"
                >
                  <IonIcon :icon="cashOutline" class="w-3 h-3" />
                  {{ t('entries.rebuy') }}
                </button>
                <button
                  @click="openEntryModal(player, 'ADDON')"
                  class="pp-action-button pp-action-button--secondary text-xs px-2 py-1"
                >
                  <IonIcon :icon="addCircleOutline" class="w-3 h-3" />
                  {{ t('entries.addon') }}
                </button>
              </template>

              <!-- Cancel Button for REGISTERED and WAITLISTED players -->
              <button
                v-if="player.status === 'REGISTERED' || player.status === 'WAITLISTED'"
                @click="cancelRegistration(player)"
                :disabled="cancelling === player.id"
                class="pp-action-button pp-action-button--danger text-xs px-2 py-1"
              >
                <IonIcon
                  :icon="cancelling === player.id ? refreshOutline : closeCircleOutline"
                  :class="['w-3 h-3', cancelling === player.id && 'animate-spin']"
                />
                {{ t('buttons.cancel') }}
              </button>

              <!-- Waitlist Position Badge -->
              <span
                v-if="player.status === 'WAITLISTED' && player.waitlistPosition"
                class="text-xs text-amber-400"
              >
                #{{ player.waitlistPosition }}
              </span>

              <!-- More Actions Button -->
              <button class="pp-action-button pp-action-button--ghost p-1 text-xs">
                <IonIcon :icon="ellipsisVerticalOutline" class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Entry Modal -->
    <AddEntryModal
      :is-open="showAddEntryModal"
      :tournament-id="selectedTournamentId"
      :player="selectedPlayerForEntry"
      :default-amount-cents="defaultAmountCents"
      :default-entry-type="defaultEntryType"
      @close="showAddEntryModal = false"
      @entry-added="handleEntryAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { searchOutline, personAddOutline, qrCodeOutline, checkmarkCircleOutline, checkmarkDoneOutline, refreshOutline, locationOutline, ellipsisVerticalOutline, cashOutline, addCircleOutline, closeCircleOutline } from 'ionicons/icons'
import AddEntryModal from '~/components/tournament/entries/AddEntryModal.vue'
import type { EntryType } from '~/types/tournament'
import { AssignmentStrategy } from '@/types/seating'
import { useI18n } from '~/composables/useI18n'
import { getRegistrationStatusLabel, getRegistrationStatusClass } from '~/utils/registrationStatus'

const { t } = useI18n()
const toast = useToast()

const route = useRoute()

// Define emits
const $emit = defineEmits<{
  'player-checked-in': [data: { playerId: string, result: any }]
  'seat-player': [data: { playerId: string, playerName: string }]
  'registerPlayer': []
  'showQRCode': [player: any]
  'entry-added': []
}>()

// State
const checkingIn = ref<string | null>(null)
const checkingInAll = ref(false)
const checkInProgress = ref(0)
const cancelling = ref<string | null>(null)

// Entry modal state
const showAddEntryModal = ref(false)
const selectedPlayerForEntry = ref<{ id: string; name: string } | null>(null)
const defaultEntryType = ref<EntryType>('REBUY')
const defaultAmountCents = ref(0)

// Fetch tournament players with reactive data
const selectedTournamentId = route.params.id as string
const { data: playersData, refresh: refreshPlayers } = await useLazyAsyncData(
  `players-${selectedTournamentId}`,
  () => GqlGetTournamentPlayers({ tournamentId: selectedTournamentId })
)

// Get tournament players from the GraphQL response
const tournamentPlayers = computed(() =>
  playersData.value?.tournamentPlayers?.items || []
)

// Get registered players for "Check In All" button
const registeredPlayers = computed(() =>
  tournamentPlayers.value.filter((tp: any) => tp.registration.status === 'REGISTERED')
)

// Filters
const playerSearch = ref('')
const playerFilter = ref('all')

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
      waitlistPosition: tp.registration.waitlistPosition
    }
  }).sort((a, b) => {
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

      if (entrySuccess) {
        toast.success(t('toast.checkInAndEntrySuccess'))
        $emit('entry-added')
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

// Handle seat player button click
const handleSeatPlayer = (player: any) => {
  $emit('seat-player', {
    playerId: player.id,
    playerName: player.name
  })
}

// Open entry modal for a player
const openEntryModal = (player: any, entryType: EntryType) => {
  selectedPlayerForEntry.value = { id: player.id, name: player.name }
  defaultEntryType.value = entryType
  showAddEntryModal.value = true
}

// Handle entry added
const handleEntryAdded = () => {
  showAddEntryModal.value = false
  $emit('entry-added')
}

// Cancel registration
const cancelRegistration = async (player: any) => {
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

// Check in all registered players
const checkInAllPlayers = async () => {
  if (checkingInAll.value) return

  const players = registeredPlayers.value
  if (players.length === 0) return

  checkingInAll.value = true
  checkInProgress.value = 0
  let successCount = 0
  let failCount = 0

  for (const tp of players) {
    try {
      await GqlCheckInPlayer({
        input: {
          tournamentId: selectedTournamentId,
          userId: tp.user.id,
          autoAssign: true,
          assignmentStrategy: AssignmentStrategy.BALANCED
        }
      })

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

  if (failCount === 0) {
    toast.success(t('toast.checkInAllSuccess', { count: successCount }))
  } else {
    toast.warning(t('toast.checkInAllPartial', { success: successCount, total: players.length, failed: failCount }))
  }

  $emit('player-checked-in', { playerId: '', result: null })
  $emit('entry-added')
  checkingInAll.value = false
}

</script>