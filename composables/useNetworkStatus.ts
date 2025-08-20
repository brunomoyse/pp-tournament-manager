import { ref, onMounted, onUnmounted } from 'vue'
import { Network } from '@capacitor/network'

export function useNetworkStatus() {
  const isOnline = ref(true)
  const connectionStatus = ref<'connected' | 'disconnected' | 'reconnecting'>('connected')
  const connectionType = ref<string>('unknown')
  
  let networkListener: any = null
  let reconnectTimer: NodeJS.Timeout | null = null
  
  const updateNetworkStatus = async () => {
    try {
      const status = await Network.getStatus()
      isOnline.value = status.connected
      connectionType.value = status.connectionType
      
      if (status.connected) {
        connectionStatus.value = 'connected'
        // Clear any existing reconnect timer
        if (reconnectTimer) {
          clearTimeout(reconnectTimer)
          reconnectTimer = null
        }
      } else {
        connectionStatus.value = 'disconnected'
        // Start reconnecting state after a brief delay
        setTimeout(() => {
          if (!isOnline.value) {
            connectionStatus.value = 'reconnecting'
          }
        }, 1000)
      }
    } catch (error) {
      // Fallback for web/development
      console.log('Network API not available, using browser fallback')
      isOnline.value = navigator.onLine
      connectionStatus.value = navigator.onLine ? 'connected' : 'disconnected'
    }
  }
  
  const startNetworkListener = async () => {
    try {
      // Listen for network status changes
      networkListener = await Network.addListener('networkStatusChange', (status) => {
        isOnline.value = status.connected
        connectionType.value = status.connectionType
        
        if (status.connected) {
          connectionStatus.value = 'connected'
          if (reconnectTimer) {
            clearTimeout(reconnectTimer)
            reconnectTimer = null
          }
        } else {
          connectionStatus.value = 'disconnected'
          // Show reconnecting after 1 second
          setTimeout(() => {
            if (!isOnline.value) {
              connectionStatus.value = 'reconnecting'
            }
          }, 1000)
        }
      })
      
      // Initial status check
      await updateNetworkStatus()
    } catch (error) {
      // Fallback for web/development - use browser events
      console.log('Using browser network events as fallback')
      
      const handleOnline = () => {
        isOnline.value = true
        connectionStatus.value = 'connected'
      }
      
      const handleOffline = () => {
        isOnline.value = false
        connectionStatus.value = 'disconnected'
        setTimeout(() => {
          if (!isOnline.value) {
            connectionStatus.value = 'reconnecting'
          }
        }, 1000)
      }
      
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      
      // Store cleanup function
      networkListener = () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
      
      // Initial status
      isOnline.value = navigator.onLine
      connectionStatus.value = navigator.onLine ? 'connected' : 'disconnected'
    }
  }
  
  const stopNetworkListener = () => {
    if (networkListener) {
      if (typeof networkListener === 'function') {
        // Browser fallback cleanup
        networkListener()
      } else {
        // Capacitor cleanup
        networkListener.remove()
      }
      networkListener = null
    }
    
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }
  
  onMounted(() => {
    startNetworkListener()
  })
  
  onUnmounted(() => {
    stopNetworkListener()
  })
  
  return {
    isOnline,
    connectionStatus,
    connectionType,
    updateNetworkStatus,
    startNetworkListener,
    stopNetworkListener
  }
}