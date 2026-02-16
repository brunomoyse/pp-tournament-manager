<template>
  <div class="space-y-6 pb-8" data-seating-container>
    <!-- Table Management Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h2 class="text-xl font-bold text-pp-text-primary">{{ t('headings.tableManagement') }}</h2>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex items-center gap-3">
        <button 
          @click="showAssignTableModal = true"
          class="pp-action-button pp-action-button--primary"
        >
          <IonIcon :icon="linkOutline" class="w-4 h-4" />
          {{ t('buttons.linkTables') }}
        </button>
        <button
          @click="balanceTables"
          :disabled="isBalancing"
          class="pp-action-button pp-action-button--secondary"
        >
          <IonIcon :icon="scaleOutline" :class="['w-4 h-4', isBalancing && 'animate-spin']" />
          {{ isBalancing ? t('status.balancing') : t('buttons.balanceTables') }}
        </button>
        <button
          @click="openBreakTableModal"
          class="pp-action-button pp-action-button--danger"
        >
          <IonIcon :icon="unlinkOutline" class="w-4 h-4" />
          {{ t('buttons.breakTable') }}
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
        @select-player-for-seat="handleSelectPlayerForSeat"
      />
    </div>

    <!-- Loading State -->
    <div v-if="!seatingData" class="flex justify-center py-12">
      <div class="text-white/60">{{ t('messages.loadingSeatingChart') }}</div>
    </div>

    <!-- No Tables State -->
    <div v-else-if="!seatingData?.tournamentSeatingChart?.tables?.length" class="text-center py-16">
      <div class="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
        <IonIcon :icon="gridOutline" class="w-8 h-8 text-white/40" />
      </div>
      <div class="text-white/60 mb-6">{{ t('messages.noTablesLinked') }}</div>
      <button
        @click="showAssignTableModal = true"
        class="pp-action-button pp-action-button--primary mx-auto"
      >
        <IonIcon :icon="linkOutline" class="w-4 h-4" />
        {{ t('buttons.linkTables') }}
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

    <!-- Move Player Modal -->
    <div v-if="showMoveModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeMoveModal"></div>
      <div class="relative bg-pp-bg-secondary rounded-2xl w-full max-w-md border border-pp-border shadow-2xl p-6" style="background-color: #24242a !important;">
        <h2 class="text-xl font-bold text-pp-text-primary mb-4">{{ t('seating.movePlayer') }}</h2>
        <p class="text-white/70 mb-4">{{ t('seating.selectDestination') }}</p>

        <div class="space-y-4 max-h-96 overflow-y-auto">
          <div v-for="tableData in availableTables" :key="tableData.table.id" class="border border-pp-border rounded-lg p-3">
            <h3 class="font-semibold text-white mb-2">{{ t('labels.table') }} {{ tableData.table.tableNumber }}</h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="seatNum in tableData.table.maxSeats"
                :key="seatNum"
                :disabled="tableData.seats?.some(s => s.assignment.seatNumber === seatNum)"
                @click="executePlayerMove(tableData.table.id, seatNum)"
                :class="[
                  'w-10 h-10 rounded-full border-2 text-sm font-bold transition-all',
                  tableData.seats?.some(s => s.assignment.seatNumber === seatNum)
                    ? 'bg-red-500/20 border-red-500/50 text-red-400 cursor-not-allowed'
                    : 'bg-pp-bg-primary border-pp-border text-white hover:border-pp-accent-gold hover:bg-pp-accent-gold/20 cursor-pointer'
                ]"
              >
                {{ seatNum }}
              </button>
            </div>
          </div>
        </div>

        <div class="mt-4 flex justify-end">
          <button @click="closeMoveModal" class="pp-action-button pp-action-button--secondary">
            {{ t('buttons.cancel') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Player Selection Modal -->
    <div v-if="showPlayerSelectionModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closePlayerSelectionModal"></div>
      <div class="relative bg-pp-bg-secondary rounded-2xl w-full max-w-md border border-pp-border shadow-2xl p-6" style="background-color: #24242a !important;">
        <h2 class="text-xl font-bold text-pp-text-primary mb-2">{{ t('seating.selectPlayer') }}</h2>
        <p class="text-white/70 mb-4">{{ t('seating.choosePlayerForSeat', { seat: targetSeat?.seatNumber }) }}</p>

        <div v-if="unassignedPlayers.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
          <button
            v-for="player in unassignedPlayers"
            :key="player.id"
            @click="selectPlayerForSeat(player.id)"
            class="w-full flex items-center gap-3 p-3 bg-pp-bg-primary border border-pp-border rounded-lg hover:border-pp-accent-gold hover:bg-pp-accent-gold/10 transition-all text-left"
          >
            <div class="w-10 h-10 bg-pp-accent-gold/20 rounded-full flex items-center justify-center text-pp-accent-gold font-bold">
              {{ (player.firstName?.[0] || '') + (player.lastName?.[0] || '') }}
            </div>
            <div>
              <div class="font-semibold text-white">{{ getPlayerDisplayName(player) }}</div>
              <div class="text-sm text-white/60">{{ player.email }}</div>
            </div>
          </button>
        </div>

        <div v-else class="text-center py-8 text-white/60">
          {{ t('seating.noUnassignedPlayers') }}
          <br>
          <span class="text-sm">{{ t('seating.mustBeCheckedIn') }}</span>
        </div>

        <div class="mt-4 flex justify-end">
          <button @click="closePlayerSelectionModal" class="pp-action-button pp-action-button--secondary">
            {{ t('buttons.cancel') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Break Table Modal -->
    <div v-if="showBreakTableModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeBreakTableModal"></div>
      <div class="relative bg-pp-bg-secondary rounded-2xl w-full max-w-md border border-pp-border shadow-2xl p-6" style="background-color: #24242a !important;">
        <h2 class="text-xl font-bold text-pp-text-primary mb-2">{{ t('buttons.breakTable') }}</h2>
        <p class="text-white/70 mb-4">{{ t('seating.selectTableToRemove') }}</p>

        <div v-if="tablesWithStatus.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="tableData in tablesWithStatus"
            :key="tableData.table.id"
            :class="[
              'flex items-center justify-between p-4 border rounded-lg transition-all',
              tableData.isEmpty
                ? 'bg-pp-bg-primary border-pp-border hover:border-red-500/50 cursor-pointer'
                : 'bg-pp-bg-primary/50 border-pp-border/50 opacity-60 cursor-not-allowed'
            ]"
          >
            <div class="flex items-center gap-3">
              <div :class="[
                'w-10 h-10 rounded-full flex items-center justify-center font-bold',
                tableData.isEmpty
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-orange-500/20 text-orange-400'
              ]">
                {{ tableData.table.tableNumber }}
              </div>
              <div>
                <div class="font-semibold text-white">{{ t('labels.table') }} {{ tableData.table.tableNumber }}</div>
                <div class="text-sm text-white/60">
                  {{ tableData.isEmpty ? t('seating.emptyCanBeRemoved') : t('seating.playersSeated', { count: tableData.seats?.length || 0 }) }}
                </div>
              </div>
            </div>
            <button
              v-if="tableData.isEmpty"
              @click="breakTable(tableData.table.id)"
              :disabled="isBreakingTable"
              class="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {{ isBreakingTable ? t('status.removing') : t('buttons.remove') }}
            </button>
            <span v-else class="px-3 py-1.5 text-orange-400 text-sm">
              {{ t('seating.hasPlayers') }}
            </span>
          </div>
        </div>

        <div v-else class="text-center py-8 text-white/60">
          {{ t('messages.noTablesLinked') }}
        </div>

        <div v-if="tablesWithStatus.length > 0 && !hasEmptyTables" class="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <p class="text-orange-400 text-sm">
            {{ t('seating.allTablesHavePlayers') }}
          </p>
        </div>

        <div class="mt-4 flex justify-end">
          <button @click="closeBreakTableModal" class="pp-action-button pp-action-button--secondary">
            {{ t('common.close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { scaleOutline, linkOutline, unlinkOutline, gridOutline } from 'ionicons/icons'
import TournamentTableCard from './TournamentTableCard.vue'
import AssignTableModal from './AssignTableModal.vue'
import { useTournamentStore } from '~/stores/useTournamentStore'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n()
const toast = useToast()

const route = useRoute()
const tournamentStore = useTournamentStore()
const clubStore = useClubStore()

// State
const showAssignTableModal = ref(false)
const isBalancing = ref(false)
const showMoveModal = ref(false)
const playerToMove = ref<{ playerId: string, fromTable: number, fromSeat: number } | null>(null)
const showPlayerSelectionModal = ref(false)
const targetSeat = ref<{ tableId: string, seatNumber: number } | null>(null)

// Fetch seating data
const selectedTournamentId = route.params.id as string
const { data: seatingData, refresh: refreshSeatingData } = await useLazyAsyncData(
  `seating-${selectedTournamentId}`,
  () => GqlGetTournamentSeatingChart({ tournamentId: selectedTournamentId })
)

// Get tournament info for club details
const tournament = computed(() => tournamentStore.tournament)
const club = computed(() => clubStore.club)

// Get available tables for move modal
const availableTables = computed(() => seatingData.value?.tournamentSeatingChart?.tables || [])

// Get unassigned players (checked-in but not seated)
const unassignedPlayers = computed(() => seatingData.value?.tournamentSeatingChart?.unassignedPlayers || [])

// Event handlers
const balanceTables = async () => {
  if (isBalancing.value) return

  isBalancing.value = true
  try {
    await GqlBalanceTables({
      input: {
        tournamentId: selectedTournamentId
      }
    })
    await refreshSeatingData()
  } catch (error) {
    console.error('Failed to balance tables:', error)
    toast.error(t('toast.balanceTablesFailed'))
  } finally {
    isBalancing.value = false
  }
}

// Break table modal state
const showBreakTableModal = ref(false)
const isBreakingTable = ref(false)

// Get tables with their empty status
const tablesWithStatus = computed(() => {
  const tables = seatingData.value?.tournamentSeatingChart?.tables || []
  return tables.map(tableData => ({
    ...tableData,
    isEmpty: !tableData.seats || tableData.seats.length === 0
  }))
})

// Check if there are any empty tables
const hasEmptyTables = computed(() => tablesWithStatus.value.some(t => t.isEmpty))

const openBreakTableModal = () => {
  showBreakTableModal.value = true
}

const closeBreakTableModal = () => {
  showBreakTableModal.value = false
}

const breakTable = async (tableId: string) => {
  if (isBreakingTable.value) return

  isBreakingTable.value = true
  try {
    await GqlUnassignTableFromTournament({
      input: {
        tournamentId: selectedTournamentId,
        clubTableId: tableId
      }
    })
    await refreshSeatingData()
    closeBreakTableModal()
  } catch (error: any) {
    console.error('Failed to break table:', error)
    toast.error(t('toast.breakTableFailed'))
  } finally {
    isBreakingTable.value = false
  }
}

const handleSeatPlayer = async (data: { tableId: string, seatNumber: number, playerId: string }) => {
  try {
    await GqlAssignPlayerToSeat({
      input: {
        tournamentId: selectedTournamentId,
        clubTableId: data.tableId,
        userId: data.playerId,
        seatNumber: data.seatNumber
      }
    })
    await refreshSeatingData()
  } catch (error) {
    console.error('Failed to seat player:', error)
    toast.error(t('toast.seatPlayerFailed'))
  }
}

const handleRemovePlayer = async (data: { tableId: string, seatNumber: number }) => {
  // Find the player at this seat
  const table = seatingData.value?.tournamentSeatingChart?.tables?.find(
    t => t.table.id === data.tableId
  )
  const seatData = table?.seats?.find(s => s.assignment.seatNumber === data.seatNumber)

  if (!seatData?.player?.id) {
    console.error('Could not find player at seat')
    return
  }

  if (!confirm('Are you sure you want to eliminate this player from the tournament?')) {
    return
  }

  try {
    await GqlEliminatePlayer({
      tournamentId: selectedTournamentId,
      userId: seatData.player.id
    })
    await refreshSeatingData()
  } catch (error) {
    console.error('Failed to eliminate player:', error)
    toast.error(t('toast.eliminatePlayerFailed'))
  }
}

const handleTablesAssigned = async () => {
  // Refresh seating data after tables are assigned
  await refreshSeatingData()
}

const handlePlayerStatusChanged = async (data: { playerId: string, status: string, stackSize?: number }) => {
  try {
    // Handle elimination
    if (data.status === 'ELIMINATED') {
      await GqlEliminatePlayer({
        tournamentId: selectedTournamentId,
        userId: data.playerId
      })
    }
    // Handle stack size update
    else if (data.stackSize !== undefined) {
      await GqlUpdateStackSize({
        input: {
          tournamentId: selectedTournamentId,
          userId: data.playerId,
          newStackSize: data.stackSize
        }
      })
    }

    await refreshSeatingData()
  } catch (error) {
    console.error('Failed to update player:', error)
    toast.error(t('toast.updatePlayerFailed'))
  }
}

const handlePlayerMove = async (data: { playerId: string, fromTable: number, fromSeat: number }) => {
  // Store the player info and show move modal
  playerToMove.value = data
  showMoveModal.value = true
}

const executePlayerMove = async (targetTableId: string, targetSeatNumber: number) => {
  if (!playerToMove.value) return

  try {
    await GqlMovePlayer({
      input: {
        tournamentId: selectedTournamentId,
        userId: playerToMove.value.playerId,
        newClubTableId: targetTableId,
        newSeatNumber: targetSeatNumber
      }
    })
    await refreshSeatingData()
    closeMoveModal()
  } catch (error) {
    console.error('Failed to move player:', error)
    toast.error(t('toast.movePlayerFailed'))
  }
}

const closeMoveModal = () => {
  showMoveModal.value = false
  playerToMove.value = null
}

// Player selection for empty seats
const handleSelectPlayerForSeat = (data: { tableId: string, seatNumber: number }) => {
  targetSeat.value = data
  showPlayerSelectionModal.value = true
}

const selectPlayerForSeat = async (playerId: string) => {
  if (!targetSeat.value) return

  try {
    await GqlAssignPlayerToSeat({
      input: {
        tournamentId: selectedTournamentId,
        clubTableId: targetSeat.value.tableId,
        userId: playerId,
        seatNumber: targetSeat.value.seatNumber
      }
    })
    await refreshSeatingData()
    closePlayerSelectionModal()
  } catch (error) {
    console.error('Failed to assign player:', error)
    toast.error(t('toast.seatPlayerFailed'))
  }
}

const closePlayerSelectionModal = () => {
  showPlayerSelectionModal.value = false
  targetSeat.value = null
}

const getPlayerDisplayName = (player: any) => {
  if (!player) return 'Unknown'
  const firstName = player.firstName || ''
  const lastName = player.lastName || ''
  if (firstName && lastName) return `${firstName} ${lastName}`
  return firstName || lastName || player.username || 'Unknown'
}

defineExpose({ refreshSeatingData })
</script>