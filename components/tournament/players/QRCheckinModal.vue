<template>
  <div v-if="isOpen" class="pp-modal-overlay">
    <!-- Backdrop -->
    <div class="pp-modal-backdrop qr-backdrop-dark" @click="close"></div>

    <!-- Modal Content -->
    <div class="pp-modal-content pp-modal-content--md">
      <!-- Header -->
      <div class="pp-modal-header">
        <h2 class="qr-checkin-title">{{ t('qr.generate.title') }}</h2>
        <button @click="close" class="pp-close-button">
          <IonIcon :icon="closeOutline" class="qr-checkin-close-icon" />
        </button>
      </div>

      <!-- Content -->
      <div class="pp-modal-body">
        <!-- Player Info -->
        <div v-if="playerName" class="qr-checkin-player-info">
          <p class="qr-checkin-player-label">{{ t('qr.generate.playerName') }}</p>
          <p class="qr-checkin-player-name">{{ playerName }}</p>
        </div>

        <!-- Instructions -->
        <p class="qr-checkin-instructions">
          {{ t('qr.generate.instructions') }}
        </p>

        <!-- QR Code Display -->
        <div v-if="qrCodeDataUrl" class="qr-checkin-display">
          <!-- QR Code Image -->
          <div class="qr-checkin-code-wrapper">
            <img
              :src="qrCodeDataUrl"
              :alt="t('qr.generate.qrCodeAlt')"
              class="qr-checkin-code-image"
            />
          </div>

          <!-- Manual Code (Fallback) -->
          <div class="qr-checkin-manual-code">
            <p class="qr-checkin-manual-label">{{ t('qr.generate.manualCode') }}</p>
            <div class="qr-checkin-manual-row">
              <code class="qr-checkin-manual-value">
                {{ manualCode }}
              </code>
              <button
                @click="copyToClipboard"
                class="qr-checkin-copy-button"
                :title="t('qr.generate.copy')"
              >
                <IonIcon
                  :icon="copied ? checkmarkOutline : copyOutline"
                  :class="['qr-checkin-copy-icon', copied ? 'qr-checkin-copy-icon--success' : 'qr-checkin-copy-icon--gold']"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-else class="qr-checkin-loading">
          <IonIcon :icon="qrCodeOutline" class="qr-checkin-loading-icon pp-animate-pulse" />
          <p class="qr-checkin-loading-text">{{ t('qr.generate.generating') }}</p>
        </div>

        <!-- Error State -->
        <div v-if="errorMessage" class="qr-checkin-error">
          <div class="qr-checkin-error-content">
            <IonIcon :icon="alertCircleOutline" class="qr-checkin-error-icon" />
            <span class="qr-checkin-error-text">{{ errorMessage }}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="pp-modal-footer">
        <button @click="close" class="qr-checkin-close-btn pp-action-button pp-action-button--secondary">
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
.qr-backdrop-dark {
  background-color: rgba(0, 0, 0, 0.8);
}

.qr-checkin-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--pp-text-primary);
}

.qr-checkin-close-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.qr-checkin-player-info {
  margin-bottom: 1rem;
  text-align: center;
}

.qr-checkin-player-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.qr-checkin-player-name {
  color: var(--pp-text-primary);
  font-weight: 600;
  font-size: 1.125rem;
}

.qr-checkin-instructions {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  text-align: center;
  margin-bottom: 1rem;
}

.qr-checkin-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.qr-checkin-code-wrapper {
  background-color: #ffffff;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: var(--pp-shadow-lg);
}

.qr-checkin-code-image {
  width: 16rem;
  height: 16rem;
}

.qr-checkin-manual-code {
  width: 100%;
  background-color: var(--pp-bg-primary);
  border: 1px solid var(--pp-border);
  border-radius: 0.5rem;
  padding: 1rem;
}

.qr-checkin-manual-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  text-align: center;
  margin-bottom: 0.5rem;
}

.qr-checkin-manual-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.qr-checkin-manual-value {
  color: var(--pp-accent-gold);
  font-size: 0.875rem;
  font-family: var(--pp-font-mono);
  flex: 1;
  text-align: center;
  word-break: break-all;
}

.qr-checkin-copy-button {
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.15s ease;
  cursor: pointer;
}

.qr-checkin-copy-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.qr-checkin-copy-icon {
  width: 1.25rem;
  height: 1.25rem;
  transition: color 0.15s ease;
}

.qr-checkin-copy-icon--gold {
  color: var(--pp-accent-gold);
}

.qr-checkin-copy-icon--success {
  color: var(--pp-green-400);
}

.qr-checkin-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
}

.qr-checkin-loading-icon {
  width: 4rem;
  height: 4rem;
  color: var(--pp-accent-gold);
}

.qr-checkin-loading-text {
  color: rgba(255, 255, 255, 0.6);
}

.qr-checkin-error {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
}

.qr-checkin-error-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--pp-red-400);
}

.qr-checkin-error-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.qr-checkin-error-text {
  font-size: 0.875rem;
}

.qr-checkin-close-btn {
  width: 100%;
}
</style>
