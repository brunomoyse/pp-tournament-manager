<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-semibold text-pp-text-primary">{{ t('headings.prizePool') }}</h3>
      <IonIcon :icon="trophyOutline" class="w-6 h-6 text-white" />
    </div>
    <div class="space-y-6">
      <!-- Total Prize Pool -->
      <div class="text-4xl font-bold text-pp-text-primary mb-2">{{ prizePool || t('status.loading') }}</div>

      <!-- Entry context subtitle -->
      <div v-if="entryStats" class="text-sm text-white/50 -mt-4 mb-4">
        {{ t('prizePool.entriesAndPlayers', { entries: entryStats.totalEntries, players: entryStats.uniquePlayers }) }}
      </div>

      <!-- Entry Breakdown (compact) -->
      <div v-if="entryStats" class="grid grid-cols-4 gap-2">
        <div class="bg-pp-bg-primary/50 rounded-lg p-2 text-center">
          <div class="text-xs text-white/50">{{ t('entries.stats.initialCount') }}</div>
          <div class="text-base font-bold text-white">{{ entryStats.initialCount || 0 }}</div>
        </div>
        <div class="bg-pp-bg-primary/50 rounded-lg p-2 text-center">
          <div class="text-xs text-white/50">{{ t('entries.stats.rebuyCount') }}</div>
          <div class="text-base font-bold text-white">{{ entryStats.rebuyCount || 0 }}</div>
        </div>
        <div class="bg-pp-bg-primary/50 rounded-lg p-2 text-center">
          <div class="text-xs text-white/50">{{ t('entries.stats.reEntryCount') }}</div>
          <div class="text-base font-bold text-white">{{ entryStats.reEntryCount || 0 }}</div>
        </div>
        <div class="bg-pp-bg-primary/50 rounded-lg p-2 text-center">
          <div class="text-xs text-white/50">{{ t('entries.stats.addonCount') }}</div>
          <div class="text-base font-bold text-white">{{ entryStats.addonCount || 0 }}</div>
        </div>
      </div>

      <!-- Position payouts -->
      <div class="space-y-3">
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
        <div v-if="!payoutPositions.length" class="text-center text-white/60 py-4">
          {{ t('messages.noPayoutStructure') }}
        </div>
      </div>

      <!-- Paying positions count -->
      <div v-if="payoutPositions.length" class="pt-3 border-t border-pp-border/30">
        <div class="flex items-center justify-between text-sm">
          <span class="text-white/50">{{ t('prizePool.payingPositions') }}</span>
          <span class="font-medium text-white">{{ payoutPositions.length }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { trophyOutline } from 'ionicons/icons'
import { formatPrice } from '~/utils'
import { useI18n } from '~/composables/useI18n'

const route = useRoute()
const { t, locale } = useI18n()

const selectedTournamentId = route.params.id as string

// Fetch payout data
const { data: payoutData } = await useLazyAsyncData(
  `payout-${selectedTournamentId}`,
  () => GqlGetTournamentPayout({ tournamentId: selectedTournamentId })
)

// Fetch entry stats
const { data: entryStatsData, refresh: refreshStats } = await useLazyAsyncData(
  `prize-entry-stats-${selectedTournamentId}`,
  () => GqlGetTournamentEntryStats({ tournamentId: selectedTournamentId })
)

const entryStats = computed(() => entryStatsData.value?.tournamentEntryStats)
const payoutPositions = computed(() => payoutData.value?.tournamentPayout?.positions || [])
const prizePool = computed(() => formatPrice(payoutData.value?.tournamentPayout?.totalPrizePool, locale.value))

const getPositionLabel = (position: number) => {
  const key = `positions.${position}`
  const translated = t(key)
  if (translated !== key) return translated
  return t('positions.nth', { n: position })
}

defineExpose({ refreshStats })
</script>
