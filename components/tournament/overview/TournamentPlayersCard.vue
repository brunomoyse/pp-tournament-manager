<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-semibold text-pp-text-primary">{{ t('headings.players') }}</h3>
      <IonIcon :icon="peopleOutline" class="w-6 h-6 text-white" />
    </div>

    <!-- Hero number -->
    <div class="mb-1">
      <span class="text-4xl font-bold text-pp-text-primary">{{ confirmedCount }}</span>
      <span v-if="seatCap" class="text-lg text-white/40"> / {{ seatCap }}</span>
    </div>
    <div class="text-sm text-white/50 mb-6">{{ t('labels.confirmed') }}</div>

    <!-- Status funnel -->
    <div class="space-y-3 mb-6">
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-white/50"></span>
          <span class="text-white/70">{{ t('labels.registered') }}</span>
        </div>
        <span class="font-medium text-white">{{ registeredCount }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-blue-400"></span>
          <span class="text-white/70">{{ t('labels.checkedIn') }}</span>
        </div>
        <span class="font-medium text-white">{{ checkedInCount }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-green-400"></span>
          <span class="text-white/70">{{ t('labels.seated') }}</span>
        </div>
        <span class="font-medium text-white">{{ seatedCount }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-red-400"></span>
          <span class="text-white/70">{{ t('labels.busted') }}</span>
        </div>
        <span class="font-medium text-white">{{ bustedCount }}</span>
      </div>

      <!-- Waitlisted (conditional) -->
      <div v-if="waitlistedCount > 0" class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          <span class="text-amber-400">{{ t('filters.waitlisted') }}</span>
        </div>
        <span class="font-medium text-amber-400">{{ waitlistedCount }}</span>
      </div>
    </div>

    <!-- Elimination progress bar -->
    <div class="space-y-2">
      <div class="flex justify-between items-center text-xs">
        <span class="text-white/60">{{ t('labels.progress') }}</span>
        <span class="text-white/60">{{ eliminationPercent }}%</span>
      </div>
      <div class="w-full bg-pp-bg-primary rounded-full h-2">
        <div
          class="bg-pp-accent-gold h-2 rounded-full transition-all duration-300"
          :style="{ width: `${eliminationPercent}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { peopleOutline } from 'ionicons/icons'
import { useTournamentStore } from '~/stores/useTournamentStore'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n()

const tournamentStore = useTournamentStore()

// Store data
const seatCap = computed(() => tournamentStore.tournament?.seatCap || null)
const registeredCount = computed(() => tournamentStore.registrations?.filter(r => r.status === 'REGISTERED').length || 0)
const checkedInCount = computed(() => tournamentStore.registrations?.filter(r => r.status === 'CHECKED_IN').length || 0)
const seatedCount = computed(() => tournamentStore.registrations?.filter(r => r.status === 'SEATED').length || 0)
const bustedCount = computed(() => tournamentStore.registrations?.filter(r => r.status === 'BUSTED').length || 0)
const confirmedCount = computed(() => registeredCount.value + checkedInCount.value + seatedCount.value + bustedCount.value)
const waitlistedCount = computed(() => tournamentStore.registrations?.filter(r => r.status === 'WAITLISTED').length || 0)
const eliminationPercent = computed(() => {
  if (confirmedCount.value === 0) return 0
  return Math.round(bustedCount.value / confirmedCount.value * 100)
})
</script>
