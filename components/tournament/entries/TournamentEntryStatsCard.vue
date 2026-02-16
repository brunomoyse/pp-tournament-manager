<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-semibold text-pp-text-primary">{{ t('entries.stats.title') }}</h3>
      <IonIcon :icon="cashOutline" class="w-6 h-6 text-white" />
    </div>

    <div class="space-y-4">
      <!-- Total Amount -->
      <div class="text-3xl font-bold text-pp-text-primary mb-4">
        {{ formatPrice(stats?.totalAmountCents, locale) }}
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-pp-bg-primary/50 rounded-lg p-3">
          <div class="text-xs text-white/50 mb-1">{{ t('entries.stats.totalEntries') }}</div>
          <div class="text-lg font-bold text-white">{{ stats?.totalEntries || 0 }}</div>
        </div>
        <div class="bg-pp-bg-primary/50 rounded-lg p-3">
          <div class="text-xs text-white/50 mb-1">{{ t('entries.stats.uniquePlayers') }}</div>
          <div class="text-lg font-bold text-white">{{ stats?.uniquePlayers || 0 }}</div>
        </div>
      </div>

      <!-- Breakdown -->
      <div class="space-y-2 pt-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-white/60">{{ t('entries.stats.initialCount') }}</span>
          <span class="font-medium text-white">{{ stats?.initialCount || 0 }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-white/60">{{ t('entries.stats.rebuyCount') }}</span>
          <span class="font-medium text-white">{{ stats?.rebuyCount || 0 }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-white/60">{{ t('entries.stats.reEntryCount') }}</span>
          <span class="font-medium text-white">{{ stats?.reEntryCount || 0 }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-white/60">{{ t('entries.stats.addonCount') }}</span>
          <span class="font-medium text-white">{{ stats?.addonCount || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { cashOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { formatPrice } from '~/utils'

const route = useRoute()
const { t, locale } = useI18n()

const selectedTournamentId = route.params.id as string

const { data: statsData, refresh: refreshStats } = await useLazyAsyncData(
  `entry-stats-${selectedTournamentId}`,
  () => GqlGetTournamentEntryStats({ tournamentId: selectedTournamentId })
)

const stats = computed(() => statsData.value?.tournamentEntryStats)

defineExpose({ refreshStats })
</script>
