import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Club {
  id: string
  name: string
  city: string
}

export const useClubStore = defineStore('club', () => {
  // State
  const selectedClub = ref<Club | null>(null)
  const clubs = ref<Club[]>([])

  // Getters
  const hasSelectedClub = computed(() => selectedClub.value !== null)
  const selectedClubName = computed(() => selectedClub.value?.name || 'Select Club')

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

  const setClubs = (newClubs: Club[]) => {
    clubs.value = newClubs
    
    // Auto-select first club if none selected and clubs are available
    if (newClubs.length > 0 && !selectedClub.value) {
      // Try to restore from localStorage first
      const savedClub = localStorage.getItem('selectedClub')
      if (savedClub) {
        try {
          const parsedClub = JSON.parse(savedClub)
          // Verify the saved club still exists in the new clubs list
          const clubExists = newClubs.find(c => c.id === parsedClub.id)
          if (clubExists) {
            selectedClub.value = parsedClub
            return
          }
        } catch (e) {
          // Invalid saved club, ignore
        }
      }
      
      // No valid saved club, select the first available
      setSelectedClub(newClubs[0])
    }
  }

  const initializeFromStorage = () => {
    if (process.client) {
      const savedClub = localStorage.getItem('selectedClub')
      if (savedClub) {
        try {
          selectedClub.value = JSON.parse(savedClub)
        } catch (e) {
          // Invalid saved club, ignore
          localStorage.removeItem('selectedClub')
        }
      }
    }
  }

  return {
    // State
    selectedClub: readonly(selectedClub),
    clubs: readonly(clubs),
    
    // Getters
    hasSelectedClub,
    selectedClubName,
    
    // Actions
    setSelectedClub,
    setClubs,
    initializeFromStorage
  }
}, {
  persist: true
})