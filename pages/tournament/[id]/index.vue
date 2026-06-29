<template>
  <ion-page class="page-bg">
    <!-- Sub-header: back link, event identity, live + connection, TV display -->
    <div class="custom-header">
      <div class="sub-header">
        <button class="back-link" @click="goHome" :aria-label="t('common.back')">
          <ion-icon :icon="chevronBackOutline" class="back-icon" />
          <span>{{ t('common.back') }}</span>
        </button>

        <div class="sub-header__id">
          <h1 class="sub-header__title">
            {{ tournament?.title || t('status.loadingTournament') }}
          </h1>
          <div class="sub-header__meta">
            <span class="sub-header__club">{{ club?.name || t('status.loading') }}</span>
            <PpStatusPill v-if="isLive" tone="live" dot>{{ t('status.live') }}</PpStatusPill>
            <span class="connection-status">
              <span class="status-dot" :class="`status-dot--${connectionStatusKey}`" />
              <span class="status-label" :class="`status-label--${connectionStatusKey}`">
                {{ connectionStatusLabel }}
              </span>
            </span>
          </div>
        </div>

        <div class="sub-header__actions">
          <PpButton
            variant="secondary"
            size="sm"
            :title="t('display.openOnTv')"
            @click="openTvDisplay"
          >
            <ion-icon :icon="tvOutline" class="icon-md" />
            {{ t('display.openButton') }}
          </PpButton>
        </div>
      </div>

      <!-- Segmented tab navigation -->
      <div class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          :class="[
            'tab-button',
            activeTab === tab.value ? 'tab-button--active' : 'tab-button--inactive',
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
          <!-- Multi-day series banner -->
          <div v-if="tournament?.seriesId" class="series-banner">
            <div class="series-banner-body">
              <span class="series-banner-eyebrow">{{ t('series.partOfSeries') }}</span>
              <span class="series-banner-label">{{ tournament.flightLabel }}</span>
            </div>
            <div class="series-banner-actions">
              <PpButton
                v-if="!tournament.isFinalDay && tournament.liveStatus !== 'FINISHED'"
                variant="primary"
                size="sm"
                @click="showCloseFlightModal = true"
              >
                {{ t('series.closeFlight') }}
              </PpButton>
              <PpButton variant="secondary" size="sm" :to="`/series/${tournament.seriesId}`">
                {{ t('series.viewSeries') }}
              </PpButton>
            </div>
          </div>

          <!-- Warning: No tables linked -->
          <div v-if="showNoTablesWarning" class="warning-banner warning-banner--orange">
            <ion-icon :icon="warningOutline" class="warning-icon warning-icon--orange" />
            <div class="warning-body">
              <p class="warning-title warning-title--orange">{{ t('warnings.noTablesLinked') }}</p>
              <p class="warning-desc warning-desc--orange">
                {{ t('warnings.noTablesLinkedDesc') }}
              </p>
            </div>
            <PpButton variant="warning" class="warning-action" @click="activeTab = 'seating'">
              {{ t('warnings.goToSeating') }}
            </PpButton>
          </div>

          <!-- Warning: Unseated checked-in players -->
          <div v-if="showUnseatedWarning" class="warning-banner warning-banner--amber">
            <ion-icon :icon="warningOutline" class="warning-icon warning-icon--amber" />
            <div class="warning-body">
              <p class="warning-title warning-title--amber">
                {{ t('warnings.unseatedPlayers', { count: unseatedCheckedInCount }) }}
              </p>
              <p class="warning-desc warning-desc--amber">
                {{ t('warnings.unseatedPlayersDesc') }}
              </p>
            </div>
            <PpButton variant="warning" class="warning-action" @click="activeTab = 'players'">
              {{ t('warnings.goToPlayers') }}
            </PpButton>
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
            <PpButton variant="secondary" @click="showTournamentQRModal = true">
              <ion-icon :icon="qrCodeOutline" class="icon-md" />
              {{ t('qr.tournament.button') }}
            </PpButton>
          </div>

          <!-- Cash report (manager-only financials) -->
          <TournamentCashReportCard
            ref="cashReportCard"
            :tournament-id="selectedTournamentId"
            :tournament-title="tournament?.title"
            class="results-section"
          />

          <!-- Bounty leaderboard (PKO tournaments) -->
          <TournamentBountiesCard
            v-if="isPko"
            :tournament-id="selectedTournamentId"
            class="results-section"
          />

          <!-- Results Display (FINISHED) -->
          <template v-if="tournament?.liveStatus === 'FINISHED'">
            <div class="export-bar export-bar--end">
              <PpButton variant="secondary" size="sm" @click="openPrint('payouts')">
                <ion-icon :icon="printOutline" class="icon-md" />
                {{ t('exports.printPayoutSheet') }}
              </PpButton>
            </div>
            <TournamentResultsDisplay class="results-section" />
          </template>

          <!-- Prediction resolution (FINISHED; self-gates on the predictions feature flag) -->
          <TournamentPredictionsCard
            v-if="tournament?.liveStatus === 'FINISHED'"
            class="results-section"
          />

          <!-- Recent Activity -->
          <TournamentActivityFeed :tournament-id="selectedTournamentId" />
        </div>

        <!-- Clock Tab -->
        <Transition name="tab-fade" mode="out-in">
          <div v-if="activeTab === 'clock'" key="clock">
            <div class="clock-grid">
              <TournamentClockCard />
              <TournamentStructureCard :current-level-index="(clock?.currentLevel || 1) - 1" />
            </div>
          </div>
        </Transition>

        <!-- Players Tab -->
        <Transition name="tab-fade" mode="out-in">
          <div v-if="activeTab === 'players'" key="players">
            <div class="export-bar">
              <PpButton variant="ghost" size="sm" @click="exportPlayersCsv">
                <ion-icon :icon="downloadOutline" class="icon-md" />
                {{ t('exports.button') }}
              </PpButton>
              <PpButton variant="ghost" size="sm" @click="openPrint('players')">
                <ion-icon :icon="printOutline" class="icon-md" />
                {{ t('exports.printPlayerList') }}
              </PpButton>
            </div>
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
          :clubPlayerIds="clubPlayerIds"
          :liveStatus="tournament?.liveStatus || null"
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

        <!-- Close Flight Modal (multi-day series) -->
        <CloseFlightModal
          :open="showCloseFlightModal"
          :tournament-id="selectedTournamentId"
          @close="showCloseFlightModal = false"
          @closed="onFlightClosed"
        />

        <!-- Tournament-complete celebration (fires once on the FINISHED transition) -->
        <TournamentCompleteCelebration
          :open="showCompletionCelebration"
          :tournament-title="tournament?.title"
          @close="showCompletionCelebration = false"
        />

        <!-- Seating Tab -->
        <Transition name="tab-fade" mode="out-in">
          <div v-if="activeTab === 'seating'" key="seating">
            <TournamentSeatingManager
              ref="seatingManager"
              @navigate-to-players="activeTab = 'players'"
            />
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
                <PpButton v-if="canEditTournament" @click="openEditModal">
                  <ion-icon :icon="createOutline" class="icon-md" />
                  {{ t('tournament.edit') }}
                </PpButton>
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
                    <p class="info-value">{{ formatPrice(tournament.buyInCents) }}</p>
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
                      <PpBadge
                        :variant="getTournamentStatusVariant(tournament.liveStatus || 'UNKNOWN')"
                      >
                        {{ getTournamentStatusLabel(tournament.liveStatus || 'UNKNOWN', t) }}
                      </PpBadge>
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
import { useI18n } from '~/composables/useI18n'

definePageMeta({
  middleware: 'auth',
  title: 'nav.tournaments',
})

import {
  settingsOutline,
  createOutline,
  warningOutline,
  qrCodeOutline,
  downloadOutline,
  printOutline,
  chevronBackOutline,
  tvOutline,
} from 'ionicons/icons'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import { useTournamentStore } from '~/stores/useTournamentStore'
import TournamentStructureCard from '~/components/tournament/clock/TournamentStructureCard.vue'
import TournamentStatusCard from '~/components/tournament/overview/TournamentStatusCard.vue'
import TournamentPlayersCard from '~/components/tournament/overview/TournamentPlayersCard.vue'
import TournamentPrizePool from '~/components/tournament/overview/TournamentPrizePool.vue'
import TournamentSeatingManager from '~/components/tournament/seating/TournamentSeatingManager.vue'
import TournamentFormModal from '~/components/tournament/TournamentFormModal.vue'
import RegisterPlayerModal from '~/components/tournament/players/RegisterPlayerModal.vue'
import TournamentQRModal from '~/components/tournament/TournamentQRModal.vue'
import EnterResultsModal from '~/components/tournament/results/EnterResultsModal.vue'
import CloseFlightModal from '~/components/tournament/series/CloseFlightModal.vue'
import TournamentResultsDisplay from '~/components/tournament/results/TournamentResultsDisplay.vue'
import TournamentPredictionsCard from '~/components/tournament/overview/TournamentPredictionsCard.vue'
import TournamentCashReportCard from '~/components/tournament/entries/TournamentCashReportCard.vue'
import TournamentBountiesCard from '~/components/tournament/entries/TournamentBountiesCard.vue'
import TournamentActivityFeed from '~/components/tournament/overview/TournamentActivityFeed.vue'
import { useGqlSubscription } from '~/composables/useGqlSubscription'
import type { TournamentClock } from '~/types/clock'
import { formatPrice } from '~/utils'
import { getTournamentStatusLabel, getTournamentStatusVariant } from '~/utils/tournamentStatus'
import { getRegistrationStatusLabel } from '~/utils/registrationStatus'
import { downloadCsv, exportFilename } from '~/utils/exportCsv'

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
const cashReportCard = ref()

// Use store getters for reactive data
const tournament = computed(() => tournamentStore.tournament)

// Celebrate the moment a tournament finishes. Only on a live transition into
// FINISHED (prev defined & not already finished) - navigating to an
// already-finished tournament shouldn't re-pop the celebration.
const showCompletionCelebration = ref(false)
watch(
  () => tournament.value?.liveStatus,
  (status, prev) => {
    if (status === 'FINISHED' && prev && prev !== 'FINISHED') {
      showCompletionCelebration.value = true
    }
  },
)
const isPko = computed(() => (tournament.value?.bountyType ?? 'NONE') !== 'NONE')
const clock = computed(() => tournamentStore.clock)
const club = computed(() => clubStore.club)

// Live pill: tournament is mid-flight or the clock is actively running.
const isLive = computed(() => {
  const liveStatuses = ['LATE_REGISTRATION', 'IN_PROGRESS', 'BREAK', 'FINAL_TABLE']
  return (
    clock.value?.status === 'RUNNING' || liveStatuses.includes(tournament.value?.liveStatus || '')
  )
})

// Connection status reduced to a token + label for the sub-header indicator.
const connectionStatusKey = computed(() => {
  if (connectionStatus.value === 'connected') return 'connected'
  if (connectionStatus.value === 'reconnecting') return 'reconnecting'
  return 'offline'
})
const connectionStatusLabel = computed(() => {
  if (connectionStatusKey.value === 'connected') return t('status.connected')
  if (connectionStatusKey.value === 'reconnecting') return t('status.reconnecting')
  return t('status.offline')
})

// Open the TV display (read-only big-screen clock) in a new tab.
const openTvDisplay = () => {
  window.open(`/tournament/${selectedTournamentId}/display`, '_blank', 'noopener')
}

// Edit modal state
const showEditModal = ref(false)

// Results modal state
const showEnterResultsModal = ref(false)

// Multi-day series: close-flight modal state
const showCloseFlightModal = ref(false)

// Player modals state
const showRegisterPlayerModal = ref(false)
const showTournamentQRModal = ref(false)

// Fetch seating data for warning banner
const { data: overviewSeatingData, refresh: refreshOverviewSeating } = await useLazyAsyncData(
  `overview-seating-${selectedTournamentId}`,
  () => GqlGetTournamentSeatingChart({ tournamentId: selectedTournamentId }),
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
  return tournamentStore.registrations?.filter((r) => r.status === 'CHECKED_IN').length || 0
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
  () => GqlGetTournamentPlayers({ tournamentId: selectedTournamentId }),
)

// Club-player IDs already in this tournament - used to filter them out of the
// roster search in RegisterPlayerModal (registration is keyed on club_player).
const clubPlayerIds = computed(() => {
  return (playersData.value?.tournamentPlayers?.items || [])
    .map((tp: any) => tp.registration.clubPlayerId)
    .filter(Boolean)
})

// ── Exports ────────────────────────────────────────────────────────
// Seat label per player, resolved from the seating chart we already load.
const seatByPlayer = computed(() => {
  const map = new Map<string, string>()
  for (const tbl of overviewSeatingData.value?.tournamentSeatingChart?.tables || []) {
    const tableNo = tbl.table?.tableNumber
    for (const s of tbl.seats || []) {
      const a = s.assignment
      const key = a?.clubPlayerId || a?.userId
      if (key && a?.seatNumber != null) map.set(key, `T${tableNo} · S${a.seatNumber}`)
    }
  }
  return map
})

const exportPlayersCsv = () => {
  const rows = (playersData.value?.tournamentPlayers?.items || [])
    .filter((tp: any) => tp.registration.status !== 'CANCELLED')
    .map((tp: any) => {
      const key = tp.registration.clubPlayerId || tp.registration.userId
      return {
        name: tp.displayName || tp.user?.username || tp.user?.email || '-',
        status: tp.registration.status,
        seat: (key && seatByPlayer.value.get(key)) || '',
        registeredAt: tp.registration.registrationTime,
      }
    })
    .toSorted((a: any, b: any) => a.name.localeCompare(b.name))

  downloadCsv(exportFilename([tournament.value?.title, t('exports.doc.playerList')]), rows, [
    { label: t('exports.col.player'), value: (r) => r.name },
    { label: t('exports.col.status'), value: (r) => getRegistrationStatusLabel(r.status, t) },
    { label: t('exports.col.seat'), value: (r) => r.seat },
    {
      label: t('exports.col.registeredAt'),
      value: (r) =>
        r.registeredAt ? new Date(r.registeredAt).toLocaleString(`${locale.value}-BE`) : '',
    },
  ])
}

// Open a printable document (payout sheet / player list) in a new tab.
const openPrint = (doc: 'payouts' | 'players') => {
  window.open(`/tournament/${selectedTournamentId}/print?doc=${doc}`, '_blank', 'noopener')
}

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
  { label: t('tabs.settings'), value: 'settings' },
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
const handlePlayerCheckedIn = async (data: { playerId: string; result: any }) => {
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

// Handle entry added (refresh stats in prize pool card + cash report)
const handleEntryAdded = async () => {
  if (prizePoolCard.value?.refreshStats) {
    await prizePoolCard.value.refreshStats()
  }
  if (cashReportCard.value?.refresh) {
    await cashReportCard.value.refresh()
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

// Handle a flight closed (multi-day): refresh tournament (now FINISHED).
const onFlightClosed = async () => {
  showCloseFlightModal.value = false
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
  immediate: true,
})

// Watch for subscription updates and update the store
let lastClockLevel: number | null = null
watch(clockUpdates, async (raw) => {
  const data = raw as { tournamentClockUpdates?: TournamentClock } | undefined
  const update = data?.tournamentClockUpdates
  if (!update) return
  tournamentStore.setSelectedTournamentClock(update)
  // A level advance can auto-close late registration server-side (status flips
  // to IN_PROGRESS). Refetch the tournament so the live status badge reflects it.
  if (lastClockLevel !== null && update.currentLevel !== lastClockLevel) {
    const response = await GqlGetTournament({ id: selectedTournamentId })
    if (response.tournament) tournamentStore.setSelectedTournament(response.tournament)
  }
  lastClockLevel = update.currentLevel
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
  immediate: true,
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
  immediate: !!clubId.value,
})

watch(seatingUpdates, async (data: any) => {
  const evt = data?.clubSeatingChanges
  if (!evt) return
  // Ignore events for other tournaments in the same club
  if (evt.tournamentId && evt.tournamentId !== selectedTournamentId) return

  // Refresh active seating tab (if mounted) and overview warning banner
  await Promise.all([seatingManager.value?.refreshSeatingData?.(), refreshOverviewSeating()])

  // Refresh tournament so registration statuses stay in sync
  // (seating events change statuses: CHECKED_IN→SEATED, SEATED→BUSTED, etc.)
  const response = await GqlGetTournament({ id: selectedTournamentId })
  if (response.tournament) tournamentStore.setSelectedTournament(response.tournament)
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
  immediate: true,
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
  background-color: var(--color-pp-bg);
}

.content-bg {
  background-color: var(--color-pp-bg);
  --padding-top: 0 !important;
}

/* Custom Header */
.custom-header {
  background-color: var(--color-pp-bg);
  border-bottom: 1px solid var(--color-pp-border-strong);
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

.sub-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

/* Clear the fixed hamburger on phones; the rail replaces it on tablet+. */
@media (max-width: 767px) {
  .sub-header {
    padding-left: 3rem;
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.7rem 0.4rem 0.5rem;
  border-radius: 0.6rem;
  border: 1px solid var(--color-pp-border);
  background-color: var(--color-pp-surface);
  color: var(--color-pp-text-muted);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;
}

.back-link:hover {
  color: var(--color-pp-text);
  border-color: var(--color-pp-border-strong);
}

.back-icon {
  width: 1.05rem;
  height: 1.05rem;
}

.sub-header__id {
  min-width: 0;
  flex: 1;
}

.sub-header__title {
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 2vw + 0.5rem, 1.65rem);
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-pp-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub-header__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.3rem;
  flex-wrap: wrap;
}

.sub-header__club {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-pp-text-muted);
}

.connection-status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.status-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 9999px;
}

.status-dot--connected {
  background-color: var(--color-pp-success);
}

.status-dot--reconnecting {
  background-color: var(--color-pp-warning);
}

.status-dot--offline {
  background-color: var(--color-pp-danger);
}

.status-label {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 500;
}

.status-label--connected {
  color: var(--color-pp-success);
}

.status-label--reconnecting {
  color: var(--color-pp-warning);
}

.status-label--offline {
  color: #f87171;
}

.sub-header__actions {
  margin-left: auto;
  flex-shrink: 0;
}

/* Segmented tab bar */
.tab-bar {
  display: flex;
  overflow-x: auto;
  gap: 0.25rem;
  background-color: var(--color-pp-surface);
  padding: 0.3rem;
  border-radius: 0.85rem;
  border: 1px solid var(--color-pp-border);
}

.tab-button {
  flex: 1;
  min-width: max-content;
  padding: 0.55rem 1rem;
  border-radius: 0.6rem;
  border: 1px solid transparent;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 500;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
  white-space: nowrap;
  cursor: pointer;
}

.tab-button--active {
  background-color: rgba(var(--pp-accent-rgb), 0.1);
  color: var(--color-pp-gold);
  border-color: rgba(var(--pp-accent-rgb), 0.4);
}

.tab-button--inactive {
  color: var(--color-pp-text-muted);
}

.tab-button--inactive:hover {
  color: var(--color-pp-text);
  background-color: rgba(255, 255, 255, 0.04);
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

.series-banner {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  background-color: rgba(var(--pp-accent-rgb), 0.08);
  border: 1px solid rgba(var(--pp-accent-rgb), 0.3);
}

.series-banner-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.series-banner-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-pp-gold-deep);
}

.series-banner-label {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--color-pp-text);
}

.series-banner-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
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

/* Keep the action button from shrinking inside the flex banner; size/colour
   come from <PpButton variant="warning">. */
.warning-action {
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

/* Export toolbar (players tab, payout sheet) */
.export-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.export-bar--end {
  justify-content: flex-end;
}

/* Results Section */
.results-section {
  margin-bottom: 2rem;
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
  background-color: var(--color-pp-surface-2);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--pp-shadow-sm);
  border: 1px solid var(--color-pp-border-strong);
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
  color: var(--color-pp-text);
}

.settings-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-pp-text);
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
  --color-selected: var(--color-pp-gold);
  --border-radius: 12px;
  --padding-start: 32px;
  --padding-end: 32px;
  --margin: 4px;
  --box-shadow: none;
  --box-shadow-selected: 0 2px 8px 0 rgba(var(--pp-accent-rgb), 0.2);
  margin: 0 2px;
  border: 1px solid #54545f; /* Subtle border for visibility */
  transition: all 0.2s ease;
}

.tab-button-custom:hover:not([aria-selected='true']) {
  --background: rgba(94, 164, 184, 0.1);
  --color: #ffffff;
  border: 1px solid #94a3b8;
  transform: translateY(-1px);
}

.tab-button-custom[aria-selected='true'] {
  --background: #24242a;
  border: 1px solid rgba(var(--pp-accent-rgb), 0.6);
  box-shadow: 0 2px 8px 0 rgba(var(--pp-accent-rgb), 0.2);
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
  --color-selected: var(--color-pp-gold);
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  --margin: 0;
  --box-shadow: none;
  --box-shadow-selected: 0 2px 8px 0 rgba(var(--pp-accent-rgb), 0.15);
  border: 1px solid transparent;
  border-radius: 12px;
  transition: all 0.2s ease;
  flex: 1;
}

.tab-button-custom-grid:hover:not([aria-selected='true']) {
  --background: rgba(148, 163, 184, 0.1);
  --color: #ffffff;
  border: 1px solid #94a3b8;
}

.tab-button-custom-grid[aria-selected='true'] {
  --background: #24242a;
  --color: var(--color-pp-gold);
  border: 1px solid rgba(var(--pp-accent-rgb), 0.4);
  box-shadow: 0 2px 8px 0 rgba(var(--pp-accent-rgb), 0.15);
}

.tab-button-custom-grid ion-label {
  font-weight: 500;
  font-size: 14px;
  opacity: 1;
  margin: 0;
}
</style>
