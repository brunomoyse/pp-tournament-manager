<template>
  <IonPage class="bg-pp-bg-primary">
    <!-- Custom Header -->
    <div class="bg-pp-bg-primary border-b border-pp-border px-8 py-6">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-4">
          <img src="/assets/icon-no-bg.png" alt="Pocket Pair Logo" class="w-12 h-12" />
          <div>
            <h1 class="text-4xl font-bold text-pp-text-primary">Pocket Pair - Tournament Manager</h1>
            <p class="text-white/70 text-lg">Welcome back, {{ currentUser?.firstName || currentUser?.username || 'User' }}!</p>
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
              <h3 class="text-xl font-semibold text-pp-text-primary">Active Tournaments</h3>
              <IonIcon :icon="trophyOutline" class="w-6 h-6 text-pp-accent-gold" />
            </div>
            <div class="space-y-6">
              <div class="text-center">
                <div class="text-4xl font-bold text-pp-text-primary mb-2">{{ activeTournaments.length }}</div>
                <div class="text-white/60">Currently running</div>
              </div>
              <div v-if="activeTournaments.length > 0" class="space-y-3">
                <div class="text-sm text-white/60">Latest:</div>
                <div class="bg-pp-bg-primary/50 rounded-lg p-3 border border-pp-border">
                  <div class="font-medium text-white">{{ activeTournaments[0].name }}</div>
                  <div class="text-sm text-white/60">{{ activeTournaments[0].registrations }} players</div>
                </div>
                <button 
                  @click="goToTournament(activeTournaments[0].id)"
                  class="w-full py-3 bg-pp-accent-gold text-pp-bg-primary rounded-lg font-medium hover:bg-pp-accent-gold/90 transition-colors"
                >
                  View Tournament
                </button>
              </div>
              <div v-else class="text-center py-4">
                <IonIcon :icon="trophyOutline" class="w-8 h-8 text-white/30 mx-auto mb-2" />
                <div class="text-white/60 text-sm">No active tournaments</div>
              </div>
            </div>
          </div>

          <!-- Players Statistics Card -->
          <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-xl font-semibold text-pp-text-primary">Players</h3>
              <IonIcon :icon="peopleOutline" class="w-6 h-6 text-pp-accent-gold" />
            </div>
            <div class="space-y-6">
              <div class="text-center">
                <div class="text-4xl font-bold text-pp-text-primary mb-2">{{ totalPlayers }}</div>
                <div class="text-white/60">Total registered</div>
              </div>
              <div class="space-y-3">
                <div class="flex justify-between items-center text-sm">
                  <span class="text-white/60">Active this month</span>
                  <span class="text-pp-text-primary font-medium">{{ Math.floor(totalPlayers * 0.8) }}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span class="text-white/60">New this week</span>
                  <span class="text-pp-text-primary font-medium">{{ Math.floor(totalPlayers * 0.1) }}</span>
                </div>
              </div>
              <button 
                @click="managePlayers"
                class="w-full py-3 border border-pp-border text-white rounded-lg font-medium hover:bg-pp-border/20 transition-colors"
              >
                Manage Players
              </button>
            </div>
          </div>

          <!-- Quick Actions Card -->
          <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-xl font-semibold text-pp-text-primary">Quick Actions</h3>
              <IonIcon :icon="flashOutline" class="w-6 h-6 text-pp-accent-gold" />
            </div>
            <div class="space-y-4">
              <button 
                @click="createTournament"
                class="w-full py-4 bg-pp-accent-gold text-pp-bg-primary rounded-lg font-medium hover:bg-pp-accent-gold/90 transition-colors flex items-center justify-center gap-2"
              >
                <IonIcon :icon="addOutline" class="w-5 h-5" />
                Create Tournament
              </button>
              <button 
                @click="managePlayers"
                class="w-full py-3 border border-pp-border text-white rounded-lg font-medium hover:bg-pp-border/20 transition-colors flex items-center justify-center gap-2"
              >
                <IonIcon :icon="peopleOutline" class="w-5 h-5" />
                Manage Players
              </button>
              <button 
                @click="viewReports"
                class="w-full py-3 border border-pp-border text-white rounded-lg font-medium hover:bg-pp-border/20 transition-colors flex items-center justify-center gap-2"
              >
                <IonIcon :icon="statsChartOutline" class="w-5 h-5" />
                View Reports
              </button>
            </div>
          </div>
        </div>

        <!-- Recent Tournaments Section -->
        <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-xl font-semibold text-pp-text-primary">Recent Tournaments</h3>
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 bg-pp-border/50 text-white rounded-full text-sm font-medium">{{ recentTournaments.length }} tournaments</span>
              <button 
                @click="viewAllTournaments"
                class="px-4 py-2 border border-pp-border text-white rounded-lg font-medium hover:bg-pp-border/20 transition-colors text-sm"
              >
                View All
              </button>
            </div>
          </div>
          
          <div v-if="recentTournaments.length > 0" class="space-y-4">
            <div 
              v-for="tournament in recentTournaments" 
              :key="tournament.id"
              class="flex items-center justify-between p-6 bg-pp-bg-primary/50 rounded-xl border border-pp-border hover:bg-pp-bg-primary/70 cursor-pointer transition-all group"
              @click="goToTournament(tournament.id)"
            >
              <div class="flex items-center gap-6">
                <div class="w-16 h-16 bg-pp-bg-secondary rounded-xl flex items-center justify-center border border-pp-border group-hover:border-pp-accent-gold/30 transition-colors">
                  <IonIcon :icon="trophyOutline" class="w-8 h-8 text-pp-accent-gold" />
                </div>
                <div>
                  <h4 class="text-lg font-semibold text-pp-text-primary mb-1">{{ tournament.name }}</h4>
                  <div class="flex items-center gap-4 text-white/60 text-sm">
                    <span>{{ tournament.registrations }} players</span>
                    <span>•</span>
                    <span>{{ tournament.date }}</span>
                    <span v-if="tournament.prizePool">•</span>
                    <span v-if="tournament.prizePool" class="text-pp-accent-gold font-medium">{{ tournament.prizePool }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <span :class="[
                  'px-4 py-2 rounded-xl text-sm font-medium border',
                  tournament.status === 'completed' 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : tournament.status === 'running'
                    ? 'bg-pp-accent-gold/20 text-pp-accent-gold border-pp-accent-gold/30'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                ]">
                  {{ tournament.status }}
                </span>
                <IonIcon :icon="chevronForwardOutline" class="w-6 h-6 text-white/40 group-hover:text-pp-accent-gold transition-colors" />
              </div>
            </div>
          </div>
          
          <div v-else class="text-center py-12">
            <div class="w-20 h-20 bg-pp-bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 border border-pp-border">
              <IonIcon :icon="trophyOutline" class="w-10 h-10 text-white/30" />
            </div>
            <h4 class="text-lg font-medium text-white mb-2">No tournaments yet</h4>
            <p class="text-white/60 mb-6">Create your first tournament to get started</p>
            <button 
              @click="createTournament"
              class="px-6 py-3 bg-pp-accent-gold text-pp-bg-primary rounded-xl font-medium hover:bg-pp-accent-gold/90 transition-colors flex items-center gap-2 mx-auto"
            >
              <IonIcon :icon="addOutline" class="w-5 h-5" />
              Create Tournament
            </button>
          </div>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
// Protect this page with authentication
definePageMeta({
  middleware: 'auth'
})

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
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
import { useAuth } from '~/composables/useAuth'
import { useTournamentData } from '~/composables/useTournamentData'

const router = useRouter()
const { currentUser, logout } = useAuth()
const { tournaments } = useTournamentData()

// Tournament statistics
const activeTournaments = computed(() => 
  tournaments.value.filter(t => t.status === 'running' || t.status === 'registration')
)

const recentTournaments = computed(() => 
  [...tournaments.value]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5)
)

const totalPlayers = computed(() => 
  tournaments.value.reduce((total, tournament) => total + tournament.registrations, 0)
)

// Actions
const goToTournament = (id: string) => {
  router.push(`/tournament/${id}`)
}

const createTournament = async () => {
  const alert = await alertController.create({
    header: 'Create Tournament',
    message: 'Tournament creation feature coming soon!',
    buttons: ['OK']
  })
  await alert.present()
}

const managePlayers = async () => {
  const alert = await alertController.create({
    header: 'Player Management',
    message: 'Player management feature coming soon!',
    buttons: ['OK']
  })
  await alert.present()
}

const viewReports = async () => {
  const alert = await alertController.create({
    header: 'Reports',
    message: 'Tournament reports feature coming soon!',
    buttons: ['OK']
  })
  await alert.present()
}

const viewAllTournaments = async () => {
  const alert = await alertController.create({
    header: 'All Tournaments',
    message: 'Tournament archive feature coming soon!',
    buttons: ['OK']
  })
  await alert.present()
}

const handleLogout = async () => {
  const alert = await alertController.create({
    header: 'Logout',
    message: 'Are you sure you want to logout?',
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Logout',
        role: 'confirm',
        handler: async () => {
          await logout()
          router.replace('/login')
        }
      }
    ]
  })
  
  await alert.present()
}
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