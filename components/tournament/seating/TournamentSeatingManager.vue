<template>
  <div class="space-y-6 pb-8">
    <!-- Table Management Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h2 class="text-xl font-bold text-pp-text-primary">Table Management</h2>
        <span class="px-3 py-1 bg-pp-accent-gold/20 text-pp-accent-gold rounded-full text-sm font-medium">
          {{ activeTables }} Active Tables
        </span>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex items-center gap-3">
        <button 
          @click="showAssignTableModal = true"
          class="px-4 py-2 bg-pp-accent-gold hover:bg-pp-accent-gold/90 text-pp-bg-primary rounded-lg font-semibold flex items-center gap-2"
        >
          <IonIcon :icon="linkOutline" class="w-4 h-4" />
          Link Table(s)
        </button>
        <button 
          @click="autoSeatNext"
          class="px-4 py-2 border border-pp-text-primary text-pp-text-primary hover:bg-pp-text-primary hover:text-pp-bg-primary rounded-lg font-semibold flex items-center gap-2"
        >
          <IonIcon :icon="shuffleOutline" class="w-4 h-4" />
          Auto Seat Next
        </button>
        <button 
          @click="balanceTables"
          class="px-4 py-2 border border-pp-text-primary text-pp-text-primary hover:bg-pp-text-primary hover:text-pp-bg-primary rounded-lg font-semibold flex items-center gap-2"
        >
          <IonIcon :icon="scaleOutline" class="w-4 h-4" />
          Balance Tables
        </button>
        <button 
          @click="breakTable"
          class="px-4 py-2 border border-pp-text-primary text-pp-text-primary hover:bg-pp-text-primary hover:text-pp-bg-primary rounded-lg font-semibold flex items-center gap-2"
        >
          <IonIcon :icon="pauseCircleOutline" class="w-4 h-4" />
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
        @seat-player="handleSeatPlayer"
        @remove-player="handleRemovePlayer"
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
      :club-id="tournament?.club?.id || ''"
      :club-name="tournament?.club?.name || ''"
      :tournament-id="selectedTournamentId"
      @close="showAssignTableModal = false"
      @tables-assigned="handleTablesAssigned"
    />
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { shuffleOutline, scaleOutline, pauseCircleOutline, linkOutline } from 'ionicons/icons'
import TournamentTableCard from './TournamentTableCard.vue'
import AssignTableModal from './AssignTableModal.vue'
import { useTournamentStore } from '~/stores/useTournamentStore'

const route = useRoute()
const tournamentStore = useTournamentStore()

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

// Computed properties
const activeTables = computed(() => {
  return seatingData.value?.tournamentSeatingChart?.tables?.length || 0
})

// Event handlers
const autoSeatNext = () => {
  // TODO: Implement auto-seat functionality
  console.log('Auto seat next player')
}

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
</script>