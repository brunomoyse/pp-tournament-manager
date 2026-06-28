<template>
  <IonPage class="page-bg">
    <IonContent class="content-bg">
      <div class="page-container">
        <div class="page-header">
          <PpFadeUp>
            <p class="eyebrow">{{ tournaments.length }} {{ t('nav.tournaments') }}</p>
            <h1 class="page-title">{{ t('tournaments.title') }}</h1>
          </PpFadeUp>
          <PpFadeUp :delay="0.08" data-tour="create-tournament">
            <div class="header-actions">
              <PpButton variant="secondary" @click="showSeriesModal = true">
                <IonIcon :icon="layersOutline" class="icon-md" />
                {{ t('series.newSeries') }}
              </PpButton>
              <PpButton magnetic @click="createTournament">
                <IonIcon :icon="addOutline" class="icon-md" />
                {{ t('buttons.createTournament') }}
              </PpButton>
            </div>
          </PpFadeUp>
        </div>

        <!-- Filter chips + search -->
        <div class="filter-bar">
          <div class="chips">
            <button
              v-for="chip in statusChips"
              :key="chip.key || 'all'"
              type="button"
              class="chip"
              :class="{ 'chip--active': statusFilter === chip.key }"
              @click="statusFilter = chip.key"
            >
              <span v-if="chip.tone" class="chip__dot" :class="`chip__dot--${chip.tone}`" />
              <span class="chip__label">{{ chip.label }}</span>
              <span class="chip__count">{{ chip.count }}</span>
            </button>
          </div>

          <div class="search-wrapper">
            <IonIcon :icon="searchOutline" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('tournaments.search')"
              :aria-label="t('tournaments.search')"
              class="search-input"
            />
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <IonSpinner name="crescent" class="spinner" />
        </div>

        <!-- Card grid -->
        <PpStagger
          v-else-if="filteredTournaments.length > 0"
          class="tournaments-grid"
          :stagger-children="0.04"
        >
          <PpStaggerItem v-for="tournament in filteredTournaments" :key="tournament.id">
            <PpCard
              interactive
              padding="none"
              class="tournament-card"
              :class="`tournament-card--${toneFor(tournament.status)}`"
              @click="goToTournament(tournament.id)"
            >
              <span
                class="tournament-card__accent"
                :class="`accent--${toneFor(tournament.status)}`"
              />
              <div class="tournament-card__body">
                <div class="card-header">
                  <PpStatusPill
                    :tone="toneFor(tournament.status)"
                    :dot="tournament.status === 'IN_PROGRESS'"
                  >
                    {{ getTournamentStatusLabel(tournament.status, t) }}
                  </PpStatusPill>
                  <span class="card-date">{{ formatDate(tournament.startTime) }}</span>
                </div>

                <h4 class="card-title">{{ tournament.title }}</h4>

                <p class="card-structure">{{ structureLine(tournament) }}</p>

                <div class="card-footer">
                  <span class="card-buyin">{{ formatPrice(tournament.buyInCents) }}</span>
                  <IonIcon :icon="chevronForwardOutline" class="card-chevron" />
                </div>
              </div>
            </PpCard>
          </PpStaggerItem>
        </PpStagger>

        <!-- Empty -->
        <PpEmptyState
          v-else
          :icon="trophyOutline"
          :title="t('tournaments.noTournaments')"
          :description="
            searchQuery || statusFilter
              ? t('tournaments.tryDifferentFilter')
              : t('tournaments.createFirst')
          "
        />
      </div>
    </IonContent>

    <TournamentFormModal
      :isOpen="showTournamentModal"
      :tournament="null"
      mode="create"
      @close="showTournamentModal = false"
      @saved="onTournamentSaved"
    />

    <CreateSeriesModal
      :open="showSeriesModal"
      @close="showSeriesModal = false"
      @created="onSeriesCreated"
    />
  </IonPage>
</template>

<script setup lang="ts">
import type { GetTournamentsQuery } from '#gql'
import type { TournamentStatus } from '~/types/tournament'

definePageMeta({
  middleware: 'auth',
  title: 'nav.tournaments',
})

import { IonPage, IonContent, IonIcon, IonSpinner } from '@ionic/vue'
import {
  searchOutline,
  trophyOutline,
  chevronForwardOutline,
  addOutline,
  layersOutline,
} from 'ionicons/icons'
import TournamentFormModal from '~/components/tournament/TournamentFormModal.vue'
import CreateSeriesModal from '~/components/tournament/series/CreateSeriesModal.vue'
import { useI18n } from '~/composables/useI18n'
import { formatPrice } from '~/utils'
import { getTournamentStatusLabel } from '~/utils/tournamentStatus'

const router = useRouter()
const clubStore = useClubStore()
const { t, locale } = useI18n()

const { club } = clubStore

const loading = ref(true)
const tournaments = ref<GetTournamentsQuery['tournaments']['items']>([])
const searchQuery = ref('')
const statusFilter = ref<TournamentStatus | ''>('')
const showTournamentModal = ref(false)
const showSeriesModal = ref(false)

const onSeriesCreated = (id: string) => {
  showSeriesModal.value = false
  router.push(`/series/${id}`)
}

// Map the lifecycle status to a pill/accent tone (live = red, upcoming = sky,
// completed = neutral). Anything mid-flight (late reg, break) reads as live.
const toneFor = (status: string) => {
  if (status === 'IN_PROGRESS') return 'live'
  if (status === 'COMPLETED') return 'neutral'
  return 'info'
}

const countByStatus = (status: string) =>
  tournaments.value.filter((tournament) => tournament.status === status).length

const statusChips = computed(() => [
  { key: '' as const, label: t('tournaments.all'), count: tournaments.value.length, tone: '' },
  {
    key: 'IN_PROGRESS' as const,
    label: t('tournaments.inProgress'),
    count: countByStatus('IN_PROGRESS'),
    tone: 'live',
  },
  {
    key: 'UPCOMING' as const,
    label: t('tournaments.upcoming'),
    count: countByStatus('UPCOMING'),
    tone: 'info',
  },
  {
    key: 'COMPLETED' as const,
    label: t('tournaments.completed'),
    count: countByStatus('COMPLETED'),
    tone: 'neutral',
  },
])

const filteredTournaments = computed(() => {
  let result = [...tournaments.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query),
    )
  }

  if (statusFilter.value) {
    result = result.filter((item) => item.status === statusFilter.value)
  }

  return result.toSorted(
    (a, b) => new Date(b.startTime || '').getTime() - new Date(a.startTime || '').getTime(),
  )
})

// be-FR integer formatting for stack sizes (dot thousands: 40.000).
const numberFormatter = new Intl.NumberFormat('fr-BE', { maximumFractionDigits: 0 })

// One-line structure description: prefer the tournament's own description,
// otherwise compose stack + seats from real fields.
const structureLine = (tournament: any) => {
  if (tournament.description) return tournament.description
  const parts: string[] = []
  if (tournament.startingStack)
    parts.push(`${numberFormatter.format(tournament.startingStack)} ${t('tournaments.stack')}`)
  if (tournament.seatCap) parts.push(`${tournament.seatCap} ${t('tournaments.seats')}`)
  return parts.join(' · ')
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString(locale.value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const goToTournament = (id: string) => {
  router.push(`/tournament/${id}`)
}

const createTournament = () => {
  showTournamentModal.value = true
}

const onTournamentSaved = async () => {
  showTournamentModal.value = false
  await fetchTournaments()
}

const fetchTournaments = async () => {
  if (!club) return
  loading.value = true
  try {
    const { tournaments: result } = await GqlGetTournaments({ clubId: club.id })
    tournaments.value = result?.items || []
  } catch (error) {
    console.error('Failed to fetch tournaments:', error)
    tournaments.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTournaments()
})
</script>

<style scoped>
.page-bg,
.content-bg {
  background-color: var(--color-pp-bg);
}

.page-container {
  padding: 1.75rem 1rem 3rem;
}

@media (min-width: 640px) {
  .page-container {
    padding: 2rem 1.5rem 3rem;
  }
}

@media (min-width: 1024px) {
  .page-container {
    padding: 2.5rem 2rem 4rem;
  }
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
  font-variant-numeric: tabular-nums;
}

.page-title {
  margin-top: 0.65rem;
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 3vw + 0.5rem, 2.5rem);
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-pp-text);
}

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Filter bar */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.25rem;
  padding: 0 0.75rem;
  border-radius: 9999px;
  border: 1px solid var(--color-pp-border);
  background-color: var(--color-pp-surface);
  color: var(--color-pp-text-muted);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.chip:hover {
  color: var(--color-pp-text);
  border-color: var(--color-pp-border-strong);
}

.chip--active {
  color: var(--color-pp-gold);
  border-color: rgba(var(--pp-accent-rgb), 0.4);
  background-color: rgba(var(--pp-accent-rgb), 0.1);
}

.chip__dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 9999px;
  background-color: var(--color-pp-text-dim);
}
.chip__dot--live {
  background-color: var(--color-pp-danger);
}
.chip__dot--info {
  background-color: var(--color-pp-info);
}
.chip__dot--neutral {
  background-color: var(--color-pp-text-dim);
}

.chip__count {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  color: var(--color-pp-text-dim);
}

.chip--active .chip__count {
  color: var(--color-pp-gold);
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 14rem;
  max-width: 22rem;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.1rem;
  height: 1.1rem;
  color: var(--color-pp-text-dim);
}

.search-input {
  width: 100%;
  height: 2.25rem;
  padding: 0 0.9rem 0 2.4rem;
  background-color: var(--color-pp-bg);
  border: 1px solid var(--color-pp-border);
  border-radius: 0.7rem;
  color: var(--color-pp-text);
  font-size: 0.85rem;
}

.search-input::placeholder {
  color: var(--color-pp-text-dim);
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--pp-accent-rgb), 0.4);
  border-color: var(--color-pp-gold);
}

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5rem 0;
}

.spinner {
  width: 2rem;
  height: 2rem;
  color: var(--color-pp-gold);
}

/* Card grid */
.tournaments-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .tournaments-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .tournaments-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Card: PpCard owns surface/border/radius/hover. We add the status accent and
   an inner flex column so the footer pins to the bottom across the row. */
.tournament-card {
  position: relative;
  overflow: hidden;
  height: 100%;
  transition: transform 0.15s ease;
}

/* PpCard deliberately neutralizes its own hover lift; the grid cards want it
   back. The double class (.ppc is on the PpCard root) outspecifies that rule. */
.tournament-card.ppc:hover {
  transform: translateY(-3px);
}

.tournament-card__accent {
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
}
.accent--live {
  background: linear-gradient(90deg, var(--color-pp-danger), rgba(var(--pp-danger-rgb), 0));
}
.accent--info {
  background: linear-gradient(90deg, var(--color-pp-info), rgba(var(--pp-info-rgb), 0));
}
.accent--neutral {
  background: linear-gradient(90deg, var(--color-pp-border-strong), transparent);
}

.tournament-card__body {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.1rem 1.15rem 1rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.card-date {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  color: var(--color-pp-text-dim);
}

.card-title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-pp-text);
  margin-bottom: 0.35rem;
  transition: color 0.15s ease;
}

.tournament-card:hover .card-title {
  color: var(--color-pp-gold);
}

.card-structure {
  color: var(--color-pp-text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
  margin-bottom: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 0.85rem;
  border-top: 1px solid var(--color-pp-border);
}

.card-buyin {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-pp-gold);
}

.card-chevron {
  width: 1.05rem;
  height: 1.05rem;
  color: var(--color-pp-text-dim);
  transition:
    color 0.15s ease,
    transform 0.15s ease;
}

.tournament-card:hover .card-chevron {
  color: var(--color-pp-gold);
  transform: translateX(2px);
}
</style>
