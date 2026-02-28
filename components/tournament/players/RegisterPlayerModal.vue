<template>
  <div v-if="isOpen" class="pp-modal-overlay">
    <!-- Backdrop -->
    <div class="pp-modal-backdrop" @click="close"></div>

    <!-- Modal Content -->
    <div class="pp-modal-content pp-modal-content--lg modal-flex-container">
      <!-- Header -->
      <div class="pp-modal-header">
        <h3>{{ t('buttons.registerPlayer') }}</h3>
        <button @click="close" class="pp-close-button">
          <IonIcon :icon="closeOutline" class="icon-lg" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="tabs-wrapper">
        <div class="tabs-container">
          <button
            @click="activeTab = 'search'"
            :class="[
              'tab-button',
              activeTab === 'search' ? 'tab-button--active' : ''
            ]"
          >
            <IonIcon :icon="searchOutline" class="icon-sm" />
            {{ t('registerModal.searchExisting') }}
          </button>
          <button
            @click="activeTab = 'create'"
            :class="[
              'tab-button',
              activeTab === 'create' ? 'tab-button--active' : ''
            ]"
          >
            <IonIcon :icon="personAddOutline" class="icon-sm" />
            {{ t('registerModal.createNew') }}
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="tab-content">
        <!-- Search Tab -->
        <div v-if="activeTab === 'search'" class="search-tab">
          <!-- Search Input -->
          <div class="search-input-wrapper">
            <IonIcon :icon="searchOutline" class="search-input-icon" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('registerModal.searchPlaceholder')"
              class="pp-input search-input"
              @input="debouncedSearch"
            />
          </div>

          <!-- Loading State -->
          <div v-if="searching" class="search-loading">
            <IonIcon :icon="refreshOutline" class="search-spinner pp-animate-spin" />
            <span class="search-loading-text">{{ t('registerModal.searching') }}</span>
          </div>

          <!-- Search Results -->
          <div v-else-if="searchResults.length > 0" class="search-results">
            <p class="results-count">{{ t('registerModal.playersFound', { count: searchResults.length }) }}</p>
            <div
              v-for="player in searchResults"
              :key="player.id"
              class="result-card"
            >
              <div class="result-player">
                <div class="result-avatar">
                  {{ getInitials(player.firstName, player.lastName) }}
                </div>
                <div>
                  <h4 class="result-name">{{ getPlayerName(player) }}</h4>
                  <p class="result-email">{{ player.email }}</p>
                </div>
              </div>
              <button
                @click="registerExistingPlayer(player.id)"
                :disabled="registering === player.id"
                class="pp-action-button pp-action-button--primary result-register-btn"
              >
                <IonIcon
                  :icon="registering === player.id ? refreshOutline : personAddOutline"
                  :class="['icon-sm', registering === player.id && 'pp-animate-spin']"
                />
                {{ registering === player.id ? t('registerModal.registering') : t('buttons.register') }}
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="searchQuery && !searching" class="search-empty">
            <IonIcon :icon="searchOutline" class="empty-icon" />
            <p class="empty-text">{{ t('registerModal.noPlayersMatching', { query: searchQuery }) }}</p>
            <button
              @click="activeTab = 'create'"
              class="create-instead-link"
            >
              {{ t('registerModal.createInstead') }}
            </button>
          </div>

          <!-- Initial State -->
          <div v-else class="search-empty">
            <IonIcon :icon="personOutline" class="empty-icon" />
            <p class="empty-text">{{ t('registerModal.searchPrompt') }}</p>
          </div>
        </div>

        <!-- Create Tab -->
        <div v-if="activeTab === 'create'" class="create-tab">
          <form @submit.prevent="createAndRegister" class="create-form">
            <div class="name-grid">
              <div>
                <label class="pp-label">{{ t('players.firstName') }} *</label>
                <input
                  v-model="newPlayer.firstName"
                  type="text"
                  required
                  class="pp-input"
                  placeholder="John"
                />
              </div>
              <div>
                <label class="pp-label">{{ t('players.lastName') }} *</label>
                <input
                  v-model="newPlayer.lastName"
                  type="text"
                  required
                  class="pp-input"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label class="pp-label">{{ t('auth.email') }} *</label>
              <input
                v-model="newPlayer.email"
                type="email"
                required
                class="pp-input"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label class="pp-label">{{ t('registerModal.phoneOptional') }}</label>
              <input
                v-model="newPlayer.phone"
                type="tel"
                class="pp-input"
                placeholder="+1 234 567 890"
              />
            </div>

            <!-- Error Message -->
            <div v-if="error" class="form-error">
              <p class="form-error-text">{{ error }}</p>
            </div>

            <button
              type="submit"
              :disabled="creating"
              class="pp-action-button pp-action-button--primary submit-button"
            >
              <IonIcon
                :icon="creating ? refreshOutline : personAddOutline"
                :class="['icon-md', creating && 'pp-animate-spin']"
              />
              {{ creating ? t('registerModal.creatingAndRegistering') : t('registerModal.createAndRegister') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { closeOutline, searchOutline, personAddOutline, personOutline, refreshOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n()
const clubStore = useClubStore()

const props = defineProps<{
  isOpen: boolean
  tournamentId: string
  registeredPlayerIds: string[]
}>()

const emit = defineEmits<{
  'close': []
  'registered': [data: { playerId: string }]
}>()

// State
const activeTab = ref<'search' | 'create'>('search')
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const searching = ref(false)
const registering = ref<string | null>(null)
const creating = ref(false)
const error = ref<string | null>(null)

const newPlayer = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
})

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300)
}

// Search for players
const performSearch = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }

  try {
    searching.value = true
    error.value = null

    const result = await GqlGetUsers({
      search: searchQuery.value,
      isActive: true,
      pagination: { limit: 20 }
    })

    // Filter out already registered players
    searchResults.value = (result?.users?.items || []).filter(
      (user: any) => !props.registeredPlayerIds.includes(user.id)
    )
  } catch (e: any) {
    console.error('Search failed:', e)
    error.value = 'Failed to search players'
  } finally {
    searching.value = false
  }
}

// Register existing player
const registerExistingPlayer = async (playerId: string) => {
  try {
    registering.value = playerId
    error.value = null

    await GqlRegisterTournament({
      input: {
        tournamentId: props.tournamentId,
        userId: playerId
      }
    })

    emit('registered', { playerId })
    close()
  } catch (e: any) {
    console.error('Registration failed:', e)
    error.value = e.message || 'Failed to register player'
  } finally {
    registering.value = null
  }
}

// Create new player and register
const createAndRegister = async () => {
  try {
    creating.value = true
    error.value = null

    // First create the player
    const createResult = await GqlCreatePlayer({
      input: {
        clubId: clubStore.club!.id,
        firstName: newPlayer.firstName,
        lastName: newPlayer.lastName,
        email: newPlayer.email,
        phone: newPlayer.phone || undefined
      }
    })

    if (!createResult?.createPlayer?.id) {
      throw new Error('Failed to create player')
    }

    const playerId = createResult.createPlayer.id

    // Then register them for the tournament
    await GqlRegisterTournament({
      input: {
        tournamentId: props.tournamentId,
        userId: playerId
      }
    })

    emit('registered', { playerId })
    close()
  } catch (e: any) {
    console.error('Create & register failed:', e)
    error.value = e.message || 'Failed to create and register player'
  } finally {
    creating.value = false
  }
}

// Helper functions
const getInitials = (firstName?: string | null, lastName?: string | null) => {
  const f = firstName?.[0] || ''
  const l = lastName?.[0] || ''
  return (f + l).toUpperCase() || '?'
}

const getPlayerName = (player: any) => {
  const name = `${player.firstName || ''} ${player.lastName || ''}`.trim()
  return name || player.username || player.email || 'Unknown'
}

const close = () => {
  // Reset state
  searchQuery.value = ''
  searchResults.value = []
  error.value = null
  activeTab.value = 'search'
  newPlayer.firstName = ''
  newPlayer.lastName = ''
  newPlayer.email = ''
  newPlayer.phone = ''
  emit('close')
}

// Clear search when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    searchQuery.value = ''
    searchResults.value = []
    error.value = null
  }
})
</script>

<style scoped>
.modal-flex-container {
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

/* Tabs */
.tabs-wrapper {
  padding: 0.75rem 1rem 0;
}

.tabs-container {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(24, 24, 26, 0.5);
  border-radius: 1rem;
  border: 1px solid var(--pp-border);
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  color: #ffffff;
  cursor: pointer;
}

.tab-button:hover:not(.tab-button--active) {
  background-color: rgba(36, 36, 42, 0.5);
}

.tab-button--active {
  background-color: var(--pp-bg-secondary);
  color: var(--pp-accent-gold);
  border: 1px solid rgba(254, 231, 138, 0.4);
  box-shadow: var(--pp-shadow-sm);
}

/* Content */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* Search Tab */
.search-tab > * + * {
  margin-top: 1rem;
}

.search-input-wrapper {
  position: relative;
}

.search-input-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: rgba(255, 255, 255, 0.4);
}

.search-input {
  padding-left: 2.5rem;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.search-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.search-spinner {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--pp-accent-gold);
}

.search-loading-text {
  margin-left: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Search Results */
.search-results > * + * {
  margin-top: 0.5rem;
}

.results-count {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 0.5rem;
}

.result-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: var(--pp-bg-primary);
  border-radius: 0.5rem;
  border: 1px solid var(--pp-border);
  transition: border-color 0.15s ease;
}

.result-card:hover {
  border-color: rgba(254, 231, 138, 0.5);
}

.result-player {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.result-avatar {
  width: 2.5rem;
  height: 2.5rem;
  background-color: var(--pp-text-secondary);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.875rem;
}

.result-name {
  font-weight: 500;
  color: #ffffff;
}

.result-email {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.result-register-btn {
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
}

/* Empty / Initial State */
.search-empty {
  text-align: center;
  padding: 2rem 0;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: rgba(255, 255, 255, 0.2);
  margin: 0 auto 0.5rem;
}

.empty-text {
  color: rgba(255, 255, 255, 0.5);
}

.create-instead-link {
  margin-top: 0.75rem;
  color: var(--pp-accent-gold);
  font-size: 0.875rem;
  cursor: pointer;
  background: none;
  border: none;
}

.create-instead-link:hover {
  text-decoration: underline;
}

/* Create Tab */
.create-form > * + * {
  margin-top: 1rem;
}

.name-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-error {
  padding: 0.75rem;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
}

.form-error-text {
  color: var(--pp-red-400);
  font-size: 0.875rem;
}

.submit-button {
  width: 100%;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  justify-content: center;
}

/* Icon sizes */
.icon-lg {
  width: 1.5rem;
  height: 1.5rem;
}

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

.icon-sm {
  width: 1rem;
  height: 1rem;
}
</style>
