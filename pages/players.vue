<template>
  <IonPage class="bg-pp-bg-primary">
    <!-- Custom Header -->
    <div class="bg-pp-bg-primary border-b border-pp-border px-8 py-6">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-4 cursor-pointer" @click="goHome">
          <img src="/assets/icon-no-bg.png" alt="Pocket Pair Logo" class="w-12 h-12" />
          <div>
            <h1 class="text-4xl font-bold text-pp-text-primary">{{ t('players.title') }}</h1>
            <p class="text-white/70 text-lg">{{ club?.name }}</p>
          </div>
        </div>
        <button @click="openCreateModal" class="pp-action-button pp-action-button--primary">
          <IonIcon :icon="personAddOutline" class="w-5 h-5" />
          {{ t('players.addPlayer') }}
        </button>
      </div>
    </div>

    <IonContent class="bg-pp-bg-primary">
      <div class="px-8 py-6">
        <!-- Search/Filter Toolbar -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-4">
            <!-- Search Input -->
            <div class="relative">
              <IonIcon :icon="searchOutline" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('players.searchPlaceholder')"
                class="pl-10 pr-4 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold w-64"
              />
            </div>

            <!-- Status Filter -->
            <select v-model="statusFilter" class="px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white">
              <option value="all">{{ t('players.allPlayers') }}</option>
              <option value="active">{{ t('players.activePlayers') }}</option>
              <option value="inactive">{{ t('players.inactivePlayers') }}</option>
            </select>
          </div>

          <div class="text-white/60">
            {{ filteredPlayers.length }} {{ t('players.playersFound') }}
          </div>
        </div>

        <!-- Players List Card -->
        <div class="bg-pp-bg-secondary rounded-2xl shadow-sm border border-pp-border" style="background-color: #24242a !important;">
          <!-- Loading State -->
          <div v-if="loading" class="text-center py-12">
            <div class="text-white/60">{{ t('status.loading') }}</div>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredPlayers.length === 0" class="text-center py-12">
            <IonIcon :icon="peopleOutline" class="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h4 class="text-lg font-medium text-white mb-2">{{ t('players.noPlayersFound') }}</h4>
            <p class="text-white/60 mb-6">{{ t('players.createFirstPlayer') }}</p>
            <button @click="openCreateModal" class="pp-action-button pp-action-button--primary mx-auto">
              <IonIcon :icon="personAddOutline" class="w-5 h-5" />
              {{ t('players.addPlayer') }}
            </button>
          </div>

          <!-- Players Table -->
          <div v-else class="divide-y divide-pp-border">
            <div
              v-for="player in filteredPlayers"
              :key="player.id"
              class="p-4 flex items-center justify-between hover:bg-pp-bg-primary/30 transition-colors"
            >
              <!-- Player Info -->
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-pp-accent-gold/20 rounded-full flex items-center justify-center text-pp-accent-gold font-bold">
                  {{ getInitials(player) }}
                </div>
                <div>
                  <h3 class="font-semibold text-white">{{ getDisplayName(player) }}</h3>
                  <div class="text-sm text-white/60">{{ player.email }}</div>
                </div>
              </div>

              <!-- Status & Actions -->
              <div class="flex items-center gap-4">
                <span :class="[
                  'px-3 py-1 rounded-full text-xs font-medium border',
                  player.isActive
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                ]">
                  {{ player.isActive ? t('players.active') : t('players.inactive') }}
                </span>

                <div class="flex items-center gap-2">
                  <button @click="openEditModal(player)" class="pp-action-button pp-action-button--secondary text-xs px-3 py-1">
                    <IonIcon :icon="createOutline" class="w-4 h-4" />
                    {{ t('common.edit') }}
                  </button>
                  <button
                    v-if="player.isActive"
                    @click="confirmDeactivate(player)"
                    class="pp-action-button pp-action-button--danger text-xs px-3 py-1"
                  >
                    <IonIcon :icon="banOutline" class="w-4 h-4" />
                    {{ t('players.deactivate') }}
                  </button>
                  <button
                    v-else
                    @click="reactivatePlayer(player.id)"
                    class="pp-action-button pp-action-button--success text-xs px-3 py-1"
                  >
                    <IonIcon :icon="checkmarkOutline" class="w-4 h-4" />
                    {{ t('players.reactivate') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </IonContent>

    <!-- Create/Edit Player Modal -->
    <PlayersPlayerFormModal
      :is-open="showFormModal"
      :player="selectedPlayer"
      :mode="formMode"
      @close="closeFormModal"
      @saved="handlePlayerSaved"
    />

    <!-- Delete Confirmation Modal -->
    <PlayersPlayerDeleteModal
      :is-open="showDeleteModal"
      :player="playerToDelete"
      @close="closeDeleteModal"
      @confirmed="handleDeleteConfirmed"
    />
  </IonPage>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

import {
  IonPage,
  IonContent,
  IonIcon
} from '@ionic/vue'
import {
  personAddOutline,
  searchOutline,
  peopleOutline,
  createOutline,
  banOutline,
  checkmarkOutline
} from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import type { User } from '~/types/user'

const router = useRouter()
const clubStore = useClubStore()
const { t } = useI18n()

const club = computed(() => clubStore.club)

// State
const loading = ref(true)
const players = ref<User[]>([])
const searchQuery = ref('')
const statusFilter = ref('all')
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const selectedPlayer = ref<User | null>(null)
const playerToDelete = ref<User | null>(null)
const formMode = ref<'create' | 'edit'>('create')

// Computed
const filteredPlayers = computed(() => {
  return players.value.filter(player => {
    const searchLower = searchQuery.value.toLowerCase()
    const matchesSearch =
      player.firstName.toLowerCase().includes(searchLower) ||
      (player.lastName?.toLowerCase().includes(searchLower)) ||
      player.email.toLowerCase().includes(searchLower) ||
      (player.username?.toLowerCase().includes(searchLower))

    const matchesStatus =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'active' && player.isActive) ||
      (statusFilter.value === 'inactive' && !player.isActive)

    return matchesSearch && matchesStatus
  })
})

// Methods
const goHome = () => router.push('/')

const getInitials = (player: User) => {
  const first = player.firstName?.charAt(0)?.toUpperCase() || ''
  const last = player.lastName?.charAt(0)?.toUpperCase() || ''
  return `${first}${last}` || '?'
}

const getDisplayName = (player: User) => {
  if (player.firstName && player.lastName) return `${player.firstName} ${player.lastName}`
  if (player.firstName) return player.firstName
  return player.username || player.email
}

const fetchPlayers = async () => {
  if (!club.value) return
  try {
    loading.value = true
    const result = await GqlGetUsers({
      search: searchQuery.value || undefined,
      isActive: statusFilter.value === 'all' ? undefined : statusFilter.value === 'active'
    })
    players.value = (result?.users || []) as User[]
  } catch (error) {
    console.error('Failed to fetch players:', error)
  } finally {
    loading.value = false
  }
}

// Modal handlers
const openCreateModal = () => {
  selectedPlayer.value = null
  formMode.value = 'create'
  showFormModal.value = true
}

const openEditModal = (player: User) => {
  selectedPlayer.value = player
  formMode.value = 'edit'
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  selectedPlayer.value = null
}

const handlePlayerSaved = async () => {
  closeFormModal()
  await fetchPlayers()
}

const confirmDeactivate = (player: User) => {
  playerToDelete.value = player
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  playerToDelete.value = null
}

const handleDeleteConfirmed = async () => {
  if (!playerToDelete.value) return
  try {
    await GqlDeactivatePlayer({ id: playerToDelete.value.id })
    closeDeleteModal()
    await fetchPlayers()
  } catch (error) {
    console.error('Failed to deactivate player:', error)
    alert(t('players.deactivateFailed'))
  }
}

const reactivatePlayer = async (id: string) => {
  try {
    await GqlReactivatePlayer({ id })
    await fetchPlayers()
  } catch (error) {
    console.error('Failed to reactivate player:', error)
    alert(t('players.reactivateFailed'))
  }
}

// Lifecycle
onMounted(fetchPlayers)

// Watch search query with debounce
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(fetchPlayers, 300)
})
watch(statusFilter, fetchPlayers)
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
</style>
