import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {Tournament, TournamentRegistration, TournamentStructure} from '~/types/tournament'
import type {TournamentClock} from "~/types/clock";

export const useTournamentStore = defineStore('selectedTournament', () => {
  // State
  const selectedTournament = ref<Tournament | null>(null)
  const selectedTournamentStructure = ref<TournamentStructure[] | null>(null)
  const selectedTournamentClock = ref<TournamentClock | null>(null)
  const selectedTournamentRegistrations = ref<TournamentRegistration[] | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const tournament = computed((): Tournament | null => selectedTournament.value || null)
  const structure = computed((): TournamentStructure[] | null => selectedTournamentStructure.value)
  const clock = computed((): TournamentClock | null => selectedTournamentClock.value || null)
  const registrations = computed((): TournamentRegistration[] | null => selectedTournamentRegistrations.value || null)

  const hasSelectedTournament = computed(() => selectedTournament.value !== null)

  // Actions
  const setSelectedTournament = (data: Tournament | null) => {
    selectedTournament.value = data
    selectedTournamentStructure.value = data?.structure || null
    selectedTournamentClock.value = data?.clock || null
    selectedTournamentRegistrations.value = data?.registrations || null
  }

  const setSelectedTournamentClock = (data: TournamentClock | null) => {
    selectedTournamentClock.value = data
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
    hasSelectedTournament,

    clock,
    registrations,
    structure,
    tournament,
    
    // Actions
    setError,
    setLoading,

    clearSelectedTournament,
    setSelectedTournamentClock,
    setSelectedTournament,
  }
})