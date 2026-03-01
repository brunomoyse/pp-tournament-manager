<template>
  <IonPage class="page-bg">
    <IonContent class="content-bg">
      <div class="page-container">
        <!-- Page Header -->
        <div class="header-section">
          <h1 class="page-title">{{ t('reports.title') }}</h1>
        </div>

        <!-- Period Selector Tabs -->
        <div class="period-tabs">
          <button
            v-for="period in periods"
            :key="period.value"
            @click="selectedPeriod = period.value"
            :class="['period-tab', selectedPeriod === period.value ? 'period-tab--active' : 'period-tab--inactive']"
          >
            {{ t(period.label) }}
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <IonSpinner name="crescent" class="spinner" />
        </div>

        <!-- Content -->
        <div v-else>
          <!-- Stats Cards -->
          <div class="stats-grid">
            <!-- Total Tournaments -->
            <div class="pp-card pp-poker-watermark stat-card" data-suit="&#9824;">
              <div class="stat-header">
                <span class="stat-label">{{ t('reports.tournaments') }}</span>
                <IonIcon :icon="trophyOutline" class="stat-icon" />
              </div>
              <div class="stat-value">{{ stats.totalTournaments }}</div>
            </div>

            <!-- Unique Players -->
            <div class="pp-card pp-poker-watermark stat-card" data-suit="&#9829;">
              <div class="stat-header">
                <span class="stat-label">{{ t('reports.players') }}</span>
                <IonIcon :icon="peopleOutline" class="stat-icon" />
              </div>
              <div class="stat-value">{{ stats.totalPlayers }}</div>
            </div>

            <!-- Total Prize Pool -->
            <div class="pp-card pp-poker-watermark stat-card" data-suit="&#9830;">
              <div class="stat-header">
                <span class="stat-label">{{ t('reports.prizePool') }}</span>
                <IonIcon :icon="cashOutline" class="stat-icon" />
              </div>
              <div class="stat-value">{{ formatPrice(stats.totalPrizePool, locale) }}</div>
            </div>

            <!-- Average Buy-in -->
            <div class="pp-card pp-poker-watermark stat-card" data-suit="&#9827;">
              <div class="stat-header">
                <span class="stat-label">{{ t('reports.avgBuyIn') }}</span>
                <IonIcon :icon="walletOutline" class="stat-icon" />
              </div>
              <div class="stat-value">{{ formatPrice(stats.avgBuyIn, locale) }}</div>
            </div>

            <!-- Top Winner -->
            <div class="pp-card stat-card">
              <div class="stat-header">
                <span class="stat-label">{{ t('reports.topWinner') }}</span>
                <IonIcon :icon="ribbonOutline" class="stat-icon" />
              </div>
              <div class="stat-value-name pp-truncate">{{ stats.topWinner?.name || '-' }}</div>
              <div v-if="stats.topWinner" class="stat-subtitle-gold">{{ formatPrice(stats.topWinner.winnings, locale) }}</div>
            </div>

            <!-- Most Games -->
            <div class="pp-card stat-card">
              <div class="stat-header">
                <span class="stat-label">{{ t('reports.mostGames') }}</span>
                <IonIcon :icon="gameControllerOutline" class="stat-icon" />
              </div>
              <div class="stat-value-name pp-truncate">{{ stats.mostGames?.name || '-' }}</div>
              <div v-if="stats.mostGames" class="stat-subtitle-muted">{{ stats.mostGames.count }} {{ t('reports.tournaments').toLowerCase() }}</div>
            </div>
          </div>

          <!-- Leaderboard Section -->
          <div class="leaderboard-section">
            <h2 class="leaderboard-title">{{ t('reports.leaderboard') }}</h2>

            <!-- Empty State -->
            <div v-if="leaderboard.length === 0" class="leaderboard-empty">
              <IonIcon :icon="podiumOutline" class="leaderboard-empty-icon" />
              <p class="leaderboard-empty-text">{{ t('reports.noData') }}</p>
            </div>

            <!-- Podium - Top 3 -->
            <div v-if="leaderboard.length >= 3" class="podium">
              <!-- 2nd Place -->
              <div class="podium-entry podium-entry--second">
                <div class="podium-avatar podium-avatar--second">
                  {{ getInitials(leaderboard[1]?.user) }}
                </div>
                <div class="podium-name">{{ getFullName(leaderboard[1]?.user) }}</div>
                <div class="podium-points">{{ leaderboard[1]?.points }} pts</div>
                <div class="podium-bar podium-bar--second">
                  <span class="podium-rank podium-rank--second">2</span>
                </div>
              </div>

              <!-- 1st Place -->
              <div class="podium-entry podium-entry--first">
                <div class="podium-avatar podium-avatar--first">
                  {{ getInitials(leaderboard[0]?.user) }}
                </div>
                <div class="podium-name-first">{{ getFullName(leaderboard[0]?.user) }}</div>
                <div class="podium-points-first">{{ leaderboard[0]?.points }} pts</div>
                <div class="podium-bar podium-bar--first">
                  <span class="podium-rank podium-rank--first">1</span>
                </div>
              </div>

              <!-- 3rd Place -->
              <div class="podium-entry podium-entry--third">
                <div class="podium-avatar podium-avatar--third">
                  {{ getInitials(leaderboard[2]?.user) }}
                </div>
                <div class="podium-name">{{ getFullName(leaderboard[2]?.user) }}</div>
                <div class="podium-points">{{ leaderboard[2]?.points }} pts</div>
                <div class="podium-bar podium-bar--third">
                  <span class="podium-rank podium-rank--third">3</span>
                </div>
              </div>
            </div>

            <!-- Leaderboard Table -->
            <div v-if="leaderboard.length > 0" class="table-wrapper">
              <table class="leaderboard-table">
                <thead>
                  <tr class="table-head-row">
                    <th class="th-cell">{{ t('reports.rank') }}</th>
                    <th class="th-cell">{{ t('reports.player') }}</th>
                    <th class="th-cell th-center">{{ t('reports.tournaments') }}</th>
                    <th class="th-cell th-center">{{ t('reports.itmPercent') }}</th>
                    <th class="th-cell th-center">{{ t('reports.roiPercent') }}</th>
                    <th class="th-cell th-right">{{ t('reports.netProfit') }}</th>
                    <th class="th-cell-last">{{ t('reports.points') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(entry, index) in leaderboard"
                    :key="entry.user.id"
                    :class="['pp-stagger-item', 'table-row', entry.rank <= 3 ? 'table-row--top3' : '']"
                    :style="{ animationDelay: `${index * 50}ms` }"
                  >
                    <!-- Rank -->
                    <td class="td-cell">
                      <div class="rank-cell">
                        <span v-if="entry.rank === 1" class="rank-medal">&#129351;</span>
                        <span v-else-if="entry.rank === 2" class="rank-medal">&#129352;</span>
                        <span v-else-if="entry.rank === 3" class="rank-medal">&#129353;</span>
                        <span v-else class="rank-number">{{ entry.rank }}</span>
                      </div>
                    </td>
                    <!-- Player -->
                    <td class="td-cell">
                      <div class="player-cell">
                        <div class="player-cell-avatar">
                          {{ getInitials(entry.user) }}
                        </div>
                        <div>
                          <div :class="['player-cell-name', entry.rank === 1 ? 'player-cell-name--gold' : '']">
                            {{ getFullName(entry.user) }}
                          </div>
                          <div class="player-cell-username">@{{ entry.user.username }}</div>
                        </div>
                      </div>
                    </td>
                    <!-- Tournaments -->
                    <td class="td-cell td-center text-white">{{ entry.totalTournaments }}</td>
                    <!-- ITM% -->
                    <td class="td-cell td-center">
                      <span :class="entry.itmPercentage >= 50 ? 'text-green' : 'text-white'">
                        {{ entry.itmPercentage.toFixed(1) }}%
                      </span>
                    </td>
                    <!-- ROI% -->
                    <td class="td-cell td-center">
                      <span :class="entry.roiPercentage >= 0 ? 'text-green' : 'text-red'">
                        {{ entry.roiPercentage >= 0 ? '+' : '' }}{{ entry.roiPercentage.toFixed(1) }}%
                      </span>
                    </td>
                    <!-- Net Profit -->
                    <td class="td-cell td-right">
                      <span :class="entry.netProfit >= 0 ? 'text-green' : 'text-red'">
                        {{ entry.netProfit >= 0 ? '+' : '' }}{{ formatPrice(entry.netProfit, locale) }}
                      </span>
                    </td>
                    <!-- Points -->
                    <td class="td-cell-last">
                      <span class="points-value">{{ entry.points }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { LeaderboardPeriod } from '~/types/enums'
import type { GetLeaderboardQuery } from '#gql'

definePageMeta({
  middleware: 'auth'
})

import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner
} from '@ionic/vue'
import {
  trophyOutline,
  peopleOutline,
  cashOutline,
  walletOutline,
  ribbonOutline,
  gameControllerOutline,
  podiumOutline
} from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { formatPrice } from '~/utils'

const router = useRouter()
const clubStore = useClubStore()
const { t, locale } = useI18n()

const { club } = clubStore

// Period options
type LeaderboardItem = GetLeaderboardQuery['leaderboard']['items'][number]

const periods = [
  { value: LeaderboardPeriod.ALL_TIME, label: 'reports.period.allTime' },
  { value: LeaderboardPeriod.LAST_30_DAYS, label: 'reports.period.last30Days' },
  { value: LeaderboardPeriod.LAST_7_DAYS, label: 'reports.period.last7Days' }
]

const selectedPeriod = ref<LeaderboardPeriod>(LeaderboardPeriod.ALL_TIME)
const loading = ref(true)
const leaderboard = ref<LeaderboardItem[]>([])

// Computed stats from leaderboard data
const stats = computed(() => {
  if (leaderboard.value.length === 0) {
    return {
      totalTournaments: 0,
      totalPlayers: 0,
      totalPrizePool: 0,
      avgBuyIn: 0,
      topWinner: null as { name: string; winnings: number } | null,
      mostGames: null as { name: string; count: number } | null
    }
  }

  // Sum up tournaments played (this counts each player's tournaments, may overcount if same tournament)
  const totalTournamentEntries = leaderboard.value.reduce((sum, e) => sum + e.totalTournaments, 0)
  const totalPlayers = leaderboard.value.length
  const totalPrizePool = leaderboard.value.reduce((sum, e) => sum + e.totalWinnings, 0)
  const totalBuyIns = leaderboard.value.reduce((sum, e) => sum + e.totalBuyIns, 0)
  const avgBuyIn = totalTournamentEntries > 0 ? Math.round(totalBuyIns / totalTournamentEntries) : 0

  // Find top winner
  const topWinnerEntry = leaderboard.value.reduce((max, e) =>
    e.totalWinnings > (max?.totalWinnings || 0) ? e : max, leaderboard.value[0])

  // Find most games played
  const mostGamesEntry = leaderboard.value.reduce((max, e) =>
    e.totalTournaments > (max?.totalTournaments || 0) ? e : max, leaderboard.value[0])

  return {
    totalTournaments: Math.max(...leaderboard.value.map(e => e.totalTournaments), 0),
    totalPlayers,
    totalPrizePool,
    avgBuyIn,
    topWinner: topWinnerEntry ? {
      name: getFullName(topWinnerEntry.user),
      winnings: topWinnerEntry.totalWinnings
    } : null,
    mostGames: mostGamesEntry ? {
      name: getFullName(mostGamesEntry.user),
      count: mostGamesEntry.totalTournaments
    } : null
  }
})

// Helper functions
const getInitials = (user: { firstName?: string | null; lastName?: string | null; username?: string | null } | undefined) => {
  if (!user) return '?'
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }
  return user.username?.[0]?.toUpperCase() || '?'
}

const getFullName = (user: { firstName?: string | null; lastName?: string | null; username?: string | null } | undefined) => {
  if (!user) return 'Unknown'
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`
  }
  return user.username || 'Unknown'
}

// Fetch leaderboard data
const fetchLeaderboard = async () => {
  if (!club) return

  loading.value = true
  try {
    const { leaderboard: result } = await GqlGetLeaderboard({
      period: selectedPeriod.value,
      clubId: club.id,
      pagination: { limit: 50 }
    })
    leaderboard.value = result?.items || []
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    leaderboard.value = []
  } finally {
    loading.value = false
  }
}

// Watch for period changes
watch(selectedPeriod, () => {
  fetchLeaderboard()
})

// Initial fetch
onMounted(() => {
  fetchLeaderboard()
})
</script>

<style scoped>
.page-bg {
  background-color: var(--pp-bg-primary);
}

.content-bg {
  background-color: var(--pp-bg-primary);
}

.page-container {
  padding: 1.5rem 1rem;
}

@media (min-width: 640px) {
  .page-container {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .page-container {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.header-section {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.875rem;
  line-height: 2.25rem;
  font-weight: 700;
  color: var(--pp-text-primary);
}

/* Period Tabs */
.period-tabs {
  display: flex;
  overflow-x: auto;
  gap: 0.5rem;
  background-color: rgba(36, 36, 42, 0.5);
  padding: 0.5rem;
  border-radius: 1rem;
  border: 1px solid var(--pp-border);
  margin-bottom: 2rem;
}

.period-tab {
  flex: 1;
  min-width: 0;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  cursor: pointer;
}

.period-tab--active {
  background-color: var(--pp-bg-secondary);
  color: var(--pp-accent-gold);
  border: 1px solid rgba(254, 231, 138, 0.4);
  box-shadow: var(--pp-shadow-sm);
}

.period-tab--inactive {
  color: #ffffff;
  border: 1px solid transparent;
}

.period-tab--inactive:hover {
  background-color: rgba(36, 36, 42, 0.5);
}

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5rem 0;
}

.spinner {
  width: 2rem;
  height: 2rem;
  color: var(--pp-accent-gold);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(6, 1fr);
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
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
}

.stat-icon {
  width: 1rem;
  height: 1rem;
  color: var(--pp-accent-gold);
}

.stat-value {
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  color: var(--pp-accent-gold);
}

.stat-value-name {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
}

.stat-subtitle-gold {
  font-size: 0.75rem;
  color: var(--pp-accent-gold);
}

.stat-subtitle-muted {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Leaderboard Section */
.leaderboard-section {
  background-color: var(--pp-bg-secondary);
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid var(--pp-border);
}

.leaderboard-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--pp-text-primary);
  margin-bottom: 1rem;
}

.leaderboard-empty {
  text-align: center;
  padding: 3rem 0;
}

.leaderboard-empty-icon {
  width: 4rem;
  height: 4rem;
  color: rgba(255, 255, 255, 0.2);
  margin: 0 auto 1rem;
}

.leaderboard-empty-text {
  color: rgba(255, 255, 255, 0.6);
}

/* Podium */
.podium {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-top: 1rem;
}

.podium-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.podium-entry--second,
.podium-entry--third {
  width: 7rem;
}

@media (min-width: 768px) {
  .podium-entry--second,
  .podium-entry--third {
    width: 9rem;
  }
}

.podium-entry--first {
  width: 8rem;
}

@media (min-width: 768px) {
  .podium-entry--first {
    width: 10rem;
  }
}

.podium-avatar {
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.podium-avatar--second {
  width: 3.5rem;
  height: 3.5rem;
  background-color: rgba(156, 163, 175, 0.2);
  border: 2px solid rgba(156, 163, 175, 0.5);
  color: #ffffff;
  font-size: 1.125rem;
}

.podium-avatar--first {
  width: 4rem;
  height: 4rem;
  background-color: rgba(254, 231, 138, 0.2);
  border: 2px solid rgba(254, 231, 138, 0.6);
  color: var(--pp-accent-gold);
  font-size: 1.25rem;
  box-shadow: 0 0 25px rgba(254, 231, 138, 0.3);
}

.podium-avatar--third {
  width: 3.5rem;
  height: 3.5rem;
  background-color: rgba(249, 115, 22, 0.15);
  border: 2px solid rgba(249, 115, 22, 0.4);
  color: var(--pp-orange-400);
  font-size: 1.125rem;
}

.podium-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  text-align: center;
}

.podium-name-first {
  font-size: 1rem;
  font-weight: 700;
  color: var(--pp-accent-gold);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  text-align: center;
}

.podium-points {
  font-size: 0.75rem;
  color: var(--pp-accent-gold);
  font-weight: 500;
}

.podium-points-first {
  font-size: 0.875rem;
  color: var(--pp-accent-gold);
  font-weight: 600;
}

.podium-bar {
  width: 100%;
  border-radius: 0.5rem 0.5rem 0 0;
  margin-top: 0.5rem;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.podium-bar--second {
  background-color: rgba(156, 163, 175, 0.2);
  height: 100px;
}

.podium-bar--first {
  background-color: rgba(254, 231, 138, 0.15);
  border: 1px solid rgba(254, 231, 138, 0.3);
  height: 130px;
  box-shadow: 0 0 20px rgba(254, 231, 138, 0.1);
}

.podium-bar--third {
  background-color: rgba(249, 115, 22, 0.1);
  height: 75px;
}

.podium-rank {
  font-weight: 900;
  padding-bottom: 0.5rem;
}

.podium-rank--second {
  font-size: 1.875rem;
  color: rgba(156, 163, 175, 0.6);
}

.podium-rank--first {
  font-size: 2.25rem;
  color: rgba(254, 231, 138, 0.4);
  padding-bottom: 0.75rem;
}

.podium-rank--third {
  font-size: 1.875rem;
  color: rgba(249, 115, 22, 0.4);
}

/* Table */
.table-wrapper {
  overflow-x: auto;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
}

.leaderboard-table th,
.leaderboard-table td {
  white-space: nowrap;
}

.table-head-row {
  text-align: left;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  border-bottom: 1px solid var(--pp-border);
}

.th-cell {
  padding-bottom: 1rem;
  padding-right: 1rem;
}

.th-center {
  text-align: center;
}

.th-right {
  text-align: right;
}

.th-cell-last {
  padding-bottom: 1rem;
  text-align: right;
}

.table-row {
  border-bottom: 1px solid rgba(84, 84, 95, 0.5);
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: rgba(24, 24, 26, 0.3);
}

.table-row--top3 {
  background-color: rgba(24, 24, 26, 0.2);
}

.td-cell {
  padding: 1rem 1rem 1rem 0;
}

.td-center {
  text-align: center;
}

.td-right {
  text-align: right;
}

.td-cell-last {
  padding: 1rem 0;
  text-align: right;
}

.rank-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rank-medal {
  font-size: 1.5rem;
}

.rank-number {
  color: rgba(255, 255, 255, 0.6);
  width: 2rem;
  text-align: center;
}

.player-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.player-cell-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background-color: var(--pp-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 500;
}

.player-cell-name {
  font-weight: 500;
  color: #ffffff;
}

.player-cell-name--gold {
  color: var(--pp-accent-gold);
}

.player-cell-username {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
}

.text-white {
  color: #ffffff;
}

.text-green {
  color: var(--pp-green-400);
}

.text-red {
  color: var(--pp-red-400);
}

.points-value {
  font-weight: 600;
  color: var(--pp-accent-gold);
}
</style>
