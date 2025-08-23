import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {Tournament, TournamentComplete, TournamentLiveState, TournamentStructure} from '~/types/tournament'
import type { TournamentPlayer } from '~/types/user'

export const useTournamentStore = defineStore('selectedTournament', () => {
  // State
  const selectedTournament = ref<TournamentComplete | null>(null)
  const selectedTournamentStructure = ref<TournamentStructure | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const tournament = computed((): Tournament | null => selectedTournament.value?.tournament || null)
  const liveState = computed((): TournamentLiveState | null => selectedTournament.value?.liveState || null)
  const totalRegistered = computed((): number => selectedTournament.value?.totalRegistered || 0)
  const structure = computed((): TournamentStructure | null => selectedTournamentStructure.value)

  const hasSelectedTournament = computed(() => selectedTournament.value !== null)

  // Actions
  const setSelectedTournament = (data: TournamentComplete | null) => {
    selectedTournament.value = data
  }

  const setSelectedTournamentStructure = (data: TournamentStructure | null) => {
    selectedTournamentStructure.value = data
  }

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const clearSelectedTournament = () => {
    selectedTournament.value = null
    error.value = null
  }

  return {
    // State
    selectedTournament: readonly(selectedTournament),
    loading: readonly(loading),
    error: readonly(error),
    
    // Getters
    tournament,
    liveState,
    totalRegistered,
    hasSelectedTournament,
    
    // Actions
    setSelectedTournament,
    setSelectedTournamentStructure,
    setLoading,
    setError,
    clearSelectedTournament
  }
})