<template>
  <IonPage class="page-bg">
    <IonContent class="content-bg">
      <div class="page-container">
        <div v-if="loading" class="loading-state">
          <IonSpinner name="crescent" class="spinner" />
        </div>

        <template v-else-if="series">
          <PpFadeUp>
            <div class="header-section">
              <p class="eyebrow">{{ t('series.eyebrow') }}</p>
              <h1 class="page-title">{{ series.title }}</h1>
            </div>
          </PpFadeUp>

          <!-- Flights -->
          <h2 class="section-title">{{ t('series.flightsLabel') }}</h2>
          <div class="flight-grid">
            <NuxtLink
              v-for="f in series.flights"
              :key="f.id"
              :to="`/tournament/${f.id}`"
              class="flight-card pp-card"
            >
              <div class="flight-card-head">
                <span class="flight-label">{{ f.flightLabel }}</span>
                <span v-if="f.isFinalDay" class="badge badge--gold">{{
                  t('series.finalDay')
                }}</span>
              </div>
              <span class="flight-status">{{ liveStatusLabel(f.liveStatus) }}</span>
              <span class="flight-date">{{ formatDate(f.startTime) }}</span>
            </NuxtLink>
          </div>

          <!-- Qualifiers + Open Day 2 -->
          <div class="qual-head">
            <h2 class="section-title">
              {{ t('series.qualifiers') }} ({{ series.qualifications.length }})
            </h2>
            <PpButton variant="primary" size="sm" :loading="opening" @click="openDay2">
              <IonIcon :icon="arrowForwardOutline" />
              {{ t('series.openDay2') }}
            </PpButton>
          </div>

          <div v-if="series.qualifications.length === 0" class="empty-text">
            {{ t('series.noQualifiers') }}
          </div>
          <div v-else class="qual-list">
            <div v-for="q in sortedQuals" :key="q.clubPlayerId" class="qual-row pp-card">
              <span class="qual-name">{{ playerName(q.clubPlayerId) }}</span>
              <span class="qual-stack"
                >{{ q.chipCount.toLocaleString('fr-BE') }} {{ t('series.chips') }}</span
              >
            </div>
          </div>
        </template>

        <div v-else class="empty-text">{{ t('series.notFound') }}</div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { IonPage, IonContent, IonIcon, IonSpinner } from '@ionic/vue'
import { arrowForwardOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import type { TournamentSeries } from '~/types/series'

const route = useRoute()
const { t, locale } = useI18n()
const toast = useToast()

const seriesId = computed(() => route.params.id as string)
const series = ref<TournamentSeries | null>(null)
const players = ref<{ id: string; displayName: string }[]>([])
const loading = ref(true)
const opening = ref(false)

const fetchSeries = async () => {
  loading.value = true
  try {
    const { tournamentSeries } = await GqlGetTournamentSeries({ id: seriesId.value })
    series.value = (tournamentSeries as TournamentSeries) ?? null
    if (series.value) {
      const { clubPlayers } = await GqlGetClubPlayers({ clubId: series.value.clubId })
      players.value = (clubPlayers || []).map((p) => ({ id: p.id, displayName: p.displayName }))
    }
  } catch (e) {
    console.error('Failed to load series:', e)
    series.value = null
  } finally {
    loading.value = false
  }
}

onMounted(fetchSeries)

const sortedQuals = computed(() =>
  (series.value?.qualifications ?? []).toSorted((a, b) => b.chipCount - a.chipCount),
)

const playerName = (id: string) =>
  players.value.find((p) => p.id === id)?.displayName || t('common.unknown')

const openDay2 = async () => {
  opening.value = true
  try {
    await GqlOpenDayTwo({ seriesId: seriesId.value })
    toast.success(t('series.day2Opened'))
    await fetchSeries()
  } catch (e) {
    console.error('Failed to open Day 2:', e)
    toast.error(t('series.day2Error'))
  } finally {
    opening.value = false
  }
}

const liveStatusLabel = (s: string) => t(`liveStatus.${s}`, s)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(locale.value === 'en' ? 'en-GB' : `${locale.value}-BE`, {
    day: '2-digit',
    month: 'short',
  })
</script>

<style scoped>
.page-bg,
.content-bg {
  background-color: var(--color-pp-bg);
}
.page-container {
  padding: 1.5rem 1rem;
}
@media (min-width: 1024px) {
  .page-container {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}
.loading-state {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}
.spinner {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-pp-gold);
}
.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
}
.page-title {
  margin-top: 0.65rem;
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 3vw + 0.5rem, 2.5rem);
  line-height: 1.1;
  font-weight: 600;
  color: var(--color-pp-text);
}
.section-title {
  margin: 1.5rem 0 0.75rem;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-pp-text);
}
.flight-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
@media (min-width: 640px) {
  .flight-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
.flight-card {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-decoration: none;
  transition: border-color 0.2s ease;
}
.flight-card:hover {
  border-color: var(--color-pp-gold);
}
.flight-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.flight-label {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--color-pp-text);
}
.flight-status {
  font-size: 0.8rem;
  color: var(--color-pp-text-muted);
}
.flight-date {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-pp-text-dim);
}
.badge {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.2rem 0.5rem;
  border-radius: 0.5rem;
}
.badge--gold {
  background-color: rgba(var(--pp-accent-rgb), 0.15);
  color: var(--color-pp-gold);
  border: 1px solid rgba(var(--pp-accent-rgb), 0.4);
}
.qual-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.empty-text {
  color: var(--color-pp-text-muted);
  font-size: 0.9rem;
}
.qual-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.qual-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1rem;
}
.qual-name {
  color: var(--color-pp-text);
  font-size: 0.9rem;
}
.qual-stack {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-pp-gold);
}
</style>
