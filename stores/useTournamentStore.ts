import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tournament, TournamentComplete, TournamentLiveState } from '~/types/tournament'
import type { TournamentPlayer } from '~/types/user'

export const useTournamentStore = defineStore('tournament', () => {
  // State
  const selectedTournamentId = ref<string | null>(null)
  const tournamentData = ref<TournamentComplete | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const tournament = computed((): Tournament | null => tournamentData.value?.tournament || null)
  const liveState = computed((): TournamentLiveState | null => tournamentData.value?.liveState || null)
  const totalRegistered = computed((): number => tournamentData.value?.totalRegistered || 0)
  const hasSelectedTournament = computed(() => selectedTournamentId.value !== null)

  // Actions
  const setSelectedTournament = (data: TournamentComplete | null) => {
    tournamentData.value = data
  }

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const clearTournamentData = () => {
    tournamentData.value = null
    error.value = null
  }

  return {
    // State
    selectedTournamentId: readonly(selectedTournamentId),
    tournamentData: readonly(tournamentData),
    loading: readonly(loading),
    error: readonly(error),
    
    // Getters
    tournament,
    liveState,
    totalRegistered,
    hasSelectedTournament,
    
    // Actions
    setSelectedTournament,
    setLoading,
    setError,
    clearTournamentData
  }
})