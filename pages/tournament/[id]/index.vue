<template>
    <ion-page class="bg-pp-bg-primary">
        <!-- Custom Header -->
        <div class="bg-pp-bg-primary border-b border-pp-border px-8 py-6">
            <div class="flex justify-between items-start">
                <div>
                    <div class="flex items-center gap-4 mb-2">
                        <img src="/assets/icon-no-bg.png" alt="Pocket Pair Logo" class="w-12 h-12" />
                        <h1 class="text-4xl font-bold text-pp-text-primary">Pocket Pair - Tournament Manager</h1>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="text-lg text-white">{{ tournament?.club?.name || 'Loading...' }}</span>
                        <div class="flex items-center gap-2">
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
                                    connectionStatus === 'connected' ? 'Connected' :
                                        connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Offline'
                                }}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <span class="text-sm text-white">Last update: {{ new Date(lastUpdate).toLocaleTimeString() }}</span>
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span class="text-lg font-semibold text-white">{{ tournament?.title || 'Loading Tournament...' }}</span>
                    </div>
                </div>
            </div>
        </div>

        <ion-content class="bg-pp-bg-primary">
            <!-- Ionic Tabs -->
            <ion-tabs>
                <ion-tab-bar slot="top" class="bg-transparent border-b-0 py-6 px-8">
                    <div class="grid grid-cols-5 gap-2 bg-pp-bg-secondary/50 p-2 rounded-2xl border border-pp-border w-full">
                        <ion-tab-button
                            v-for="tab in tabs"
                            :key="tab.value"
                            :tab="tab.value"
                            class="tab-button-custom-grid"
                        >
                            <ion-label class="text-base font-medium">{{ tab.label }}</ion-label>
                        </ion-tab-button>
                    </div>
                </ion-tab-bar>

                <ion-tab :tab="'overview'">
                    <div class="px-8 py-6">
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
                </ion-tab>

                <ion-tab :tab="'clock'">
                    <div class="px-8 py-6">
                        <div class="grid grid-cols-2 gap-8">
                            <TournamentClockCard />

                            <TournamentStructureCard
                                :current-level-index="(liveState?.currentLevel || 1) - 1"
                            />
                        </div>
                    </div>
                </ion-tab>


                <ion-tab :tab="'players'">
                    <div class="px-8 py-6">
                        <TournamentPlayersTable />
                    </div>
                </ion-tab>

                <ion-tab :tab="'seating'">
                    <div class="px-8 py-6">
                        <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
                            <div class="flex items-center gap-3 mb-6">
                                <IonIcon :icon="gridOutline" class="w-6 h-6 text-pp-text-primary" />
                                <h3 class="text-xl font-semibold text-pp-text-primary">Table Management</h3>
                            </div>
                            <p class="text-white">Seating chart and table management will be available here.</p>
                        </div>
                    </div>
                </ion-tab>

                <ion-tab :tab="'settings'">
                    <div class="px-8 py-6">
                        <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
                            <div class="flex items-center gap-3 mb-6">
                                <ion-icon :icon="settingsOutline" class="w-6 h-6 text-pp-text-primary"></ion-icon>
                                <h3 class="text-xl font-semibold text-pp-text-primary">Tournament Settings</h3>
                            </div>
                            <p class="text-white">Tournament configuration and advanced settings will be available here.</p>
                        </div>
                    </div>
                </ion-tab>
            </ion-tabs>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: 'auth'
})

import { settingsOutline, gridOutline } from 'ionicons/icons'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import { useTournamentStore } from '~/stores/useTournamentStore'
import TournamentStructureCard from "~/components/tournament/clock/TournamentStructureCard.vue";
import TournamentStatusCard from "~/components/tournament/overview/TournamentStatusCard.vue";
import TournamentPlayersCard from "~/components/tournament/overview/TournamentPlayersCard.vue";
import TournamentPrizePool from "~/components/tournament/overview/TournamentPrizePool.vue";

const { connectionStatus } = useNetworkStatus()
const lastUpdate = ref(Date.now())
const route = useRoute()
const tournamentStore = useTournamentStore()

// Use store getters for reactive data
const tournament = computed(() => tournamentStore.tournament)
const liveState = computed(() => tournamentStore.liveState)

const tabs = [
    { label: 'Overview', value: 'overview' },
    { label: 'Clock', value: 'clock' },
    { label: 'Players', value: 'players' },
    { label: 'Seating', value: 'seating' },
    { label: 'Settings', value: 'settings' }
]

// Update last update timestamp when connection status changes
watch(connectionStatus, () => {
    lastUpdate.value = Date.now()
})

// Update timestamp periodically when connected
const updateTimer = setInterval(() => {
    if (connectionStatus.value === 'connected') {
        lastUpdate.value = Date.now()
    }
}, 30000) // Update every 30 seconds when connected

onBeforeUnmount(() => clearInterval(updateTimer))

// ---

onMounted(async () => {
    const selectedTournamentId = route.params.id as string
    if (selectedTournamentId) {
        const resTournament = await GqlGetTournamentComplete({ tournamentId: selectedTournamentId })
        tournamentStore.setSelectedTournament(resTournament.tournamentComplete)

        const resStructure = await GqlGetTournamentStructure({ tournamentId: selectedTournamentId })
        tournamentStore.setSelectedTournamentStructure(resStructure.tournamentStructure)

        const resClock = await GqlGetTournamentClock({ tournamentId: selectedTournamentId })
        tournamentStore.setSelectedTournamentClock(resClock.tournamentClock)
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