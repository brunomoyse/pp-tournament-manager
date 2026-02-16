<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal"></div>

    <!-- Modal Content -->
    <div class="relative bg-pp-bg-secondary rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-pp-border shadow-2xl" style="background-color: #24242a !important;">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-pp-border/50 flex-shrink-0">
        <div>
          <h2 class="text-xl font-bold text-pp-text-primary">{{ t('results.title') }}</h2>
          <p class="text-sm text-white/60 mt-1">{{ stepLabels[currentStep] }}</p>
        </div>
        <button
          @click="closeModal"
          class="p-2 text-white/60 hover:text-white rounded-lg hover:bg-pp-bg-primary/50 transition-colors"
        >
          <IonIcon :icon="closeOutline" class="w-5 h-5" />
        </button>
      </div>

      <!-- Step Indicator -->
      <div class="flex items-center gap-2 px-6 py-3 border-b border-pp-border/30 flex-shrink-0">
        <div
          v-for="step in 3"
          :key="step"
          :class="[
            'flex-1 h-1.5 rounded-full transition-all',
            step <= currentStep ? 'bg-pp-accent-gold' : 'bg-white/10'
          ]"
        ></div>
      </div>

      <!-- Scrollable Content -->
      <div class="overflow-y-auto flex-1 p-6">
        <!-- Step 1: Player Ordering -->
        <div v-if="currentStep === 1">
          <p class="text-white/70 text-sm mb-4">{{ t('results.step1Desc') }}</p>

          <div v-if="orderedPlayers.length === 0" class="text-center py-8 text-white/60">
            {{ t('results.noRemainingPlayers') }}
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(player, index) in orderedPlayers"
              :key="player.userId"
              class="flex items-center gap-3 p-3 bg-pp-bg-primary/50 rounded-lg border border-pp-border/30"
            >
              <!-- Position Number -->
              <div class="w-8 h-8 rounded-full bg-pp-accent-gold/20 flex items-center justify-center text-pp-accent-gold font-bold text-sm flex-shrink-0">
                {{ index + 1 }}
              </div>

              <!-- Player Info -->
              <div class="flex-1 min-w-0">
                <div class="font-medium text-white truncate">{{ player.name }}</div>
              </div>

              <!-- Move Buttons -->
              <div class="flex items-center gap-1 flex-shrink-0">
                <button
                  @click="movePlayer(index, -1)"
                  :disabled="index === 0"
                  :class="[
                    'p-1.5 rounded-lg transition-colors',
                    index === 0 ? 'text-white/20 cursor-not-allowed' : 'text-white/60 hover:text-white hover:bg-pp-bg-primary'
                  ]"
                >
                  <IonIcon :icon="chevronUpOutline" class="w-4 h-4" />
                </button>
                <button
                  @click="movePlayer(index, 1)"
                  :disabled="index === orderedPlayers.length - 1"
                  :class="[
                    'p-1.5 rounded-lg transition-colors',
                    index === orderedPlayers.length - 1 ? 'text-white/20 cursor-not-allowed' : 'text-white/60 hover:text-white hover:bg-pp-bg-primary'
                  ]"
                >
                  <IonIcon :icon="chevronDownOutline" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Payout Preview -->
        <div v-if="currentStep === 2">
          <p class="text-white/70 text-sm mb-4">{{ t('results.step2Desc') }}</p>

          <!-- Payout Template Selector -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-white/70 mb-2">{{ t('results.payoutTemplate') }}</label>
            <select
              v-model="selectedPayoutTemplateId"
              @change="applyPayoutTemplate"
              class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white text-sm focus:ring-1 focus:ring-pp-accent-gold"
            >
              <option value="">{{ t('results.useExistingPayout') }}</option>
              <option
                v-for="tmpl in availablePayoutTemplates"
                :key="tmpl.id"
                :value="tmpl.id"
              >
                {{ tmpl.name }} ({{ tmpl.minPlayers }}-{{ tmpl.maxPlayers || '∞' }} {{ t('headings.players').toLowerCase() }})
              </option>
            </select>
          </div>

          <!-- Payout Table -->
          <div class="space-y-2 mb-6">
            <div
              v-for="(player, index) in orderedPlayers"
              :key="player.userId"
              class="flex items-center justify-between p-3 bg-pp-bg-primary/50 rounded-lg border border-pp-border/30"
            >
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-full bg-pp-accent-gold/20 flex items-center justify-center text-pp-accent-gold font-bold text-xs">
                  {{ index + 1 }}
                </div>
                <span class="text-white text-sm">{{ player.name }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span v-if="getPayoutForPosition(index + 1)?.percentage" class="text-white/40 text-xs">
                  {{ getPayoutForPosition(index + 1)?.percentage?.toFixed(1) }}%
                </span>
                <span class="font-semibold text-pp-text-primary text-sm">
                  {{ formatPrice(getPayoutForPosition(index + 1)?.amountCents || 0, locale) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Deal Section -->
          <div class="border-t border-pp-border/30 pt-4">
            <label class="flex items-center gap-3 cursor-pointer mb-4">
              <input
                v-model="includeDeal"
                type="checkbox"
                class="w-4 h-4 rounded border-pp-border bg-pp-bg-primary text-pp-accent-gold focus:ring-pp-accent-gold"
              />
              <span class="text-white font-medium">{{ t('results.includeDeal') }}</span>
            </label>

            <div v-if="includeDeal" class="space-y-4 pl-7">
              <!-- Deal Type -->
              <div>
                <label class="block text-sm font-medium text-white/70 mb-2">{{ t('results.dealType') }}</label>
                <div class="flex gap-2">
                  <button
                    v-for="type in dealTypes"
                    :key="type.value"
                    type="button"
                    @click="deal.dealType = type.value"
                    :class="[
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      deal.dealType === type.value
                        ? 'bg-pp-accent-gold/20 text-pp-accent-gold border-pp-accent-gold/40'
                        : 'bg-pp-bg-primary border-pp-border text-white/70'
                    ]"
                  >
                    {{ type.label }}
                  </button>
                </div>
              </div>

              <!-- Affected Positions -->
              <div>
                <label class="block text-sm font-medium text-white/70 mb-2">{{ t('results.affectedPositions') }}</label>
                <div class="flex flex-wrap gap-2">
                  <label
                    v-for="(player, index) in orderedPlayers"
                    :key="player.userId"
                    class="flex items-center gap-2 px-3 py-1.5 bg-pp-bg-primary rounded-lg border border-pp-border cursor-pointer hover:border-pp-accent-gold/40 text-sm"
                  >
                    <input
                      v-model="deal.affectedPositions"
                      :value="index + 1"
                      type="checkbox"
                      class="w-3 h-3 rounded border-pp-border bg-pp-bg-primary text-pp-accent-gold focus:ring-pp-accent-gold"
                    />
                    <span class="text-white/80">#{{ index + 1 }} {{ player.name }}</span>
                  </label>
                </div>
              </div>

              <!-- Custom Payouts (for CUSTOM deal type) -->
              <div v-if="deal.dealType === 'CUSTOM'" class="space-y-2">
                <label class="block text-sm font-medium text-white/70 mb-2">{{ t('results.customAmount') }}</label>
                <div
                  v-for="pos in deal.affectedPositions"
                  :key="pos"
                  class="flex items-center gap-3"
                >
                  <span class="text-white/60 text-sm min-w-[100px]">#{{ pos }} {{ orderedPlayers[pos - 1]?.name }}</span>
                  <div class="relative flex-1">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">&euro;</span>
                    <input
                      v-model.number="customPayoutAmounts[pos]"
                      type="number"
                      step="0.01"
                      min="0"
                      class="w-full pl-7 pr-3 py-1.5 text-sm bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-1 focus:ring-pp-accent-gold"
                    />
                  </div>
                </div>
              </div>

              <!-- Deal Notes -->
              <div>
                <label class="block text-sm font-medium text-white/70 mb-2">{{ t('results.dealNotes') }}</label>
                <input
                  v-model="deal.notes"
                  type="text"
                  :placeholder="t('results.dealNotesPlaceholder')"
                  class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white text-sm focus:ring-1 focus:ring-pp-accent-gold"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Confirmation -->
        <div v-if="currentStep === 3">
          <p class="text-white/70 text-sm mb-4">{{ t('results.step3Desc') }}</p>

          <div class="bg-pp-bg-primary/50 rounded-lg border border-pp-border/30 p-4 space-y-3">
            <h4 class="font-semibold text-pp-text-primary">{{ t('results.summaryTitle') }}</h4>

            <div
              v-for="(player, index) in orderedPlayers"
              :key="player.userId"
              class="flex items-center justify-between text-sm py-1"
            >
              <div class="flex items-center gap-2">
                <span class="text-pp-accent-gold font-bold">{{ index + 1 }}.</span>
                <span class="text-white">{{ player.name }}</span>
              </div>
              <span class="text-pp-text-primary font-medium">
                {{ formatPrice(getPayoutForPosition(index + 1)?.amountCents || 0, locale) }}
              </span>
            </div>

            <div v-if="includeDeal" class="pt-3 border-t border-pp-border/30">
              <div class="text-sm text-white/60">
                {{ t('results.deal') }}: {{ dealTypes.find(d => d.value === deal.dealType)?.label }}
                ({{ deal.affectedPositions.length }} {{ t('results.affectedPositions').toLowerCase() }})
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Banner -->
      <div v-if="errorMessage" class="mx-6 mb-2 flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
        <IonIcon :icon="alertCircleOutline" class="w-5 h-5 text-red-400 flex-shrink-0" />
        <div class="flex-1">
          <p class="text-red-300 font-medium text-sm">{{ t('results.submitErrorTitle') }}</p>
          <p class="text-red-400/70 text-xs mt-0.5">{{ errorMessage }}</p>
        </div>
        <button @click="errorMessage = ''" class="text-red-400/60 hover:text-red-300 p-1">
          <IonIcon :icon="closeOutline" class="w-4 h-4" />
        </button>
      </div>

      <!-- Footer Navigation -->
      <div class="flex items-center justify-between p-6 border-t border-pp-border/50 flex-shrink-0">
        <button
          v-if="currentStep > 1"
          @click="currentStep--; errorMessage = ''"
          class="pp-action-button pp-action-button--secondary"
        >
          {{ t('results.back') }}
        </button>
        <div v-else></div>

        <button
          v-if="currentStep < 3"
          @click="currentStep++; errorMessage = ''"
          :disabled="currentStep === 1 && orderedPlayers.length === 0"
          class="pp-action-button pp-action-button--primary"
        >
          {{ t('results.next') }}
        </button>
        <button
          v-else
          @click="submitResults"
          :disabled="submitting"
          class="pp-action-button pp-action-button--primary"
        >
          <IonIcon v-if="submitting" :icon="refreshOutline" class="w-4 h-4 animate-spin" />
          {{ submitting ? t('results.submitting') : errorMessage ? t('results.retry') : t('results.confirmSubmit') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { closeOutline, chevronUpOutline, chevronDownOutline, refreshOutline, alertCircleOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { useTournamentStore } from '~/stores/useTournamentStore'
import { formatPrice } from '~/utils'
import type { DealType, PayoutTemplate } from '~/types/tournament'

interface Props {
  isOpen: boolean
  tournamentId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'results-entered': []
}>()

const { t, locale } = useI18n()
const toast = useToast()
const tournamentStore = useTournamentStore()

const currentStep = ref(1)
const submitting = ref(false)
const errorMessage = ref('')
const includeDeal = ref(false)

interface OrderedPlayer {
  userId: string
  name: string
}

const orderedPlayers = ref<OrderedPlayer[]>([])

// Deal state
const deal = ref({
  dealType: 'EVEN_SPLIT' as DealType,
  affectedPositions: [] as number[],
  notes: ''
})

const customPayoutAmounts = ref<Record<number, number>>({})

// Payout template state
const selectedPayoutTemplateId = ref('')
const availablePayoutTemplates = ref<PayoutTemplate[]>([])

const fetchPayoutTemplates = async () => {
  try {
    const playerCount = orderedPlayers.value.length
    if (playerCount > 0) {
      const result = await GqlGetSuitablePayoutTemplates({ playerCount })
      availablePayoutTemplates.value = result?.suitablePayoutTemplates || []
    }
  } catch (error) {
    console.error('Failed to fetch payout templates:', error)
  }
}

const applyPayoutTemplate = () => {
  if (!selectedPayoutTemplateId.value) {
    // Reset to original payout data
    fetchPayoutData()
    return
  }
  const template = availablePayoutTemplates.value.find(t => t.id === selectedPayoutTemplateId.value)
  if (!template) return

  const totalPrize = (tournamentStore.tournament?.buyInCents || 0) * orderedPlayers.value.length
  payoutPositions.value = template.payoutStructure.map(entry => ({
    position: entry.position,
    percentage: entry.percentage,
    amountCents: Math.round(totalPrize * entry.percentage / 100)
  }))
}

const dealTypes = computed(() => [
  { value: 'EVEN_SPLIT' as DealType, label: t('results.evenSplit') },
  { value: 'ICM' as DealType, label: t('results.icm') },
  { value: 'CUSTOM' as DealType, label: t('results.custom') },
])

const stepLabels = computed(() => ({
  1: t('results.step1'),
  2: t('results.step2'),
  3: t('results.step3')
}))

// Fetch payout structure
const payoutPositions = ref<any[]>([])

const fetchPayoutData = async () => {
  try {
    const result = await GqlGetTournamentPayout({ tournamentId: props.tournamentId })
    payoutPositions.value = result?.tournamentPayout?.positions || []
  } catch (error) {
    console.error('Failed to fetch payout data:', error)
  }
}

const getPayoutForPosition = (position: number) => {
  return payoutPositions.value.find(p => p.position === position)
}

// Fetch remaining players when modal opens
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    currentStep.value = 1
    includeDeal.value = false
    deal.value = { dealType: 'EVEN_SPLIT', affectedPositions: [], notes: '' }
    customPayoutAmounts.value = {}
    selectedPayoutTemplateId.value = ''
    availablePayoutTemplates.value = []
    await fetchPlayersAndPayouts()
    await fetchPayoutTemplates()
  }
})

const fetchPlayersAndPayouts = async () => {
  try {
    const [playersResult] = await Promise.all([
      GqlGetTournamentPlayers({ tournamentId: props.tournamentId }),
      fetchPayoutData()
    ])

    // Get remaining players (SEATED + CHECKED_IN)
    const remainingStatuses = ['SEATED', 'CHECKED_IN']
    const players = (playersResult?.tournamentPlayers?.items || [])
      .filter((tp: any) => remainingStatuses.includes(tp.registration.status))
      .map((tp: any) => {
        const firstName = tp.user.firstName || ''
        const lastName = tp.user.lastName || ''
        const displayName = lastName && firstName
          ? `${lastName} ${firstName}`
          : `${firstName} ${lastName}`.trim()
        return {
          userId: tp.user.id,
          name: displayName || tp.user.username || tp.user.email
        }
      })

    orderedPlayers.value = players
  } catch (error) {
    console.error('Failed to fetch remaining players:', error)
  }
}

// Move player up or down
const movePlayer = (index: number, direction: number) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= orderedPlayers.value.length) return

  const players = [...orderedPlayers.value]
  const [removed] = players.splice(index, 1)
  players.splice(newIndex, 0, removed)
  orderedPlayers.value = players
}

// Submit results
const submitResults = async () => {
  if (submitting.value || orderedPlayers.value.length === 0) return

  submitting.value = true
  try {
    const playerPositions = orderedPlayers.value.map((player, index) => ({
      userId: player.userId,
      finalPosition: index + 1
    }))

    const input: any = {
      tournamentId: props.tournamentId,
      playerPositions,
      ...(selectedPayoutTemplateId.value && { payoutTemplateId: selectedPayoutTemplateId.value })
    }

    if (includeDeal.value && deal.value.affectedPositions.length > 0) {
      const dealInput: any = {
        dealType: deal.value.dealType,
        affectedPositions: deal.value.affectedPositions,
        notes: deal.value.notes || undefined
      }

      if (deal.value.dealType === 'CUSTOM') {
        dealInput.customPayouts = deal.value.affectedPositions
          .filter(pos => customPayoutAmounts.value[pos])
          .map(pos => ({
            userId: orderedPlayers.value[pos - 1]?.userId,
            amountCents: Math.round((customPayoutAmounts.value[pos] || 0) * 100)
          }))
      }

      input.deal = dealInput
    }

    await GqlEnterTournamentResults({ input })

    errorMessage.value = ''
    toast.success(t('toast.resultsEnteredSuccess'))
    emit('results-entered')
    closeModal()
  } catch (error: any) {
    console.error('Failed to enter results:', error)
    const msg = error?.gqlErrors?.[0]?.message || error?.message || t('results.submitError')
    errorMessage.value = msg
  } finally {
    submitting.value = false
  }
}

const closeModal = () => {
  emit('close')
}
</script>
