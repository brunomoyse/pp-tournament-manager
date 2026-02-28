<template>
  <div class="players-card">
    <div class="players-header">
      <h3 class="players-title">{{ t('headings.players') }}</h3>
      <IonIcon :icon="peopleOutline" class="players-header-icon" />
    </div>

    <!-- Hero number -->
    <div class="players-hero">
      <span class="players-hero-count">{{ confirmedCount }}</span>
      <span v-if="seatCap" class="players-hero-cap"> / {{ seatCap }}</span>
    </div>
    <div class="players-confirmed-label">{{ t('labels.confirmed') }}</div>

    <!-- Status funnel -->
    <div class="players-funnel">
      <div class="players-funnel-row">
        <div class="players-funnel-label">
          <span class="funnel-dot funnel-dot--registered"></span>
          <span class="funnel-text">{{ t('labels.registered') }}</span>
        </div>
        <span class="funnel-count">{{ registeredCount }}</span>
      </div>
      <div class="players-funnel-row">
        <div class="players-funnel-label">
          <span class="funnel-dot funnel-dot--checked-in"></span>
          <span class="funnel-text">{{ t('labels.checkedIn') }}</span>
        </div>
        <span class="funnel-count">{{ checkedInCount }}</span>
      </div>
      <div class="players-funnel-row">
        <div class="players-funnel-label">
          <span class="funnel-dot funnel-dot--seated"></span>
          <span class="funnel-text">{{ t('labels.seated') }}</span>
        </div>
        <span class="funnel-count">{{ seatedCount }}</span>
      </div>
      <div class="players-funnel-row">
        <div class="players-funnel-label">
          <span class="funnel-dot funnel-dot--busted"></span>
          <span class="funnel-text">{{ t('labels.busted') }}</span>
        </div>
        <span class="funnel-count">{{ bustedCount }}</span>
      </div>

      <!-- Waitlisted (conditional) -->
      <div v-if="waitlistedCount > 0" class="players-funnel-row">
        <div class="players-funnel-label">
          <span class="funnel-dot funnel-dot--waitlisted"></span>
          <span class="funnel-text funnel-text--waitlisted">{{ t('filters.waitlisted') }}</span>
        </div>
        <span class="funnel-count funnel-count--waitlisted">{{ waitlistedCount }}</span>
      </div>
    </div>

    <!-- Elimination progress bar -->
    <div class="players-progress">
      <div class="players-progress-header">
        <span class="players-progress-label">{{ t('labels.progress') }}</span>
        <span class="players-progress-label">{{ eliminationPercent }}%</span>
      </div>
      <div class="players-progress-track">
        <div
          class="players-progress-fill"
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

<style scoped>
.players-card {
  background-color: var(--pp-bg-secondary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--pp-shadow-sm);
  border: 1px solid var(--pp-border);
}

.players-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.players-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--pp-text-primary);
}

.players-header-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #ffffff;
}

.players-hero {
  margin-bottom: 0.25rem;
}

.players-hero-count {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--pp-accent-gold);
}

.players-hero-cap {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.4);
}

.players-confirmed-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 1.5rem;
}

.players-funnel {
  margin-bottom: 1.5rem;
}

.players-funnel > * + * {
  margin-top: 0.75rem;
}

.players-funnel-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}

.players-funnel-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.funnel-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
}

.funnel-dot--registered {
  background-color: rgba(255, 255, 255, 0.5);
}

.funnel-dot--checked-in {
  background-color: var(--pp-purple-400);
}

.funnel-dot--seated {
  background-color: var(--pp-green-400);
}

.funnel-dot--busted {
  background-color: var(--pp-red-400);
}

.funnel-dot--waitlisted {
  background-color: var(--pp-amber-400);
}

.funnel-text {
  color: rgba(255, 255, 255, 0.7);
}

.funnel-text--waitlisted {
  color: var(--pp-amber-400);
}

.funnel-count {
  font-weight: 500;
  color: #ffffff;
}

.funnel-count--waitlisted {
  font-weight: 500;
  color: var(--pp-amber-400);
}

.players-progress > * + * {
  margin-top: 0.5rem;
}

.players-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.players-progress-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.players-progress-track {
  width: 100%;
  background-color: var(--pp-bg-primary);
  border-radius: 9999px;
  height: 0.5rem;
}

.players-progress-fill {
  background-color: var(--pp-accent-gold);
  height: 0.5rem;
  border-radius: 9999px;
  transition: all 300ms;
}
</style>
