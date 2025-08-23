<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-semibold text-pp-text-primary">Prize Pool</h3>
      <IonIcon :icon="trophyOutline" class="w-6 h-6 text-white" />
    </div>
    <div class="space-y-6">
      <div class="text-4xl font-bold text-pp-text-primary mb-6">{{ prizePool || 'Loading...' }}</div>
      <div class="space-y-3">
        <div 
          v-for="position in payoutData?.tournamentPayout?.positions || []" 
          :key="position.position"
          class="flex items-center justify-between text-sm"
        >
          <span class="text-white">{{ getPositionLabel(position.position) }}</span>
          <span class="font-semibold text-pp-text-primary">{{ formatPayout(position.amountCents) }}</span>
        </div>
        <div v-if="!payoutData?.tournamentPayout?.positions?.length" class="text-center text-white/60 py-4">
          No payout structure defined
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { trophyOutline } from 'ionicons/icons'
import { useTournamentStore } from '~/stores/useTournamentStore'

const route = useRoute()

// Fetch tournament payout data
const selectedTournamentId = route.params.id as string
const payoutData = await GqlGetTournamentPayout({ 
  tournamentId: selectedTournamentId 
})

const prizePool = computed(() => {
  if (payoutData?.tournamentPayout?.totalPrizePool) {
    const euros = payoutData.tournamentPayout.totalPrizePool / 100
    return new Intl.NumberFormat('fr-BE', {
      style: 'currency',
      currency: 'EUR'
    }).format(euros)
  }
  return '€0'
})

const formatPayout = (amountCents: number) => {
  const euros = amountCents / 100
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(euros)
}

const getPositionLabel = (position: number) => {
  const suffixes = ['st', 'nd', 'rd']
  const suffix = position <= 3 ? suffixes[position - 1] : 'th'
  return `${position}${suffix} Place`
}
</script>