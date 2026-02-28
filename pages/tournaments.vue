<template>
  <IonPage class="page-bg">
    <IonContent class="content-bg">
      <div class="page-container">
        <!-- Page Header -->
        <div class="page-header">
          <h1 class="page-title">{{ t('tournaments.title') }}</h1>
          <button
            @click="createTournament"
            class="pp-action-button pp-action-button--primary"
          >
            <IonIcon :icon="addOutline" class="icon-md" />
            {{ t('buttons.createTournament') }}
          </button>
        </div>

        <!-- Search and Filter Bar -->
        <div class="filter-bar">
          <!-- Search Input -->
          <div class="search-wrapper">
            <IonIcon :icon="searchOutline" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('tournaments.search')"
              class="search-input"
            />
          </div>

          <!-- Status Filter -->
          <select
            v-model="statusFilter"
            class="status-filter"
          >
            <option value="">{{ t('tournaments.all') }}</option>
            <option value="UPCOMING">{{ t('tournaments.upcoming') }}</option>
            <option value="IN_PROGRESS">{{ t('tournaments.inProgress') }}</option>
            <option value="COMPLETED">{{ t('tournaments.completed') }}</option>
          </select>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <IonSpinner name="crescent" class="spinner" />
        </div>

        <!-- Tournaments Card Grid -->
        <div v-else-if="filteredTournaments.length > 0" class="tournaments-grid">
          <div
            v-for="(tournament, index) in filteredTournaments"
            :key="tournament.id"
            class="pp-stagger-item pp-card-interactive pp-shimmer-hover tournament-card"
            :style="{ animationDelay: `${index * 50}ms` }"
            @click="goToTournament(tournament.id)"
          >
            <!-- Header: status badge + date -->
            <div class="card-header">
              <span :class="['pp-status-badge', getTournamentStatusClass(tournament.status)]">
                {{ getTournamentStatusLabel(tournament.status, t) }}
              </span>
              <span class="card-date">{{ formatDate(tournament.startTime) }}</span>
            </div>

            <!-- Title -->
            <h4 class="card-title">{{ tournament.title }}</h4>

            <!-- Description snippet -->
            <p v-if="tournament.description" class="card-description pp-line-clamp-2">{{ tournament.description }}</p>

            <!-- Footer: buy-in + seats -->
            <div class="card-footer">
              <span class="card-buyin">{{ formatPrice(tournament.buyInCents, locale) }}</span>
              <span v-if="tournament.seatCap" class="card-seats">{{ tournament.seatCap }} {{ t('tournaments.seats') }}</span>
              <IonIcon :icon="chevronForwardOutline" class="card-chevron" />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-icon-wrapper">
            <IonIcon :icon="trophyOutline" class="empty-icon" />
          </div>
          <h4 class="empty-title">{{ t('tournaments.noTournaments') }}</h4>
          <p class="empty-text">
            {{ searchQuery || statusFilter ? t('tournaments.tryDifferentFilter') : t('tournaments.createFirst') }}
          </p>
        </div>
      </div>
    </IonContent>

    <!-- Tournament Form Modal -->
    <TournamentFormModal
      :isOpen="showTournamentModal"
      :tournament="null"
      mode="create"
      @close="showTournamentModal = false"
      @saved="onTournamentSaved"
    />
  </IonPage>
</template>

<script setup lang="ts">
import type { GetTournamentsQuery } from '#gql'
import type { TournamentStatus } from '~/types/tournament'

definePageMeta({
  middleware: 'auth'
})

import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner
} from '@ionic/vue'
import {
  searchOutline,
  trophyOutline,
  chevronForwardOutline,
  addOutline
} from 'ionicons/icons'
import TournamentFormModal from '~/components/tournament/TournamentFormModal.vue'
import { useI18n } from '~/composables/useI18n'
import { formatPrice } from '~/utils'
import { getTournamentStatusLabel, getTournamentStatusClass } from '~/utils/tournamentStatus'

const router = useRouter()
const clubStore = useClubStore()
const { t, locale } = useI18n()

const { club } = clubStore

// State
const loading = ref(true)
const tournaments = ref<GetTournamentsQuery['tournaments']['items']>([])
const searchQuery = ref('')
const statusFilter = ref<TournamentStatus | ''>('')
const showTournamentModal = ref(false)

// Filtered and sorted tournaments
const filteredTournaments = computed(() => {
  let result = [...tournaments.value]

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(t =>
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    )
  }

  // Filter by status
  if (statusFilter.value) {
    result = result.filter(t => t.status === statusFilter.value)
  }

  // Sort by start time (most recent first)
  result.sort((a, b) =>
    new Date(b.startTime || '').getTime() - new Date(a.startTime || '').getTime()
  )

  return result
})

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(locale.value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

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

// Fetch tournaments
const fetchTournaments = async () => {
  if (!club) return

  loading.value = true
  try {
    const { tournaments: result } = await GqlGetTournaments({
      clubId: club.id
    })
    tournaments.value = result?.items || []
  } catch (error) {
    console.error('Failed to fetch tournaments:', error)
    tournaments.value = []
  } finally {
    loading.value = false
  }
}

// Initial fetch
onMounted(() => {
  fetchTournaments()
})
</script>

<style scoped>
.page-bg {
  background-color: var(--pp-bg-primary);
}

.content-bg {
  background-color: var(--pp-bg-primary);
}

.page-container {
  padding: 1.5rem 1rem;
}

@media (min-width: 640px) {
  .page-container {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .page-container {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.875rem;
  line-height: 2.25rem;
  font-weight: 700;
  color: var(--pp-text-primary);
}

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .filter-bar {
    flex-direction: row;
  }
}

.search-wrapper {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: rgba(255, 255, 255, 0.4);
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  background-color: var(--pp-bg-secondary);
  border: 1px solid var(--pp-border);
  border-radius: 0.5rem;
  color: #ffffff;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--pp-accent-gold);
  border-color: var(--pp-accent-gold);
}

.status-filter {
  padding: 0.75rem 1rem;
  background-color: var(--pp-bg-secondary);
  border: 1px solid var(--pp-border);
  border-radius: 0.5rem;
  color: #ffffff;
  min-width: 160px;
}

.status-filter:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--pp-accent-gold);
  border-color: var(--pp-accent-gold);
}

select option {
  background-color: var(--pp-bg-secondary);
  color: white;
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
  color: var(--pp-accent-gold);
}

/* Tournaments Grid */
.tournaments-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .tournaments-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.tournament-card {
  background-color: var(--pp-bg-secondary);
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--pp-border);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.card-date {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--pp-text-primary);
  margin-bottom: 0.25rem;
  transition: color 0.2s ease;
}

.tournament-card:hover .card-title {
  color: var(--pp-accent-gold);
}

.card-description {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(84, 84, 95, 0.3);
}

.card-buyin {
  color: var(--pp-accent-gold);
  font-weight: 600;
}

.card-seats {
  color: rgba(255, 255, 255, 0.4);
}

.card-chevron {
  width: 1rem;
  height: 1rem;
  color: rgba(255, 255, 255, 0.3);
  transition: color 0.2s ease;
}

.tournament-card:hover .card-chevron {
  color: var(--pp-accent-gold);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 5rem 0;
}

.empty-icon-wrapper {
  width: 5rem;
  height: 5rem;
  background-color: var(--pp-bg-secondary);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  border: 1px solid var(--pp-border);
}

.empty-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: rgba(255, 255, 255, 0.3);
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.empty-text {
  color: rgba(255, 255, 255, 0.6);
}
</style>
