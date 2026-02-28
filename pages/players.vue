<template>
  <IonPage class="page-bg">
    <IonContent class="content-bg">
      <div class="page-container">
        <!-- Page Header -->
        <div class="page-header">
          <h1 class="page-title">{{ t('players.title') }}</h1>
          <button @click="openCreateModal" class="pp-action-button pp-action-button--primary">
            <IonIcon :icon="personAddOutline" class="icon-md" />
            {{ t('players.addPlayer') }}
          </button>
        </div>

        <!-- Search/Filter Toolbar -->
        <div class="toolbar">
          <div class="toolbar-left">
            <!-- Search Input -->
            <div class="search-wrapper">
              <IonIcon :icon="searchOutline" class="search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('players.searchPlaceholder')"
                class="search-input"
              />
            </div>

            <!-- Status Filter -->
            <select v-model="statusFilter" class="status-filter">
              <option value="all">{{ t('players.allPlayers') }}</option>
              <option value="active">{{ t('players.activePlayers') }}</option>
              <option value="inactive">{{ t('players.inactivePlayers') }}</option>
            </select>
          </div>

          <div class="player-count">
            {{ filteredPlayers.length }} {{ t('players.playersFound') }}
          </div>
        </div>

        <!-- Players List Card -->
        <div class="players-card">
          <!-- Loading State -->
          <div v-if="loading" class="centered-state">
            <div class="muted-text">{{ t('status.loading') }}</div>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredPlayers.length === 0" class="centered-state">
            <IonIcon :icon="peopleOutline" class="empty-icon" />
            <h4 class="empty-title">{{ t('players.noPlayersFound') }}</h4>
            <p class="empty-text">{{ t('players.createFirstPlayer') }}</p>
            <button @click="openCreateModal" class="pp-action-button pp-action-button--primary empty-action">
              <IonIcon :icon="personAddOutline" class="icon-md" />
              {{ t('players.addPlayer') }}
            </button>
          </div>

          <!-- Column Headers (md+) -->
          <div v-if="filteredPlayers.length > 0" class="column-headers">
            <button class="sort-button" @click="toggleSort('name')">
              {{ t('labels.name') }}
              <span v-if="sortField === 'name'" class="sort-indicator">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
            </button>
            <button class="sort-button" @click="toggleSort('email')">
              {{ t('labels.email') }}
              <span v-if="sortField === 'email'" class="sort-indicator">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
            </button>
            <button class="sort-button" @click="toggleSort('status')">
              {{ t('labels.status') }}
              <span v-if="sortField === 'status'" class="sort-indicator">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
            </button>
            <div>{{ t('labels.actions') }}</div>
          </div>

          <!-- Players Table -->
          <div v-if="filteredPlayers.length > 0" class="players-list">
            <div
              v-for="(player, index) in sortedPlayers"
              :key="player.id"
              class="pp-stagger-item player-row"
              :style="{ animationDelay: `${index * 50}ms` }"
            >
              <!-- Player Name -->
              <div class="player-name-cell">
                <div class="player-avatar">
                  {{ getInitials(player) }}
                </div>
                <span class="player-name">{{ getDisplayName(player) }}</span>
              </div>

              <!-- Email -->
              <div class="player-email pp-truncate">{{ player.email }}</div>

              <!-- Status -->
              <div>
                <span :class="['status-pill', player.isActive ? 'status-active' : 'status-inactive']">
                  {{ player.isActive ? t('players.active') : t('players.inactive') }}
                </span>
              </div>

              <!-- Actions -->
              <div class="actions-cell">
                <button @click="openEditModal(player)" class="pp-action-button pp-action-button--secondary action-btn-sm">
                  <IonIcon :icon="createOutline" class="icon-sm" />
                  {{ t('common.edit') }}
                </button>
                <button
                  v-if="player.isActive"
                  @click="confirmDeactivate(player)"
                  class="pp-action-button pp-action-button--danger action-btn-sm"
                >
                  <IonIcon :icon="banOutline" class="icon-sm" />
                  {{ t('players.deactivate') }}
                </button>
                <button
                  v-else
                  @click="reactivatePlayer(player.id)"
                  class="pp-action-button pp-action-button--success action-btn-sm"
                >
                  <IonIcon :icon="checkmarkOutline" class="icon-sm" />
                  {{ t('players.reactivate') }}
                </button>
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

const clubStore = useClubStore()
const { t } = useI18n()
const toast = useToast()

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
const sortField = ref<'name' | 'email' | 'status'>('name')
const sortDirection = ref<'asc' | 'desc'>('asc')

const toggleSort = (field: 'name' | 'email' | 'status') => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

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

const sortedPlayers = computed(() => {
  const list = [...filteredPlayers.value]
  const dir = sortDirection.value === 'asc' ? 1 : -1
  list.sort((a, b) => {
    switch (sortField.value) {
      case 'name': {
        const nameA = getDisplayName(a).toLowerCase()
        const nameB = getDisplayName(b).toLowerCase()
        return nameA.localeCompare(nameB) * dir
      }
      case 'email':
        return a.email.localeCompare(b.email) * dir
      case 'status':
        return (Number(b.isActive) - Number(a.isActive)) * dir
      default:
        return 0
    }
  })
  return list
})

// Methods
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
    players.value = (result?.users?.items || []) as User[]
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
    toast.error(t('players.deactivateFailed'))
  }
}

const reactivatePlayer = async (id: string) => {
  try {
    await GqlReactivatePlayer({ id })
    await fetchPlayers()
  } catch (error) {
    console.error('Failed to reactivate player:', error)
    toast.error(t('players.reactivateFailed'))
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

/* Page Header */
.page-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
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

.icon-sm {
  width: 1rem;
  height: 1rem;
}

/* Toolbar */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .toolbar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: rgba(255, 255, 255, 0.6);
}

.search-input {
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  background-color: var(--pp-bg-primary);
  border: 1px solid var(--pp-border);
  border-radius: 0.5rem;
  color: #ffffff;
  width: 100%;
}

@media (min-width: 640px) {
  .search-input {
    width: 16rem;
  }
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--pp-accent-gold);
}

.status-filter {
  padding: 0.5rem 0.75rem;
  background-color: var(--pp-bg-primary);
  border: 1px solid var(--pp-border);
  border-radius: 0.5rem;
  color: #ffffff;
}

.player-count {
  color: rgba(255, 255, 255, 0.6);
}

/* Players Card */
.players-card {
  background-color: var(--pp-bg-secondary);
  border-radius: 1rem;
  box-shadow: var(--pp-shadow-sm);
  border: 1px solid var(--pp-border);
}

.centered-state {
  text-align: center;
  padding: 3rem 0;
}

.muted-text {
  color: rgba(255, 255, 255, 0.6);
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: rgba(255, 255, 255, 0.3);
  margin: 0 auto 1rem;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.empty-text {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.5rem;
}

.empty-action {
  margin: 0 auto;
}

/* Column Headers */
.column-headers {
  display: none;
}

@media (min-width: 768px) {
  .column-headers {
    display: grid;
    grid-template-columns: 2fr 2fr 1fr auto;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--pp-border);
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.sort-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  text-align: left;
  cursor: pointer;
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
}

.sort-indicator {
  color: var(--pp-accent-gold);
}

/* Players List */
.players-list > * + * {
  border-top: 1px solid var(--pp-border);
}

.player-row {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

@media (min-width: 768px) {
  .player-row {
    padding: 1rem;
    display: grid;
    grid-template-columns: 2fr 2fr 1fr auto;
    align-items: center;
    gap: 1rem;
  }
}

.player-row:hover {
  background-color: rgba(24, 24, 26, 0.3);
}

.player-name-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.player-avatar {
  width: 2.25rem;
  height: 2.25rem;
  background-color: rgba(254, 231, 138, 0.2);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--pp-accent-gold);
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.player-name {
  font-weight: 600;
  color: #ffffff;
  font-size: 0.875rem;
}

.player-email {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Status Pills */
.status-pill {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
}

.status-active {
  background-color: rgba(34, 197, 94, 0.2);
  color: var(--pp-green-400);
  border-color: rgba(34, 197, 94, 0.3);
}

.status-inactive {
  background-color: rgba(239, 68, 68, 0.2);
  color: var(--pp-red-400);
  border-color: rgba(239, 68, 68, 0.3);
}

/* Actions */
.actions-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn-sm {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
}
</style>
