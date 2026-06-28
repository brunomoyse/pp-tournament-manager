<template>
  <IonPage class="page-bg">
    <IonContent class="content-bg">
      <div class="page-container">
        <PpFadeUp>
          <div class="header-section">
            <p class="eyebrow">{{ t('nav.reports') }}</p>
            <h1 class="page-title">{{ t('reports.title') }}</h1>
          </div>
        </PpFadeUp>

        <!-- Period tabs -->
        <div class="period-tabs" data-tour="reports">
          <button
            v-for="period in periods"
            :key="period.value"
            :disabled="!!selectedConfigId"
            :class="[
              'period-tab',
              selectedPeriod === period.value ? 'period-tab--active' : 'period-tab--inactive',
            ]"
            @click="selectedPeriod = period.value"
          >
            {{ t(period.label) }}
          </button>
        </div>

        <!-- League selector (only when the club has leagues) -->
        <div v-if="leagues.length" class="league-row">
          <label class="league-label">{{ t('leagues.viewLabel') }}</label>
          <select v-model="selectedConfigId" class="pp-select league-select">
            <option :value="null">{{ t('leagues.defaultView') }}</option>
            <option v-for="lg in leagues" :key="lg.id" :value="lg.id">{{ lg.name }}</option>
          </select>
          <NuxtLink to="/leagues" class="league-manage-link">{{ t('leagues.manage') }}</NuxtLink>
        </div>

        <div v-if="loading" class="loading-state">
          <IonSpinner name="crescent" class="spinner" />
        </div>

        <div v-else>
          <!-- Compact 6-up stat strip -->
          <div class="stats-grid">
            <PpCard padding="none" class="stat-tile">
              <PpEyebrow size="sm">{{ t('reports.tournaments') }}</PpEyebrow>
              <div class="stat-figure">{{ stats.totalTournaments }}</div>
            </PpCard>

            <PpCard padding="none" class="stat-tile">
              <PpEyebrow size="sm">{{ t('reports.players') }}</PpEyebrow>
              <div class="stat-figure">{{ stats.totalPlayers }}</div>
            </PpCard>

            <PpCard padding="none" class="stat-tile">
              <PpEyebrow size="sm">{{ t('reports.prizePool') }}</PpEyebrow>
              <div class="stat-figure">{{ formatPrice(stats.totalPrizePool) }}</div>
            </PpCard>

            <PpCard padding="none" class="stat-tile">
              <PpEyebrow size="sm">{{ t('reports.avgBuyIn') }}</PpEyebrow>
              <div class="stat-figure">{{ formatPrice(stats.avgBuyIn) }}</div>
            </PpCard>

            <PpCard padding="none" class="stat-tile">
              <PpEyebrow size="sm">{{ t('reports.topWinner') }}</PpEyebrow>
              <div class="stat-figure stat-figure--name pp-truncate">
                {{ stats.topWinner?.name || '-' }}
              </div>
              <div v-if="stats.topWinner" class="stat-sub stat-sub--gold">
                {{ formatPrice(stats.topWinner.winnings) }}
              </div>
            </PpCard>

            <PpCard padding="none" class="stat-tile">
              <PpEyebrow size="sm">{{ t('reports.mostGames') }}</PpEyebrow>
              <div class="stat-figure stat-figure--name pp-truncate">
                {{ stats.mostGames?.name || '-' }}
              </div>
              <div v-if="stats.mostGames" class="stat-sub">
                {{ stats.mostGames.count }} {{ t('reports.games').toLowerCase() }}
              </div>
            </PpCard>
          </div>

          <!-- Leaderboard -->
          <div class="leaderboard-section">
            <div class="leaderboard-header">
              <div>
                <PpEyebrow size="sm">{{ t('reports.players') }}</PpEyebrow>
                <h2 class="leaderboard-title">{{ t('reports.leaderboard') }}</h2>
              </div>
              <PpButton
                variant="ghost"
                size="sm"
                :disabled="leaderboard.length === 0"
                @click="exportLeaderboardCsv"
              >
                <IonIcon :icon="downloadOutline" class="icon-md" />
                {{ t('exports.button') }}
              </PpButton>
            </div>

            <div v-if="leaderboard.length === 0" class="leaderboard-empty">
              <IonIcon :icon="podiumOutline" class="leaderboard-empty-icon" />
              <p class="leaderboard-empty-text">{{ t('reports.noData') }}</p>
            </div>

            <!-- Podium - top 3 -->
            <div v-if="leaderboard.length >= 3" class="podium">
              <div
                v-for="spot in podiumOrder"
                :key="spot.idx"
                class="podium-entry"
                :class="`podium-entry--${spot.place}`"
              >
                <div class="podium-avatar" :class="`podium-avatar--${spot.place}`">
                  {{ getInitials(leaderboard[spot.idx]?.user, leaderboard[spot.idx]?.displayName) }}
                </div>
                <div class="podium-name" :class="{ 'podium-name--first': spot.place === 'first' }">
                  {{ getFullName(leaderboard[spot.idx]?.user, leaderboard[spot.idx]?.displayName) }}
                </div>
                <div
                  class="podium-points"
                  :class="{ 'podium-points--first': spot.place === 'first' }"
                >
                  {{
                    isLeagueView
                      ? `${rankedLeaderboard[spot.idx]?.points} pts`
                      : formatPrice(rankedLeaderboard[spot.idx]?.totalWinnings ?? 0)
                  }}
                </div>
                <div class="podium-bar" :class="`podium-bar--${spot.place}`">
                  <span class="podium-rank" :class="`podium-rank--${spot.place}`">{{
                    spot.rank
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Full table -->
            <div v-if="leaderboard.length > 0" class="table-wrapper">
              <table class="leaderboard-table">
                <thead>
                  <tr class="table-head-row">
                    <th class="th-cell">{{ t('reports.rank') }}</th>
                    <th class="th-cell">{{ t('reports.player') }}</th>
                    <th class="th-cell th-center">{{ t('reports.played') }}</th>
                    <th class="th-cell">{{ t('reports.itmPercent') }}</th>
                    <th class="th-cell th-center">{{ t('reports.roiPercent') }}</th>
                    <th class="th-cell th-right">{{ t('reports.netProfit') }}</th>
                    <th class="th-cell-last">
                      {{ isLeagueView ? t('reports.points') : t('reports.winnings') }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(entry, index) in rankedLeaderboard"
                    :key="entry.clubPlayerId || entry.user?.id || index"
                    :class="[
                      'pp-stagger-item',
                      'table-row',
                      entry.rank <= 3 ? 'table-row--top3' : '',
                    ]"
                    :style="{ animationDelay: `${index * 40}ms` }"
                  >
                    <td class="td-cell">
                      <div class="rank-cell">
                        <span v-if="entry.rank === 1" class="rank-medal">&#129351;</span>
                        <span v-else-if="entry.rank === 2" class="rank-medal">&#129352;</span>
                        <span v-else-if="entry.rank === 3" class="rank-medal">&#129353;</span>
                        <span v-else class="rank-number">{{ entry.rank }}</span>
                      </div>
                    </td>
                    <td class="td-cell">
                      <div class="player-cell">
                        <div class="player-cell-avatar">
                          {{ getInitials(entry.user, entry.displayName) }}
                        </div>
                        <div>
                          <div
                            :class="[
                              'player-cell-name',
                              entry.rank === 1 ? 'player-cell-name--gold' : '',
                            ]"
                          >
                            {{ getFullName(entry.user, entry.displayName) }}
                          </div>
                          <div v-if="entry.user?.username" class="player-cell-username">
                            @{{ entry.user.username }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="td-cell td-center num">{{ entry.totalTournaments }}</td>
                    <td class="td-cell">
                      <div class="itm-cell">
                        <span class="num" :class="entry.itmPercentage >= 50 ? 'text-green' : ''">
                          {{ entry.itmPercentage.toFixed(1) }}%
                        </span>
                        <PpFillBar
                          class="itm-bar"
                          :value="entry.itmPercentage"
                          :max="100"
                          tone="success"
                          :height="4"
                        />
                      </div>
                    </td>
                    <td class="td-cell td-center num">
                      <span :class="entry.roiPercentage >= 0 ? 'text-green' : 'text-red'">
                        {{ entry.roiPercentage >= 0 ? '+' : ''
                        }}{{ entry.roiPercentage.toFixed(1) }}%
                      </span>
                    </td>
                    <td class="td-cell td-right num">
                      <span :class="entry.netProfit >= 0 ? 'text-green' : 'text-red'">
                        {{ entry.netProfit >= 0 ? '+' : '' }}{{ formatPrice(entry.netProfit) }}
                      </span>
                    </td>
                    <td class="td-cell-last num">
                      <span class="points-value">
                        {{ isLeagueView ? entry.points : formatPrice(entry.totalWinnings) }}
                      </span>
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
  middleware: 'auth',
  title: 'nav.reports',
})

import { IonPage, IonContent, IonIcon, IonSpinner } from '@ionic/vue'
import { podiumOutline, downloadOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { formatPrice } from '~/utils'
import { downloadCsv, csvAmount, exportFilename } from '~/utils/exportCsv'

const clubStore = useClubStore()
const { t } = useI18n()

const { club } = clubStore

// Period options
type LeaderboardItem = GetLeaderboardQuery['leaderboard']['items'][number]

const periods = [
  { value: LeaderboardPeriod.CURRENT_YEAR, label: 'reports.period.currentYear' },
  { value: LeaderboardPeriod.ALL_TIME, label: 'reports.period.allTime' },
  { value: LeaderboardPeriod.LAST_30_DAYS, label: 'reports.period.last30Days' },
  { value: LeaderboardPeriod.LAST_7_DAYS, label: 'reports.period.last7Days' },
]

// Podium render order: 2nd, 1st, 3rd (so 1st sits centre and tallest).
const podiumOrder = [
  { idx: 1, place: 'second', rank: 2 },
  { idx: 0, place: 'first', rank: 1 },
  { idx: 2, place: 'third', rank: 3 },
]

const selectedPeriod = ref<LeaderboardPeriod>(LeaderboardPeriod.CURRENT_YEAR)
const loading = ref(true)
const leaderboard = ref<LeaderboardItem[]>([])

// Leagues (configurable leaderboards). null = the club's default period-based view.
const leagues = ref<{ id: string; name: string }[]>([])
const selectedConfigId = ref<string | null>(null)

// Points are a league concept; the default club stats view ranks by winnings.
const isLeagueView = computed(() => !!selectedConfigId.value)

// The list to render: leagues keep the server's points ranking; the default
// view ranks by total winnings (and re-numbers ranks accordingly).
const rankedLeaderboard = computed<LeaderboardItem[]>(() => {
  if (isLeagueView.value) return leaderboard.value
  return leaderboard.value
    .toSorted((a, b) => b.totalWinnings - a.totalWinnings)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
})

// Computed stats from leaderboard data
const stats = computed(() => {
  if (leaderboard.value.length === 0) {
    return {
      totalTournaments: 0,
      totalPlayers: 0,
      totalPrizePool: 0,
      avgBuyIn: 0,
      topWinner: null as { name: string; winnings: number } | null,
      mostGames: null as { name: string; count: number } | null,
    }
  }

  // Sum up tournaments played (this counts each player's tournaments, may overcount if same tournament)
  const totalTournamentEntries = leaderboard.value.reduce((sum, e) => sum + e.totalTournaments, 0)
  const totalPlayers = leaderboard.value.length
  const totalPrizePool = leaderboard.value.reduce((sum, e) => sum + e.totalWinnings, 0)
  const totalBuyIns = leaderboard.value.reduce((sum, e) => sum + e.totalBuyIns, 0)
  const avgBuyIn = totalTournamentEntries > 0 ? Math.round(totalBuyIns / totalTournamentEntries) : 0

  // Find top winner
  const topWinnerEntry = leaderboard.value.reduce(
    (max, e) => (e.totalWinnings > (max?.totalWinnings || 0) ? e : max),
    leaderboard.value[0],
  )

  // Find most games played
  const mostGamesEntry = leaderboard.value.reduce(
    (max, e) => (e.totalTournaments > (max?.totalTournaments || 0) ? e : max),
    leaderboard.value[0],
  )

  return {
    totalTournaments: Math.max(...leaderboard.value.map((e) => e.totalTournaments), 0),
    totalPlayers,
    totalPrizePool,
    avgBuyIn,
    topWinner: topWinnerEntry
      ? {
          name: getFullName(topWinnerEntry.user, topWinnerEntry.displayName),
          winnings: topWinnerEntry.totalWinnings,
        }
      : null,
    mostGames: mostGamesEntry
      ? {
          name: getFullName(mostGamesEntry.user, mostGamesEntry.displayName),
          count: mostGamesEntry.totalTournaments,
        }
      : null,
  }
})

// Helper functions
const getInitials = (
  user:
    | { firstName?: string | null; lastName?: string | null; username?: string | null }
    | null
    | undefined,
  displayName?: string | null,
) => {
  if (user?.firstName && user?.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }
  if (user?.username) return user.username[0].toUpperCase()
  if (displayName) {
    const parts = displayName.trim().split(/\s+/)
    return (
      parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : displayName.slice(0, 2)
    ).toUpperCase()
  }
  return '?'
}

const getFullName = (
  user:
    | { firstName?: string | null; lastName?: string | null; username?: string | null }
    | null
    | undefined,
  displayName?: string | null,
) => {
  if (user?.firstName && user?.lastName) {
    return `${user.firstName} ${user.lastName}`
  }
  if (user?.username) return user.username
  return displayName || 'Unknown'
}

// Fetch leaderboard data
const fetchLeaderboard = async () => {
  if (!club) return

  loading.value = true
  try {
    const { leaderboard: result } = await GqlGetLeaderboard({
      period: selectedPeriod.value,
      clubId: club.id,
      configId: selectedConfigId.value || undefined,
      pagination: { limit: 50 },
    })
    leaderboard.value = result?.items || []
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    leaderboard.value = []
  } finally {
    loading.value = false
  }
}

// Export the current leaderboard (selected period) to CSV.
const exportLeaderboardCsv = () => {
  const periodLabel = periods.find((p) => p.value === selectedPeriod.value)?.label
  downloadCsv(
    exportFilename([club?.name, t('reports.leaderboard'), periodLabel ? t(periodLabel) : '']),
    rankedLeaderboard.value,
    [
      { label: t('exports.col.rank'), value: (e) => e.rank },
      { label: t('exports.col.player'), value: (e) => getFullName(e.user, e.displayName) },
      { label: t('exports.col.points'), value: (e) => e.points },
      { label: t('exports.col.tournaments'), value: (e) => e.totalTournaments },
      { label: t('exports.col.buyIns'), value: (e) => csvAmount(e.totalBuyIns) },
      { label: t('exports.col.winnings'), value: (e) => csvAmount(e.totalWinnings) },
      { label: t('exports.col.netProfit'), value: (e) => csvAmount(e.netProfit) },
      { label: t('exports.col.itm'), value: (e) => e.totalItm },
      {
        label: t('exports.col.itmPct'),
        value: (e) => e.itmPercentage.toFixed(1).replace('.', ','),
      },
      { label: t('exports.col.roi'), value: (e) => e.roiPercentage.toFixed(1).replace('.', ',') },
      {
        label: t('exports.col.avgFinish'),
        value: (e) => e.averageFinish.toFixed(1).replace('.', ','),
      },
      { label: t('exports.col.firstPlaces'), value: (e) => e.firstPlaces },
      { label: t('exports.col.finalTables'), value: (e) => e.finalTables },
    ],
  )
}

// Load the club's leagues for the selector.
const fetchLeagues = async () => {
  if (!club) return
  try {
    const { leaderboardConfigs } = await GqlGetLeaderboardConfigs({ clubId: club.id })
    leagues.value = (leaderboardConfigs || []).map((c) => ({ id: c.id, name: c.name }))
  } catch (error) {
    console.error('Failed to fetch leagues:', error)
    leagues.value = []
  }
}

// Watch for period / league changes
watch([selectedPeriod, selectedConfigId], () => {
  fetchLeaderboard()
})

// Initial fetch
onMounted(() => {
  fetchLeagues()
  fetchLeaderboard()
})
</script>

<style scoped>
.page-bg,
.content-bg {
  background-color: var(--color-pp-bg);
}

.page-container {
  padding: 1.75rem 1rem 3rem;
}

@media (min-width: 640px) {
  .page-container {
    padding: 2rem 1.5rem 3rem;
  }
}

@media (min-width: 1024px) {
  .page-container {
    padding: 2.5rem 2rem 4rem;
  }
}

.header-section {
  margin-bottom: 1.5rem;
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
}

.page-title {
  margin-top: 0.65rem;
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 3vw + 0.5rem, 2.5rem);
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-pp-text);
}

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

/* Period tabs (segmented) */
.period-tabs {
  display: inline-flex;
  overflow-x: auto;
  gap: 0.25rem;
  background-color: var(--color-pp-surface);
  padding: 0.3rem;
  border-radius: 0.85rem;
  border: 1px solid var(--color-pp-border);
  margin-bottom: 1.5rem;
}

.period-tab {
  flex: 1;
  min-width: max-content;
  padding: 0.5rem 1rem;
  border-radius: 0.6rem;
  border: 1px solid transparent;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.period-tab--active {
  background-color: rgba(var(--pp-accent-rgb), 0.1);
  color: var(--color-pp-gold);
  border-color: rgba(var(--pp-accent-rgb), 0.4);
}

.period-tab--inactive {
  color: var(--color-pp-text-muted);
}

.period-tab--inactive:hover {
  color: var(--color-pp-text);
  background-color: rgba(255, 255, 255, 0.04);
}

.period-tab:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* League selector */
.league-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: -0.5rem;
  margin-bottom: 1.5rem;
}

.league-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--color-pp-text-muted);
}

.pp-select {
  background-color: var(--color-pp-surface);
  color: var(--color-pp-text);
  border: 1px solid var(--color-pp-border);
  border-radius: 0.7rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.league-select {
  min-width: 12rem;
}

.league-manage-link {
  font-size: 0.8rem;
  color: var(--color-pp-gold);
  text-decoration: none;
}

.league-manage-link:hover {
  text-decoration: underline;
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
  color: var(--color-pp-gold);
}

/* Stat strip */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
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

.stat-tile {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1rem 1.1rem;
  min-height: 6rem;
}

.stat-figure {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--color-pp-gold);
  font-variant-numeric: tabular-nums;
}

.stat-figure--name {
  font-size: 1.05rem;
  color: var(--color-pp-text);
}

.stat-sub {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-pp-text-muted);
  font-variant-numeric: tabular-nums;
}

.stat-sub--gold {
  color: var(--color-pp-gold);
}

/* Leaderboard */
.leaderboard-section {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0));
  border-radius: var(--radius-2xl);
  padding: 1.25rem;
  border: 1px solid var(--color-pp-border);
  box-shadow: var(--shadow-card);
}

.leaderboard-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.leaderboard-title {
  margin-top: 0.3rem;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-pp-text);
}

.leaderboard-empty {
  text-align: center;
  padding: 3rem 0;
}

.leaderboard-empty-icon {
  width: 3.5rem;
  height: 3.5rem;
  color: var(--color-pp-text-dim);
  margin: 0 auto 1rem;
}

.leaderboard-empty-text {
  color: var(--color-pp-text-muted);
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
  width: 7rem;
}

@media (min-width: 768px) {
  .podium-entry--second,
  .podium-entry--third {
    width: 9rem;
  }
  .podium-entry--first {
    width: 10rem;
  }
}

.podium-avatar {
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.podium-avatar--second {
  width: 3.5rem;
  height: 3.5rem;
  background-color: rgba(203, 213, 225, 0.18);
  border: 2px solid rgba(203, 213, 225, 0.45);
  color: #e2e8f0;
  font-size: 1.05rem;
}

.podium-avatar--first {
  width: 4.25rem;
  height: 4.25rem;
  background-color: rgba(var(--pp-accent-rgb), 0.2);
  border: 2px solid rgba(var(--pp-accent-rgb), 0.6);
  color: var(--color-pp-gold);
  font-size: 1.3rem;
  box-shadow: 0 0 25px rgba(var(--pp-accent-rgb), 0.3);
}

.podium-avatar--third {
  width: 3.5rem;
  height: 3.5rem;
  background-color: rgba(var(--pp-warning-rgb), 0.15);
  border: 2px solid rgba(var(--pp-warning-rgb), 0.4);
  color: var(--color-pp-warning);
  font-size: 1.05rem;
}

.podium-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-pp-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  text-align: center;
}

.podium-name--first {
  font-size: 1rem;
  color: var(--color-pp-gold);
}

.podium-points {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-pp-gold);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.podium-points--first {
  font-size: 0.85rem;
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
  background-color: rgba(203, 213, 225, 0.16);
  height: 100px;
}

.podium-bar--first {
  background-color: rgba(var(--pp-accent-rgb), 0.15);
  border: 1px solid rgba(var(--pp-accent-rgb), 0.3);
  height: 130px;
  box-shadow: 0 0 20px rgba(var(--pp-accent-rgb), 0.1);
}

.podium-bar--third {
  background-color: rgba(var(--pp-warning-rgb), 0.12);
  height: 75px;
}

.podium-rank {
  font-family: var(--font-display);
  font-weight: 700;
  padding-bottom: 0.5rem;
}

.podium-rank--second {
  font-size: 1.75rem;
  color: rgba(203, 213, 225, 0.6);
}

.podium-rank--first {
  font-size: 2.1rem;
  color: rgba(var(--pp-accent-rgb), 0.5);
  padding-bottom: 0.75rem;
}

.podium-rank--third {
  font-size: 1.75rem;
  color: rgba(var(--pp-warning-rgb), 0.5);
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

.num {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.table-head-row {
  text-align: left;
  color: var(--color-pp-text-dim);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-bottom: 1px solid var(--color-pp-border);
}

.th-cell {
  padding-bottom: 0.85rem;
  padding-right: 1rem;
}

.th-center {
  text-align: center;
}

.th-right {
  text-align: right;
}

.th-cell-last {
  padding-bottom: 0.85rem;
  text-align: right;
}

.table-row {
  border-bottom: 1px solid var(--color-pp-border);
  transition: background-color 0.15s ease;
}

.table-row:hover {
  background-color: rgba(255, 255, 255, 0.02);
}

.table-row--top3 {
  background-color: rgba(255, 255, 255, 0.015);
}

.td-cell {
  padding: 0.85rem 1rem 0.85rem 0;
}

.td-center {
  text-align: center;
}

.td-right {
  text-align: right;
}

.td-cell-last {
  padding: 0.85rem 0;
  text-align: right;
}

.rank-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rank-medal {
  font-size: 1.4rem;
}

.rank-number {
  font-family: var(--font-mono);
  color: var(--color-pp-text-muted);
  width: 2rem;
  text-align: center;
}

.player-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.player-cell-avatar {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--color-pp-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-pp-text);
  flex-shrink: 0;
}

.player-cell-name {
  font-weight: 500;
  color: var(--color-pp-text);
}

.player-cell-name--gold {
  color: var(--color-pp-gold);
}

.player-cell-username {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-pp-text-dim);
}

/* ITM cell with mini bar */
.itm-cell {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 5rem;
}

.itm-bar {
  max-width: 6rem;
}

.text-green {
  color: #34d399;
}

.text-red {
  color: #f87171;
}

.points-value {
  font-weight: 600;
  color: var(--color-pp-gold);
}
</style>
