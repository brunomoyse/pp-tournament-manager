<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm print:hidden" @click="close"></div>

    <!-- Modal Content -->
    <div class="relative bg-pp-bg-secondary rounded-2xl shadow-xl border border-pp-border w-full max-w-lg print:max-w-none print:border-none print:shadow-none print:rounded-none print:bg-white">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-pp-border print:hidden">
        <h2 class="text-lg font-bold text-pp-text-primary">{{ t('qr.tournament.title') }}</h2>
        <button @click="close" class="text-white/60 hover:text-white transition-colors">
          <IonIcon :icon="closeOutline" class="w-6 h-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Tournament Info -->
        <div class="mb-4 text-center print:mb-8">
          <p class="text-pp-accent-gold font-bold text-xl print:text-black print:text-3xl">{{ tournamentName }}</p>
          <p class="text-white/60 text-sm mt-1 print:text-gray-600 print:text-lg">{{ formattedDate }}</p>
          <p v-if="clubName" class="text-white/60 text-sm print:text-gray-600 print:text-lg">{{ clubName }}</p>
        </div>

        <!-- Instructions -->
        <p class="text-white/60 text-sm text-center mb-4 print:text-gray-800 print:text-lg print:mb-8">
          {{ t('qr.tournament.instructions') }}
        </p>

        <!-- QR Code Display -->
        <div v-if="qrCodeDataUrl" class="flex flex-col items-center gap-4">
          <!-- QR Code Image -->
          <div class="bg-white p-6 rounded-lg shadow-lg print:shadow-none print:p-8">
            <img
              :src="qrCodeDataUrl"
              :alt="t('qr.tournament.qrCodeAlt')"
              class="w-[300px] h-[300px] print:w-[400px] print:h-[400px]"
            />
          </div>

          <!-- Manual Code (Fallback) -->
          <div class="w-full bg-pp-bg-primary border border-pp-border rounded-lg p-4 print:hidden">
            <p class="text-white/60 text-xs text-center mb-2">{{ t('qr.tournament.manualCode') }}</p>
            <div class="flex items-center justify-between gap-2">
              <code class="text-pp-accent-gold text-sm font-mono flex-1 text-center">
                {{ manualCode }}
              </code>
              <button
                @click="copyToClipboard"
                class="p-2 hover:bg-white/10 rounded transition-colors"
                :title="t('qr.tournament.copy')"
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
          <p class="text-white/60">{{ t('qr.tournament.generating') }}</p>
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
      <div class="p-4 border-t border-pp-border flex gap-3 print:hidden">
        <button @click="printQR" class="flex-1 pp-action-button pp-action-button--primary">
          <IonIcon :icon="printOutline" class="w-5 h-5 mr-2" />
          {{ t('qr.tournament.print') }}
        </button>
        <button @click="close" class="flex-1 pp-action-button pp-action-button--secondary">
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
code {
  word-break: break-all;
}

@media print {
  /* Print-specific overrides */
  :deep(.fixed) {
    position: static !important;
  }

  :deep(.absolute) {
    display: none !important;
  }

  .relative {
    position: static !important;
    max-width: none !important;
    background: white !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }
}
</style>
