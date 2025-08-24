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
          <span class="font-semibold text-pp-text-primary">{{ formatPrice(position.amountCents) }}</span>
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
import {formatPrice} from "~/utils";

const route = useRoute()

// Fetch tournament payout data
const selectedTournamentId = route.params.id as string
const payoutData = await GqlGetTournamentPayout({ 
  tournamentId: selectedTournamentId 
})

const prizePool = computed(() => formatPrice(payoutData?.tournamentPayout?.totalPrizePool))

const getPositionLabel = (position: number) => {
  const suffixes = ['st', 'nd', 'rd']
  const suffix = position <= 3 ? suffixes[position - 1] : 'th'
  return `${position}${suffix} Place`
}
</script>