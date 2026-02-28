<template>
  <div v-if="isOpen" class="pp-modal-overlay">
    <!-- Backdrop -->
    <div class="pp-modal-backdrop qr-backdrop-dark print-hidden" @click="close"></div>

    <!-- Modal Content -->
    <div class="pp-modal-content pp-modal-content--lg qr-modal-content">
      <!-- Header -->
      <div class="pp-modal-header print-hidden">
        <h2 class="qr-modal-title">{{ t('qr.tournament.title') }}</h2>
        <button @click="close" class="pp-close-button">
          <IonIcon :icon="closeOutline" class="qr-modal-close-icon" />
        </button>
      </div>

      <!-- Content -->
      <div class="pp-modal-body">
        <!-- Tournament Info -->
        <div class="qr-tournament-info">
          <p class="qr-tournament-name">{{ tournamentName }}</p>
          <p class="qr-tournament-date">{{ formattedDate }}</p>
          <p v-if="clubName" class="qr-tournament-date">{{ clubName }}</p>
        </div>

        <!-- Instructions -->
        <p class="qr-instructions">
          {{ t('qr.tournament.instructions') }}
        </p>

        <!-- QR Code Display -->
        <div v-if="qrCodeDataUrl" class="qr-display">
          <!-- QR Code Image -->
          <div class="qr-code-wrapper">
            <img
              :src="qrCodeDataUrl"
              :alt="t('qr.tournament.qrCodeAlt')"
              class="qr-code-image"
            />
          </div>

          <!-- Manual Code (Fallback) -->
          <div class="qr-manual-code print-hidden">
            <p class="qr-manual-code-label">{{ t('qr.tournament.manualCode') }}</p>
            <div class="qr-manual-code-row">
              <code class="qr-manual-code-value">
                {{ manualCode }}
              </code>
              <button
                @click="copyToClipboard"
                class="qr-copy-button"
                :title="t('qr.tournament.copy')"
              >
                <IonIcon
                  :icon="copied ? checkmarkOutline : copyOutline"
                  :class="['qr-copy-icon', copied ? 'qr-copy-icon--success' : 'qr-copy-icon--gold']"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-else class="qr-loading">
          <IonIcon :icon="qrCodeOutline" class="qr-loading-icon pp-animate-pulse" />
          <p class="qr-loading-text">{{ t('qr.tournament.generating') }}</p>
        </div>

        <!-- Error State -->
        <div v-if="errorMessage" class="qr-error">
          <div class="qr-error-content">
            <IonIcon :icon="alertCircleOutline" class="qr-error-icon" />
            <span class="qr-error-text">{{ errorMessage }}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="pp-modal-footer print-hidden">
        <button @click="printQR" class="qr-footer-btn pp-action-button pp-action-button--primary">
          <IonIcon :icon="printOutline" class="qr-footer-btn-icon" />
          {{ t('qr.tournament.print') }}
        </button>
        <button @click="close" class="qr-footer-btn pp-action-button pp-action-button--secondary">
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
  alertCircleOutline,
  printOutline
} from 'ionicons/icons'
import QRCode from 'qrcode'

const props = defineProps<{
  isOpen: boolean
  tournamentId: string
  tournamentName: string
  tournamentDate: string
}>()

const emit = defineEmits<{
  'close': []
}>()

const { t, locale } = useI18n()
const clubStore = useClubStore()

// State
const qrCodeDataUrl = ref('')
const manualCode = ref('')
const errorMessage = ref('')
const copied = ref(false)

// Computed
const clubName = computed(() => clubStore.club?.name || '')

const formattedDate = computed(() => {
  if (!props.tournamentDate) return ''
  return new Date(props.tournamentDate).toLocaleString(locale.value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Generate QR code when modal opens or props change
watch([() => props.isOpen, () => props.tournamentId], async ([isOpen, tournamentId]) => {
  if (isOpen && tournamentId) {
    await generateTournamentCode()
  } else {
    qrCodeDataUrl.value = ''
    manualCode.value = ''
    errorMessage.value = ''
    copied.value = false
  }
}, { immediate: true })

const generateTournamentCode = async () => {
  try {
    errorMessage.value = ''
    const code = `TOURNAMENT:${props.tournamentId}`
    manualCode.value = code

    qrCodeDataUrl.value = await QRCode.toDataURL(code, {
      width: 400,
      margin: 2,
      color: {
        dark: '#18181a',
        light: '#ffffff'
      }
    })
  } catch (err: any) {
    console.error('Failed to generate QR code:', err)
    errorMessage.value = t('qr.tournament.error')
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(manualCode.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
  }
}

const printQR = () => {
  window.print()
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.qr-backdrop-dark {
  background-color: rgba(0, 0, 0, 0.8);
}

.qr-modal-content {
  box-shadow: var(--pp-shadow-xl);
}

.qr-modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--pp-text-primary);
}

.qr-modal-close-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.qr-tournament-info {
  margin-bottom: 1rem;
  text-align: center;
}

.qr-tournament-name {
  color: var(--pp-accent-gold);
  font-weight: 700;
  font-size: 1.25rem;
}

.qr-tournament-date {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.qr-instructions {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  text-align: center;
  margin-bottom: 1rem;
}

.qr-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.qr-code-wrapper {
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: var(--pp-shadow-lg);
}

.qr-code-image {
  width: 300px;
  height: 300px;
}

.qr-manual-code {
  width: 100%;
  background-color: var(--pp-bg-primary);
  border: 1px solid var(--pp-border);
  border-radius: 0.5rem;
  padding: 1rem;
}

.qr-manual-code-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  text-align: center;
  margin-bottom: 0.5rem;
}

.qr-manual-code-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.qr-manual-code-value {
  color: var(--pp-accent-gold);
  font-size: 0.875rem;
  font-family: var(--pp-font-mono);
  flex: 1;
  text-align: center;
  word-break: break-all;
}

.qr-copy-button {
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.15s ease;
  cursor: pointer;
}

.qr-copy-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.qr-copy-icon {
  width: 1.25rem;
  height: 1.25rem;
  transition: color 0.15s ease;
}

.qr-copy-icon--gold {
  color: var(--pp-accent-gold);
}

.qr-copy-icon--success {
  color: var(--pp-green-400);
}

.qr-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
}

.qr-loading-icon {
  width: 4rem;
  height: 4rem;
  color: var(--pp-accent-gold);
}

.qr-loading-text {
  color: rgba(255, 255, 255, 0.6);
}

.qr-error {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
}

.qr-error-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--pp-red-400);
}

.qr-error-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.qr-error-text {
  font-size: 0.875rem;
}

.qr-footer-btn {
  flex: 1;
}

.qr-footer-btn-icon {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.5rem;
}

.print-hidden {
  /* Visible by default, hidden in print */
}

@media print {
  .print-hidden {
    display: none !important;
  }

  .qr-modal-content {
    position: static !important;
    max-width: none !important;
    background: white !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  .qr-tournament-name {
    color: #000000;
    font-size: 1.875rem;
  }

  .qr-tournament-date {
    color: #4b5563;
    font-size: 1.125rem;
  }

  .qr-instructions {
    color: #1f2937;
    font-size: 1.125rem;
    margin-bottom: 2rem;
  }

  .qr-tournament-info {
    margin-bottom: 2rem;
  }

  .qr-code-wrapper {
    box-shadow: none;
    padding: 2rem;
  }

  .qr-code-image {
    width: 400px;
    height: 400px;
  }
}
</style>
