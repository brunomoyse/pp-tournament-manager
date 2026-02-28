<template>
  <div class="stats-card">
    <div class="stats-header">
      <h3 class="stats-title">{{ t('entries.stats.title') }}</h3>
      <IonIcon :icon="cashOutline" class="stats-header-icon" />
    </div>

    <div class="stats-body">
      <!-- Total Amount -->
      <div class="stats-total-amount">
        {{ formatPrice(stats?.totalAmountCents, locale) }}
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stats-grid-item">
          <div class="stats-grid-label">{{ t('entries.stats.totalEntries') }}</div>
          <div class="stats-grid-value">{{ stats?.totalEntries || 0 }}</div>
        </div>
        <div class="stats-grid-item">
          <div class="stats-grid-label">{{ t('entries.stats.uniquePlayers') }}</div>
          <div class="stats-grid-value">{{ stats?.uniquePlayers || 0 }}</div>
        </div>
      </div>

      <!-- Breakdown -->
      <div class="stats-breakdown">
        <div class="stats-breakdown-row">
          <span class="stats-breakdown-label">{{ t('entries.stats.initialCount') }}</span>
          <span class="stats-breakdown-value">{{ stats?.initialCount || 0 }}</span>
        </div>
        <div class="stats-breakdown-row">
          <span class="stats-breakdown-label">{{ t('entries.stats.rebuyCount') }}</span>
          <span class="stats-breakdown-value">{{ stats?.rebuyCount || 0 }}</span>
        </div>
        <div class="stats-breakdown-row">
          <span class="stats-breakdown-label">{{ t('entries.stats.reEntryCount') }}</span>
          <span class="stats-breakdown-value">{{ stats?.reEntryCount || 0 }}</span>
        </div>
        <div class="stats-breakdown-row">
          <span class="stats-breakdown-label">{{ t('entries.stats.addonCount') }}</span>
          <span class="stats-breakdown-value">{{ stats?.addonCount || 0 }}</span>
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

<style scoped>
.stats-card {
  background-color: var(--pp-bg-secondary);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--pp-shadow-sm);
  border: 1px solid var(--pp-border);
}

.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.stats-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--pp-text-primary);
}

.stats-header-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #ffffff;
}

.stats-body > * + * {
  margin-top: 1rem;
}

.stats-total-amount {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--pp-accent-gold);
  margin-bottom: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.stats-grid-item {
  background-color: rgba(24, 24, 26, 0.5);
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.stats-grid-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.25rem;
}

.stats-grid-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffffff;
}

.stats-breakdown {
  padding-top: 0.5rem;
}

.stats-breakdown > * + * {
  margin-top: 0.5rem;
}

.stats-breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}

.stats-breakdown-label {
  color: rgba(255, 255, 255, 0.6);
}

.stats-breakdown-value {
  font-weight: 500;
  color: #ffffff;
}
</style>
