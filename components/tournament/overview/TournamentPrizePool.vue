<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-semibold text-pp-text-primary">Prize Pool</h3>
      <IonIcon :icon="trophyOutline" class="w-6 h-6 text-white" />
    </div>
    <div class="space-y-6">
      <div class="text-4xl font-bold text-pp-text-primary mb-6">{{ prizePool || 'Loading...' }}</div>
      <div class="space-y-3">
        <div class="flex items-center justify-between text-sm">
          <span class="text-white">1st Place</span>
          <span class="font-semibold text-pp-text-primary">{{ formatPayout(0.4) }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-white">2nd Place</span>
          <span class="font-semibold text-pp-text-primary">{{ formatPayout(0.25) }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-white">3rd Place</span>
          <span class="font-semibold text-pp-text-primary">{{ formatPayout(0.15) }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-white">4th Place</span>
          <span class="font-semibold text-pp-text-primary">{{ formatPayout(0.1) }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-white">5th Place</span>
          <span class="font-semibold text-pp-text-primary">{{ formatPayout(0.1) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { trophyOutline } from 'ionicons/icons'
import { useTournamentStore } from '~/stores/useTournamentStore'

const tournamentStore = useTournamentStore()

const tournament = computed(() => tournamentStore.tournament)
const totalRegistered = computed(() => tournamentStore.totalRegistered)


const prizePool = computed(() => {
  if (!tournament.value || !totalRegistered.value) return '€0'
  const totalCents = tournament.value.buyInCents * totalRegistered.value
  const euros = totalCents / 100
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency: 'EUR'
  }).format(euros)
})

const formatPayout = (percentage: number) => {
  if (!tournament.value || !totalRegistered.value) return '€0'
  const totalCents = tournament.value.buyInCents * totalRegistered.value
  const payoutAmount = Math.floor(totalCents * percentage / 100)
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(payoutAmount)
}
</script>