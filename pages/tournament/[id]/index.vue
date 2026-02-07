<template>
    <ion-page class="bg-pp-bg-primary">
        <!-- Custom Header -->
        <div class="bg-pp-bg-primary border-b border-pp-border px-8 py-6">
            <!-- Top row with title and status -->
            <div class="flex justify-between items-start mb-6">
                <div class="flex items-center gap-4 cursor-pointer" @click="goHome">
                    <img src="/assets/icon-no-bg.png" alt="Pocket Pair Logo" class="w-12 h-12" />
                    <h1 class="text-4xl font-bold text-pp-text-primary hover:text-pp-accent-gold transition-colors">Pocket Pair - Tournament Manager</h1>
                </div>
                <div class="text-right">
                    <!-- Club name and tournament name -->
                    <div class="text-lg font-semibold text-white mb-1">
                        {{ club?.name || t('status.loading') }} - {{ tournament?.title || t('status.loadingTournament') }}
                    </div>
                    <!-- Connection status -->
                    <div class="flex items-center justify-end gap-2">
                        <div :class="[
                            'w-2 h-2 rounded-full',
                            connectionStatus === 'connected' ? 'bg-green-500' :
                            connectionStatus === 'reconnecting' ? 'bg-orange-500' : 'bg-red-500'
                        ]"></div>
                        <span :class="[
                            'text-sm capitalize font-medium',
                            connectionStatus === 'connected' ? 'text-green-500' :
                            connectionStatus === 'reconnecting' ? 'text-orange-500' : 'text-red-500'
                        ]">{{
                                connectionStatus === 'connected' ? t('status.connected') :
                                    connectionStatus === 'reconnecting' ? t('status.reconnecting') : t('status.offline')
                            }}</span>
                    </div>
                </div>
            </div>
            
            <!-- Full width tab navigation -->
            <div class="grid grid-cols-5 gap-2 bg-pp-bg-secondary/50 p-2 rounded-2xl border border-pp-border">
                <button
                    v-for="tab in tabs"
                    :key="tab.value"
                    @click="activeTab = tab.value"
                    :class="[
                        'px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap',
                        activeTab === tab.value
                            ? 'bg-pp-bg-secondary text-pp-accent-gold border border-pp-accent-gold/40 shadow-sm'
                            : 'text-white hover:bg-pp-bg-secondary/50'
                    ]"
                >
                    {{ tab.label }}
                </button>
            </div>
        </div>

        <ion-content class="bg-pp-bg-primary">
            <!-- Tab Content -->
            <div class="px-8 pt-4 pb-24">
                <!-- Overview Tab -->
                <div v-if="activeTab === 'overview'" class="">
                    <!-- Three Column Grid -->
                    <div class="grid grid-cols-3 gap-8 mb-12">
                        <TournamentStatusCard />
                        <TournamentPlayersCard />
                        <TournamentPrizePool />
                    </div>

                    <!-- Recent Activity -->
                    <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
                        <h3 class="text-xl font-semibold text-pp-text-primary mb-8">Recent Activity</h3>
                        <div class="space-y-6">
                            <div class="text-center py-8 text-white/60">
                                No recent activity
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Clock Tab -->
                <div v-if="activeTab === 'clock'" class="">
                    <div class="grid grid-cols-2 gap-8">
                        <TournamentClockCard />
                        <TournamentStructureCard
                            :current-level-index="(clock?.currentLevel || 1) - 1"
                        />
                    </div>
                </div>

                <!-- Players Tab -->
                <div v-if="activeTab === 'players'" class="">
                    <TournamentPlayersTable
                      @player-checked-in="handlePlayerCheckedIn"
                      @seat-player="handleSeatPlayer"
                      @registerPlayer="showRegisterPlayerModal = true"
                      @qrCheckin="showQRCheckinModal = true"
                    />
                </div>

                <!-- Register Player Modal -->
                <RegisterPlayerModal
                  :isOpen="showRegisterPlayerModal"
                  :tournamentId="selectedTournamentId"
                  :registeredPlayerIds="registeredPlayerIds"
                  @close="showRegisterPlayerModal = false"
                  @registered="handlePlayerRegistered"
                />

                <!-- QR Check-in Modal -->
                <QRCheckinModal
                  :isOpen="showQRCheckinModal"
                  :tournamentId="selectedTournamentId"
                  @close="showQRCheckinModal = false"
                  @checkedIn="handleQRCheckedIn"
                />

                <!-- Seating Tab -->
                <div v-if="activeTab === 'seating'" class="">
                    <TournamentSeatingManager ref="seatingManager" />
                </div>

                <!-- Settings Tab -->
                <div v-if="activeTab === 'settings'" class="">
                    <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
                        <div class="flex items-center justify-between mb-6">
                            <div class="flex items-center gap-3">
                                <ion-icon :icon="settingsOutline" class="w-6 h-6 text-pp-text-primary"></ion-icon>
                                <h3 class="text-xl font-semibold text-pp-text-primary">{{ t('headings.tournamentSettings') }}</h3>
                            </div>
                            <button
                                v-if="canEditTournament"
                                @click="openEditModal"
                                class="pp-action-button pp-action-button--primary"
                            >
                                <ion-icon :icon="createOutline" class="w-5 h-5" />
                                {{ t('tournament.edit') }}
                            </button>
                        </div>

                        <!-- Tournament Info Display -->
                        <div class="space-y-4" v-if="tournament">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="text-sm text-white/60">{{ t('tournament.name') }}</label>
                                    <p class="text-white font-medium">{{ tournament.title }}</p>
                                </div>
                                <div>
                                    <label class="text-sm text-white/60">{{ t('tournament.buyIn') }}</label>
                                    <p class="text-white font-medium">{{ formatPrice(tournament.buyInCents, locale) }}</p>
                                </div>
                                <div>
                                    <label class="text-sm text-white/60">{{ t('tournament.startTime') }}</label>
                                    <p class="text-white font-medium">{{ new Date(tournament.startTime).toLocaleString() }}</p>
                                </div>
                                <div>
                                    <label class="text-sm text-white/60">{{ t('tournament.seatCap') }}</label>
                                    <p class="text-white font-medium">{{ tournament.seatCap || t('tournament.unlimited') }}</p>
                                </div>
                                <div>
                                    <label class="text-sm text-white/60">{{ t('tournament.status') }}</label>
                                    <p class="mt-1">
                                        <span :class="[
                                            'px-3 py-1 rounded-full text-sm font-medium border',
                                            getTournamentStatusClass(tournament.liveStatus || 'UNKNOWN')
                                        ]">
                                            {{ getTournamentStatusLabel(tournament.liveStatus || 'UNKNOWN') }}
                                        </span>
                                    </p>
                                </div>
                                <div v-if="tournament.description">
                                    <label class="text-sm text-white/60">{{ t('tournament.description') }}</label>
                                    <p class="text-white font-medium">{{ tournament.description }}</p>
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
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { useI18n } from '~/composables/useI18n';

definePageMeta({
    middleware: 'auth'
})

import { settingsOutline, createOutline } from 'ionicons/icons'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import { useTournamentStore } from '~/stores/useTournamentStore'
import TournamentStructureCard from "~/components/tournament/clock/TournamentStructureCard.vue";
import TournamentStatusCard from "~/components/tournament/overview/TournamentStatusCard.vue";
import TournamentPlayersCard from "~/components/tournament/overview/TournamentPlayersCard.vue";
import TournamentPrizePool from "~/components/tournament/overview/TournamentPrizePool.vue";
import TournamentSeatingManager from "~/components/tournament/seating/TournamentSeatingManager.vue";
import TournamentFormModal from "~/components/tournament/TournamentFormModal.vue";
import RegisterPlayerModal from "~/components/tournament/players/RegisterPlayerModal.vue";
import QRCheckinModal from "~/components/tournament/players/QRCheckinModal.vue";
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

// Use store getters for reactive data
const tournament = computed(() => tournamentStore.tournament)
const clock = computed(() => tournamentStore.clock)
const club = computed(() => clubStore.club)

// Edit modal state
const showEditModal = ref(false)

// Player modals state
const showRegisterPlayerModal = ref(false)
const showQRCheckinModal = ref(false)

// Fetch tournament players for filtering in RegisterPlayerModal
const { data: playersData, refresh: refreshPlayers } = await useLazyAsyncData(
  `players-page-${selectedTournamentId}`,
  () => GqlGetTournamentPlayers({ tournamentId: selectedTournamentId })
)

// Get registered player IDs to filter them out in search
const registeredPlayerIds = computed(() => {
  return (playersData.value?.tournamentPlayers || []).map((tp: any) => tp.user.id)
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
    console.log('Player checked in:', data)
    
    // If seatingManager component is available, refresh its data
    if (seatingManager.value && seatingManager.value.refreshSeatingData) {
        await seatingManager.value.refreshSeatingData()
    }
}

// Handle seat player button click
const handleSeatPlayer = async (data: { playerId: string, playerName: string }) => {
    console.log('Seating player:', data)

    // Switch to seating tab
    activeTab.value = 'seating'

    // Wait for the tab to render, then scroll to find the player
    await nextTick()

    // Wait a bit more for the seating manager to load data
    setTimeout(() => {
        scrollToPlayer(data.playerId, data.playerName)
    }, 500)
}

// Handle player registered via modal
const handlePlayerRegistered = async (data: { playerId: string }) => {
    console.log('Player registered:', data)
    // Refresh players list
    await refreshPlayers()
}

// Handle QR check-in
const handleQRCheckedIn = async (data: { registrationId: string; result: any }) => {
    console.log('Player checked in via QR:', data)
    // Refresh players list
    await refreshPlayers()
    // If seatingManager component is available, refresh its data
    if (seatingManager.value && seatingManager.value.refreshSeatingData) {
        await seatingManager.value.refreshSeatingData()
    }
}

// Scroll to find a specific player in the seating area
const scrollToPlayer = (playerId: string, playerName: string) => {
    // Look for the player by name in table cards first
    const tableCards = document.querySelectorAll('[data-table-card]')
    let foundPlayerElement = null
    
    // Search for player name in seated players lists
    tableCards.forEach(tableCard => {
        const playerNameElements = tableCard.querySelectorAll('*')
        playerNameElements.forEach(element => {
            if (element.textContent && element.textContent.includes(playerName)) {
                // Found the player name, use the parent table card
                foundPlayerElement = tableCard
            }
        })
    })
    
    if (foundPlayerElement) {
        foundPlayerElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        })
        
        // Add a temporary highlight effect
        foundPlayerElement.classList.add('ring-4', 'ring-pp-accent-gold', 'ring-opacity-75')
        setTimeout(() => {
            foundPlayerElement?.classList.remove('ring-4', 'ring-pp-accent-gold', 'ring-opacity-75')
        }, 3000)
        
        console.log(`Found and scrolled to ${playerName} in a table`)
    } else {
        // If not found in tables, player might be unassigned - scroll to top
        const seatingContainer = document.querySelector('[data-seating-container]')
        if (seatingContainer) {
            seatingContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            })
            console.log(`Player ${playerName} might be unassigned - scrolled to seating area`)
        }
    }
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
watch(clockUpdates, (data: {tournamentClockUpdates: TournamentClock}) => {
    console.log('[TournamentPage] Clock subscription update received:', data)
    if (data?.tournamentClockUpdates) {
        console.log('[TournamentPage] Updating store with clock:', data.tournamentClockUpdates)
        tournamentStore.setSelectedTournamentClock(data.tournamentClockUpdates)
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
    opacity: 1 !important;
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
    opacity: 1 !important;
    margin: 0;
}


/* Remove default ionic tab bar styling */
ion-tab-bar {
    border: none !important;
}

/* Custom Modal Animations */
.modal-enter-active,
.modal-leave-active {
    transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
    transform: scale(0.95);
}
</style>