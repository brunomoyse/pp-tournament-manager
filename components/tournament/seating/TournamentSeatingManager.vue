<template>
  <div class="space-y-6 pb-8" data-seating-container>
    <!-- Table Management Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h2 class="text-xl font-bold text-pp-text-primary">Table Management</h2>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex items-center gap-3">
        <button 
          @click="showAssignTableModal = true"
          class="pp-action-button pp-action-button--primary"
        >
          <IonIcon :icon="linkOutline" class="w-4 h-4" />
          Link Table(s)
        </button>
        <button 
          @click="balanceTables"
          class="pp-action-button pp-action-button--secondary"
        >
          <IonIcon :icon="scaleOutline" class="w-4 h-4" />
          Balance Tables
        </button>
        <button 
          @click="breakTable"
          class="pp-action-button pp-action-button--danger"
        >
          <IonIcon :icon="unlinkOutline" class="w-4 h-4" />
          Break Table
        </button>
      </div>
    </div>

    <!-- Tables Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TournamentTableCard 
        v-for="tableData in seatingData?.tournamentSeatingChart?.tables || []"
        :key="tableData.table.id"
        :table="tableData.table"
        :seats="tableData.seats"
        data-table-card
        @seat-player="handleSeatPlayer"
        @remove-player="handleRemovePlayer"
        @status-changed="handlePlayerStatusChanged"
        @move-player="handlePlayerMove"
      />
    </div>

    <!-- Loading State -->
    <div v-if="!seatingData" class="flex justify-center py-12">
      <div class="text-white/60">Loading seating chart...</div>
    </div>

    <!-- No Tables State -->
    <div v-else-if="!seatingData?.tournamentSeatingChart?.tables?.length" class="text-center py-12">
      <div class="text-white/60 mb-4">No tables linked to this tournament</div>
      <button 
        @click="showAssignTableModal = true"
        class="px-4 py-2 bg-pp-accent-gold text-pp-bg-primary rounded-lg font-semibold flex items-center gap-2 mx-auto"
      >
        <IonIcon :icon="linkOutline" class="w-4 h-4" />
        Link Table(s)
      </button>
    </div>

    <!-- Assign Table Modal -->
    <AssignTableModal 
      :is-open="showAssignTableModal"
      :club-id="club?.id || ''"
      :club-name="tournament?.club?.name || ''"
      :tournament-id="selectedTournamentId"
      @close="showAssignTableModal = false"
      @tables-assigned="handleTablesAssigned"
    />
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { scaleOutline, linkOutline, unlinkOutline } from 'ionicons/icons'
import TournamentTableCard from './TournamentTableCard.vue'
import AssignTableModal from './AssignTableModal.vue'
import { useTournamentStore } from '~/stores/useTournamentStore'

const route = useRoute()
const tournamentStore = useTournamentStore()
const clubStore = useClubStore()

// State
const showAssignTableModal = ref(false)

// Fetch seating data
const selectedTournamentId = route.params.id as string
const { data: seatingData, refresh: refreshSeatingData } = await useLazyAsyncData(
  `seating-${selectedTournamentId}`, 
  () => GqlGetTournamentSeatingChart({ tournamentId: selectedTournamentId })
)

// Get tournament info for club details
const tournament = computed(() => tournamentStore.tournament)
const club = computed(() => clubStore.club)

// Computed properties - removed activeTables as it's no longer used

// Event handlers
const balanceTables = () => {
  // TODO: Implement table balancing
  console.log('Balance tables')
}

const breakTable = () => {
  // TODO: Implement break table functionality
  console.log('Break table')
}

const handleSeatPlayer = (data: { tableId: string, seatNumber: number, playerId: string }) => {
  // TODO: Implement seat player
  console.log('Seat player:', data)
}

const handleRemovePlayer = (data: { tableId: string, seatNumber: number }) => {
  // TODO: Implement remove player
  console.log('Remove player:', data)
}

const handleTablesAssigned = async () => {
  // Refresh seating data after tables are assigned
  await refreshSeatingData()
}

const handlePlayerStatusChanged = async (data: { playerId: string, status: string, stackSize?: number }) => {
  console.log('Player status changed:', data)
  
  // TODO: Implement GraphQL mutation to update player status
  // For now, just refresh the seating data
  await refreshSeatingData()
}

const handlePlayerMove = async (data: { playerId: string, fromTable: number, fromSeat: number }) => {
  console.log('Move player requested:', data)
  
  // TODO: Implement player table move functionality
  // This could open a modal to select the destination table and seat
}
</script>