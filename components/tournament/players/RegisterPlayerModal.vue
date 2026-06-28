<template>
  <PpModal :open="isOpen" size="lg" :title="t('buttons.registerPlayer')" @close="close">
    <!-- Tabs -->
    <div class="tabs-wrapper">
      <div class="tabs-container">
        <button
          @click="activeTab = 'search'"
          :class="['tab-button', activeTab === 'search' ? 'tab-button--active' : '']"
        >
          <IonIcon :icon="searchOutline" class="icon-sm" />
          {{ t('registerModal.searchExisting') }}
        </button>
        <button
          @click="activeTab = 'create'"
          :class="['tab-button', activeTab === 'create' ? 'tab-button--active' : '']"
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
        <div class="search-input-wrapper">
          <IonIcon :icon="searchOutline" class="search-input-icon" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('registerModal.searchPlaceholder')"
            class="pp-input search-input"
          />
        </div>

        <!-- Loading State -->
        <div v-if="loadingRoster" class="search-loading">
          <IonIcon :icon="refreshOutline" class="search-spinner pp-animate-spin" />
          <span class="search-loading-text">{{ t('registerModal.searching') }}</span>
        </div>

        <!-- Results -->
        <div v-else-if="searchResults.length > 0" class="search-results">
          <p class="results-count">
            {{ t('registerModal.playersFound', { count: searchResults.length }) }}
          </p>
          <div v-for="player in searchResults" :key="player.id" class="result-card">
            <div class="result-player">
              <div class="result-avatar">
                {{ getInitials(player.displayName) }}
              </div>
              <div>
                <h4 class="result-name">{{ player.displayName }}</h4>
                <p class="result-email">
                  {{ player.isClaimed ? t('players.appUser') : t('players.rosterOnly') }}
                </p>
              </div>
            </div>
            <PpButton
              size="sm"
              variant="primary"
              @click="registerPlayer(player.id)"
              :disabled="registering === player.id"
              :loading="registering === player.id"
            >
              <IonIcon v-if="registering !== player.id" :icon="personAddOutline" class="icon-sm" />
              {{
                registering === player.id ? t('registerModal.registering') : t('buttons.register')
              }}
            </PpButton>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="searchQuery" class="search-empty">
          <IonIcon :icon="searchOutline" class="empty-icon" />
          <p class="empty-text">
            {{ t('registerModal.noPlayersMatching', { query: searchQuery }) }}
          </p>
          <button @click="activeTab = 'create'" class="create-instead-link">
            {{ t('registerModal.createInstead') }}
          </button>
        </div>

        <div v-else class="search-empty">
          <IonIcon :icon="personOutline" class="empty-icon" />
          <p class="empty-text">{{ t('registerModal.searchPrompt') }}</p>
        </div>
      </div>

      <!-- Create Tab -->
      <div v-if="activeTab === 'create'" class="create-tab">
        <form @submit.prevent="createAndRegister" class="create-form">
          <div>
            <label class="pp-label">{{ t('players.firstName') }} *</label>
            <input
              v-model="newFirstName"
              type="text"
              required
              class="pp-input"
              :placeholder="t('players.firstNamePlaceholder')"
            />
          </div>

          <div>
            <label class="pp-label">{{ t('players.lastName') }}</label>
            <input
              v-model="newLastName"
              type="text"
              class="pp-input"
              :placeholder="t('players.lastNamePlaceholder')"
            />
            <p class="create-hint">{{ t('players.nameHint') }}</p>
          </div>

          <div v-if="error" class="form-error">
            <p class="form-error-text">{{ error }}</p>
          </div>

          <PpButton type="submit" variant="primary" block :loading="creating" class="submit-button">
            <IonIcon v-if="!creating" :icon="personAddOutline" class="icon-md" />
            {{
              creating
                ? t('registerModal.creatingAndRegistering')
                : t('registerModal.createAndRegister')
            }}
          </PpButton>
        </form>
      </div>
    </div>
  </PpModal>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { searchOutline, personAddOutline, personOutline, refreshOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import type { ClubPlayer } from '~/types/user'

const { t } = useI18n()
const clubStore = useClubStore()

const props = defineProps<{
  isOpen: boolean
  tournamentId: string
  clubPlayerIds: string[]
}>()

const emit = defineEmits<{
  close: []
  registered: [data: { playerId: string }]
}>()

const activeTab = ref<'search' | 'create'>('search')
const searchQuery = ref('')
const roster = ref<ClubPlayer[]>([])
const loadingRoster = ref(false)
const registering = ref<string | null>(null)
const creating = ref(false)
const error = ref<string | null>(null)
const newFirstName = ref('')
const newLastName = ref('')

// Search filters the loaded roster client-side, excluding already-registered players.
const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return roster.value.filter(
    (p) => !props.clubPlayerIds.includes(p.id) && p.displayName.toLowerCase().includes(q),
  )
})

const loadRoster = async () => {
  if (!clubStore.club) return
  try {
    loadingRoster.value = true
    const result = await GqlGetClubPlayers({ clubId: clubStore.club.id })
    roster.value = (result?.clubPlayers || []) as ClubPlayer[]
  } catch (e) {
    console.error('Failed to load roster:', e)
    error.value = 'Failed to load roster'
  } finally {
    loadingRoster.value = false
  }
}

const registerPlayer = async (clubPlayerId: string) => {
  try {
    registering.value = clubPlayerId
    error.value = null
    await GqlRegisterRosterPlayer({
      input: { tournamentId: props.tournamentId, clubPlayerId },
    })
    emit('registered', { playerId: clubPlayerId })
    close()
  } catch (e: any) {
    console.error('Registration failed:', e)
    error.value = e.message || 'Failed to register player'
  } finally {
    registering.value = null
  }
}

const createAndRegister = async () => {
  try {
    creating.value = true
    error.value = null

    const createResult = await GqlCreateClubPlayer({
      input: {
        clubId: clubStore.club!.id,
        firstName: newFirstName.value.trim(),
        lastName: newLastName.value.trim(),
      },
    })
    const clubPlayerId = createResult?.createClubPlayer?.id
    if (!clubPlayerId) throw new Error('Failed to create player')

    await GqlRegisterRosterPlayer({
      input: { tournamentId: props.tournamentId, clubPlayerId },
    })

    emit('registered', { playerId: clubPlayerId })
    close()
  } catch (e: any) {
    console.error('Create & register failed:', e)
    error.value = e.message || 'Failed to create and register player'
  } finally {
    creating.value = false
  }
}

const getInitials = (displayName: string) => {
  const parts = displayName.trim().split(/\s+/)
  const f = parts[0]?.[0] || ''
  const l = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (f + l).toUpperCase() || '?'
}

const close = () => {
  searchQuery.value = ''
  error.value = null
  activeTab.value = 'search'
  newFirstName.value = ''
  newLastName.value = ''
  emit('close')
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      searchQuery.value = ''
      error.value = null
      newFirstName.value = ''
      newLastName.value = ''
      activeTab.value = 'search'
      loadRoster()
    }
  },
)
</script>

<style scoped>
/* Tabs */
.tabs-wrapper {
  margin: 0 -1.5rem 0 -1.5rem;
  padding: 0.75rem 1rem 0;
  border-bottom: 1px solid var(--color-pp-border);
}

.tabs-container {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(24, 24, 26, 0.5);
  border-radius: 1rem;
  border: 1px solid var(--color-pp-border-strong);
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
  background-color: var(--color-pp-surface-2);
  color: var(--color-pp-gold);
  border: 1px solid rgba(var(--pp-accent-rgb), 0.4);
  box-shadow: var(--pp-shadow-sm);
}

/* Content */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

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
  color: var(--color-pp-gold);
}

.search-loading-text {
  margin-left: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
}

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
  background-color: var(--color-pp-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--color-pp-border-strong);
  transition: border-color 0.15s ease;
}

.result-card:hover {
  border-color: rgba(var(--pp-accent-rgb), 0.5);
}

.result-player {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.result-avatar {
  width: 2.5rem;
  height: 2.5rem;
  background-color: var(--color-pp-text-muted);
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
  color: var(--color-pp-gold);
  font-size: 0.875rem;
  cursor: pointer;
  background: none;
  border: none;
}

.create-instead-link:hover {
  text-decoration: underline;
}

.create-form > * + * {
  margin-top: 1rem;
}

.create-hint {
  color: var(--color-pp-text-dim);
  font-size: 0.8rem;
  margin-top: 0.35rem;
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

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

.icon-sm {
  width: 1rem;
  height: 1rem;
}
</style>
