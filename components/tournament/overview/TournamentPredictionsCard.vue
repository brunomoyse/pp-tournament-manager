<template>
  <!-- Rendered only when the Predictions feature is enabled server-side. -->
  <div v-if="predictionsEnabled" class="predictions-card">
    <div class="predictions-header">
      <h3 class="predictions-title">{{ t('predictions.title') }}</h3>
      <IonIcon :icon="sparklesOutline" class="predictions-header-icon" />
    </div>

    <p class="predictions-desc">{{ t('predictions.description') }}</p>

    <button
      class="pp-action-button pp-action-button--primary predictions-button"
      :disabled="isResolving || !tournamentId"
      @click="resolvePredictions"
    >
      <IonIcon :icon="trophyOutline" class="icon-md" />
      {{ isResolving ? t('predictions.resolving') : t('predictions.resolve') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { sparklesOutline, trophyOutline } from 'ionicons/icons'
import { useTournamentStore } from '~/stores/useTournamentStore'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n()
const toast = useToast()
const tournamentStore = useTournamentStore()

const tournamentId = computed(() => tournamentStore.tournament?.id)

const predictionsEnabled = ref(false)
const isResolving = ref(false)

onMounted(async () => {
  try {
    const res = await GqlGetFeatureFlags()
    predictionsEnabled.value = res.featureFlags?.predictions ?? false
  } catch (error) {
    console.error('Failed to load feature flags:', error)
  }
})

const resolvePredictions = async () => {
  if (!tournamentId.value) return
  isResolving.value = true
  try {
    const res = await GqlResolveTournamentPredictions({ tournamentId: tournamentId.value })
    const count = res.resolveTournamentPredictions ?? 0
    toast.success(t('predictions.resolved', { count }))
  } catch (error) {
    console.error('Failed to resolve predictions:', error)
    toast.error(t('predictions.resolveFailed'))
  } finally {
    isResolving.value = false
  }
}
</script>

<style scoped>
.predictions-card {
  background-color: var(--color-pp-surface-2);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--pp-shadow-sm);
  border: 1px solid var(--color-pp-border-strong);
}

.predictions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.predictions-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-pp-text);
}

.predictions-header-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-pp-gold);
}

.predictions-desc {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.25rem;
}

.predictions-button {
  width: 100%;
}
</style>
