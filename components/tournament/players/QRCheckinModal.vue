<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="close"></div>

    <!-- Modal Content -->
    <div class="relative bg-pp-bg-secondary rounded-2xl shadow-xl border border-pp-border w-full max-w-md">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-pp-border">
        <h2 class="text-lg font-bold text-pp-text-primary">{{ t('qr.generate.title') }}</h2>
        <button @click="close" class="text-white/60 hover:text-white transition-colors">
          <IonIcon :icon="closeOutline" class="w-6 h-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Player Info -->
        <div v-if="playerName" class="mb-4 text-center">
          <p class="text-white/60 text-sm mb-1">{{ t('qr.generate.playerName') }}</p>
          <p class="text-pp-text-primary font-semibold text-lg">{{ playerName }}</p>
        </div>

        <!-- Instructions -->
        <p class="text-white/60 text-sm text-center mb-4">
          {{ t('qr.generate.instructions') }}
        </p>

        <!-- QR Code Display -->
        <div v-if="qrCodeDataUrl" class="flex flex-col items-center gap-4">
          <!-- QR Code Image -->
          <div class="bg-white p-4 rounded-lg shadow-lg">
            <img
              :src="qrCodeDataUrl"
              :alt="t('qr.generate.qrCodeAlt')"
              class="w-64 h-64"
            />
          </div>

          <!-- Manual Code (Fallback) -->
          <div class="w-full bg-pp-bg-primary border border-pp-border rounded-lg p-4">
            <p class="text-white/60 text-xs text-center mb-2">{{ t('qr.generate.manualCode') }}</p>
            <div class="flex items-center justify-between gap-2">
              <code class="text-pp-accent-gold text-sm font-mono flex-1 text-center">
                {{ manualCode }}
              </code>
              <button
                @click="copyToClipboard"
                class="p-2 hover:bg-white/10 rounded transition-colors"
                :title="t('qr.generate.copy')"
              >
                <IonIcon
                  :icon="copied ? checkmarkOutline : copyOutline"
                  :class="[
                    'w-5 h-5 transition-colors',
                    copied ? 'text-green-400' : 'text-pp-accent-gold'
                  ]"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-else class="flex flex-col items-center gap-4 py-8">
          <IonIcon :icon="qrCodeOutline" class="w-16 h-16 text-pp-accent-gold animate-pulse" />
          <p class="text-white/60">{{ t('qr.generate.generating') }}</p>
        </div>

        <!-- Error State -->
        <div v-if="errorMessage" class="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div class="flex items-center gap-2 text-red-400">
            <IonIcon :icon="alertCircleOutline" class="w-5 h-5" />
            <span class="text-sm">{{ errorMessage }}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-pp-border">
        <button @click="close" class="w-full pp-action-button pp-action-button--secondary">
          {{ t('common.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  closeOutline,
  qrCodeOutline,
  copyOutline,
  checkmarkOutline,
  alertCircleOutline
} from 'ionicons/icons'
import QRCode from 'qrcode'

const props = defineProps<{
  isOpen: boolean
  registrationId: string
  playerId: string
  playerName?: string
  tournamentId: string
}>()

const emit = defineEmits<{
  'close': []
}>()

const { t } = useI18n()

// State
const qrCodeDataUrl = ref('')
const manualCode = ref('')
const errorMessage = ref('')
const copied = ref(false)

// Generate QR code when modal opens or props change
watch([() => props.isOpen, () => props.registrationId], async ([isOpen, registrationId]) => {
  if (isOpen && registrationId) {
    await generateCheckInCode()
  } else {
    // Reset state when modal closes
    qrCodeDataUrl.value = ''
    manualCode.value = ''
    errorMessage.value = ''
    copied.value = false
  }
}, { immediate: true })

const generateCheckInCode = async () => {
  try {
    errorMessage.value = ''

    // Generate the check-in code
    // Format: CHECKIN:registrationId
    const code = `CHECKIN:${props.registrationId}`
    manualCode.value = code

    // Generate QR code as data URL
    qrCodeDataUrl.value = await QRCode.toDataURL(code, {
      width: 256,
      margin: 2,
      color: {
        dark: '#18181a',  // Dark color for QR code
        light: '#ffffff'  // White background
      }
    })
  } catch (err: any) {
    console.error('Failed to generate QR code:', err)
    errorMessage.value = t('qr.generate.error')
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(manualCode.value)
    copied.value = true

    // Reset copied state after 2 seconds
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
  }
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
/* QR Code container */
.bg-white {
  background-color: white;
}

/* Manual code */
code {
  word-break: break-all;
}
</style>
