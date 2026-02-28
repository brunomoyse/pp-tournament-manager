<template>
  <div class="results-card">
    <div class="results-card__header">
      <h3 class="results-card__title">{{ t('results.viewResults') }}</h3>
      <IonIcon :icon="trophyOutline" class="results-card__icon" />
    </div>

    <!-- Loading -->
    <div v-if="!playersData" class="results-card__loading">
      {{ t('status.loading') }}
    </div>

    <!-- Results Table -->
    <div v-else-if="finishedPlayers.length > 0" class="results-card__list">
      <div
        v-for="player in finishedPlayers"
        :key="player.id"
        :class="[
          'results-card__row',
          player.position <= 3
            ? 'results-card__row--podium'
            : 'results-card__row--regular'
        ]"
      >
        <div class="results-card__row-left">
          <!-- Position Badge -->
          <div :class="[
            'results-card__position',
            player.position === 1 ? 'results-card__position--first' :
            player.position === 2 ? 'results-card__position--second' :
            player.position === 3 ? 'results-card__position--third' :
            'results-card__position--default'
          ]">
            {{ player.position }}
          </div>
          <div>
            <span class="results-card__player-name">{{ player.name }}</span>
          </div>
        </div>

        <div class="results-card__row-right">
          <span v-if="player.prizeCents > 0" class="results-card__prize">
            {{ formatPrice(player.prizeCents, locale) }}
          </span>
          <span v-if="player.points > 0" class="results-card__points">
            {{ player.points }} {{ t('results.points') }}
          </span>
        </div>
      </div>
    </div>

    <!-- No Results -->
    <div v-else class="results-card__empty">
      {{ t('results.noRemainingPlayers') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { trophyOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { formatPrice } from '~/utils'
import { useTournamentStore } from '~/stores/useTournamentStore'

const route = useRoute()
const { t, locale } = useI18n()
const tournamentStore = useTournamentStore()

const selectedTournamentId = route.params.id as string

// Fetch tournament players to get results
const { data: playersData } = await useLazyAsyncData(
  `results-${selectedTournamentId}`,
  () => GqlGetTournamentPlayers({ tournamentId: selectedTournamentId })
)

// Also fetch payout data
const { data: payoutData } = await useLazyAsyncData(
  `results-payout-${selectedTournamentId}`,
  () => GqlGetTournamentPayout({ tournamentId: selectedTournamentId })
)

interface FinishedPlayer {
  id: string
  name: string
  position: number
  prizeCents: number
  points: number
}

const finishedPlayers = computed<FinishedPlayer[]>(() => {
  const tournament = tournamentStore.tournament
  const registrations = tournament?.registrations || []
  const players = playersData.value?.tournamentPlayers?.items || []
  const positions = payoutData.value?.tournamentPayout?.positions || []

  // Build a map of registration results from the tournament registrations
  // For finished tournaments, we rely on the registration statuses (BUSTED players have positions)
  // Actually, we need the results - let's use payout positions + busted players
  const bustedPlayers = players
    .filter((tp: any) => tp.registration.status === 'BUSTED' || tp.registration.status === 'SEATED' || tp.registration.status === 'CHECKED_IN')
    .map((tp: any) => {
      const firstName = tp.user.firstName || ''
      const lastName = tp.user.lastName || ''
      const displayName = lastName && firstName
        ? `${lastName} ${firstName}`
        : `${firstName} ${lastName}`.trim()
      return {
        id: tp.user.id,
        name: displayName || tp.user.username || tp.user.email,
        registrationStatus: tp.registration.status
      }
    })

  // For now, display players sorted - we don't have individual result data in this query
  // The positions from payout give us the structure
  return bustedPlayers.map((player, index) => {
    const position = index + 1
    const payoutPos = positions.find((p: any) => p.position === position)
    return {
      id: player.id,
      name: player.name,
      position,
      prizeCents: payoutPos?.amountCents || 0,
      points: 0
    }
  })
})
</script>

<style scoped>
.results-card {
  background-color: var(--pp-bg-secondary);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--pp-shadow-sm);
  border: 1px solid var(--pp-border);
}

.results-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.results-card__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--pp-text-primary);
}

.results-card__icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--pp-accent-gold);
}

/* Loading */
.results-card__loading {
  text-align: center;
  padding: 2rem 0;
  color: rgba(255, 255, 255, 0.6);
}

/* Results List */
.results-card__list > * + * {
  margin-top: 0.5rem;
}

.results-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid;
}

.results-card__row--podium {
  background-color: rgba(254, 231, 138, 0.1);
  border-color: rgba(254, 231, 138, 0.2);
}

.results-card__row--regular {
  background-color: rgba(24, 24, 26, 0.3);
  border-color: rgba(84, 84, 95, 0.3);
}

.results-card__row-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Position Badge */
.results-card__position {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}

.results-card__position--first {
  background-color: rgba(254, 231, 138, 0.3);
  color: var(--pp-accent-gold);
}

.results-card__position--second {
  background-color: rgba(209, 213, 219, 0.2);
  color: #d1d5db;
}

.results-card__position--third {
  background-color: rgba(251, 146, 60, 0.2);
  color: var(--pp-orange-400);
}

.results-card__position--default {
  background-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
}

.results-card__player-name {
  color: #ffffff;
  font-weight: 500;
  font-size: 0.875rem;
}

.results-card__row-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.results-card__prize {
  font-weight: 600;
  color: var(--pp-accent-gold);
  font-size: 0.875rem;
}

.results-card__points {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

/* No Results */
.results-card__empty {
  text-align: center;
  padding: 2rem 0;
  color: rgba(255, 255, 255, 0.6);
}
</style>
