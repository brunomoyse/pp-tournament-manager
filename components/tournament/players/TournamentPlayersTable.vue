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
            placeholder="Search players..."
            class="pl-10 pr-4 py-2 border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
          />
        </div>
        
        <!-- Filter Dropdown -->
        <div class="relative">
          <ion-select 
            v-model="playerFilter"
            placeholder="All Players"
            interface="action-sheet"
            class="min-w-32"
          >
            <ion-select-option value="all">All Players</ion-select-option>
            <ion-select-option value="registered">Registered</ion-select-option>
            <ion-select-option value="checked-in">Checked In</ion-select-option>
            <ion-select-option value="seated">Seated</ion-select-option>
            <ion-select-option value="eliminated">Eliminated</ion-select-option>
          </ion-select>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3">
        <button 
          @click="$emit('registerPlayer')"
          class="pp-action-button pp-action-button--primary"
        >
          <IonIcon :icon="personAddOutline" class="w-4 h-4" />
          Register Player
        </button>
        <button
          @click="$emit('qrCheckin')"
          class="pp-action-button pp-action-button--secondary"
        >
          <IonIcon :icon="qrCodeOutline" class="w-4 h-4" />
          QR Check-in
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
              {{ getRegistrationStatusLabel(player.status) }}
            </span>

            <!-- Action Buttons -->
            <div class="flex items-center gap-1">
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
                {{ checkingIn === player.id ? 'Checking In...' : 'Check In' }}
              </button>
              
              <!-- Undo and Seat Buttons -->
              <template v-else-if="player.status === 'CHECKED_IN'">
                <button class="pp-action-button pp-action-button--secondary text-xs px-2 py-1">
                  <IonIcon :icon="refreshOutline" class="w-3 h-3" />
                  Undo
                </button>
                <button 
                  @click="handleSeatPlayer(player)"
                  class="pp-action-button pp-action-button--primary text-xs px-2 py-1"
                >
                  <IonIcon :icon="locationOutline" class="w-3 h-3" />
                  Seat
                </button>
              </template>

              <!-- More Actions Button -->
              <button class="pp-action-button pp-action-button--ghost p-1 text-xs">
                <IonIcon :icon="ellipsisVerticalOutline" class="w-3 h-3" />
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
import { searchOutline, personAddOutline, qrCodeOutline, checkmarkCircleOutline, refreshOutline, locationOutline, ellipsisVerticalOutline } from 'ionicons/icons'
import { AssignmentStrategy } from '@/types/seating'
import { getRegistrationStatusLabel, getRegistrationStatusClass } from '~/utils/registrationStatus'

const route = useRoute()

// Define emits
const $emit = defineEmits<{
  'player-checked-in': [data: { playerId: string, result: any }]
  'seat-player': [data: { playerId: string, playerName: string }]
  'registerPlayer': []
  'qrCheckin': []
}>()

// State
const checkingIn = ref<string | null>(null)

// Fetch tournament players with reactive data
const selectedTournamentId = route.params.id as string
const { data: playersData, refresh: refreshPlayers } = await useLazyAsyncData(
  `players-${selectedTournamentId}`,
  () => GqlGetTournamentPlayers({ tournamentId: selectedTournamentId })
)

// Get tournament players from the GraphQL response
const tournamentPlayers = computed(() => 
  playersData.value?.tournamentPlayers || []
)

// Filters
const playerSearch = ref('')
const playerFilter = ref('all')

const filteredPlayers = computed(() => {
  return tournamentPlayers.value.filter(tp => {
    const firstName = tp.user.firstName || ''
    const lastName = tp.user.lastName || ''
    const username = tp.user.username || ''
    const fullName = `${firstName} ${lastName}`.trim()
    const player = {
      id: tp.user.id,
      name: fullName || username || 'Unknown',
      email: tp.user.email,
      status: tp.registration.status
    }
    
    const matchesSearch =
      player.name.toLowerCase().includes(playerSearch.value.toLowerCase()) ||
      player.email.toLowerCase().includes(playerSearch.value.toLowerCase())
    const matchesFilter = playerFilter.value === 'all' || player.status === playerFilter.value
    return matchesSearch && matchesFilter
  }).map(tp => {
    const firstName = tp.user.firstName || ''
    const lastName = tp.user.lastName || ''
    const username = tp.user.username || ''
    const fullName = `${firstName} ${lastName}`.trim()
    return {
      id: tp.user.id,
      name: fullName || username || 'Unknown',
      email: tp.user.email,
      status: tp.registration.status,
      registrationTime: tp.registration.registrationTime,
      notes: tp.registration.notes
    }
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
      
      // Show success message if there's a message
      if (result.checkInPlayer.message) {
        console.log('Check-in successful:', result.checkInPlayer.message)
      }
      
      // Emit event to notify parent components that players data has changed
      $emit('player-checked-in', { playerId, result: result.checkInPlayer })
    }
    
  } catch (error) {
    console.error('Failed to check in player:', error)
    // TODO: Show error notification to user
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

</script>