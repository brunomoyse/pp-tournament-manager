<template>
  <IonPage class="pp-page">
    <IonHeader :translucent="true" class="pp-header">
      <IonToolbar class="pp-toolbar">
        <IonTitle class="pp-title">PocketPair Tournament Manager</IonTitle>
        <IonButtons slot="end">
          <IonButton @click="handleLogout" fill="clear">
            <IonIcon :icon="logOutOutline" slot="icon-only" />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent :fullscreen="true" class="pp-content">
      <div class="px-8 py-6">
        <!-- Welcome Section -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-pp-text-primary mb-2">
            Welcome back, {{ currentUser?.firstName || currentUser?.username || 'User' }}!
          </h1>
          <p class="text-white/70">Manage your poker tournaments with ease</p>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <!-- Active Tournaments -->
          <div class="bg-pp-bg-secondary rounded-2xl p-6 shadow-sm border border-pp-border">
            <div class="flex items-center gap-3 mb-4">
              <IonIcon :icon="trophyOutline" class="w-6 h-6 text-pp-accent-gold" />
              <h3 class="text-xl font-semibold text-pp-text-primary">Active Tournaments</h3>
            </div>
            <p class="text-3xl font-bold text-pp-text-primary mb-2">{{ activeTournaments.length }}</p>
            <p class="text-white/60">Currently running</p>
            <IonButton 
              v-if="activeTournaments.length > 0"
              fill="clear" 
              size="small" 
              class="mt-4"
              @click="goToTournament(activeTournaments[0].id)"
            >
              View Latest
            </IonButton>
          </div>

          <!-- Create Tournament -->
          <div class="bg-pp-bg-secondary rounded-2xl p-6 shadow-sm border border-pp-border">
            <div class="flex items-center gap-3 mb-4">
              <IonIcon :icon="addOutline" class="w-6 h-6 text-pp-accent-gold" />
              <h3 class="text-xl font-semibold text-pp-text-primary">New Tournament</h3>
            </div>
            <p class="text-white/60 mb-4">Start a new poker tournament</p>
            <IonButton 
              expand="block"
              class="bg-pp-accent-gold text-pp-bg-primary"
              @click="createTournament"
            >
              Create Tournament
            </IonButton>
          </div>

          <!-- Players Management -->
          <div class="bg-pp-bg-secondary rounded-2xl p-6 shadow-sm border border-pp-border">
            <div class="flex items-center gap-3 mb-4">
              <IonIcon :icon="peopleOutline" class="w-6 h-6 text-pp-accent-gold" />
              <h3 class="text-xl font-semibold text-pp-text-primary">Players</h3>
            </div>
            <p class="text-3xl font-bold text-pp-text-primary mb-2">{{ totalPlayers }}</p>
            <p class="text-white/60">Registered players</p>
            <IonButton fill="clear" size="small" class="mt-4" @click="managePlayers">
              Manage
            </IonButton>
          </div>
        </div>

        <!-- Recent Tournaments -->
        <div class="bg-pp-bg-secondary rounded-2xl p-6 shadow-sm border border-pp-border">
          <h3 class="text-xl font-semibold text-pp-text-primary mb-6">Recent Tournaments</h3>
          <div class="space-y-4">
            <div 
              v-for="tournament in recentTournaments" 
              :key="tournament.id"
              class="flex items-center justify-between p-4 bg-pp-bg-primary/50 rounded-lg border border-pp-border hover:bg-pp-text-primary/10 cursor-pointer transition-colors"
              @click="goToTournament(tournament.id)"
            >
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-pp-text-secondary rounded-lg flex items-center justify-center">
                  <IonIcon :icon="trophyOutline" class="w-6 h-6 text-pp-accent-gold" />
                </div>
                <div>
                  <h4 class="font-semibold text-pp-text-primary">{{ tournament.name }}</h4>
                  <p class="text-white/60 text-sm">{{ tournament.registrations }} players • {{ tournament.date }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span :class="[
                  'px-3 py-1 rounded-full text-sm font-medium',
                  tournament.status === 'completed' 
                    ? 'bg-green-500/20 text-green-400'
                    : tournament.status === 'running'
                    ? 'bg-pp-accent-gold/20 text-pp-accent-gold'
                    : 'bg-blue-500/20 text-blue-400'
                ]">
                  {{ tournament.status }}
                </span>
                <IonIcon :icon="chevronForwardOutline" class="w-5 h-5 text-white/40" />
              </div>
            </div>
          </div>
          
          <div v-if="recentTournaments.length === 0" class="text-center py-8">
            <IonIcon :icon="trophyOutline" class="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p class="text-white/60">No tournaments yet</p>
            <IonButton fill="clear" size="small" @click="createTournament">
              Create your first tournament
            </IonButton>
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
  chevronForwardOutline
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
.pp-page {
  background: linear-gradient(135deg, #18181a 0%, #1a1a1e 100%);
}

.pp-header {
  --background: rgba(24, 24, 26, 0.95);
  backdrop-filter: blur(10px);
}

.pp-toolbar {
  --background: transparent;
  --border-color: #24242a;
  border-bottom: 1px solid #24242a;
}

.pp-title {
  color: #fee78a;
  font-weight: 700;
}

.pp-content {
  --background: transparent;
}
</style>