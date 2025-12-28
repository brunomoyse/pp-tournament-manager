<template>
  <IonPage class="bg-pp-bg-primary">
    <!-- Custom Header -->
    <div class="bg-pp-bg-primary border-b border-pp-border px-8 py-6">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-4">
          <button @click="goBack" class="p-2 text-white/60 hover:text-white rounded-lg hover:bg-pp-bg-secondary transition-colors">
            <IonIcon :icon="arrowBackOutline" class="w-6 h-6" />
          </button>
          <div>
            <h1 class="text-3xl font-bold text-pp-text-primary">{{ t('reports.title') }}</h1>
            <p class="text-white/70">{{ club?.name }}</p>
          </div>
        </div>
      </div>
    </div>

    <IonContent class="bg-pp-bg-primary">
      <div class="px-8 py-6">
        <!-- Period Selector Tabs -->
        <div class="flex gap-2 mb-8">
          <button
            v-for="period in periods"
            :key="period.value"
            @click="selectedPeriod = period.value"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-all',
              selectedPeriod === period.value
                ? 'bg-pp-accent-gold text-black'
                : 'bg-pp-bg-secondary border border-pp-border text-white hover:bg-pp-border/50'
            ]"
          >
            {{ t(period.label) }}
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-20">
          <IonSpinner name="crescent" class="w-8 h-8 text-pp-accent-gold" />
        </div>

        <!-- Content -->
        <div v-else>
          <!-- Stats Cards - Row 1 -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <!-- Total Tournaments -->
            <div class="bg-pp-bg-secondary rounded-xl p-6 border border-pp-border">
              <div class="flex items-center justify-between mb-4">
                <span class="text-white/70 text-sm">{{ t('reports.tournaments') }}</span>
                <IonIcon :icon="trophyOutline" class="w-5 h-5 text-pp-accent-gold" />
              </div>
              <div class="text-3xl font-bold text-pp-text-primary">{{ stats.totalTournaments }}</div>
            </div>

            <!-- Unique Players -->
            <div class="bg-pp-bg-secondary rounded-xl p-6 border border-pp-border">
              <div class="flex items-center justify-between mb-4">
                <span class="text-white/70 text-sm">{{ t('reports.players') }}</span>
                <IonIcon :icon="peopleOutline" class="w-5 h-5 text-pp-accent-gold" />
              </div>
              <div class="text-3xl font-bold text-pp-text-primary">{{ stats.totalPlayers }}</div>
            </div>

            <!-- Total Prize Pool -->
            <div class="bg-pp-bg-secondary rounded-xl p-6 border border-pp-border">
              <div class="flex items-center justify-between mb-4">
                <span class="text-white/70 text-sm">{{ t('reports.prizePool') }}</span>
                <IonIcon :icon="cashOutline" class="w-5 h-5 text-pp-accent-gold" />
              </div>
              <div class="text-3xl font-bold text-pp-accent-gold">{{ formatPrice(stats.totalPrizePool) }}</div>
            </div>
          </div>

          <!-- Stats Cards - Row 2 -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <!-- Average Buy-in -->
            <div class="bg-pp-bg-secondary rounded-xl p-6 border border-pp-border">
              <div class="flex items-center justify-between mb-4">
                <span class="text-white/70 text-sm">{{ t('reports.avgBuyIn') }}</span>
                <IonIcon :icon="walletOutline" class="w-5 h-5 text-pp-accent-gold" />
              </div>
              <div class="text-3xl font-bold text-pp-text-primary">{{ formatPrice(stats.avgBuyIn) }}</div>
            </div>

            <!-- Top Winner -->
            <div class="bg-pp-bg-secondary rounded-xl p-6 border border-pp-border">
              <div class="flex items-center justify-between mb-4">
                <span class="text-white/70 text-sm">{{ t('reports.topWinner') }}</span>
                <IonIcon :icon="ribbonOutline" class="w-5 h-5 text-pp-accent-gold" />
              </div>
              <div class="text-xl font-bold text-pp-text-primary truncate">{{ stats.topWinner?.name || '-' }}</div>
              <div v-if="stats.topWinner" class="text-sm text-pp-accent-gold">{{ formatPrice(stats.topWinner.winnings) }}</div>
            </div>

            <!-- Most Games -->
            <div class="bg-pp-bg-secondary rounded-xl p-6 border border-pp-border">
              <div class="flex items-center justify-between mb-4">
                <span class="text-white/70 text-sm">{{ t('reports.mostGames') }}</span>
                <IonIcon :icon="gameControllerOutline" class="w-5 h-5 text-pp-accent-gold" />
              </div>
              <div class="text-xl font-bold text-pp-text-primary truncate">{{ stats.mostGames?.name || '-' }}</div>
              <div v-if="stats.mostGames" class="text-sm text-white/60">{{ stats.mostGames.count }} {{ t('reports.tournaments').toLowerCase() }}</div>
            </div>
          </div>

          <!-- Leaderboard Section -->
          <div class="bg-pp-bg-secondary rounded-2xl p-6 border border-pp-border">
            <h2 class="text-xl font-semibold text-pp-text-primary mb-6">{{ t('reports.leaderboard') }}</h2>

            <!-- Empty State -->
            <div v-if="leaderboard.length === 0" class="text-center py-12">
              <IonIcon :icon="podiumOutline" class="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p class="text-white/60">{{ t('reports.noData') }}</p>
            </div>

            <!-- Leaderboard Table -->
            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="text-left text-white/60 text-sm border-b border-pp-border">
                    <th class="pb-4 pr-4">{{ t('reports.rank') }}</th>
                    <th class="pb-4 pr-4">{{ t('reports.player') }}</th>
                    <th class="pb-4 pr-4 text-center">{{ t('reports.tournaments') }}</th>
                    <th class="pb-4 pr-4 text-center">{{ t('reports.itmPercent') }}</th>
                    <th class="pb-4 pr-4 text-center">{{ t('reports.roiPercent') }}</th>
                    <th class="pb-4 pr-4 text-right">{{ t('reports.netProfit') }}</th>
                    <th class="pb-4 text-right">{{ t('reports.points') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="entry in leaderboard"
                    :key="entry.user.id"
                    :class="[
                      'border-b border-pp-border/50 hover:bg-pp-bg-primary/30 transition-colors',
                      entry.rank <= 3 ? 'bg-pp-bg-primary/20' : ''
                    ]"
                  >
                    <!-- Rank -->
                    <td class="py-4 pr-4">
                      <div class="flex items-center gap-2">
                        <span v-if="entry.rank === 1" class="text-2xl">🥇</span>
                        <span v-else-if="entry.rank === 2" class="text-2xl">🥈</span>
                        <span v-else-if="entry.rank === 3" class="text-2xl">🥉</span>
                        <span v-else class="text-white/60 w-8 text-center">{{ entry.rank }}</span>
                      </div>
                    </td>
                    <!-- Player -->
                    <td class="py-4 pr-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-pp-border flex items-center justify-center text-white font-medium">
                          {{ getInitials(entry.user) }}
                        </div>
                        <div>
                          <div :class="['font-medium', entry.rank === 1 ? 'text-pp-accent-gold' : 'text-white']">
                            {{ getFullName(entry.user) }}
                          </div>
                          <div class="text-sm text-white/50">@{{ entry.user.username }}</div>
                        </div>
                      </div>
                    </td>
                    <!-- Tournaments -->
                    <td class="py-4 pr-4 text-center text-white">{{ entry.totalTournaments }}</td>
                    <!-- ITM% -->
                    <td class="py-4 pr-4 text-center">
                      <span :class="entry.itmPercentage >= 50 ? 'text-green-400' : 'text-white'">
                        {{ entry.itmPercentage.toFixed(1) }}%
                      </span>
                    </td>
                    <!-- ROI% -->
                    <td class="py-4 pr-4 text-center">
                      <span :class="entry.roiPercentage >= 0 ? 'text-green-400' : 'text-red-400'">
                        {{ entry.roiPercentage >= 0 ? '+' : '' }}{{ entry.roiPercentage.toFixed(1) }}%
                      </span>
                    </td>
                    <!-- Net Profit -->
                    <td class="py-4 pr-4 text-right">
                      <span :class="entry.netProfit >= 0 ? 'text-green-400' : 'text-red-400'">
                        {{ entry.netProfit >= 0 ? '+' : '' }}{{ formatPrice(entry.netProfit) }}
                      </span>
                    </td>
                    <!-- Points -->
                    <td class="py-4 text-right">
                      <span class="font-semibold text-pp-accent-gold">{{ entry.points }}</span>
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
import type { LeaderboardPeriod, LeaderboardEntry } from '~/types/tournament'

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
  arrowBackOutline,
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
const { t } = useI18n()

const { club } = clubStore

// Period options
const periods = [
  { value: 'ALL_TIME' as LeaderboardPeriod, label: 'reports.period.allTime' },
  { value: 'LAST_30_DAYS' as LeaderboardPeriod, label: 'reports.period.last30Days' },
  { value: 'LAST_7_DAYS' as LeaderboardPeriod, label: 'reports.period.last7Days' }
]

const selectedPeriod = ref<LeaderboardPeriod>('ALL_TIME')
const loading = ref(true)
const leaderboard = ref<LeaderboardEntry[]>([])

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
const getInitials = (user: { firstName?: string | null; lastName?: string | null; username?: string | null }) => {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }
  return user.username?.[0]?.toUpperCase() || '?'
}

const getFullName = (user: { firstName?: string | null; lastName?: string | null; username?: string | null }) => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`
  }
  return user.username || 'Unknown'
}

const goBack = () => {
  router.push('/')
}

// Fetch leaderboard data
const fetchLeaderboard = async () => {
  if (!club) return

  loading.value = true
  try {
    const { leaderboard: result } = await GqlGetLeaderboard({
      period: selectedPeriod.value,
      clubId: club.id,
      limit: 50
    })
    leaderboard.value = result?.entries || []
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
ion-page {
  --background: #18181a !important;
  background-color: #18181a !important;
}

ion-content {
  --background: #18181a !important;
  background-color: #18181a !important;
}

.bg-pp-bg-secondary {
  background-color: #24242a !important;
}

table {
  border-collapse: collapse;
}

th, td {
  white-space: nowrap;
}
</style>
