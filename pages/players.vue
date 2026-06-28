<template>
  <IonPage class="page-bg">
    <IonContent class="content-bg">
      <div class="page-container">
        <div class="page-header">
          <PpFadeUp>
            <p class="eyebrow">{{ players.length }} {{ t('nav.players') }}</p>
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

        <!-- Search + segmented filter + count -->
        <div class="toolbar">
          <div class="search-wrapper">
            <IonIcon :icon="searchOutline" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('players.searchPlaceholder')"
              class="search-input"
            />
          </div>

          <div class="segmented">
            <button
              v-for="option in typeOptions"
              :key="option.key"
              type="button"
              class="segment"
              :class="{ 'segment--active': typeFilter === option.key }"
              @click="typeFilter = option.key"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="player-count">
            {{ filteredPlayers.length }} {{ t('players.playersFound') }}
          </div>
        </div>

        <!-- Players table -->
        <div class="players-card">
          <div v-if="loading" class="centered-state">
            <div class="muted-text">{{ t('status.loading') }}</div>
          </div>

          <div v-else-if="filteredPlayers.length === 0" class="centered-state">
            <IonIcon :icon="peopleOutline" class="empty-icon" />
            <h4 class="empty-title">{{ t('players.noPlayersFound') }}</h4>
            <p class="empty-text">{{ t('players.createFirstPlayer') }}</p>
            <PpButton class="empty-action" @click="openCreateModal">
              <IonIcon :icon="addOutline" class="icon-md" />
              {{ t('players.addPlayer') }}
            </PpButton>
          </div>

          <template v-else>
            <div class="column-headers">
              <button class="sort-button" @click="toggleSort('name')">
                {{ t('labels.name') }}
                <span v-if="sortField === 'name'" class="sort-indicator">{{
                  sortDirection === 'asc' ? '↑' : '↓'
                }}</span>
              </button>
              <div>{{ t('players.type') }}</div>
              <div class="last-seen-col">{{ t('players.lastSeen') }}</div>
              <div class="num-col">{{ t('reports.games') }}</div>
              <div class="num-col">{{ t('reports.netProfit') }}</div>
              <div class="header-actions-label">{{ t('labels.actions') }}</div>
            </div>

            <div class="players-list">
              <div
                v-for="(player, index) in pagedPlayers"
                :key="player.id"
                class="pp-stagger-item player-row"
                :style="{ animationDelay: `${index * 40}ms` }"
              >
                <div class="player-name-cell">
                  <div class="player-avatar">{{ getInitials(player) }}</div>
                  <span class="player-name">
                    <span class="player-name__last">{{ nameParts(player).last }}</span>
                    <span v-if="nameParts(player).first" class="player-name__first">{{
                      nameParts(player).first
                    }}</span>
                  </span>
                </div>

                <div class="type-cell">
                  <PpStatusPill :tone="player.isClaimed ? 'success' : 'neutral'">
                    {{ player.isClaimed ? t('players.appUser') : t('players.rosterOnly') }}
                  </PpStatusPill>
                </div>

                <div class="last-seen-cell">{{ formatLastSeen(player) }}</div>

                <div class="num-cell games-cell">{{ gamesLabel(player) }}</div>

                <div class="num-cell net-cell" :class="netClass(player)">
                  {{ netLabel(player) }}
                </div>

                <div class="actions-cell">
                  <button
                    type="button"
                    class="row-action"
                    :title="t('common.edit')"
                    :aria-label="t('common.edit')"
                    @click="openEditModal(player)"
                  >
                    <IonIcon :icon="createOutline" class="row-action-icon" />
                  </button>
                  <button
                    v-if="!player.isClaimed"
                    type="button"
                    class="row-action row-action--danger"
                    :title="t('players.anonymize')"
                    :aria-label="t('players.anonymize')"
                    @click="confirmAnonymize(player)"
                  >
                    <IonIcon :icon="banOutline" class="row-action-icon" />
                  </button>
                </div>
              </div>
            </div>

            <div v-if="totalPages > 1" class="pager">
              <button
                type="button"
                class="row-action"
                :disabled="currentPage === 1"
                :title="t('common.previous')"
                :aria-label="t('common.previous')"
                @click="goToPage(currentPage - 1)"
              >
                <IonIcon :icon="chevronBackOutline" class="row-action-icon" />
              </button>
              <span class="pager-page">{{ currentPage }} / {{ totalPages }}</span>
              <button
                type="button"
                class="row-action"
                :disabled="currentPage === totalPages"
                :title="t('common.next')"
                :aria-label="t('common.next')"
                @click="goToPage(currentPage + 1)"
              >
                <IonIcon :icon="chevronForwardOutline" class="row-action-icon" />
              </button>
            </div>
          </template>
        </div>
      </div>
    </IonContent>

    <PlayersPlayerFormModal
      :is-open="showFormModal"
      :player="selectedPlayer"
      :mode="formMode"
      @close="closeFormModal"
      @saved="handlePlayerSaved"
    />

    <PlayersPlayerDeleteModal
      :is-open="showDeleteModal"
      :player="playerToDelete"
      @close="closeDeleteModal"
      @confirmed="handleAnonymizeConfirmed"
    />

    <PlayersPlayerImportModal
      :is-open="showImportModal"
      @close="showImportModal = false"
      @imported="handleImported"
    />
  </IonPage>
</template>

<script setup lang="ts">
import { LeaderboardPeriod } from '~/types/enums'

definePageMeta({
  middleware: 'auth',
  title: 'nav.players',
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
  chevronBackOutline,
  chevronForwardOutline,
} from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { formatPrice } from '~/utils'
import { downloadCsv, exportFilename } from '~/utils/exportCsv'
import type { ClubPlayer } from '~/types/user'

const clubStore = useClubStore()
const tourStore = useTourStore()
const { t, locale } = useI18n()
const toast = useToast()

const club = computed(() => clubStore.club)

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

// All-time games + net profit, keyed by club_player id. Merged from the
// leaderboard (the roster query carries no play history); players who have
// never entered a tournament simply have no entry.
const statsByPlayer = ref<Map<string, { games: number; net: number }>>(new Map())

const typeOptions = computed(() => [
  { key: 'all' as const, label: t('players.allPlayers') },
  { key: 'app' as const, label: t('players.appUsers') },
  { key: 'roster' as const, label: t('players.rosterOnly') },
])

const toggleSort = (field: 'name') => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

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

const sortKey = (p: ClubPlayer) => (p.lastName?.trim() || p.displayName).toLowerCase()

const sortedPlayers = computed(() => {
  const dir = sortDirection.value === 'asc' ? 1 : -1
  return filteredPlayers.value.toSorted((a, b) => {
    const byLast = sortKey(a).localeCompare(sortKey(b))
    if (byLast !== 0) return byLast * dir
    return (a.firstName ?? '').localeCompare(b.firstName ?? '') * dir
  })
})

const pageSize = 20
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(sortedPlayers.value.length / pageSize)))

const pagedPlayers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return sortedPlayers.value.slice(start, start + pageSize)
})

watch([searchQuery, typeFilter, sortField, sortDirection], () => {
  currentPage.value = 1
})

watch(totalPages, (max) => {
  if (currentPage.value > max) currentPage.value = max
})

const goToPage = (p: number) => {
  currentPage.value = Math.min(Math.max(1, p), totalPages.value)
}

const nameParts = (player: ClubPlayer): { last: string; first: string } => {
  const last = player.lastName?.trim()
  const first = player.firstName?.trim()
  if (last) return { last: last.toUpperCase(), first: first ?? '' }
  return { last: player.displayName, first: '' }
}

const formatLastSeen = (player: ClubPlayer) => {
  if (!player.lastSeenAt) return t('players.neverSeen')
  const d = new Date(player.lastSeenAt)
  return isNaN(d.getTime())
    ? t('players.neverSeen')
    : d.toLocaleDateString(locale.value, { day: 'numeric', month: 'short', year: 'numeric' })
}

const getInitials = (player: ClubPlayer) => {
  const first = player.firstName?.trim()?.charAt(0)?.toUpperCase()
  const last = player.lastName?.trim()?.charAt(0)?.toUpperCase()
  if (first || last) return `${first ?? ''}${last ?? ''}` || '?'
  const parts = player.displayName.trim().split(/\s+/)
  const a = parts[0]?.charAt(0)?.toUpperCase() || ''
  const b = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : ''
  return `${a}${b}` || '?'
}

// Play-history accessors (null when the player has never entered a tournament).
const statFor = (player: ClubPlayer) => statsByPlayer.value.get(player.id) || null
const gamesLabel = (player: ClubPlayer) => {
  const s = statFor(player)
  return s ? String(s.games) : '-'
}
const netLabel = (player: ClubPlayer) => {
  const s = statFor(player)
  return s ? formatPrice(s.net) : '-'
}
const netClass = (player: ClubPlayer) => {
  const s = statFor(player)
  if (!s || s.net === 0) return 'net--zero'
  return s.net > 0 ? 'net--pos' : 'net--neg'
}

const fetchPlayers = async () => {
  if (!club.value) return
  try {
    loading.value = true
    const [rosterRes, leaderboardRes] = await Promise.all([
      GqlGetClubPlayers({ clubId: club.value.id }),
      GqlGetLeaderboard({
        clubId: club.value.id,
        period: LeaderboardPeriod.ALL_TIME,
        pagination: { limit: 1000 },
      }).catch(() => null),
    ])

    players.value = (rosterRes?.clubPlayers || []) as ClubPlayer[]

    const map = new Map<string, { games: number; net: number }>()
    for (const entry of leaderboardRes?.leaderboard?.items || []) {
      if (entry.clubPlayerId)
        map.set(entry.clubPlayerId, {
          games: entry.totalTournaments ?? 0,
          net: entry.netProfit ?? 0,
        })
    }
    statsByPlayer.value = map

    // Tick the dashboard "add your players" checklist item once the club has at
    // least one roster player.
    if (players.value.length > 0) tourStore.hasAddedPlayer = true
  } catch (error) {
    console.error('Failed to fetch roster:', error)
  } finally {
    loading.value = false
  }
}

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

const exportRosterCsv = () => {
  downloadCsv(exportFilename([club.value?.name, t('nav.players')]), sortedPlayers.value, [
    { label: t('exports.col.player'), value: (p) => p.displayName },
    {
      label: t('exports.col.type'),
      value: (p) => (p.isClaimed ? t('exports.typeApp') : t('exports.typeRoster')),
    },
  ])
}

onMounted(fetchPlayers)
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

/* Header */
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
    align-items: flex-end;
    flex-wrap: wrap;
  }
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

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

/* Toolbar */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .toolbar {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
}

.search-wrapper {
  position: relative;
  flex: 1;
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

/* Segmented filter */
.segmented {
  display: inline-flex;
  padding: 0.25rem;
  gap: 0.2rem;
  border-radius: 0.7rem;
  border: 1px solid var(--color-pp-border);
  background-color: var(--color-pp-surface);
}

.segment {
  padding: 0.4rem 0.85rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  color: var(--color-pp-text-muted);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.segment:hover {
  color: var(--color-pp-text);
}

.segment--active {
  color: var(--color-pp-gold);
  background-color: rgba(var(--pp-accent-rgb), 0.12);
}

.player-count {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-pp-text-dim);
}

@media (min-width: 768px) {
  .player-count {
    margin-left: auto;
  }
}

/* Card */
.players-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0));
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-pp-border);
  overflow: hidden;
}

.centered-state {
  text-align: center;
  padding: 3rem 0;
}

.muted-text {
  color: var(--color-pp-text-muted);
}

.empty-icon {
  width: 3.5rem;
  height: 3.5rem;
  color: var(--color-pp-text-dim);
  margin: 0 auto 1rem;
}

.empty-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-pp-text);
  margin-bottom: 0.5rem;
}

.empty-text {
  color: var(--color-pp-text-muted);
  margin-bottom: 1.5rem;
}

.empty-action {
  margin: 0 auto;
}

/* Shared row/header grid template (desktop). */
.column-headers,
.player-row {
  --players-grid: minmax(10rem, 1.6fr) minmax(5.5rem, 8rem) minmax(0, 1fr) 4.5rem
    minmax(5.5rem, 8rem) auto;
}

/* Column headers */
.column-headers {
  display: none;
}

@media (min-width: 768px) {
  .column-headers {
    display: grid;
    grid-template-columns: var(--players-grid);
    gap: 1rem;
    padding: 0.75rem 1.15rem;
    border-bottom: 1px solid var(--color-pp-border);
    font-family: var(--font-mono);
    font-size: 0.65rem;
    font-weight: 500;
    color: var(--color-pp-text-dim);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
}

.num-col {
  text-align: right;
}

.header-actions-label {
  text-align: right;
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

/* Rows */
.players-list > * + * {
  border-top: 1px solid var(--color-pp-border);
}

.player-row {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: background-color 0.15s ease;
}

@media (min-width: 768px) {
  .player-row {
    padding: 0.6rem 1.15rem;
    display: grid;
    grid-template-columns: var(--players-grid);
    align-items: center;
    gap: 1rem;
  }
}

.player-row:hover {
  background-color: rgba(255, 255, 255, 0.02);
}

.player-name-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.player-avatar {
  width: 2.25rem;
  height: 2.25rem;
  background-color: rgba(var(--pp-accent-rgb), 0.18);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-pp-gold);
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.player-name {
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.4ch;
  min-width: 0;
  font-size: 0.9rem;
}

.player-name__last {
  font-weight: 600;
  color: var(--color-pp-text);
  letter-spacing: 0.01em;
}

.player-name__first {
  font-weight: 500;
  color: var(--color-pp-text-muted);
}

.type-cell {
  display: flex;
}

/* Numeric columns: mono, right-aligned on desktop. */
.num-cell {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.85rem;
}

@media (min-width: 768px) {
  .num-cell {
    text-align: right;
  }
}

.games-cell {
  color: var(--color-pp-text-muted);
}

.net--pos {
  color: #34d399;
}
.net--neg {
  color: #f87171;
}
.net--zero {
  color: var(--color-pp-text-dim);
}

/* Last seen + games hidden in the stacked phone layout. */
.last-seen-cell {
  display: none;
}

.games-cell {
  display: none;
}

@media (min-width: 768px) {
  .last-seen-cell {
    display: block;
    font-size: 0.85rem;
    color: var(--color-pp-text-muted);
    font-variant-numeric: tabular-nums;
  }

  .games-cell {
    display: block;
  }
}

/* Actions */
.actions-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
}

.row-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 0.625rem;
  background: transparent;
  color: var(--color-pp-text-muted);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease,
    transform 0.1s ease;
}

.row-action:hover {
  color: var(--color-pp-text);
  background-color: rgba(255, 255, 255, 0.06);
}

.row-action:active {
  transform: scale(0.94);
}

.row-action:focus-visible {
  outline: 2px solid var(--color-pp-gold);
  outline-offset: 2px;
}

.row-action--danger:hover {
  color: var(--color-pp-danger);
  background-color: rgba(var(--pp-danger-rgb), 0.12);
}

.row-action:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.row-action-icon {
  width: 1.15rem;
  height: 1.15rem;
}

/* Pager */
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-top: 1px solid var(--color-pp-border);
}

.pager-page {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-pp-text-muted);
  font-variant-numeric: tabular-nums;
  min-width: 4rem;
  text-align: center;
}
</style>
