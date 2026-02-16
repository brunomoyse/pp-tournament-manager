<template>
  <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-semibold text-pp-text-primary">{{ t('headings.players') }}</h3>
      <IonIcon :icon="peopleOutline" class="w-6 h-6 text-white" />
    </div>
    <div class="space-y-6">
      <div class="grid grid-cols-2 gap-6">
        <div class="text-center">
          <div class="text-3xl font-bold text-pp-text-primary mb-1">
            {{ confirmedCount }}<span v-if="seatCap" class="text-lg text-white/40">/{{ seatCap }}</span>
          </div>
          <div class="text-white/60 text-sm">{{ t('labels.registered') }}</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-pp-text-primary mb-1">{{ remainingPlayers }}</div>
          <div class="text-white/60 text-sm">{{ t('labels.remaining') }}</div>
        </div>
      </div>

      <div v-if="waitlistedCount > 0" class="flex justify-between items-center text-sm">
        <span class="text-amber-400">{{ t('filters.waitlisted') }}</span>
        <span class="text-amber-400 font-medium">{{ waitlistedCount }}</span>
      </div>
      
      <div class="space-y-3">
        <div class="flex justify-between items-center text-sm">
          <span class="text-white/60">{{ t('labels.active') }}</span>
          <span class="text-pp-text-primary font-medium">{{ remainingPlayers }}</span>
        </div>
        <div class="flex justify-between items-center text-sm">
          <span class="text-white/60">{{ t('labels.eliminated') }}</span>
          <span class="text-pp-text-primary font-medium">{{ totalRegistered - remainingPlayers }}</span>
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="text-white/60">{{ t('labels.progress') }}</span>
          <span class="text-white/60">{{ Math.round((totalRegistered - remainingPlayers) / totalRegistered * 100) || 0 }}%</span>
        </div>
        <div class="w-full bg-pp-bg-primary rounded-full h-2">
          <div 
            class="bg-pp-accent-gold h-2 rounded-full transition-all duration-300"
            :style="{ width: `${Math.round((totalRegistered - remainingPlayers) / totalRegistered * 100) || 0}%` }"
          ></div>
        </div>
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
const confirmedCount = computed(() => tournamentStore.registrations?.filter(r => ['REGISTERED', 'CHECKED_IN', 'SEATED', 'BUSTED'].includes(r.status)).length || 0)
const waitlistedCount = computed(() => tournamentStore.registrations?.filter(r => r.status === 'WAITLISTED').length || 0)
const totalRegistered = computed(() => confirmedCount.value)
const remainingPlayers = computed(() => tournamentStore.registrations?.filter(r => ['REGISTERED', 'CHECKED_IN', 'SEATED'].includes(r.status)).length || 0)
</script>