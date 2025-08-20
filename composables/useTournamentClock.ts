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