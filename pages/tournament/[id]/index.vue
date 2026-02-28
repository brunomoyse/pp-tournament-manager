<template>
    <ion-page class="page-bg">
        <!-- Custom Header -->
        <div class="custom-header">
            <!-- Top row with title and status -->
            <div class="header-top">
                <div class="header-brand" @click="goHome">
                    <img src="/assets/icon-no-bg.png" alt="Pocket Pair Logo" class="brand-logo" />
                    <h1 class="brand-title">{{ t('app.title') }}</h1>
                </div>
                <div class="header-info">
                    <!-- Club name and tournament name -->
                    <div class="header-subtitle">
                        {{ club?.name || t('status.loading') }} - {{ tournament?.title || t('status.loadingTournament') }}
                    </div>
                    <!-- Connection status -->
                    <div class="connection-status">
                        <div :class="[
                            'status-dot',
                            connectionStatus === 'connected' ? 'status-dot--connected' :
                            connectionStatus === 'reconnecting' ? 'status-dot--reconnecting' : 'status-dot--offline'
                        ]"></div>
                        <span :class="[
                            'status-label',
                            connectionStatus === 'connected' ? 'status-label--connected' :
                            connectionStatus === 'reconnecting' ? 'status-label--reconnecting' : 'status-label--offline'
                        ]">{{
                                connectionStatus === 'connected' ? t('status.connected') :
                                    connectionStatus === 'reconnecting' ? t('status.reconnecting') : t('status.offline')
                            }}</span>
                    </div>
                </div>
            </div>

            <!-- Full width tab navigation -->
            <div class="tab-bar">
                <button
                    v-for="tab in tabs"
                    :key="tab.value"
                    @click="activeTab = tab.value"
                    :class="[
                        'tab-button',
                        activeTab === tab.value ? 'tab-button--active' : 'tab-button--inactive'
                    ]"
                >
                    {{ tab.label }}
                </button>
            </div>
        </div>

        <ion-content class="content-bg">
            <!-- Tab Content -->
            <div class="tab-content">
                <!-- Overview Tab (v-show keeps components mounted so refs stay available from other tabs) -->
                <div v-show="activeTab === 'overview'">
                    <!-- Warning: No tables linked -->
                    <div v-if="showNoTablesWarning" class="warning-banner warning-banner--orange">
                        <ion-icon :icon="warningOutline" class="warning-icon warning-icon--orange" />
                        <div class="warning-body">
                            <p class="warning-title warning-title--orange">{{ t('warnings.noTablesLinked') }}</p>
                            <p class="warning-desc warning-desc--orange">{{ t('warnings.noTablesLinkedDesc') }}</p>
                        </div>
                        <button
                            @click="activeTab = 'seating'"
                            class="pp-action-button pp-action-button--warning warning-action"
                        >
                            {{ t('warnings.goToSeating') }}
                        </button>
                    </div>

                    <!-- Warning: Unseated checked-in players -->
                    <div v-if="showUnseatedWarning" class="warning-banner warning-banner--amber">
                        <ion-icon :icon="warningOutline" class="warning-icon warning-icon--amber" />
                        <div class="warning-body">
                            <p class="warning-title warning-title--amber">{{ t('warnings.unseatedPlayers', { count: unseatedCheckedInCount }) }}</p>
                            <p class="warning-desc warning-desc--amber">{{ t('warnings.unseatedPlayersDesc') }}</p>
                        </div>
                        <button
                            @click="activeTab = 'players'"
                            class="pp-action-button pp-action-button--warning warning-action"
                        >
                            {{ t('warnings.goToPlayers') }}
                        </button>
                    </div>

                    <!-- Grid Layout -->
                    <div class="overview-grid">
                        <TournamentStatusCard
                          @enter-results="showEnterResultsModal = true"
                          @status-changed="handleStatusChanged"
                        />
                        <TournamentPlayersCard />
                        <TournamentPrizePool ref="prizePoolCard" />
                    </div>

                    <!-- Check-in QR Code Button -->
                    <div class="qr-section">
                        <button
                            @click="showTournamentQRModal = true"
                            class="pp-action-button pp-action-button--secondary qr-button"
                        >
                            <ion-icon :icon="qrCodeOutline" class="icon-md" />
                            {{ t('qr.tournament.button') }}
                        </button>
                    </div>

                    <!-- Results Display (FINISHED) -->
                    <TournamentResultsDisplay
                      v-if="tournament?.liveStatus === 'FINISHED'"
                      class="results-section"
                    />

                    <!-- Recent Activity -->
                    <div class="activity-card">
                        <h3 class="activity-title">{{ t('headings.recentActivity') }}</h3>
                        <div class="activity-content">
                            <div class="activity-empty">
                                {{ t('messages.noRecentActivity') }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Clock Tab -->
                <Transition name="tab-fade" mode="out-in">
                  <div v-if="activeTab === 'clock'" key="clock">
                    <div class="clock-grid">
                        <TournamentClockCard />
                        <TournamentStructureCard
                            :current-level-index="(clock?.currentLevel || 1) - 1"
                        />
                    </div>
                  </div>
                </Transition>

                <!-- Players Tab -->
                <Transition name="tab-fade" mode="out-in">
                  <div v-if="activeTab === 'players'" key="players">
                    <TournamentPlayersTable
                      ref="playersTable"
                      @player-checked-in="handlePlayerCheckedIn"
                      @registerPlayer="showRegisterPlayerModal = true"
                      @entry-added="handleEntryAdded"
                    />
                  </div>
                </Transition>

                <!-- Register Player Modal -->
                <RegisterPlayerModal
                  :isOpen="showRegisterPlayerModal"
                  :tournamentId="selectedTournamentId"
                  :registeredPlayerIds="registeredPlayerIds"
                  @close="showRegisterPlayerModal = false"
                  @registered="handlePlayerRegistered"
                />

                <!-- Tournament QR Code Modal -->
                <TournamentQRModal
                  :isOpen="showTournamentQRModal"
                  :tournamentId="selectedTournamentId"
                  :tournamentName="tournament?.title || ''"
                  :tournamentDate="tournament?.startTime || ''"
                  @close="showTournamentQRModal = false"
                />

                <!-- Enter Results Modal -->
                <EnterResultsModal
                  :is-open="showEnterResultsModal"
                  :tournament-id="selectedTournamentId"
                  @close="showEnterResultsModal = false"
                  @results-entered="handleResultsEntered"
                />

                <!-- Seating Tab -->
                <Transition name="tab-fade" mode="out-in">
                  <div v-if="activeTab === 'seating'" key="seating">
                    <TournamentSeatingManager ref="seatingManager" />
                  </div>
                </Transition>

                <!-- Settings Tab -->
                <Transition name="tab-fade" mode="out-in">
                  <div v-if="activeTab === 'settings'" key="settings">
                    <div class="settings-card">
                        <div class="settings-header">
                            <div class="settings-title-group">
                                <ion-icon :icon="settingsOutline" class="settings-icon"></ion-icon>
                                <h3 class="settings-title">{{ t('headings.tournamentSettings') }}</h3>
                            </div>
                            <button
                                v-if="canEditTournament"
                                @click="openEditModal"
                                class="pp-action-button pp-action-button--primary"
                            >
                                <ion-icon :icon="createOutline" class="icon-md" />
                                {{ t('tournament.edit') }}
                            </button>
                        </div>

                        <!-- Tournament Info Display -->
                        <div class="settings-info" v-if="tournament">
                            <div class="settings-grid">
                                <div>
                                    <label class="info-label">{{ t('tournament.name') }}</label>
                                    <p class="info-value">{{ tournament.title }}</p>
                                </div>
                                <div>
                                    <label class="info-label">{{ t('tournament.buyIn') }}</label>
                                    <p class="info-value">{{ formatPrice(tournament.buyInCents, locale) }}</p>
                                </div>
                                <div>
                                    <label class="info-label">{{ t('tournament.startTime') }}</label>
                                    <p class="info-value">{{ new Date(tournament.startTime).toLocaleString() }}</p>
                                </div>
                                <div>
                                    <label class="info-label">{{ t('tournament.seatCap') }}</label>
                                    <p class="info-value">{{ tournament.seatCap || t('tournament.unlimited') }}</p>
                                </div>
                                <div>
                                    <label class="info-label">{{ t('tournament.status') }}</label>
                                    <p class="info-value-status">
                                        <span :class="['pp-status-badge', getTournamentStatusClass(tournament.liveStatus || 'UNKNOWN')]">
                                            {{ getTournamentStatusLabel(tournament.liveStatus || 'UNKNOWN', t) }}
                                        </span>
                                    </p>
                                </div>
                                <div v-if="tournament.description">
                                    <label class="info-label">{{ t('tournament.description') }}</label>
                                    <p class="info-value">{{ tournament.description }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Edit Modal -->
                    <TournamentFormModal
                        :isOpen="showEditModal"
                        :tournament="tournament"
                        mode="edit"
                        @close="closeEditModal"
                        @saved="onTournamentUpdated"
                    />
                </div>
                </Transition>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { useI18n } from '~/composables/useI18n';

definePageMeta({
    middleware: 'auth'
})

import { settingsOutline, createOutline, warningOutline, qrCodeOutline } from 'ionicons/icons'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import { useTournamentStore } from '~/stores/useTournamentStore'
import TournamentStructureCard from "~/components/tournament/clock/TournamentStructureCard.vue";
import TournamentStatusCard from "~/components/tournament/overview/TournamentStatusCard.vue";
import TournamentPlayersCard from "~/components/tournament/overview/TournamentPlayersCard.vue";
import TournamentPrizePool from "~/components/tournament/overview/TournamentPrizePool.vue";
import TournamentSeatingManager from "~/components/tournament/seating/TournamentSeatingManager.vue";
import TournamentFormModal from "~/components/tournament/TournamentFormModal.vue";
import RegisterPlayerModal from "~/components/tournament/players/RegisterPlayerModal.vue";
import TournamentQRModal from "~/components/tournament/TournamentQRModal.vue";
import EnterResultsModal from "~/components/tournament/results/EnterResultsModal.vue";
import TournamentResultsDisplay from "~/components/tournament/results/TournamentResultsDisplay.vue";
import {useGqlSubscription} from "~/composables/useGqlSubscription";
import type {TournamentClock} from "~/types/clock";
import { formatPrice } from "~/utils";
import { getTournamentStatusLabel, getTournamentStatusClass } from '~/utils/tournamentStatus';

const { connectionStatus } = useNetworkStatus()
const route = useRoute()
const router = useRouter()
const tournamentStore = useTournamentStore()
const clubStore = useClubStore()
const { t, locale } = useI18n()

// Tournament ID from route
const selectedTournamentId = route.params.id as string

// Active tab state
const activeTab = ref('overview')

// Component refs
const seatingManager = ref()
const prizePoolCard = ref()
const playersTable = ref()

// Use store getters for reactive data
const tournament = computed(() => tournamentStore.tournament)
const clock = computed(() => tournamentStore.clock)
const club = computed(() => clubStore.club)

// Edit modal state
const showEditModal = ref(false)

// Results modal state
const showEnterResultsModal = ref(false)

// Player modals state
const showRegisterPlayerModal = ref(false)
const showTournamentQRModal = ref(false)

// Fetch seating data for warning banner
const { data: overviewSeatingData } = await useLazyAsyncData(
  `overview-seating-${selectedTournamentId}`,
  () => GqlGetTournamentSeatingChart({ tournamentId: selectedTournamentId })
)

// Show warning when tournament is active but no tables linked
const showNoTablesWarning = computed(() => {
  const activeStatuses = ['IN_PROGRESS', 'BREAK', 'FINAL_TABLE']
  const status = tournament.value?.liveStatus
  if (!status || !activeStatuses.includes(status)) return false
  const tables = overviewSeatingData.value?.tournamentSeatingChart?.tables || []
  return tables.length === 0
})

// Show warning when checked-in players are not seated during late reg or later
const unseatedCheckedInCount = computed(() => {
  return tournamentStore.registrations?.filter(r => r.status === 'CHECKED_IN').length || 0
})
const showUnseatedWarning = computed(() => {
  const lateOrLaterStatuses = ['LATE_REGISTRATION', 'IN_PROGRESS', 'BREAK', 'FINAL_TABLE']
  const status = tournament.value?.liveStatus
  if (!status || !lateOrLaterStatuses.includes(status)) return false
  return unseatedCheckedInCount.value > 0
})

// Fetch tournament players for filtering in RegisterPlayerModal
const { data: playersData, refresh: refreshPlayers } = await useLazyAsyncData(
  `players-page-${selectedTournamentId}`,
  () => GqlGetTournamentPlayers({ tournamentId: selectedTournamentId })
)

// Get registered player IDs to filter them out in search
const registeredPlayerIds = computed(() => {
  return (playersData.value?.tournamentPlayers?.items || []).map((tp: any) => tp.user.id)
})

// Check if tournament can be edited (not FINISHED)
const canEditTournament = computed(() => {
    return tournament.value && tournament.value.liveStatus !== 'FINISHED'
})

const openEditModal = () => {
    showEditModal.value = true
}

const closeEditModal = () => {
    showEditModal.value = false
}

const onTournamentUpdated = async () => {
    closeEditModal()
    // Refresh tournament data
    const tournamentId = route.params.id as string
    if (tournamentId) {
        const response = await GqlGetTournament({ id: tournamentId })
        if (response.tournament) tournamentStore.setSelectedTournament(response.tournament)
    }
}

const tabs = computed(() => [
    { label: t('tabs.overview'), value: 'overview' },
    { label: t('tabs.clock'), value: 'clock' },
    { label: t('tabs.players'), value: 'players' },
    { label: t('tabs.seating'), value: 'seating' },
    { label: t('tabs.settings'), value: 'settings' }
])

// Navigation
const goHome = () => {
    router.push('/')
}

// Update connection status tracking
watch(connectionStatus, () => {
    // Connection status changed, could update UI here if needed
})

// Cleanup on unmount
onBeforeUnmount(() => {
    // Component cleanup if needed
})

// Handle player check-in events
const handlePlayerCheckedIn = async (data: { playerId: string, result: any }) => {
    // Refresh tournament data in store (updates registration counts in overview card)
    const response = await GqlGetTournament({ id: selectedTournamentId })
    if (response.tournament) tournamentStore.setSelectedTournament(response.tournament)

    // If seatingManager component is available, refresh its data
    if (seatingManager.value && seatingManager.value.refreshSeatingData) {
        await seatingManager.value.refreshSeatingData()
    }
}

// Handle player registered via modal
const handlePlayerRegistered = async (data: { playerId: string }) => {
    // Refresh the parent's player ID list (for filtering in RegisterPlayerModal)
    await refreshPlayers()
    // Refresh the players table component's own data
    if (playersTable.value?.refreshPlayers) {
        await playersTable.value.refreshPlayers()
    }
    // Refresh tournament data in store (updates overview cards)
    const response = await GqlGetTournament({ id: selectedTournamentId })
    if (response.tournament) tournamentStore.setSelectedTournament(response.tournament)
}

// Handle entry added (refresh stats in prize pool card)
const handleEntryAdded = async () => {
    if (prizePoolCard.value?.refreshStats) {
        await prizePoolCard.value.refreshStats()
    }
}

// Handle status changed
const handleStatusChanged = async (status: string) => {
    // Refresh tournament data
    const response = await GqlGetTournament({ id: selectedTournamentId })
    if (response.tournament) tournamentStore.setSelectedTournament(response.tournament)
}

// Handle results entered
const handleResultsEntered = async () => {
    showEnterResultsModal.value = false
    const response = await GqlGetTournament({ id: selectedTournamentId })
    if (response.tournament) tournamentStore.setSelectedTournament(response.tournament)
}

// Clock subscription setup
const clockUpdateQuery = `
    subscription TournamentClockUpdates($tournamentId: ID!) {
      tournamentClockUpdates(tournamentId: $tournamentId) {
        id
        tournamentId
        status
        currentLevel
        timeRemainingSeconds
        levelStartedAt
        levelEndTime
        totalPauseDurationSeconds
        autoAdvance
        currentStructure {
          id
          tournamentId
          levelNumber
          smallBlind
          bigBlind
          ante
          durationMinutes
          isBreak
          breakDurationMinutes
        }
        nextStructure {
          id
          tournamentId
          levelNumber
          smallBlind
          bigBlind
          ante
          durationMinutes
          isBreak
          breakDurationMinutes
        }
      }
    }
`

// Subscribe to real-time clock updates globally
const { data: clockUpdates } = useGqlSubscription({
    query: clockUpdateQuery,
    variables: { tournamentId: selectedTournamentId },
    immediate: true
})

// Watch for subscription updates and update the store
watch(clockUpdates, (raw) => {
    const data = raw as { tournamentClockUpdates?: TournamentClock } | undefined
    console.log('[TournamentPage] Clock subscription update received:', data)
    if (data?.tournamentClockUpdates) {
        console.log('[TournamentPage] Updating store with clock:', data.tournamentClockUpdates)
        tournamentStore.setSelectedTournamentClock(data.tournamentClockUpdates)
    }
})

// --- Registration subscription ---
const registrationSubQuery = `
    subscription TournamentRegistrations($tournamentId: ID!) {
      tournamentRegistrations(tournamentId: $tournamentId) {
        tournamentId
        player {
          user { id firstName lastName username email }
          registration { id registrationTime status notes }
        }
        eventType
      }
    }
`

const { data: registrationUpdates } = useGqlSubscription({
    query: registrationSubQuery,
    variables: { tournamentId: selectedTournamentId },
    immediate: true
})

watch(registrationUpdates, async (data: any) => {
    if (data?.tournamentRegistrations) {
        // Refresh players list and entry stats
        await refreshPlayers()
        if (prizePoolCard.value?.refreshStats) {
            await prizePoolCard.value.refreshStats()
        }
        // Refresh tournament data in store
        const response = await GqlGetTournament({ id: selectedTournamentId })
        if (response.tournament) tournamentStore.setSelectedTournament(response.tournament)
    }
})

// --- Seating changes subscription ---
const seatingSubQuery = `
    subscription SeatingChanges($clubId: ID!) {
      clubSeatingChanges(clubId: $clubId) {
        eventType
        tournamentId
        clubId
        affectedPlayer { id firstName lastName username }
        message
        timestamp
      }
    }
`

const clubId = computed(() => clubStore.club?.id)

const { data: seatingUpdates } = useGqlSubscription({
    query: seatingSubQuery,
    variables: { clubId: clubId.value || '' },
    immediate: !!clubId.value
})

watch(seatingUpdates, async (data: any) => {
    if (data?.clubSeatingChanges) {
        // Refresh seating data
        if (seatingManager.value?.refreshSeatingData) {
            await seatingManager.value.refreshSeatingData()
        }
        // Always refresh tournament data so registration statuses stay in sync
        // (seating events change statuses: CHECKED_IN→SEATED, SEATED→BUSTED, etc.)
        const response = await GqlGetTournament({ id: selectedTournamentId })
        if (response.tournament) tournamentStore.setSelectedTournament(response.tournament)
    }
})

// --- User notifications subscription ---
const notificationSubQuery = `
    subscription UserNotifications {
      userNotifications {
        id userId notificationType title message tournamentId createdAt
      }
    }
`

const toast = useToast()

const { data: notificationUpdates } = useGqlSubscription({
    query: notificationSubQuery,
    variables: {},
    immediate: true
})

watch(notificationUpdates, (data: any) => {
    if (data?.userNotifications) {
        const notif = data.userNotifications
        toast.info(`${notif.title}: ${notif.message}`)
    }
})

// ---

onMounted(async () => {
    if (selectedTournamentId) {
        const response = await GqlGetTournament({ id: selectedTournamentId })
        if (response.tournament) tournamentStore.setSelectedTournament(response.tournament)
    }
})


</script>

<style scoped>
.page-bg {
  background-color: var(--pp-bg-primary);
}

.content-bg {
  background-color: var(--pp-bg-primary);
  --padding-top: 0 !important;
}

/* Custom Header */
.custom-header {
  background-color: var(--pp-bg-primary);
  border-bottom: 1px solid var(--pp-border);
  padding: 1rem 1rem;
}

@media (min-width: 640px) {
  .custom-header {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .custom-header {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.header-top {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-left: 3rem;
}

@media (min-width: 640px) {
  .header-top {
    flex-direction: row;
  }
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
}

.brand-logo {
  width: 3rem;
  height: 3rem;
}

.brand-title {
  font-size: 1.875rem;
  line-height: 2.25rem;
  font-weight: 700;
  color: var(--pp-text-primary);
  transition: color 0.2s ease;
}

.brand-title:hover {
  color: var(--pp-accent-gold);
}

.header-info {
  text-align: right;
}

.header-subtitle {
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
}

.connection-status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
}

.status-dot--connected {
  background-color: var(--pp-green-500);
}

.status-dot--reconnecting {
  background-color: var(--pp-orange-500);
}

.status-dot--offline {
  background-color: var(--pp-red-500);
}

.status-label {
  font-size: 0.875rem;
  text-transform: capitalize;
  font-weight: 500;
}

.status-label--connected {
  color: var(--pp-green-500);
}

.status-label--reconnecting {
  color: var(--pp-orange-500);
}

.status-label--offline {
  color: var(--pp-red-500);
}

/* Tab Bar */
.tab-bar {
  display: flex;
  overflow-x: auto;
  gap: 0.5rem;
  background-color: rgba(36, 36, 42, 0.5);
  padding: 0.5rem;
  border-radius: 1rem;
  border: 1px solid var(--pp-border);
}

.tab-button {
  flex: 1;
  min-width: 0;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  cursor: pointer;
}

.tab-button--active {
  background-color: var(--pp-bg-secondary);
  color: var(--pp-accent-gold);
  border: 1px solid rgba(254, 231, 138, 0.4);
  box-shadow: var(--pp-shadow-sm);
}

.tab-button--inactive {
  color: #ffffff;
  border: 1px solid transparent;
}

.tab-button--inactive:hover {
  background-color: rgba(36, 36, 42, 0.5);
}

/* Tab Content */
.tab-content {
  padding: 0.75rem 1rem 6rem;
}

@media (min-width: 640px) {
  .tab-content {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .tab-content {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

/* Warning Banners */
.warning-banner {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
}

.warning-banner--orange {
  background-color: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.warning-banner--amber {
  background-color: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.warning-icon {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
}

.warning-icon--orange {
  color: var(--pp-orange-400);
}

.warning-icon--amber {
  color: var(--pp-amber-400);
}

.warning-body {
  flex: 1;
}

.warning-title {
  font-weight: 500;
  font-size: 0.875rem;
}

.warning-title--orange {
  color: rgba(253, 186, 116, 1);
}

.warning-title--amber {
  color: rgba(252, 211, 77, 1);
}

.warning-desc {
  font-size: 0.75rem;
  margin-top: 0.125rem;
}

.warning-desc--orange {
  color: rgba(251, 146, 60, 0.7);
}

.warning-desc--amber {
  color: rgba(251, 191, 36, 0.7);
}

.warning-action {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
  flex-shrink: 0;
}

/* Overview Grid */
.overview-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  /* Status card spans full width - stepper needs horizontal room */
  .overview-grid > :first-child {
    grid-column: 1 / -1;
  }
}

/* QR Section */
.qr-section {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

.qr-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Results Section */
.results-section {
  margin-bottom: 2rem;
}

/* Activity Card */
.activity-card {
  background-color: var(--pp-bg-secondary);
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: var(--pp-shadow-sm);
  border: 1px solid var(--pp-border);
}

.activity-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--pp-text-primary);
  margin-bottom: 1rem;
}

.activity-content > * + * {
  margin-top: 1.5rem;
}

.activity-empty {
  text-align: center;
  padding: 2rem 0;
  color: rgba(255, 255, 255, 0.6);
}

/* Clock Grid */
.clock-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 768px) {
  .clock-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Settings Card */
.settings-card {
  background-color: var(--pp-bg-secondary);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--pp-shadow-sm);
  border: 1px solid var(--pp-border);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.settings-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.settings-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--pp-text-primary);
}

.settings-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--pp-text-primary);
}

.settings-info > * + * {
  margin-top: 1rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.info-value {
  color: #ffffff;
  font-weight: 500;
}

.info-value-status {
  margin-top: 0.25rem;
}
</style>

<style>
/* Custom tab styling to match the design */
.tab-button-custom {
    --background: transparent;
    --background-selected: #24242a;
    --color: #94a3b8;
    --color-selected: #fee78a;
    --border-radius: 12px;
    --padding-start: 32px;
    --padding-end: 32px;
    --margin: 4px;
    --box-shadow: none;
    --box-shadow-selected: 0 2px 8px 0 rgb(254 231 138 / 0.2);
    margin: 0 2px;
    border: 1px solid #54545f; /* Subtle border for visibility */
    transition: all 0.2s ease;
}

.tab-button-custom:hover:not([aria-selected="true"]) {
    --background: rgba(94, 164, 184, 0.1);
    --color: #ffffff;
    border: 1px solid #94a3b8;
    transform: translateY(-1px);
}

.tab-button-custom[aria-selected="true"] {
    --background: #24242a;
    border: 1px solid rgba(254, 231, 138, 0.6);
    box-shadow: 0 2px 8px 0 rgb(254 231 138 / 0.2);
}

/* Fullscreen styles for tournament clock */
.tournament-clock-card:fullscreen {
    display: flex;
    flex-direction: column;
    background-color: #1a1a1f !important;
    padding: 0;
    width: 100vw;
    height: 100vh;
}

/* Hide normal view in fullscreen */
.tournament-clock-card:fullscreen .normal-view {
    display: none;
}

.tournament-clock-card:fullscreen .fullscreen-header {
    display: none;
}

/* Show fullscreen view only in fullscreen */
.tournament-clock-card:fullscreen .fullscreen-view {
    display: block !important;
    height: 100vh;
}

/* Position fullscreen toggle button */
.tournament-clock-card:fullscreen .fullscreen-toggle {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    background: rgba(36, 36, 42, 0.9);
    backdrop-filter: blur(10px);
    display: block !important;
}

/* Hide all other buttons in fullscreen */
.tournament-clock-card:fullscreen button:not(.fullscreen-toggle) {
    display: none;
}

/* Responsive timer scaling */
.fullscreen-timer {
    font-size: clamp(8rem, 18vw, 20rem);
    line-height: 1;
}

/* Extra large screens (4K+) */
@media (min-width: 2560px) {
    .fullscreen-timer {
        font-size: clamp(16rem, 20vw, 24rem);
    }
}

/* Make sure tab labels are visible */
.tab-button-custom ion-label {
    font-weight: 500;
    font-size: 16px;
    opacity: 1;
}

/* Grid-based tab styling */
.tab-button-custom-grid {
    --background: transparent;
    --background-selected: #24242a;
    --color: #ffffff;
    --color-selected: #fee78a;
    --border-radius: 12px;
    --padding-start: 16px;
    --padding-end: 16px;
    --padding-top: 12px;
    --padding-bottom: 12px;
    --margin: 0;
    --box-shadow: none;
    --box-shadow-selected: 0 2px 8px 0 rgb(254 231 138 / 0.15);
    border: 1px solid transparent;
    border-radius: 12px;
    transition: all 0.2s ease;
    flex: 1;
}

.tab-button-custom-grid:hover:not([aria-selected="true"]) {
    --background: rgba(148, 163, 184, 0.1);
    --color: #ffffff;
    border: 1px solid #94a3b8;
}

.tab-button-custom-grid[aria-selected="true"] {
    --background: #24242a;
    --color: #fee78a;
    border: 1px solid rgba(254, 231, 138, 0.4);
    box-shadow: 0 2px 8px 0 rgb(254 231 138 / 0.15);
}

.tab-button-custom-grid ion-label {
    font-weight: 500;
    font-size: 14px;
    opacity: 1;
    margin: 0;
}
</style>
