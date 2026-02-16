<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-semibold text-pp-text-primary">{{ t('headings.prizePool') }}</h3>
      <IonIcon :icon="trophyOutline" class="w-6 h-6 text-white" />
    </div>

    <!-- Hero prize pool -->
    <div class="text-4xl font-bold text-pp-text-primary mb-1">{{ prizePool || t('status.loading') }}</div>

    <!-- Entry context subtitle -->
    <div v-if="entryStats" class="text-sm text-white/50 mb-6">
      {{ t('prizePool.entriesAndPlayers', { entries: entryStats.totalEntries, players: entryStats.uniquePlayers }) }}
    </div>

    <!-- 2x2 metrics grid -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-pp-bg-primary/50 rounded-lg p-3">
        <div class="text-xs text-white/50 mb-1">{{ t('prizePool.buyIn') }}</div>
        <div class="text-base font-bold text-white">{{ buyInDisplay }}</div>
      </div>
      <div class="bg-pp-bg-primary/50 rounded-lg p-3">
        <div class="text-xs text-white/50 mb-1">{{ t('prizePool.entries') }}</div>
        <div class="text-base font-bold text-white">{{ entryStats?.totalEntries || 0 }}</div>
      </div>
      <template v-if="showFullPayout">
        <div class="bg-pp-bg-primary/50 rounded-lg p-3">
          <div class="text-xs text-white/50 mb-1">{{ t('prizePool.firstPrize') }}</div>
          <div class="text-base font-bold text-white">{{ firstPrizeDisplay }}</div>
        </div>
        <div class="bg-pp-bg-primary/50 rounded-lg p-3">
          <div class="text-xs text-white/50 mb-1">{{ t('prizePool.payingPositions') }}</div>
          <div class="text-base font-bold text-white">{{ payoutPositions.length }}</div>
        </div>
      </template>
    </div>

    <!-- Full payout breakdown (after late registration) -->
    <template v-if="showFullPayout && payoutPositions.length">
      <div class="mt-6 pt-5 border-t border-pp-border/30">
        <h4 class="text-sm font-medium text-white/60 mb-3">{{ t('prizePool.payoutBreakdown') }}</h4>
        <div class="space-y-2">
          <div
            v-for="position in payoutPositions"
            :key="position.position"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-white">{{ getPositionLabel(position.position) }}</span>
            <div class="flex items-center gap-3">
              <span class="text-white/40 text-xs">{{ position.percentage.toFixed(1) }}%</span>
              <span class="font-semibold text-pp-text-primary min-w-[80px] text-right">{{ formatPrice(position.amountCents, locale) }}</span>
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
const buyInDisplay = computed(() => formatPrice(tournamentStore.tournament?.buyInCents, locale.value))
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
