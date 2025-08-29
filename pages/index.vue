<template>
  <IonPage class="bg-pp-bg-primary">
    <!-- Custom Header -->
    <div class="bg-pp-bg-primary border-b border-pp-border px-8 py-6">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-4">
          <img src="/assets/icon-no-bg.png" alt="Pocket Pair Logo" class="w-12 h-12" />
          <div>
            <h1 class="text-4xl font-bold text-pp-text-primary">{{ t('app.title') }}</h1>
            <p class="text-white/70 text-lg">{{ t('messages.welcomeBack', { name: currentUser?.firstName || currentUser?.username || t('common.user') }) }}</p>
          </div>
        </div>
        <IonButton @click="handleLogout" fill="clear" class="text-white hover:text-pp-accent-gold">
          <IonIcon :icon="logOutOutline" slot="icon-only" class="w-6 h-6" />
        </IonButton>
      </div>
    </div>

    <IonContent class="bg-pp-bg-primary">
      <div class="px-8 py-6">
        <!-- Dashboard Statistics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <!-- Active Tournaments Card -->
          <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-xl font-semibold text-pp-text-primary">{{ t('headings.activeTournaments') }}</h3>
              <IonIcon :icon="trophyOutline" class="w-6 h-6 text-pp-accent-gold" />
            </div>
            <div class="space-y-6">
              <div class="text-center">
                <div class="text-4xl font-bold text-pp-text-primary mb-2">{{ activeTournaments.length }}</div>
                <div class="text-white/60">{{ t('status.currentlyRunning') }}</div>
              </div>
              <div v-if="activeTournaments.length > 0" class="space-y-3">
                <div class="text-sm text-white/60">{{ t('labels.latest') }}</div>
                <div class="bg-pp-bg-primary/50 rounded-lg p-3 border border-pp-border">
                  <div class="font-medium text-white">{{ activeTournaments?.[0]?.title }}</div>
                  <div class="text-sm text-white/60">{{ t('labels.buyIn') }}: {{ formatPrice(activeTournaments[0]?.buyInCents) }}</div>
                </div>
                <button 
                  @click="activeTournaments[0]?.id && goToTournament(activeTournaments[0].id)"
                  class="w-full pp-action-button pp-action-button--primary justify-center"
                >
                  {{ t('buttons.viewTournament') }}
                </button>
              </div>
              <div v-else class="text-center py-4">
                <IonIcon :icon="trophyOutline" class="w-8 h-8 text-white/30 mx-auto mb-2" />
                <div class="text-white/60 text-sm">{{ t('messages.noActiveTournaments') }}</div>
              </div>
            </div>
          </div>

          <!-- Players Statistics Card -->
          <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-xl font-semibold text-pp-text-primary">{{ t('headings.players') }}</h3>
              <IonIcon :icon="peopleOutline" class="w-6 h-6 text-pp-accent-gold" />
            </div>
            <div class="space-y-6">
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <span class="text-white/70">Unique Players</span>
                  <span class="text-pp-text-primary font-semibold">92</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-white/70">This Week</span>
                  <span class="text-pp-text-primary font-semibold">38</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-white/70">Avg Buy-in</span>
                  <span class="text-pp-text-primary font-semibold">25€</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-white/70">Regular Players</span>
                  <span class="text-pp-text-primary font-semibold">67</span>
                </div>
              </div>
              <button 
                @click="managePlayers"
                class="w-full pp-action-button pp-action-button--secondary justify-center"
              >
                Manage Players
              </button>
            </div>
          </div>

          <!-- Quick Actions Card -->
          <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-xl font-semibold text-pp-text-primary">{{ t('headings.quickActions') }}</h3>
              <IonIcon :icon="flashOutline" class="w-6 h-6 text-pp-accent-gold" />
            </div>
            <div class="space-y-4">
              <button 
                @click="createTournament"
                class="w-full pp-action-button pp-action-button--primary justify-center"
              >
                <IonIcon :icon="addOutline" class="w-5 h-5" />
                {{ t('buttons.createTournament') }}
              </button>
              <button 
                @click="managePlayers"
                class="w-full pp-action-button pp-action-button--secondary justify-center"
              >
                <IonIcon :icon="peopleOutline" class="w-5 h-5" />
                {{ t('buttons.managePlayers') }}
              </button>
              <button 
                @click="viewReports"
                class="w-full pp-action-button pp-action-button--secondary justify-center"
              >
                <IonIcon :icon="statsChartOutline" class="w-5 h-5" />
                {{ t('buttons.viewReports') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Recent Tournaments Section -->
        <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-xl font-semibold text-pp-text-primary">{{ t('headings.recentTournaments') }}</h3>
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 bg-pp-border/50 text-white rounded-full text-sm font-medium">{{ recentTournaments.length }} {{ t('labels.tournaments') }}</span>
              <button 
                @click="viewAllTournaments"
                class="px-4 py-2 border border-pp-border text-white rounded-lg font-medium hover:bg-pp-border/20 transition-colors text-sm"
              >
                {{ t('buttons.viewAll') }}
              </button>
            </div>
          </div>
          
          <div v-if="recentTournaments.length > 0" class="space-y-2">
            <div 
              v-for="tournament in recentTournaments" 
              :key="tournament.id"
              class="flex items-center justify-between p-4 bg-pp-bg-primary/50 rounded-lg border border-pp-border hover:bg-pp-bg-primary/70 cursor-pointer transition-all group"
              @click="goToTournament(tournament.id)"
            >
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-pp-bg-secondary rounded-lg flex items-center justify-center border border-pp-border group-hover:border-pp-accent-gold/30 transition-colors">
                  <IonIcon :icon="trophyOutline" class="w-6 h-6 text-pp-accent-gold" />
                </div>
                <div>
                  <h4 class="text-base font-semibold text-pp-text-primary mb-1">{{ tournament.title }}</h4>
                  <div class="flex items-center gap-3 text-white/60 text-sm">
                    <span>{{ (tournament.buyInCents / 100).toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' }) }}</span>
                    <span>•</span>
                    <span>{{ new Date(tournament.startTime).toLocaleDateString('fr-BE') }}</span>
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
          
          <div v-else class="text-center py-12">
            <div class="w-20 h-20 bg-pp-bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 border border-pp-border">
              <IonIcon :icon="trophyOutline" class="w-10 h-10 text-white/30" />
            </div>
            <h4 class="text-lg font-medium text-white mb-2">{{ t('messages.noTournamentsYet') }}</h4>
            <p class="text-white/60 mb-6">{{ t('messages.createFirstTournament') }}</p>
            <button 
              @click="createTournament"
              class="pp-action-button pp-action-button--primary mx-auto"
            >
              <IonIcon :icon="addOutline" class="w-5 h-5" />
              {{ t('buttons.createTournament') }}
            </button>
          </div>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
// Protect this page with authentication
import type {GetTournamentsQuery} from "#gql";

definePageMeta({
  middleware: 'auth'
})

import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  alertController
} from '@ionic/vue'
import {
  trophyOutline,
  peopleOutline,
  addOutline,
  logOutOutline,
  chevronForwardOutline,
  flashOutline,
  statsChartOutline
} from 'ionicons/icons'
import { useAuthStore } from '~/stores/useAuthStore'
import {formatPrice} from "~/utils";
import { useI18n } from '~/composables/useI18n';
import { getTournamentStatusLabel, getTournamentStatusClass } from '~/utils/tournamentStatus'

const router = useRouter()
const authStore = useAuthStore()
const clubStore = useClubStore()
const { t } = useI18n()

const { currentUser } = authStore
const { club } = clubStore

const tournaments = ref<GetTournamentsQuery['tournaments']>([])

// Tournament statistics
const activeTournaments = computed(() => 
  tournaments.value.filter(t => t.status === 'IN_PROGRESS')
)

const recentTournaments = computed(() => 
  [...tournaments.value]
    .sort((a, b) => new Date(b.startTime || '').getTime() - new Date(a.startTime || '').getTime())
    .slice(0, 5)
)

// Actions
const goToTournament = (id: string) => {
  router.push(`/tournament/${id}`)
}

const createTournament = async () => {
  const alert = await alertController.create({
    header: t('alerts.createTournament.header'),
    message: t('alerts.createTournament.message'),
    buttons: [t('common.ok')]
  })
  await alert.present()
}

const managePlayers = async () => {
  const alert = await alertController.create({
    header: t('alerts.playerManagement.header'),
    message: t('alerts.playerManagement.message'),
    buttons: [t('common.ok')]
  })
  await alert.present()
}

const viewReports = async () => {
  const alert = await alertController.create({
    header: t('alerts.reports.header'),
    message: t('alerts.reports.message'),
    buttons: [t('common.ok')]
  })
  await alert.present()
}

const viewAllTournaments = async () => {
  const alert = await alertController.create({
    header: t('alerts.allTournaments.header'),
    message: t('alerts.allTournaments.message'),
    buttons: [t('common.ok')]
  })
  await alert.present()
}

const handleLogout = async () => {
    //
}

onMounted(async () => {
    if (!club) {
        const alert = await alertController.create({
            header: t('alerts.noClub.header'),
            message: t('alerts.noClub.message'),
            buttons: [t('common.ok')]
        })
        await alert.present()
        return
    }

    const res = await GqlGetTournaments({ clubId: club.id})
    tournaments.value = res.tournaments || []

})

</script>

<style scoped>
/* Match the tournament page styling */
ion-page {
  --background: #18181a !important;
  background-color: #18181a !important;
}

ion-content {
  --background: #18181a !important;
  background-color: #18181a !important;
}

/* Custom button hover effects to match the app */
button:hover {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

/* Ensure consistent card styling */
.bg-pp-bg-secondary {
  background-color: #24242a !important;
}

/* Match the sophisticated spacing and typography from tournament page */
h1, h3, h4 {
  letter-spacing: -0.025em;
}

/* Smooth transitions for all interactive elements */
button, .group {
  transition: all 0.2s ease;
}
</style>