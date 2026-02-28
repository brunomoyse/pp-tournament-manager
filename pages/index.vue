<template>
  <IonPage class="page-root">
    <IonContent class="page-content">
      <div class="page-container">
        <!-- Page Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">{{ t('nav.dashboard') }}</h1>
            <p class="page-subtitle">{{ t('messages.welcomeBack', { name: currentUser?.firstName || currentUser?.username || t('common.user') }) }}</p>
          </div>
          <button
            @click="createTournament"
            class="pp-action-button pp-action-button--primary"
          >
            <IonIcon :icon="addOutline" class="icon-md" />
            {{ t('buttons.createTournament') }}
          </button>
        </div>
        <!-- LIVE Tournament Hero -->
        <div
          v-if="activeTournaments.length > 0"
          class="live-hero pp-card-interactive pp-shimmer-hover"
          @click="activeTournaments[0] && goToTournament(activeTournaments[0].id)"
        >
          <div class="live-hero-inner">
            <div class="live-hero-left">
              <div class="live-icon-wrapper">
                <div class="pp-live-dot live-hero-dot" />
              </div>
              <div>
                <div class="live-hero-badge-row">
                  <span class="live-hero-badge">{{ t('status.live') }}</span>
                </div>
                <h3 class="live-hero-title">{{ activeTournaments[0]?.title }}</h3>
                <div class="live-hero-meta">
                  <span>{{ formatPrice(activeTournaments[0]?.buyInCents, locale) }}</span>
                  <span v-if="activeTournaments.length > 1">&bull;</span>
                  <span v-if="activeTournaments.length > 1" class="live-hero-more">+{{ activeTournaments.length - 1 }} {{ t('labels.more') }}</span>
                </div>
              </div>
            </div>
            <div class="live-hero-right">
              <span class="pp-action-button pp-action-button--primary">
                {{ t('buttons.viewTournament') }}
                <IonIcon :icon="chevronForwardOutline" class="icon-sm" />
              </span>
            </div>
          </div>
        </div>

        <!-- Statistics Cards -->
        <div class="stats-grid">
          <div class="pp-card pp-poker-watermark stat-card" data-suit="&#9824;">
            <div class="stat-header">
              <span class="stat-label">{{ t('headings.activeTournaments') }}</span>
              <IonIcon :icon="trophyOutline" class="stat-icon" />
            </div>
            <div class="stat-value">{{ activeTournaments.length }}</div>
          </div>

          <div class="pp-card pp-poker-watermark stat-card" data-suit="&#9829;">
            <div class="stat-header">
              <span class="stat-label">{{ t('reports.players') }}</span>
              <IonIcon :icon="peopleOutline" class="stat-icon" />
            </div>
            <div class="stat-value">{{ playerStats.uniquePlayers }}</div>
            <div v-if="playerStats.thisWeek > 0" class="stat-trend">{{ playerStats.thisWeek }} {{ t('reports.period.last7Days').toLowerCase() }}</div>
          </div>

          <div class="pp-card pp-poker-watermark stat-card" data-suit="&#9830;">
            <div class="stat-header">
              <span class="stat-label">{{ t('reports.avgBuyIn') }}</span>
              <IonIcon :icon="cashOutline" class="stat-icon" />
            </div>
            <div class="stat-value">{{ formatPrice(playerStats.avgBuyIn, locale) }}</div>
          </div>

          <div class="pp-card pp-poker-watermark stat-card" data-suit="&#9827;">
            <div class="stat-header">
              <span class="stat-label">{{ t('headings.regularPlayers') }}</span>
              <IonIcon :icon="peopleOutline" class="stat-icon" />
            </div>
            <div class="stat-value">{{ playerStats.regularPlayers }}</div>
          </div>
        </div>

        <!-- Recent Tournaments Section -->
        <div class="pp-card recent-section">
          <div class="recent-header">
            <h3 class="recent-title">{{ t('headings.recentTournaments') }}</h3>
            <div class="recent-header-actions">
              <span class="tournament-count-badge">{{ recentTournaments.length }} {{ t('labels.tournaments') }}</span>
              <button
                @click="viewAllTournaments"
                class="view-all-button"
              >
                {{ t('buttons.viewAll') }}
              </button>
            </div>
          </div>

          <!-- Loading Skeletons -->
          <div v-if="isLoading" class="skeleton-list">
            <div v-for="i in 3" :key="i" class="skeleton-row">
              <div class="skeleton-left">
                <IonSkeletonText :animated="true" style="width: 48px; height: 48px; border-radius: 8px" />
                <div class="skeleton-text">
                  <IonSkeletonText :animated="true" style="width: 60%; height: 20px; margin-bottom: 8px" />
                  <IonSkeletonText :animated="true" style="width: 40%; height: 16px" />
                </div>
              </div>
              <IonSkeletonText :animated="true" style="width: 80px; height: 28px; border-radius: 6px" />
            </div>
          </div>

          <div v-else-if="recentTournaments.length > 0" class="tournament-list">
            <div
              v-for="(tournament, index) in recentTournaments"
              :key="tournament.id"
              class="pp-stagger-item pp-shimmer-hover tournament-row"
              :style="{ animationDelay: `${index * 50}ms` }"
              @click="goToTournament(tournament.id)"
            >
              <div class="tournament-row-left">
                <div class="tournament-icon-wrapper">
                  <IonIcon :icon="trophyOutline" class="tournament-icon" />
                </div>
                <div>
                  <h4 class="tournament-name">{{ tournament.title }}</h4>
                  <div class="tournament-meta">
                    <span>{{ formatPrice(tournament.buyInCents, locale) }}</span>
                    <span>&bull;</span>
                    <span>{{ new Date(tournament.startTime).toLocaleDateString(locale) }}</span>
                  </div>
                </div>
              </div>
              <div class="tournament-row-right">
                <span :class="['pp-status-badge', getTournamentSmartStatus(tournament).badge]">
                  {{ getTournamentSmartStatus(tournament).label }}
                </span>
                <IonIcon
                  v-if="getTournamentSmartStatus(tournament).needsAttention"
                  :icon="warningOutline"
                  class="attention-icon pp-animate-pulse"
                />
                <IonIcon :icon="chevronForwardOutline" class="chevron-icon" />
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon-wrapper">
              <IonIcon :icon="trophyOutline" class="empty-icon" />
            </div>
            <h4 class="empty-title">{{ t('messages.noTournamentsYet') }}</h4>
            <p class="empty-description">{{ t('messages.createFirstTournament') }}</p>
            <button
              @click="createTournament"
              class="pp-action-button pp-action-button--primary empty-cta"
            >
              <IonIcon :icon="addOutline" class="icon-md" />
              {{ t('buttons.createTournament') }}
            </button>
          </div>
        </div>
      </div>
    </IonContent>

    <!-- Tournament Form Modal -->
    <TournamentFormModal
      :isOpen="showTournamentModal"
      :tournament="null"
      mode="create"
      @close="closeTournamentModal"
      @saved="onTournamentSaved"
    />
  </IonPage>
</template>

<script setup lang="ts">
// Protect this page with authentication
import { LeaderboardPeriod } from '#gql/default'
import type {GetTournamentsQuery, GetLeaderboardQuery} from "#gql";

definePageMeta({
  middleware: 'auth'
})

import {
  IonPage,
  IonContent,
  IonIcon,
  IonSkeletonText,
  alertController
} from '@ionic/vue'
import {
  trophyOutline,
  peopleOutline,
  addOutline,
  chevronForwardOutline,
  cashOutline,
  warningOutline
} from 'ionicons/icons'
import { useAuthStore } from '~/stores/useAuthStore'
import {formatPrice} from "~/utils";
import { useI18n } from '~/composables/useI18n';
import { getTournamentStatusLabel, getTournamentStatusClass } from '~/utils/tournamentStatus'
import TournamentFormModal from '~/components/tournament/TournamentFormModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const clubStore = useClubStore()
const { t, locale } = useI18n()

const { currentUser } = authStore
const { club } = clubStore

const tournaments = ref<GetTournamentsQuery['tournaments']['items']>([])
const allTimeLeaderboard = ref<GetLeaderboardQuery['leaderboard'] | null>(null)
const weekLeaderboard = ref<GetLeaderboardQuery['leaderboard'] | null>(null)

// Loading state
const isLoading = ref(true)

// Modal state
const showTournamentModal = ref(false)

// Player statistics computed from leaderboard data
const playerStats = computed(() => {
  const entries = allTimeLeaderboard.value?.items || []

  // Unique players (all time)
  const uniquePlayers = allTimeLeaderboard.value?.totalCount || 0

  // Active this week
  const thisWeek = weekLeaderboard.value?.totalCount || 0

  // Average buy-in
  const totalBuyIns = entries.reduce((sum, e) => sum + e.totalBuyIns, 0)
  const totalTournaments = entries.reduce((sum, e) => sum + e.totalTournaments, 0)
  const avgBuyIn = totalTournaments > 0 ? Math.round(totalBuyIns / totalTournaments) : 0

  // Regular players (3+ tournaments)
  const regularPlayers = entries.filter(e => e.totalTournaments >= 3).length

  return { uniquePlayers, thisWeek, avgBuyIn, regularPlayers }
})

// Tournament statistics
const activeTournaments = computed(() =>
  tournaments.value.filter(t => t.status === 'IN_PROGRESS')
)

const recentTournaments = computed(() =>
  [...tournaments.value]
    .sort((a, b) => new Date(b.startTime || '').getTime() - new Date(a.startTime || '').getTime())
    .slice(0, 5)
)

// Smart status detection - identifies tournaments that need attention
const getTournamentSmartStatus = (tournament: any) => {
  const now = new Date()
  const startTime = tournament.startTime ? new Date(tournament.startTime) : null
  const endTime = tournament.endTime ? new Date(tournament.endTime) : null

  // Check if tournament should have already started but is still marked as UPCOMING
  if (tournament.status === 'UPCOMING' && startTime && startTime < now) {
    return {
      needsAttention: true,
      suggestedStatus: 'LATE_START',
      badge: 'pp-status--orange',
      label: t('status.lateStart') || 'Demarrage en retard'
    }
  }

  // Check if tournament should have finished but is still IN_PROGRESS or UPCOMING
  if (endTime && endTime < now && tournament.status !== 'COMPLETED') {
    return {
      needsAttention: true,
      suggestedStatus: 'SHOULD_BE_COMPLETED',
      badge: 'pp-status--red',
      label: t('status.shouldBeCompleted') || 'Devrait etre termine'
    }
  }

  // Normal status
  return {
    needsAttention: false,
    badge: getTournamentStatusClass(tournament.status),
    label: getTournamentStatusLabel(tournament.status, t)
  }
}

// Actions
const goToTournament = (id: string) => {
  router.push(`/tournament/${id}`)
}

const createTournament = () => {
  showTournamentModal.value = true
}

const closeTournamentModal = () => {
  showTournamentModal.value = false
}

const onTournamentSaved = async (newTournament?: any) => {
  closeTournamentModal()

  if (!club) return

  // OPTION 3: Optimistic UI Update
  // If we have tournament data from the modal, add it immediately
  if (newTournament) {
    // Add optimistic tournament to the list immediately (UX feels instant!)
    const optimisticTournament = {
      ...newTournament,
      id: newTournament.id || `temp-${Date.now()}`, // Temporary ID if not provided
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _optimistic: true // Flag to identify optimistic updates
    }

    tournaments.value = [optimisticTournament, ...(tournaments.value || [])]
  }

  // Fetch fresh data from server in the background
  try {
    const res = await GqlGetTournaments({ clubId: club.id })
    tournaments.value = res.tournaments?.items || []
  } catch (error) {
    console.error('Failed to refresh tournaments:', error)
    // If refresh fails but we have optimistic data, keep it
    // The user will see their tournament even if the refresh failed
  }
}

const viewAllTournaments = () => {
  router.push('/tournaments')
}

onMounted(async () => {
    if (!club) {
        const alert = await alertController.create({
            header: t('alerts.noClub.header'),
            message: t('alerts.noClub.message'),
            buttons: [t('common.ok')]
        })
        await alert.present()
        isLoading.value = false
        return
    }

    try {
        isLoading.value = true

        // OPTION 2: Progressive Loading
        // Load critical data (tournaments) first - this is what users want to see immediately
        const tournamentsRes = await GqlGetTournaments({ clubId: club.id })
        tournaments.value = tournamentsRes.tournaments?.items || []

        // Show tournaments immediately, stop showing full loading state
        isLoading.value = false

        // Then load leaderboard statistics in the background (non-blocking)
        Promise.all([
            GqlGetLeaderboard({ clubId: club.id, period: LeaderboardPeriod.ALL_TIME, pagination: { limit: 200 } }),
            GqlGetLeaderboard({ clubId: club.id, period: LeaderboardPeriod.LAST_7_DAYS })
        ]).then(([allTimeRes, weekRes]) => {
            allTimeLeaderboard.value = allTimeRes.leaderboard
            weekLeaderboard.value = weekRes.leaderboard
        }).catch(err => {
            console.error('Failed to load leaderboard data:', err)
        })
    } catch (error) {
        console.error('Failed to load tournaments:', error)
        isLoading.value = false
    }
})

</script>

<style scoped>
/* Heading letter spacing */
h1, h3, h4 {
  letter-spacing: -0.025em;
}

/* Icon sizes */
.icon-sm {
  width: 1rem;
  height: 1rem;
}

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

/* Page */
.page-root {
  background-color: var(--pp-bg-primary);
}

.page-content {
  background-color: var(--pp-bg-primary);
}

.page-container {
  padding: 1.5rem 1rem;
}

@media (min-width: 640px) {
  .page-container {
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .page-container {
    padding: 1.5rem 2rem;
  }
}

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--pp-text-primary);
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
}

/* LIVE Tournament Hero */
.live-hero {
  margin-bottom: 1.5rem;
  border-radius: 1rem;
  padding: 1rem;
  border: 2px solid rgba(239, 68, 68, 0.4);
  background: linear-gradient(to right, rgba(239, 68, 68, 0.1), var(--pp-bg-secondary), var(--pp-bg-secondary));
}

.live-hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.live-hero-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.live-icon-wrapper {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background-color: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.live-hero-dot {
  width: 0.625rem;
  height: 0.625rem;
  background-color: var(--pp-red-500);
  border-radius: 9999px;
}

.live-hero-badge-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.125rem;
}

.live-hero-badge {
  color: var(--pp-red-400);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.live-hero-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffffff;
}

.live-hero-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

.live-hero-more {
  color: rgba(255, 255, 255, 0.4);
}

.live-hero-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Statistics Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background-color: var(--pp-bg-secondary);
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--pp-border);
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-icon {
  width: 1rem;
  height: 1rem;
  color: var(--pp-accent-gold);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--pp-accent-gold);
}

.stat-trend {
  font-size: 0.75rem;
  color: var(--pp-green-400);
  margin-top: 0.25rem;
}

/* Recent Tournaments Section */
.recent-section {
  background-color: var(--pp-bg-secondary);
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: var(--pp-shadow-sm);
  border: 1px solid var(--pp-border);
}

.recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.recent-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--pp-text-primary);
}

.recent-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tournament-count-badge {
  padding: 0.25rem 0.75rem;
  background-color: rgba(84, 84, 95, 0.5);
  color: #ffffff;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.view-all-button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--pp-border);
  color: #ffffff;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.view-all-button:hover {
  background-color: rgba(84, 84, 95, 0.2);
}

/* Skeleton */
.skeleton-list > * + * {
  margin-top: 0.5rem;
}

.skeleton-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: rgba(24, 24, 26, 0.5);
  border-radius: 0.5rem;
  border: 1px solid var(--pp-border);
}

.skeleton-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.skeleton-text {
  flex: 1;
}

/* Tournament list */
.tournament-list > * + * {
  margin-top: 0.375rem;
}

.tournament-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: rgba(24, 24, 26, 0.5);
  border-radius: 0.5rem;
  border: 1px solid var(--pp-border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tournament-row:hover {
  background-color: rgba(24, 24, 26, 0.7);
}

.tournament-row-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tournament-icon-wrapper {
  width: 2.5rem;
  height: 2.5rem;
  background-color: var(--pp-bg-secondary);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--pp-border);
  transition: border-color 0.15s ease;
}

.tournament-row:hover .tournament-icon-wrapper {
  border-color: rgba(254, 231, 138, 0.3);
}

.tournament-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--pp-accent-gold);
}

.tournament-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--pp-text-primary);
  margin-bottom: 0.125rem;
}

.tournament-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
}

.tournament-row-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.attention-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--pp-orange-400);
}

.chevron-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: rgba(255, 255, 255, 0.4);
  transition: color 0.15s ease;
}

.tournament-row:hover .chevron-icon {
  color: var(--pp-accent-gold);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 0;
}

.empty-icon-wrapper {
  width: 5rem;
  height: 5rem;
  background-color: var(--pp-bg-primary);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  border: 1px solid var(--pp-border);
}

.empty-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: rgba(255, 255, 255, 0.3);
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.empty-description {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.5rem;
}

.empty-cta {
  margin: 0 auto;
}
</style>
