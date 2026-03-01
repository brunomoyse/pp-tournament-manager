<template>
  <div class="prize-card">
    <div class="prize-header">
      <h3 class="prize-title">{{ t('headings.prizePool') }}</h3>
      <IonIcon :icon="trophyOutline" class="prize-header-icon" />
    </div>

    <!-- Hero prize pool -->
    <div class="prize-hero">{{ prizePool || t('status.loading') }}</div>

    <!-- Entry context subtitle -->
    <div v-if="entryStats" class="prize-subtitle">
      {{ t('prizePool.entriesAndPlayers', { entries: entryStats.totalEntries, players: entryStats.uniquePlayers }) }}
    </div>

    <!-- 2x2 metrics grid -->
    <div class="prize-grid">
      <div class="prize-grid-item">
        <div class="prize-grid-label">{{ t('prizePool.buyIn') }}</div>
        <div class="prize-grid-value">{{ buyInDisplay }}</div>
      </div>
      <div class="prize-grid-item">
        <div class="prize-grid-label">{{ t('prizePool.entries') }}</div>
        <div class="prize-grid-value">{{ entryStats?.totalEntries || 0 }}</div>
      </div>
      <div v-if="entryStats?.totalRakeCents" class="prize-grid-item">
        <div class="prize-grid-label">{{ t('prizePool.rakeCollected') }}</div>
        <div class="prize-grid-value">{{ formatPrice(entryStats.totalRakeCents, locale) }}</div>
      </div>
      <template v-if="showFullPayout">
        <div class="prize-grid-item">
          <div class="prize-grid-label">{{ t('prizePool.firstPrize') }}</div>
          <div class="prize-grid-value">{{ firstPrizeDisplay }}</div>
        </div>
        <div class="prize-grid-item">
          <div class="prize-grid-label">{{ t('prizePool.payingPositions') }}</div>
          <div class="prize-grid-value">{{ payoutPositions.length }}</div>
        </div>
      </template>
    </div>

    <!-- Full payout breakdown (after late registration) -->
    <template v-if="showFullPayout && payoutPositions.length">
      <div class="prize-breakdown">
        <h4 class="prize-breakdown-title">{{ t('prizePool.payoutBreakdown') }}</h4>
        <div class="prize-breakdown-list">
          <div
            v-for="position in payoutPositions"
            :key="position.position"
            class="prize-breakdown-row"
          >
            <span class="prize-breakdown-position">{{ getPositionLabel(position.position) }}</span>
            <div class="prize-breakdown-values">
              <span class="prize-breakdown-percent">{{ position.percentage.toFixed(1) }}%</span>
              <span class="prize-breakdown-amount">{{ formatPrice(position.amountCents, locale) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { trophyOutline } from 'ionicons/icons'
import { formatPrice } from '~/utils'
import { useI18n } from '~/composables/useI18n'
import { useTournamentStore } from '~/stores/useTournamentStore'

const route = useRoute()
const { t, locale } = useI18n()
const tournamentStore = useTournamentStore()

const selectedTournamentId = route.params.id as string

// Fetch payout data
const { data: payoutData, refresh: refreshPayout } = await useLazyAsyncData(
  `payout-${selectedTournamentId}`,
  () => GqlGetTournamentPayout({ tournamentId: selectedTournamentId })
)

// Fetch entry stats
const { data: entryStatsData, refresh: refreshEntryStats } = await useLazyAsyncData(
  `prize-entry-stats-${selectedTournamentId}`,
  () => GqlGetTournamentEntryStats({ tournamentId: selectedTournamentId })
)

// Refresh both payout and entry stats
const refreshStats = async () => {
  await Promise.all([refreshPayout(), refreshEntryStats()])
}

const entryStats = computed(() => entryStatsData.value?.tournamentEntryStats)
const payoutPositions = computed(() => payoutData.value?.tournamentPayout?.positions || [])
const prizePool = computed(() => formatPrice(payoutData.value?.tournamentPayout?.totalPrizePool, locale.value))
const buyInDisplay = computed(() => {
  const tournament = tournamentStore.tournament
  if (!tournament) return '—'
  const buyIn = formatPrice(tournament.buyInCents, locale.value)
  if (tournament.rakeCents > 0) {
    const rake = formatPrice(tournament.rakeCents, locale.value)
    return `${buyIn}+${rake}`
  }
  return buyIn
})
const firstPrizeDisplay = computed(() => {
  const first = payoutPositions.value[0]
  return first ? formatPrice(first.amountCents, locale.value) : '—'
})

const showFullPayout = computed(() => {
  const postRegStatuses = ['IN_PROGRESS', 'BREAK', 'FINAL_TABLE', 'FINISHED']
  return postRegStatuses.includes(tournamentStore.tournament?.liveStatus || '')
})

const getPositionLabel = (position: number) => {
  const key = `positions.${position}`
  const translated = t(key)
  if (translated !== key) return translated
  return t('positions.nth', { n: position })
}

defineExpose({ refreshStats })
</script>

<style scoped>
.prize-card {
  background-color: var(--pp-bg-secondary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--pp-shadow-sm);
  border: 1px solid var(--pp-border);
}

.prize-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.prize-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--pp-text-primary);
}

.prize-header-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #ffffff;
}

.prize-hero {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--pp-accent-gold);
  margin-bottom: 0.25rem;
}

.prize-subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 1.5rem;
}

.prize-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.prize-grid-item {
  background-color: rgba(24, 24, 26, 0.5);
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.prize-grid-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.25rem;
}

.prize-grid-value {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
}

.prize-breakdown {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(84, 84, 95, 0.3);
}

.prize-breakdown-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.75rem;
}

.prize-breakdown-list > * + * {
  margin-top: 0.5rem;
}

.prize-breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}

.prize-breakdown-position {
  color: #ffffff;
}

.prize-breakdown-values {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.prize-breakdown-percent {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
}

.prize-breakdown-amount {
  font-weight: 600;
  color: var(--pp-accent-gold);
  min-width: 80px;
  text-align: right;
}
</style>
