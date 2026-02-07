<template>
  <IonPage class="bg-pp-bg-primary">
    <!-- Custom Header -->
    <div class="bg-pp-bg-primary border-b border-pp-border px-8 py-6">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-4">
          <button @click="goBack" class="p-2 text-white/60 hover:text-white rounded-lg hover:bg-pp-bg-secondary transition-colors">
            <IonIcon :icon="arrowBackOutline" class="w-6 h-6" />
          </button>
          <div>
            <h1 class="text-3xl font-bold text-pp-text-primary">{{ t('tournaments.title') }}</h1>
            <p class="text-white/70">{{ club?.name }}</p>
          </div>
        </div>
      </div>
    </div>

    <IonContent class="bg-pp-bg-primary">
      <div class="px-8 py-6">
        <!-- Search and Filter Bar -->
        <div class="flex flex-col md:flex-row gap-4 mb-6">
          <!-- Search Input -->
          <div class="relative flex-1">
            <IonIcon :icon="searchOutline" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('tournaments.search')"
              class="w-full pl-10 pr-4 py-3 bg-pp-bg-secondary border border-pp-border rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
            />
          </div>

          <!-- Status Filter -->
          <select
            v-model="statusFilter"
            class="px-4 py-3 bg-pp-bg-secondary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold min-w-[160px]"
          >
            <option value="">{{ t('tournaments.all') }}</option>
            <option value="UPCOMING">{{ t('tournaments.upcoming') }}</option>
            <option value="IN_PROGRESS">{{ t('tournaments.inProgress') }}</option>
            <option value="COMPLETED">{{ t('tournaments.completed') }}</option>
          </select>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-20">
          <IonSpinner name="crescent" class="w-8 h-8 text-pp-accent-gold" />
        </div>

        <!-- Tournaments List -->
        <div v-else-if="filteredTournaments.length > 0" class="space-y-2">
          <div
            v-for="tournament in filteredTournaments"
            :key="tournament.id"
            class="flex items-center justify-between p-4 bg-pp-bg-secondary rounded-lg border border-pp-border hover:bg-pp-bg-primary/70 cursor-pointer transition-all group"
            @click="goToTournament(tournament.id)"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-pp-bg-primary rounded-lg flex items-center justify-center border border-pp-border group-hover:border-pp-accent-gold/30 transition-colors">
                <IonIcon :icon="trophyOutline" class="w-6 h-6 text-pp-accent-gold" />
              </div>
              <div>
                <h4 class="text-base font-semibold text-pp-text-primary mb-1">{{ tournament.title }}</h4>
                <div class="flex items-center gap-3 text-white/60 text-sm">
                  <span>{{ formatPrice(tournament.buyInCents, locale) }}</span>
                  <span>•</span>
                  <span>{{ formatDate(tournament.startTime) }}</span>
                  <span v-if="tournament.seatCap">•</span>
                  <span v-if="tournament.seatCap">{{ tournament.seatCap }} {{ t('tournaments.seats') }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span :class="[
                'px-3 py-1 rounded-lg text-xs font-medium border',
                getTournamentStatusClass(tournament.status)
              ]">
                {{ getTournamentStatusLabel(tournament.status) }}
              </span>
              <IonIcon :icon="chevronForwardOutline" class="w-5 h-5 text-white/40 group-hover:text-pp-accent-gold transition-colors" />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-20">
          <div class="w-20 h-20 bg-pp-bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 border border-pp-border">
            <IonIcon :icon="trophyOutline" class="w-10 h-10 text-white/30" />
          </div>
          <h4 class="text-lg font-medium text-white mb-2">{{ t('tournaments.noTournaments') }}</h4>
          <p class="text-white/60">
            {{ searchQuery || statusFilter ? t('tournaments.tryDifferentFilter') : t('tournaments.createFirst') }}
          </p>
        </div>
      </div>
    </IonContent>
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
  arrowBackOutline,
  searchOutline,
  trophyOutline,
  chevronForwardOutline
} from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { formatPrice } from '~/utils'
import { getTournamentStatusLabel, getTournamentStatusClass } from '~/utils/tournamentStatus'

const router = useRouter()
const clubStore = useClubStore()
const { t, locale } = useI18n()

const { club } = clubStore

// State
const loading = ref(true)
const tournaments = ref<GetTournamentsQuery['tournaments']>([])
const searchQuery = ref('')
const statusFilter = ref<TournamentStatus | ''>('')

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

const goBack = () => {
  router.push('/')
}

const goToTournament = (id: string) => {
  router.push(`/tournament/${id}`)
}

// Fetch tournaments
const fetchTournaments = async () => {
  if (!club) return

  loading.value = true
  try {
    const { tournaments: result } = await GqlGetTournaments({
      clubId: club.id
    })
    tournaments.value = result || []
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
ion-page {
  --background: #18181a !important;
  background-color: #18181a !important;
}

ion-content {
  --background: #18181a !important;
  background-color: #18181a !important;
}

.bg-pp-bg-secondary {
  background-color: #24242a !important;
}

select option {
  background-color: #24242a;
  color: white;
}
</style>
