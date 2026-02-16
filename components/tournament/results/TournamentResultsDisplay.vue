<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-semibold text-pp-text-primary">{{ t('results.viewResults') }}</h3>
      <IonIcon :icon="trophyOutline" class="w-6 h-6 text-pp-accent-gold" />
    </div>

    <!-- Loading -->
    <div v-if="!playersData" class="text-center py-8 text-white/60">
      {{ t('status.loading') }}
    </div>

    <!-- Results Table -->
    <div v-else-if="finishedPlayers.length > 0" class="space-y-2">
      <div
        v-for="player in finishedPlayers"
        :key="player.id"
        :class="[
          'flex items-center justify-between p-3 rounded-lg border',
          player.position <= 3
            ? 'bg-pp-accent-gold/10 border-pp-accent-gold/20'
            : 'bg-pp-bg-primary/30 border-pp-border/30'
        ]"
      >
        <div class="flex items-center gap-3">
          <!-- Position Badge -->
          <div :class="[
            'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
            player.position === 1 ? 'bg-pp-accent-gold/30 text-pp-accent-gold' :
            player.position === 2 ? 'bg-gray-300/20 text-gray-300' :
            player.position === 3 ? 'bg-orange-400/20 text-orange-400' :
            'bg-white/5 text-white/60'
          ]">
            {{ player.position }}
          </div>
          <div>
            <span class="text-white font-medium text-sm">{{ player.name }}</span>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <span v-if="player.prizeCents > 0" class="font-semibold text-pp-text-primary text-sm">
            {{ formatPrice(player.prizeCents, locale) }}
          </span>
          <span v-if="player.points > 0" class="text-xs text-white/50">
            {{ player.points }} {{ t('results.points') }}
          </span>
        </div>
      </div>
    </div>

    <!-- No Results -->
    <div v-else class="text-center py-8 text-white/60">
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
