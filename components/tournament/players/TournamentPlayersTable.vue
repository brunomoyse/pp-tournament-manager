<template>
  <div class="space-y-6 pb-8">
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
          class="px-4 py-2 bg-pp-text-primary text-pp-bg-primary rounded-lg font-medium flex items-center gap-2 hover:bg-pp-accent-gold hover:text-pp-bg-primary"
        >
          <IonIcon :icon="personAddOutline" class="w-4 h-4" />
          Register Player
        </button>
        <button 
          @click="$emit('walkIn')"
          class="px-4 py-2 border border-pp-text-primary text-pp-text-primary rounded-lg font-medium flex items-center gap-2 hover:bg-pp-text-primary hover:text-pp-bg-primary"
        >
          <IonIcon :icon="personAddOutline" class="w-4 h-4" />
          Walk-in
        </button>
        <button class="px-4 py-2 border border-pp-text-primary text-pp-text-primary rounded-lg font-medium flex items-center gap-2 hover:bg-pp-text-primary hover:text-pp-bg-primary">
          <IonIcon :icon="qrCodeOutline" class="w-4 h-4" />
          QR Check-in
        </button>
      </div>
    </div>

    <!-- Players List -->
    <div class="bg-pp-bg-secondary rounded-2xl shadow-sm border border-pp-border" style="background-color: #24242a !important;">
      <div class="divide-y divide-pp-border max-h-[450px] overflow-y-auto">
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
              'px-2 py-0.5 rounded-full text-xs font-medium',
              getStatusBadgeClass(player.status)
            ]">
              {{ player.status }}
            </span>

            <!-- Action Buttons -->
            <div class="flex items-center gap-1">
              <!-- Check In Button -->
              <button 
                v-if="player.status === 'REGISTERED'"
                @click="checkInPlayer(player.id)"
                :disabled="checkingIn === player.id"
                class="px-2 py-1 border border-pp-text-primary text-pp-text-primary rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-pp-text-primary hover:text-pp-bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IonIcon 
                  :icon="checkingIn === player.id ? refreshOutline : checkmarkCircleOutline" 
                  :class="['w-3 h-3', checkingIn === player.id && 'animate-spin']" 
                />
                {{ checkingIn === player.id ? 'Checking In...' : 'Check In' }}
              </button>
              
              <!-- Undo and Seat Buttons -->
              <template v-else-if="player.status === 'CHECKED_IN'">
                <button class="px-2 py-1 border border-pp-text-primary text-pp-text-primary rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-pp-text-primary hover:text-pp-bg-primary">
                  <IonIcon :icon="refreshOutline" class="w-3 h-3" />
                  Undo
                </button>
                <button class="px-2 py-1 bg-pp-text-primary text-pp-bg-primary rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-pp-accent-gold hover:text-pp-bg-primary">
                  <IonIcon :icon="locationOutline" class="w-3 h-3" />
                  Seat
                </button>
              </template>

              <!-- More Actions Button -->
              <button class="p-1 text-white hover:text-white hover:bg-pp-border rounded-lg">
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

const route = useRoute()

// State
const checkingIn = ref<string | null>(null)

// Fetch tournament players
const selectedTournamentId = route.params.id as string
const playersData = await GqlGetTournamentPlayers({ 
  tournamentId: selectedTournamentId 
})

// Get tournament players from the GraphQL response
const tournamentPlayers = computed(() => 
  playersData?.tournamentPlayers || []
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
      // Immediately update the player status in the local data
      const playerIndex = playersData.tournamentPlayers?.findIndex(tp => tp.user.id === playerId)
      if (playerIndex !== -1 && playersData.tournamentPlayers && result.checkInPlayer.registration) {
        playersData.tournamentPlayers[playerIndex].registration.status = result.checkInPlayer.registration.status
      }
      
      // Show success message if there's a message
      if (result.checkInPlayer.message) {
        console.log('Check-in successful:', result.checkInPlayer.message)
      }
    }
    
  } catch (error) {
    console.error('Failed to check in player:', error)
    // TODO: Show error notification to user
  } finally {
    checkingIn.value = null
  }
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'seated':
      return 'bg-pp-accent-gold/20 text-pp-accent-gold'
    case 'checked-in':
      return 'bg-blue-500/20 text-blue-400'
    case 'registered':
      return 'bg-yellow-500/20 text-yellow-400'
    case 'eliminated':
      return 'bg-red-500/20 text-red-400'
    default:
      return 'bg-pp-border text-pp-text-primary'
  }
}
</script>