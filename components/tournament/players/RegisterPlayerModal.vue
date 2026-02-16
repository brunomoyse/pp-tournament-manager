<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close"></div>

    <!-- Modal Content -->
    <div class="relative bg-pp-bg-secondary rounded-2xl shadow-xl border border-pp-border w-full max-w-lg max-h-[80vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-pp-border">
        <h2 class="text-lg font-bold text-pp-text-primary">{{ t('buttons.registerPlayer') }}</h2>
        <button @click="close" class="text-white/60 hover:text-white transition-colors">
          <IonIcon :icon="closeOutline" class="w-6 h-6" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-pp-border">
        <button
          @click="activeTab = 'search'"
          :class="[
            'flex-1 py-3 px-4 text-sm font-medium transition-colors',
            activeTab === 'search'
              ? 'text-pp-accent-gold border-b-2 border-pp-accent-gold'
              : 'text-white/60 hover:text-white'
          ]"
        >
          <IonIcon :icon="searchOutline" class="w-4 h-4 mr-2" />
          {{ t('registerModal.searchExisting') }}
        </button>
        <button
          @click="activeTab = 'create'"
          :class="[
            'flex-1 py-3 px-4 text-sm font-medium transition-colors',
            activeTab === 'create'
              ? 'text-pp-accent-gold border-b-2 border-pp-accent-gold'
              : 'text-white/60 hover:text-white'
          ]"
        >
          <IonIcon :icon="personAddOutline" class="w-4 h-4 mr-2" />
          {{ t('registerModal.createNew') }}
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4">
        <!-- Search Tab -->
        <div v-if="activeTab === 'search'" class="space-y-4">
          <!-- Search Input -->
          <div class="relative">
            <IonIcon :icon="searchOutline" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('registerModal.searchPlaceholder')"
              class="w-full pl-10 pr-4 py-3 bg-pp-bg-primary border border-pp-border rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
              @input="debouncedSearch"
            />
          </div>

          <!-- Loading State -->
          <div v-if="searching" class="flex items-center justify-center py-8">
            <IonIcon :icon="refreshOutline" class="w-6 h-6 text-pp-accent-gold animate-spin" />
            <span class="ml-2 text-white/60">{{ t('registerModal.searching') }}</span>
          </div>

          <!-- Search Results -->
          <div v-else-if="searchResults.length > 0" class="space-y-2">
            <p class="text-xs text-white/40 mb-2">{{ t('registerModal.playersFound', { count: searchResults.length }) }}</p>
            <div
              v-for="player in searchResults"
              :key="player.id"
              class="flex items-center justify-between p-3 bg-pp-bg-primary rounded-lg border border-pp-border hover:border-pp-accent-gold/50 transition-colors"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-pp-text-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {{ getInitials(player.firstName, player.lastName) }}
                </div>
                <div>
                  <h4 class="font-medium text-white">{{ getPlayerName(player) }}</h4>
                  <p class="text-xs text-white/50">{{ player.email }}</p>
                </div>
              </div>
              <button
                @click="registerExistingPlayer(player.id)"
                :disabled="registering === player.id"
                class="pp-action-button pp-action-button--primary text-sm px-3 py-1.5"
              >
                <IonIcon
                  :icon="registering === player.id ? refreshOutline : personAddOutline"
                  :class="['w-4 h-4', registering === player.id && 'animate-spin']"
                />
                {{ registering === player.id ? t('registerModal.registering') : t('buttons.register') }}
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="searchQuery && !searching" class="text-center py-8">
            <IonIcon :icon="searchOutline" class="w-12 h-12 text-white/20 mx-auto mb-2" />
            <p class="text-white/50">{{ t('registerModal.noPlayersMatching', { query: searchQuery }) }}</p>
            <button
              @click="activeTab = 'create'"
              class="mt-3 text-pp-accent-gold text-sm hover:underline"
            >
              {{ t('registerModal.createInstead') }}
            </button>
          </div>

          <!-- Initial State -->
          <div v-else class="text-center py-8">
            <IonIcon :icon="personOutline" class="w-12 h-12 text-white/20 mx-auto mb-2" />
            <p class="text-white/50">{{ t('registerModal.searchPrompt') }}</p>
          </div>
        </div>

        <!-- Create Tab -->
        <div v-if="activeTab === 'create'" class="space-y-4">
          <form @submit.prevent="createAndRegister" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-white/70 mb-1">{{ t('players.firstName') }} *</label>
                <input
                  v-model="newPlayer.firstName"
                  type="text"
                  required
                  class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
                  placeholder="John"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-white/70 mb-1">{{ t('players.lastName') }} *</label>
                <input
                  v-model="newPlayer.lastName"
                  type="text"
                  required
                  class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-white/70 mb-1">{{ t('auth.email') }} *</label>
              <input
                v-model="newPlayer.email"
                type="email"
                required
                class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-white/70 mb-1">{{ t('registerModal.phoneOptional') }}</label>
              <input
                v-model="newPlayer.phone"
                type="tel"
                class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
                placeholder="+1 234 567 890"
              />
            </div>

            <!-- Error Message -->
            <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p class="text-red-400 text-sm">{{ error }}</p>
            </div>

            <button
              type="submit"
              :disabled="creating"
              class="w-full pp-action-button pp-action-button--primary py-3"
            >
              <IonIcon
                :icon="creating ? refreshOutline : personAddOutline"
                :class="['w-5 h-5', creating && 'animate-spin']"
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
      limit: 20
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
