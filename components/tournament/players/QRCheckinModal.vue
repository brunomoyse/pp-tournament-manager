<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="close"></div>

    <!-- Modal Content -->
    <div class="relative bg-pp-bg-secondary rounded-2xl shadow-xl border border-pp-border w-full max-w-md">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-pp-border">
        <h2 class="text-lg font-bold text-pp-text-primary">QR Check-in</h2>
        <button @click="close" class="text-white/60 hover:text-white transition-colors">
          <IonIcon :icon="closeOutline" class="w-6 h-6" />
        </button>
      </div>

      <!-- Scanner Container -->
      <div class="p-4">
        <!-- Instructions -->
        <p class="text-white/60 text-sm text-center mb-4">
          Point camera at player's QR code to check them in
        </p>

        <!-- QR Reader -->
        <div id="qr-reader" class="w-full rounded-lg overflow-hidden bg-black"></div>

        <!-- Status Messages -->
        <div v-if="status" class="mt-4">
          <!-- Scanning -->
          <div v-if="status === 'scanning'" class="flex items-center justify-center gap-2 text-pp-accent-gold">
            <IonIcon :icon="scanOutline" class="w-5 h-5 animate-pulse" />
            <span>Scanning...</span>
          </div>

          <!-- Processing -->
          <div v-else-if="status === 'processing'" class="flex items-center justify-center gap-2 text-pp-accent-gold">
            <IonIcon :icon="refreshOutline" class="w-5 h-5 animate-spin" />
            <span>Checking in player...</span>
          </div>

          <!-- Success -->
          <div v-else-if="status === 'success'" class="flex items-center justify-center gap-2 text-green-400">
            <IonIcon :icon="checkmarkCircleOutline" class="w-5 h-5" />
            <span>{{ successMessage }}</span>
          </div>

          <!-- Error -->
          <div v-else-if="status === 'error'" class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div class="flex items-center gap-2 text-red-400">
              <IonIcon :icon="alertCircleOutline" class="w-5 h-5" />
              <span class="text-sm">{{ errorMessage }}</span>
            </div>
            <button @click="resumeScanning" class="mt-2 text-pp-accent-gold text-sm hover:underline">
              Try again
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-pp-border">
        <button @click="close" class="w-full pp-action-button pp-action-button--secondary">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { closeOutline, scanOutline, refreshOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { AssignmentStrategy } from '@/types/seating'

const props = defineProps<{
  isOpen: boolean
  tournamentId: string
}>()

const emit = defineEmits<{
  'close': []
  'checkedIn': [data: { registrationId: string; result: any }]
}>()

// State
const status = ref<'scanning' | 'processing' | 'success' | 'error' | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
let scanner: Html5Qrcode | null = null

// Start scanner when modal opens
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    startScanner()
  } else {
    stopScanner()
  }
})

const startScanner = async () => {
  try {
    status.value = 'scanning'
    errorMessage.value = ''

    // Create scanner instance
    scanner = new Html5Qrcode('qr-reader')

    // Start scanning
    await scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      onScanSuccess,
      onScanFailure
    )
  } catch (err: any) {
    console.error('Failed to start scanner:', err)
    status.value = 'error'
    errorMessage.value = err.message || 'Failed to access camera. Please ensure camera permissions are granted.'
  }
}

const stopScanner = async () => {
  if (scanner) {
    try {
      const state = scanner.getState()
      if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
        await scanner.stop()
      }
    } catch (err) {
      console.warn('Error stopping scanner:', err)
    }
    scanner = null
  }
  status.value = null
}

const onScanSuccess = async (decodedText: string) => {
  // Pause scanning while processing
  if (scanner) {
    try {
      await scanner.pause()
    } catch (e) {
      // Ignore pause errors
    }
  }

  status.value = 'processing'

  try {
    // The decodedText is the registration ID
    const registrationId = decodedText.trim()

    // Call check-in mutation with registration ID
    const result = await GqlCheckInPlayer({
      input: {
        tournamentId: props.tournamentId,
        registrationId: registrationId,
        autoAssign: true,
        assignmentStrategy: AssignmentStrategy.BALANCED
      }
    })

    if (result?.checkInPlayer) {
      status.value = 'success'
      successMessage.value = result.checkInPlayer.message || 'Player checked in successfully!'

      emit('checkedIn', { registrationId, result: result.checkInPlayer })

      // Auto-close after brief delay
      setTimeout(() => {
        close()
      }, 1500)
    }
  } catch (err: any) {
    console.error('Check-in failed:', err)
    status.value = 'error'
    errorMessage.value = err.message || 'Failed to check in player. Invalid QR code or player not registered.'
  }
}

const onScanFailure = (_error: string) => {
  // QR code not detected - this is normal, just keep scanning
}

const resumeScanning = async () => {
  if (scanner) {
    try {
      await scanner.resume()
      status.value = 'scanning'
      errorMessage.value = ''
    } catch (e) {
      // If resume fails, restart the scanner
      await stopScanner()
      await nextTick()
      await startScanner()
    }
  }
}

const close = () => {
  stopScanner()
  emit('close')
}

// Cleanup on unmount
onUnmounted(() => {
  stopScanner()
})
</script>

<style scoped>
#qr-reader {
  min-height: 300px;
}

/* Override html5-qrcode default styles */
:deep(#qr-reader__scan_region) {
  background: #000;
}

:deep(#qr-reader__dashboard_section_csr button) {
  background: #fee78a !important;
  color: #18181a !important;
  border-radius: 8px !important;
  padding: 8px 16px !important;
}
</style>
