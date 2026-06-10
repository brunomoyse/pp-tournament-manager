import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Club {
  id: string
  name: string
  city: string
}

export const useClubStore = defineStore(
  'club',
  () => {
    // State
    const selectedClub = ref<Club | null>(null)

    // Getters
    const hasSelectedClub = computed(() => selectedClub.value !== null)
    const club = computed(() => selectedClub.value)

    // Actions
    const setSelectedClub = (club: Club | null) => {
      selectedClub.value = club
      // Persist to localStorage
      if (club) {
        localStorage.setItem('selectedClub', JSON.stringify(club))
      } else {
        localStorage.removeItem('selectedClub')
      }
    }

    const initializeFromStorage = () => {
      if (import.meta.client) {
        const savedClub = localStorage.getItem('selectedClub')
        if (savedClub) {
          try {
            selectedClub.value = JSON.parse(savedClub)
          } catch {
            // Invalid saved club, ignore
            localStorage.removeItem('selectedClub')
          }
        }
      }
    }

    const clearSelectedClub = () => {
      selectedClub.value = null
      if (import.meta.client) {
        localStorage.removeItem('selectedClub')
      }
    }

    return {
      // State (not readonly - required for Pinia persistence plugin)
      selectedClub,

      // Getters
      hasSelectedClub,
      club,

      // Actions
      setSelectedClub,
      initializeFromStorage,
      clearSelectedClub,
    }
  },
  {
    persist: {
      pick: ['selectedClub'],
    },
  },
)
