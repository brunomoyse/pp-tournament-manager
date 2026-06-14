<template>
  <IonPage class="page-bg">
    <IonContent class="content-bg">
      <div class="page-container">
        <div class="page-header">
          <PpFadeUp>
            <p class="eyebrow">{{ t('nav.players') }}</p>
            <h1 class="page-title">{{ t('players.title') }}</h1>
          </PpFadeUp>
          <PpFadeUp :delay="0.08" data-tour="add-players" class="header-actions">
            <PpButton
              variant="ghost"
              :disabled="filteredPlayers.length === 0"
              @click="exportRosterCsv"
            >
              <IonIcon :icon="downloadOutline" class="icon-md" />
              {{ t('exports.button') }}
            </PpButton>
            <PpButton variant="secondary" @click="openImportModal">
              <IonIcon :icon="cloudUploadOutline" class="icon-md" />
              {{ t('players.import.button') }}
            </PpButton>
            <PpButton magnetic @click="openCreateModal">
              <IonIcon :icon="addOutline" class="icon-md" />
              {{ t('players.addPlayer') }}
            </PpButton>
          </PpFadeUp>
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

            <!-- Type Filter -->
            <select v-model="typeFilter" class="status-filter">
              <option value="all">{{ t('players.allPlayers') }}</option>
              <option value="app">{{ t('players.appUsers') }}</option>
              <option value="roster">{{ t('players.rosterOnly') }}</option>
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
            <PpButton class="empty-action" @click="openCreateModal">
              <IonIcon :icon="addOutline" class="icon-md" />
              {{ t('players.addPlayer') }}
            </PpButton>
          </div>

          <!-- Column Headers (md+) -->
          <div v-if="filteredPlayers.length > 0" class="column-headers">
            <button class="sort-button" @click="toggleSort('name')">
              {{ t('labels.name') }}
              <span v-if="sortField === 'name'" class="sort-indicator">{{
                sortDirection === 'asc' ? '↑' : '↓'
              }}</span>
            </button>
            <div>{{ t('players.type') }}</div>
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
                <span class="player-name">{{ formatName(player) }}</span>
              </div>

              <!-- Type -->
              <div>
                <PpBadge :variant="player.isClaimed ? 'success' : 'neutral'">
                  {{ player.isClaimed ? t('players.appUser') : t('players.rosterOnly') }}
                </PpBadge>
              </div>

              <!-- Actions -->
              <div class="actions-cell">
                <PpButton variant="secondary" size="sm" @click="openEditModal(player)">
                  <IonIcon :icon="createOutline" class="icon-sm" />
                  {{ t('common.edit') }}
                </PpButton>
                <!-- App users own their account; anonymise/archive is reserved
                     for roster-only (unclaimed) entries. -->
                <PpButton
                  v-if="!player.isClaimed"
                  variant="danger"
                  size="sm"
                  @click="confirmAnonymize(player)"
                >
                  <IonIcon :icon="banOutline" class="icon-sm" />
                  {{ t('players.anonymize') }}
                </PpButton>
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

    <!-- Anonymise Confirmation Modal -->
    <PlayersPlayerDeleteModal
      :is-open="showDeleteModal"
      :player="playerToDelete"
      @close="closeDeleteModal"
      @confirmed="handleAnonymizeConfirmed"
    />

    <!-- Bulk Import Modal -->
    <PlayersPlayerImportModal
      :is-open="showImportModal"
      @close="showImportModal = false"
      @imported="handleImported"
    />
  </IonPage>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

import { IonPage, IonContent, IonIcon } from '@ionic/vue'
import {
  addOutline,
  searchOutline,
  peopleOutline,
  createOutline,
  banOutline,
  cloudUploadOutline,
  downloadOutline,
} from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { downloadCsv, exportFilename } from '~/utils/exportCsv'
import type { ClubPlayer } from '~/types/user'

const clubStore = useClubStore()
const { t } = useI18n()
const toast = useToast()

const club = computed(() => clubStore.club)

// State
const loading = ref(true)
const players = ref<ClubPlayer[]>([])
const searchQuery = ref('')
const typeFilter = ref<'all' | 'app' | 'roster'>('all')
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const showImportModal = ref(false)
const selectedPlayer = ref<ClubPlayer | null>(null)
const playerToDelete = ref<ClubPlayer | null>(null)
const formMode = ref<'create' | 'edit'>('create')
const sortField = ref<'name'>('name')
const sortDirection = ref<'asc' | 'desc'>('asc')

const toggleSort = (field: 'name') => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

// Computed — search + type filtering happen client-side over the club roster.
const filteredPlayers = computed(() => {
  const searchLower = searchQuery.value.toLowerCase()
  return players.value.filter((player) => {
    const matchesSearch = player.displayName.toLowerCase().includes(searchLower)
    const matchesType =
      typeFilter.value === 'all' ||
      (typeFilter.value === 'app' && player.isClaimed) ||
      (typeFilter.value === 'roster' && !player.isClaimed)
    return matchesSearch && matchesType
  })
})

// Sort key: family name first (the roster is ordered by family name), falling
// back to the display name for legacy single-field entries.
const sortKey = (p: ClubPlayer) => (p.lastName?.trim() || p.displayName).toLowerCase()

const sortedPlayers = computed(() => {
  const list = [...filteredPlayers.value]
  const dir = sortDirection.value === 'asc' ? 1 : -1
  list.sort((a, b) => {
    const byLast = sortKey(a).localeCompare(sortKey(b))
    if (byLast !== 0) return byLast * dir
    return (a.firstName ?? '').localeCompare(b.firstName ?? '') * dir
  })
  return list
})

// Methods
// Display as "Family name / First name"; legacy entries fall back to display name.
const formatName = (player: ClubPlayer) => {
  const last = player.lastName?.trim()
  const first = player.firstName?.trim()
  if (last && first) return `${last} / ${first}`
  if (last) return last
  return player.displayName
}

const getInitials = (player: ClubPlayer) => {
  const first = player.firstName?.trim()?.charAt(0)?.toUpperCase()
  const last = player.lastName?.trim()?.charAt(0)?.toUpperCase()
  if (first || last) return `${last ?? ''}${first ?? ''}` || '?'
  const parts = player.displayName.trim().split(/\s+/)
  const a = parts[0]?.charAt(0)?.toUpperCase() || ''
  const b = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : ''
  return `${a}${b}` || '?'
}

const fetchPlayers = async () => {
  if (!club.value) return
  try {
    loading.value = true
    const result = await GqlGetClubPlayers({ clubId: club.value.id })
    players.value = (result?.clubPlayers || []) as ClubPlayer[]
  } catch (error) {
    console.error('Failed to fetch roster:', error)
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

const openImportModal = () => {
  showImportModal.value = true
}

const openEditModal = (player: ClubPlayer) => {
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

const handleImported = async () => {
  showImportModal.value = false
  await fetchPlayers()
}

const confirmAnonymize = (player: ClubPlayer) => {
  playerToDelete.value = player
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  playerToDelete.value = null
}

const handleAnonymizeConfirmed = async () => {
  if (!playerToDelete.value) return
  try {
    await GqlAnonymizeClubPlayer({ id: playerToDelete.value.id })
    closeDeleteModal()
    await fetchPlayers()
  } catch (error) {
    console.error('Failed to anonymise player:', error)
    toast.error(t('players.anonymizeFailed'))
  }
}

// Export the (filtered) roster to CSV.
const exportRosterCsv = () => {
  downloadCsv(exportFilename([club.value?.name, t('nav.players')]), sortedPlayers.value, [
    { label: t('exports.col.player'), value: (p) => p.displayName },
    {
      label: t('exports.col.type'),
      value: (p) => (p.isClaimed ? t('exports.typeApp') : t('exports.typeRoster')),
    },
  ])
}

// Lifecycle
onMounted(fetchPlayers)
</script>

<style scoped>
.page-bg {
  background-color: var(--color-pp-bg);
}

.content-bg {
  background-color: var(--color-pp-bg);
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
    flex-wrap: wrap;
  }
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
  letter-spacing: -0.02em;
  color: var(--color-pp-text);
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
  background-color: var(--color-pp-bg);
  border: 1px solid var(--color-pp-border-strong);
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
  box-shadow: 0 0 0 2px rgba(var(--pp-accent-rgb), 0.4);
  border-color: var(--color-pp-gold);
}

.status-filter {
  padding: 0.5rem 0.75rem;
  background-color: var(--color-pp-bg);
  border: 1px solid var(--color-pp-border-strong);
  border-radius: 0.5rem;
  color: #ffffff;
}

.player-count {
  color: rgba(255, 255, 255, 0.6);
}

/* Players Card */
.players-card {
  background-color: var(--color-pp-surface-2);
  border-radius: 1rem;
  box-shadow: var(--pp-shadow-sm);
  border: 1px solid var(--color-pp-border-strong);
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
    grid-template-columns: 2fr 1fr auto;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-pp-border-strong);
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
  color: var(--color-pp-gold);
}

/* Players List */
.players-list > * + * {
  border-top: 1px solid var(--color-pp-border-strong);
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
    grid-template-columns: 2fr 1fr auto;
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
  background-color: rgba(var(--pp-accent-rgb), 0.2);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-pp-gold);
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

/* Actions */
.actions-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
