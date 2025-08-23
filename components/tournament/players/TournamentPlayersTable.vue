<template>
  <div class="space-y-8">
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
      <div class="divide-y divide-pp-border">
        <div 
          v-for="player in filteredPlayers" 
          :key="player.id"
          class="p-3 flex items-center justify-between"
        >
          <!-- Player Info -->
          <div class="flex items-center gap-4">
            <!-- Avatar -->
            <div class="w-10 h-10 bg-pp-text-secondary rounded-full flex items-center justify-center text-white font-bold text-base">
              {{ getInitials(player.name) }}
            </div>
            
            <!-- Player Details -->
            <div>
              <h3 class="font-semibold text-white text-base">{{ player.name }}</h3>
              <div class="flex items-center gap-3 text-white text-sm">
                <span>{{ player.email }}</span>
                <span class="text-white text-xs">
                  Registered: {{ player.registrationTime }}
                  <span v-if="player.tableNumber"> • Table {{ player.tableNumber }}, Seat {{ player.seatNumber }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Status and Actions -->
          <div class="flex items-center gap-4">
            <!-- Status Badge -->
            <span :class="[
              'px-3 py-1 rounded-full text-sm font-medium',
              getStatusBadgeClass(player.status)
            ]">
              {{ player.status }}
            </span>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2">
              <!-- Check In Button -->
              <button 
                v-if="player.status === 'registered'"
                class="px-3 py-2 border border-pp-text-primary text-pp-text-primary rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-pp-text-primary hover:text-pp-bg-primary"
              >
                <IonIcon :icon="checkmarkCircleOutline" class="w-4 h-4" />
                Check In
              </button>
              
              <!-- Undo and Seat Buttons -->
              <template v-else-if="player.status === 'checked-in'">
                <button class="px-3 py-2 border border-pp-text-primary text-pp-text-primary rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-pp-text-primary hover:text-pp-bg-primary">
                  <IonIcon :icon="refreshOutline" class="w-4 h-4" />
                  Undo
                </button>
                <button class="px-3 py-2 bg-pp-text-primary text-pp-bg-primary rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-pp-accent-gold hover:text-pp-bg-primary">
                  <IonIcon :icon="locationOutline" class="w-4 h-4" />
                  Seat
                </button>
              </template>

              <!-- More Actions Button -->
              <button class="p-2 text-white hover:text-white hover:bg-pp-border rounded-lg">
                <IonIcon :icon="ellipsisVerticalOutline" class="w-4 h-4" />
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
import type { TournamentPlayer } from '~/types/user'

const props = defineProps<{
  tournamentPlayers: TournamentPlayer[]
}>()

const emit = defineEmits<{
  registerPlayer: []
  walkIn: []
}>()

// Filters
const playerSearch = ref('')
const playerFilter = ref('all')

const filteredPlayers = computed(() => {
  if (!props.tournamentPlayers) return []
  
  return props.tournamentPlayers.filter(tp => {
    const player = {
      id: tp.user.id,
      name: `${tp.user.firstName} ${tp.user.lastName}`.trim() || tp.user.username,
      email: tp.user.email,
      status: tp.registration.status
    }
    
    const matchesSearch =
      player.name.toLowerCase().includes(playerSearch.value.toLowerCase()) ||
      player.email.toLowerCase().includes(playerSearch.value.toLowerCase())
    const matchesFilter = playerFilter.value === 'all' || player.status === playerFilter.value
    return matchesSearch && matchesFilter
  }).map(tp => ({
    id: tp.user.id,
    name: `${tp.user.firstName} ${tp.user.lastName}`.trim() || tp.user.username,
    email: tp.user.email,
    status: tp.registration.status,
    registrationTime: tp.registration.registrationTime,
    notes: tp.registration.notes
  }))
})

// Helper functions
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
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