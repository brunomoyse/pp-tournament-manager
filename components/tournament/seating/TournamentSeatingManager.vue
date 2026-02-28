<template>
  <div class="seating-manager" data-seating-container>
    <!-- Table Management Header -->
    <div class="seating-manager__header">
      <div class="seating-manager__header-left">
        <h2 class="seating-manager__title">{{ t('headings.tableManagement') }}</h2>
      </div>

      <!-- Action Buttons -->
      <div class="seating-manager__actions">
        <button
          @click="showAssignTableModal = true"
          class="pp-action-button pp-action-button--primary"
        >
          <IonIcon :icon="linkOutline" class="seating-manager__action-icon" />
          {{ t('buttons.linkTables') }}
        </button>
        <button
          @click="balanceTables"
          :disabled="isBalancing"
          class="pp-action-button pp-action-button--secondary"
        >
          <IonIcon :icon="scaleOutline" :class="['seating-manager__action-icon', isBalancing && 'pp-animate-spin']" />
          {{ isBalancing ? t('status.balancing') : t('buttons.balanceTables') }}
        </button>
        <button
          @click="openBreakTableModal"
          class="pp-action-button pp-action-button--danger"
        >
          <IonIcon :icon="unlinkOutline" class="seating-manager__action-icon" />
          {{ t('buttons.breakTable') }}
        </button>
      </div>
    </div>

    <!-- Tables Grid -->
    <div class="seating-manager__grid">
      <TournamentTableCard
        v-for="tableData in seatingData?.tournamentSeatingChart?.tables || []"
        :key="tableData.table.id"
        :table="tableData.table"
        :seats="tableData.seats"
        data-table-card
        @seat-player="handleSeatPlayer"
        @status-changed="handlePlayerStatusChanged"
        @move-player="handlePlayerMove"
        @select-player-for-seat="handleSelectPlayerForSeat"
      />
    </div>

    <!-- Loading State -->
    <div v-if="!seatingData" class="seating-manager__loading">
      <div class="seating-manager__loading-text">{{ t('messages.loadingSeatingChart') }}</div>
    </div>

    <!-- No Tables State -->
    <div v-else-if="!seatingData?.tournamentSeatingChart?.tables?.length" class="seating-manager__empty">
      <div class="seating-manager__empty-icon-wrapper">
        <IonIcon :icon="gridOutline" class="seating-manager__empty-icon" />
      </div>
      <div class="seating-manager__empty-text">{{ t('messages.noTablesLinked') }}</div>
      <button
        @click="showAssignTableModal = true"
        class="pp-action-button pp-action-button--primary seating-manager__empty-button"
      >
        <IonIcon :icon="linkOutline" class="seating-manager__action-icon" />
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
    <div v-if="showMoveModal" class="pp-modal-overlay">
      <div class="pp-modal-backdrop" @click="closeMoveModal"></div>
      <div class="pp-modal-content pp-modal-content--md seating-manager__modal-body">
        <h2 class="seating-manager__modal-title">{{ t('seating.movePlayer') }}</h2>
        <p class="seating-manager__modal-description">{{ t('seating.selectDestination') }}</p>

        <div class="seating-manager__modal-scroll">
          <div v-for="tableData in availableTables" :key="tableData.table.id" class="seating-manager__move-table">
            <h3 class="seating-manager__move-table-title">{{ t('labels.table') }} {{ tableData.table.tableNumber }}</h3>
            <div class="seating-manager__move-seats">
              <button
                v-for="seatNum in tableData.table.maxSeats"
                :key="seatNum"
                :disabled="tableData.seats?.some(s => s.assignment.seatNumber === seatNum)"
                @click="executePlayerMove(tableData.table.id, seatNum)"
                :class="[
                  'seating-manager__move-seat',
                  tableData.seats?.some(s => s.assignment.seatNumber === seatNum)
                    ? 'seating-manager__move-seat--occupied'
                    : 'seating-manager__move-seat--available'
                ]"
              >
                {{ seatNum }}
              </button>
            </div>
          </div>
        </div>

        <div class="seating-manager__modal-footer">
          <button @click="closeMoveModal" class="pp-action-button pp-action-button--secondary">
            {{ t('buttons.cancel') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Player Selection Modal -->
    <div v-if="showPlayerSelectionModal" class="pp-modal-overlay">
      <div class="pp-modal-backdrop" @click="closePlayerSelectionModal"></div>
      <div class="pp-modal-content pp-modal-content--md seating-manager__modal-body">
        <h2 class="seating-manager__modal-title">{{ t('seating.selectPlayer') }}</h2>
        <p class="seating-manager__modal-description">{{ t('seating.choosePlayerForSeat', { seat: targetSeat?.seatNumber }) }}</p>

        <div v-if="unassignedPlayers.length > 0" class="seating-manager__modal-scroll seating-manager__player-list">
          <button
            v-for="player in unassignedPlayers"
            :key="player.id"
            @click="selectPlayerForSeat(player.id)"
            class="seating-manager__player-option"
          >
            <div class="seating-manager__player-avatar">
              {{ (player.firstName?.[0] || '') + (player.lastName?.[0] || '') }}
            </div>
            <div>
              <div class="seating-manager__player-name">{{ getPlayerDisplayName(player) }}</div>
              <div class="seating-manager__player-full-name">{{ player.firstName }} {{ player.lastName || '' }}</div>
            </div>
          </button>
        </div>

        <div v-else class="seating-manager__no-players">
          {{ t('seating.noUnassignedPlayers') }}
          <br>
          <span class="seating-manager__no-players-hint">{{ t('seating.mustBeCheckedIn') }}</span>
        </div>

        <div class="seating-manager__modal-footer">
          <button @click="closePlayerSelectionModal" class="pp-action-button pp-action-button--secondary">
            {{ t('buttons.cancel') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Break Table Modal -->
    <div v-if="showBreakTableModal" class="pp-modal-overlay">
      <div class="pp-modal-backdrop" @click="closeBreakTableModal"></div>
      <div class="pp-modal-content pp-modal-content--md seating-manager__modal-body">
        <h2 class="seating-manager__modal-title">{{ t('buttons.breakTable') }}</h2>
        <p class="seating-manager__modal-description">{{ t('seating.selectTableToRemove') }}</p>

        <div v-if="tablesWithStatus.length > 0" class="seating-manager__modal-scroll seating-manager__break-list">
          <div
            v-for="tableData in tablesWithStatus"
            :key="tableData.table.id"
            :class="[
              'seating-manager__break-table',
              tableData.isEmpty
                ? 'seating-manager__break-table--empty'
                : 'seating-manager__break-table--occupied'
            ]"
          >
            <div class="seating-manager__break-table-left">
              <div :class="[
                'seating-manager__break-table-number',
                tableData.isEmpty
                  ? 'seating-manager__break-table-number--empty'
                  : 'seating-manager__break-table-number--occupied'
              ]">
                {{ tableData.table.tableNumber }}
              </div>
              <div>
                <div class="seating-manager__break-table-label">{{ t('labels.table') }} {{ tableData.table.tableNumber }}</div>
                <div class="seating-manager__break-table-status">
                  {{ tableData.isEmpty ? t('seating.emptyCanBeRemoved') : t('seating.playersSeated', { count: tableData.seats?.length || 0 }) }}
                </div>
              </div>
            </div>
            <button
              v-if="tableData.isEmpty"
              @click="breakTable(tableData.table.id)"
              :disabled="isBreakingTable"
              class="seating-manager__break-remove-button"
            >
              {{ isBreakingTable ? t('status.removing') : t('buttons.remove') }}
            </button>
            <span v-else class="seating-manager__break-has-players">
              {{ t('seating.hasPlayers') }}
            </span>
          </div>
        </div>

        <div v-else class="seating-manager__no-players">
          {{ t('messages.noTablesLinked') }}
        </div>

        <div v-if="tablesWithStatus.length > 0 && !hasEmptyTables" class="seating-manager__break-warning">
          <p class="seating-manager__break-warning-text">
            {{ t('seating.allTablesHavePlayers') }}
          </p>
        </div>

        <div class="seating-manager__modal-footer">
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

const handleTablesAssigned = async () => {
  // Refresh seating data after tables are assigned
  await refreshSeatingData()
}

const handlePlayerStatusChanged = async (data: { playerId: string, status: string }) => {
  try {
    if (data.status === 'ELIMINATED') {
      await GqlEliminatePlayer({
        tournamentId: selectedTournamentId,
        userId: data.playerId
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

<style scoped>
.seating-manager {
  padding-bottom: 2rem;
}

.seating-manager > * + * {
  margin-top: 1.5rem;
}

/* Header */
.seating-manager__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.seating-manager__header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.seating-manager__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--pp-text-primary);
}

.seating-manager__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.seating-manager__action-icon {
  width: 1rem;
  height: 1rem;
}

/* Tables Grid */
.seating-manager__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .seating-manager__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Loading State */
.seating-manager__loading {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.seating-manager__loading-text {
  color: rgba(255, 255, 255, 0.6);
}

/* Empty State */
.seating-manager__empty {
  text-align: center;
  padding: 4rem 0;
}

.seating-manager__empty-icon-wrapper {
  width: 4rem;
  height: 4rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.seating-manager__empty-icon {
  width: 2rem;
  height: 2rem;
  color: rgba(255, 255, 255, 0.4);
}

.seating-manager__empty-text {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.5rem;
}

.seating-manager__empty-button {
  margin: 0 auto;
}

/* Modal shared styles */
.seating-manager__modal-body {
  padding: 1.5rem;
}

.seating-manager__modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--pp-text-primary);
  margin-bottom: 0.5rem;
}

.seating-manager__modal-description {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1rem;
}

.seating-manager__modal-scroll {
  max-height: 24rem;
  overflow-y: auto;
}

.seating-manager__modal-scroll > * + * {
  margin-top: 1rem;
}

.seating-manager__modal-footer {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

/* Move Player Modal */
.seating-manager__move-table {
  border: 1px solid var(--pp-border);
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.seating-manager__move-table-title {
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.seating-manager__move-seats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.seating-manager__move-seat {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  border: 2px solid;
  font-size: 0.875rem;
  font-weight: 700;
  transition: all 0.2s ease;
}

.seating-manager__move-seat--occupied {
  background-color: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  color: var(--pp-red-400);
  cursor: not-allowed;
}

.seating-manager__move-seat--available {
  background-color: var(--pp-bg-primary);
  border-color: var(--pp-border);
  color: #ffffff;
  cursor: pointer;
}

@media (hover: hover) {
  .seating-manager__move-seat--available:hover {
    border-color: var(--pp-accent-gold);
    background-color: rgba(254, 231, 138, 0.2);
  }
}

/* Player Selection Modal */
.seating-manager__player-list > * + * {
  margin-top: 0.5rem;
}

.seating-manager__player-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: var(--pp-bg-primary);
  border: 1px solid var(--pp-border);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  text-align: left;
  cursor: pointer;
}

@media (hover: hover) {
  .seating-manager__player-option:hover {
    border-color: var(--pp-accent-gold);
    background-color: rgba(254, 231, 138, 0.1);
  }
}

.seating-manager__player-avatar {
  width: 2.5rem;
  height: 2.5rem;
  background-color: rgba(254, 231, 138, 0.2);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--pp-accent-gold);
  font-weight: 700;
}

.seating-manager__player-name {
  font-weight: 600;
  color: #ffffff;
}

.seating-manager__player-full-name {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.seating-manager__no-players {
  text-align: center;
  padding: 2rem 0;
  color: rgba(255, 255, 255, 0.6);
}

.seating-manager__no-players-hint {
  font-size: 0.875rem;
}

/* Break Table Modal */
.seating-manager__break-list > * + * {
  margin-top: 0.5rem;
}

.seating-manager__break-table {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.seating-manager__break-table--empty {
  background-color: var(--pp-bg-primary);
  border-color: var(--pp-border);
  cursor: pointer;
}

.seating-manager__break-table--occupied {
  background-color: rgba(24, 24, 26, 0.5);
  border-color: rgba(84, 84, 95, 0.5);
  opacity: 0.6;
  cursor: not-allowed;
}

@media (hover: hover) {
  .seating-manager__break-table--empty:hover {
    border-color: rgba(239, 68, 68, 0.5);
  }
}

.seating-manager__break-table-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.seating-manager__break-table-number {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.seating-manager__break-table-number--empty {
  background-color: rgba(34, 197, 94, 0.2);
  color: var(--pp-green-400);
}

.seating-manager__break-table-number--occupied {
  background-color: rgba(249, 115, 22, 0.2);
  color: var(--pp-orange-400);
}

.seating-manager__break-table-label {
  font-weight: 600;
  color: #ffffff;
}

.seating-manager__break-table-status {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.seating-manager__break-remove-button {
  padding: 0.375rem 0.75rem;
  background-color: rgba(239, 68, 68, 0.2);
  color: var(--pp-red-400);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.15s ease;
  cursor: pointer;
}

@media (hover: hover) {
  .seating-manager__break-remove-button:hover {
    background-color: rgba(239, 68, 68, 0.3);
  }
}

.seating-manager__break-remove-button:disabled {
  opacity: 0.5;
}

.seating-manager__break-has-players {
  padding: 0.375rem 0.75rem;
  color: var(--pp-orange-400);
  font-size: 0.875rem;
}

.seating-manager__break-warning {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 0.5rem;
}

.seating-manager__break-warning-text {
  color: var(--pp-orange-400);
  font-size: 0.875rem;
}
</style>
