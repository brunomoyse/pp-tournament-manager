import { useGraphQLSubscription, useGraphQLMutation } from './useGraphQL'

interface TournamentClockData {
  tournamentClockUpdates: {
    tournamentId: string
    status: string
    currentLevel: number
    timeRemainingSeconds: number
    smallBlind: number
    bigBlind: number
    ante?: number
    isBreak: boolean
    nextLevelPreview: {
      smallBlind: number
      bigBlind: number
      ante?: number
    }
  }
}

interface TournamentStructure {
  id: string
  tournamentId: string
  levelNumber: number
  smallBlind: number
  bigBlind: number
  ante?: number
  durationMinutes: number
  isBreak: boolean
  breakDurationMinutes?: number
}

interface TournamentClockMutationResponse {
  id: string
  tournamentId: string
  status: string
  currentLevel: number
  timeRemainingSeconds: number
  levelStartedAt: string
  levelEndTime: string
  totalPauseDurationSeconds: number
  autoAdvance: boolean
  currentStructure: TournamentStructure
  nextStructure?: TournamentStructure
}

interface StartTournamentClockResponse {
  startTournamentClock: TournamentClockMutationResponse
}

interface PauseTournamentClockResponse {
  pauseTournamentClock: TournamentClockMutationResponse
}

interface ResumeTournamentClockResponse {
  resumeTournamentClock: TournamentClockMutationResponse
}

interface AdvanceTournamentLevelResponse {
  advanceTournamentLevel: TournamentClockMutationResponse
}

// Local-only clock for offline/demo mode
export function useTournamentClock(initialTime: string = '15:00') {
  const timeRemaining = ref(initialTime)
  const running = ref(false)
  let interval: NodeJS.Timeout | null = null

  const start = () => {
    if (!running.value) {
      running.value = true
      interval = setInterval(() => {
        const [minutes, seconds] = timeRemaining.value.split(':').map(Number)
        const totalSeconds = minutes * 60 + seconds - 1
        
        if (totalSeconds <= 0) {
          pause()
          timeRemaining.value = '00:00'
          return
        }
        
        const newMinutes = Math.floor(totalSeconds / 60)
        const newSeconds = totalSeconds % 60
        timeRemaining.value = `${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`
      }, 1000)
    }
  }

  const pause = () => {
    if (running.value && interval) {
      running.value = false
      clearInterval(interval)
      interval = null
    }
  }

  const reset = (newTime: string = '15:00') => {
    pause()
    timeRemaining.value = newTime
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (interval) {
      clearInterval(interval)
    }
  })

  return {
    timeRemaining,
    running,
    start,
    pause,
    reset
  }
}

// Real-time synchronized clock with GraphQL subscription
export function useTournamentClockSync(tournamentId: string) {
  const timeRemaining = ref('15:00')
  const running = ref(false)
  const currentLevel = ref(1)
  const smallBlind = ref(25)
  const bigBlind = ref(50)
  const ante = ref<number | null>(null)
  const isBreak = ref(false)
  const nextLevel = ref({
    smallBlind: 50,
    bigBlind: 100,
    ante: null as number | null
  })
  const status = ref('scheduled')
  const connected = ref(false)
  const error = ref<string | null>(null)

  // Convert seconds to MM:SS format
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // GraphQL subscription for real-time updates
  const subscription = `
    subscription TournamentClockUpdates($tournamentId: ID!) {
      tournamentClockUpdates(tournamentId: $tournamentId) {
        tournamentId
        status
        currentLevel
        timeRemainingSeconds
        smallBlind
        bigBlind
        ante
        isBreak
        nextLevelPreview {
          smallBlind
          bigBlind
          ante
        }
      }
    }
  `

  const {
    data,
    loading,
    error: subscriptionError,
    connected: subscriptionConnected,
    connect,
    disconnect,
    reconnect
  } = useGraphQLSubscription<TournamentClockData>(
    subscription,
    { tournamentId },
    { immediate: true }
  )

  // Watch for subscription data updates
  watch(data, (newData) => {
    if (newData?.tournamentClockUpdates) {
      const update = newData.tournamentClockUpdates
      
      // Update all reactive values
      timeRemaining.value = formatTime(update.timeRemainingSeconds)
      currentLevel.value = update.currentLevel
      smallBlind.value = update.smallBlind
      bigBlind.value = update.bigBlind
      ante.value = update.ante || null
      isBreak.value = update.isBreak
      status.value = update.status
      running.value = update.status === 'running'
      
      // Update next level preview
      if (update.nextLevelPreview) {
        nextLevel.value = {
          smallBlind: update.nextLevelPreview.smallBlind,
          bigBlind: update.nextLevelPreview.bigBlind,
          ante: update.nextLevelPreview.ante || null
        }
      }
    }
  })

  // Watch connection status
  watch(subscriptionConnected, (isConnected) => {
    connected.value = isConnected
  })

  // Watch for errors
  watch(subscriptionError, (errors) => {
    if (errors && errors.length > 0) {
      error.value = errors[0].message
    } else {
      error.value = null
    }
  })

  // Format blinds for display
  const blindsText = computed(() => {
    if (ante.value) {
      return `${smallBlind.value}/${bigBlind.value} (${ante.value})`
    }
    return `${smallBlind.value}/${bigBlind.value}`
  })

  const nextBlindsText = computed(() => {
    if (nextLevel.value.ante) {
      return `${nextLevel.value.smallBlind}/${nextLevel.value.bigBlind} (${nextLevel.value.ante})`
    }
    return `${nextLevel.value.smallBlind}/${nextLevel.value.bigBlind}`
  })

  // GraphQL Mutations
  const startMutation = useGraphQLMutation<StartTournamentClockResponse>(`
    mutation StartTournamentClock($tournamentId: ID!) {
      startTournamentClock(tournamentId: $tournamentId) {
        id
        tournamentId
        status
        currentLevel
        timeRemainingSeconds
        levelStartedAt
        levelEndTime
        totalPauseDurationSeconds
        autoAdvance
        currentStructure {
          id
          tournamentId
          levelNumber
          smallBlind
          bigBlind
          ante
          durationMinutes
          isBreak
          breakDurationMinutes
        }
        nextStructure {
          id
          tournamentId
          levelNumber
          smallBlind
          bigBlind
          ante
          durationMinutes
          isBreak
          breakDurationMinutes
        }
      }
    }
  `)

  const pauseMutation = useGraphQLMutation<PauseTournamentClockResponse>(`
    mutation PauseTournamentClock($tournamentId: ID!) {
      pauseTournamentClock(tournamentId: $tournamentId) {
        id
        tournamentId
        status
        currentLevel
        timeRemainingSeconds
        levelStartedAt
        levelEndTime
        totalPauseDurationSeconds
        autoAdvance
        currentStructure {
          id
          tournamentId
          levelNumber
          smallBlind
          bigBlind
          ante
          durationMinutes
          isBreak
          breakDurationMinutes
        }
        nextStructure {
          id
          tournamentId
          levelNumber
          smallBlind
          bigBlind
          ante
          durationMinutes
          isBreak
          breakDurationMinutes
        }
      }
    }
  `)

  const resumeMutation = useGraphQLMutation<ResumeTournamentClockResponse>(`
    mutation ResumeTournamentClock($tournamentId: ID!) {
      resumeTournamentClock(tournamentId: $tournamentId) {
        id
        tournamentId
        status
        currentLevel
        timeRemainingSeconds
        levelStartedAt
        levelEndTime
        totalPauseDurationSeconds
        autoAdvance
        currentStructure {
          id
          tournamentId
          levelNumber
          smallBlind
          bigBlind
          ante
          durationMinutes
          isBreak
          breakDurationMinutes
        }
        nextStructure {
          id
          tournamentId
          levelNumber
          smallBlind
          bigBlind
          ante
          durationMinutes
          isBreak
          breakDurationMinutes
        }
      }
    }
  `)

  const advanceLevelMutation = useGraphQLMutation<AdvanceTournamentLevelResponse>(`
    mutation AdvanceTournamentLevel($tournamentId: ID!) {
      advanceTournamentLevel(tournamentId: $tournamentId) {
        id
        tournamentId
        status
        currentLevel
        timeRemainingSeconds
        levelStartedAt
        levelEndTime
        totalPauseDurationSeconds
        autoAdvance
        currentStructure {
          id
          tournamentId
          levelNumber
          smallBlind
          bigBlind
          ante
          durationMinutes
          isBreak
          breakDurationMinutes
        }
        nextStructure {
          id
          tournamentId
          levelNumber
          smallBlind
          bigBlind
          ante
          durationMinutes
          isBreak
          breakDurationMinutes
        }
      }
    }
  `)

  // Clock control functions
  const startClock = async () => {
    try {
      await startMutation.mutate({ tournamentId })
    } catch (err) {
      console.error('Failed to start tournament clock:', err)
    }
  }

  const pauseClock = async () => {
    try {
      await pauseMutation.mutate({ tournamentId })
    } catch (err) {
      console.error('Failed to pause tournament clock:', err)
    }
  }

  const resumeClock = async () => {
    try {
      await resumeMutation.mutate({ tournamentId })
    } catch (err) {
      console.error('Failed to resume tournament clock:', err)
    }
  }

  const advanceLevel = async () => {
    try {
      await advanceLevelMutation.mutate({ tournamentId })
    } catch (err) {
      console.error('Failed to advance tournament level:', err)
    }
  }

  // For previous level, we need a different mutation (not provided in your list)
  // This would need to be implemented on the backend
  const previousLevel = () => {
    console.warn('Previous level mutation not yet implemented on backend')
  }

  // Smart start/pause toggle
  const toggleClock = async () => {
    if (status.value === 'running') {
      await pauseClock()
    } else if (status.value === 'paused') {
      await resumeClock()
    } else {
      await startClock()
    }
  }

  return {
    // Clock state
    timeRemaining,
    running,
    currentLevel,
    smallBlind,
    bigBlind,
    ante,
    isBreak,
    nextLevel,
    status,
    
    // Formatted values
    blindsText,
    nextBlindsText,
    
    // Connection state
    connected,
    loading,
    error,
    
    // Connection controls
    connect,
    disconnect,
    reconnect,
    
    // Clock controls
    startClock,
    pauseClock,
    resumeClock,
    toggleClock,
    advanceLevel,
    previousLevel,
    
    // Mutation states
    startLoading: startMutation.loading,
    pauseLoading: pauseMutation.loading,
    resumeLoading: resumeMutation.loading,
    advanceLoading: advanceLevelMutation.loading
  }
}