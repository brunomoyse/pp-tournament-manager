<template>
  <div v-if="isOpen" class="pp-modal-overlay">
    <!-- Backdrop -->
    <div class="pp-modal-backdrop" @click="closeModal"></div>

    <!-- Modal Content -->
    <div class="pp-modal-content pp-modal-content--2xl modal-flex-container">
      <!-- Header -->
      <div class="pp-modal-header modal-header-shrink">
        <div>
          <h3 class="modal-title">{{ t('results.title') }}</h3>
          <p class="modal-subtitle">{{ stepLabels[currentStep] }}</p>
        </div>
        <button
          @click="closeModal"
          class="pp-close-button"
        >
          <IonIcon :icon="closeOutline" class="icon-md" />
        </button>
      </div>

      <!-- Step Indicator -->
      <div class="step-indicator modal-header-shrink">
        <div
          v-for="step in 3"
          :key="step"
          :class="[
            'step-bar',
            step <= currentStep ? 'step-bar--active' : 'step-bar--inactive'
          ]"
        ></div>
      </div>

      <!-- Scrollable Content -->
      <div class="scrollable-content">
        <!-- Step 1: Player Ordering -->
        <div v-if="currentStep === 1">
          <p class="step-description">{{ t('results.step1Desc') }}</p>

          <div v-if="orderedPlayers.length === 0" class="empty-message">
            {{ t('results.noRemainingPlayers') }}
          </div>

          <div v-else class="player-order-list">
            <div
              v-for="(player, index) in orderedPlayers"
              :key="player.userId"
              class="player-order-row"
            >
              <!-- Position Number -->
              <div class="position-badge">
                {{ index + 1 }}
              </div>

              <!-- Player Info -->
              <div class="player-order-info">
                <div class="player-order-name pp-truncate">{{ player.name }}</div>
              </div>

              <!-- Move Buttons -->
              <div class="move-buttons">
                <button
                  @click="movePlayer(index, -1)"
                  :disabled="index === 0"
                  :class="[
                    'move-button',
                    index === 0 ? 'move-button--disabled' : ''
                  ]"
                >
                  <IonIcon :icon="chevronUpOutline" class="icon-sm" />
                </button>
                <button
                  @click="movePlayer(index, 1)"
                  :disabled="index === orderedPlayers.length - 1"
                  :class="[
                    'move-button',
                    index === orderedPlayers.length - 1 ? 'move-button--disabled' : ''
                  ]"
                >
                  <IonIcon :icon="chevronDownOutline" class="icon-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Payout Preview -->
        <div v-if="currentStep === 2">
          <p class="step-description">{{ t('results.step2Desc') }}</p>

          <!-- Payout Template Selector -->
          <div class="template-selector">
            <label class="pp-label">{{ t('results.payoutTemplate') }}</label>
            <select
              v-model="selectedPayoutTemplateId"
              @change="applyPayoutTemplate"
              class="pp-select"
            >
              <option value="">{{ t('results.useExistingPayout') }}</option>
              <option
                v-for="tmpl in availablePayoutTemplates"
                :key="tmpl.id"
                :value="tmpl.id"
              >
                {{ tmpl.name }} ({{ tmpl.minPlayers }}-{{ tmpl.maxPlayers || '&#x221e;' }} {{ t('headings.players').toLowerCase() }})
              </option>
            </select>
          </div>

          <!-- Payout Table -->
          <div class="payout-list">
            <div
              v-for="(player, index) in orderedPlayers"
              :key="player.userId"
              class="payout-row"
            >
              <div class="payout-row-left">
                <div class="position-badge position-badge--sm">
                  {{ index + 1 }}
                </div>
                <span class="payout-player-name">{{ player.name }}</span>
              </div>
              <div class="payout-row-right">
                <span v-if="getPayoutForPosition(index + 1)?.percentage" class="payout-percentage">
                  {{ getPayoutForPosition(index + 1)?.percentage?.toFixed(1) }}%
                </span>
                <span class="payout-amount">
                  {{ formatPrice(getPayoutForPosition(index + 1)?.amountCents || 0, locale) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Deal Section -->
          <div class="deal-section">
            <label class="deal-toggle">
              <input
                v-model="includeDeal"
                type="checkbox"
                class="deal-checkbox"
              />
              <span class="deal-toggle-label">{{ t('results.includeDeal') }}</span>
            </label>

            <div v-if="includeDeal" class="deal-options">
              <!-- Deal Type -->
              <div>
                <label class="pp-label">{{ t('results.dealType') }}</label>
                <div class="deal-type-options">
                  <button
                    v-for="type in dealTypes"
                    :key="type.value"
                    type="button"
                    @click="deal.dealType = type.value"
                    :class="[
                      'deal-type-button',
                      deal.dealType === type.value ? 'deal-type-button--active' : ''
                    ]"
                  >
                    {{ type.label }}
                  </button>
                </div>
              </div>

              <!-- Affected Positions -->
              <div>
                <label class="pp-label">{{ t('results.affectedPositions') }}</label>
                <div class="affected-positions">
                  <label
                    v-for="(player, index) in orderedPlayers"
                    :key="player.userId"
                    class="affected-position-item"
                  >
                    <input
                      v-model="deal.affectedPositions"
                      :value="index + 1"
                      type="checkbox"
                      class="affected-position-checkbox"
                    />
                    <span class="affected-position-label">#{{ index + 1 }} {{ player.name }}</span>
                  </label>
                </div>
              </div>

              <!-- Custom Payouts (for CUSTOM deal type) -->
              <div v-if="deal.dealType === 'CUSTOM'" class="custom-payouts">
                <label class="pp-label">{{ t('results.customAmount') }}</label>
                <div
                  v-for="pos in deal.affectedPositions"
                  :key="pos"
                  class="custom-payout-row"
                >
                  <span class="custom-payout-label">#{{ pos }} {{ orderedPlayers[pos - 1]?.name }}</span>
                  <div class="custom-payout-input-wrapper">
                    <span class="custom-payout-prefix">&euro;</span>
                    <input
                      v-model.number="customPayoutAmounts[pos]"
                      type="number"
                      step="0.01"
                      min="0"
                      class="pp-input custom-payout-input"
                    />
                  </div>
                </div>
              </div>

              <!-- Deal Notes -->
              <div>
                <label class="pp-label">{{ t('results.dealNotes') }}</label>
                <input
                  v-model="deal.notes"
                  type="text"
                  :placeholder="t('results.dealNotesPlaceholder')"
                  class="pp-input"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Confirmation -->
        <div v-if="currentStep === 3">
          <p class="step-description">{{ t('results.step3Desc') }}</p>

          <div class="summary-card">
            <h4 class="summary-title">{{ t('results.summaryTitle') }}</h4>

            <div class="summary-list">
              <div
                v-for="(player, index) in orderedPlayers"
                :key="player.userId"
                class="summary-row"
              >
                <div class="summary-row-left">
                  <span class="summary-position">{{ index + 1 }}.</span>
                  <span class="summary-name">{{ player.name }}</span>
                </div>
                <span class="summary-amount">
                  {{ formatPrice(getPayoutForPosition(index + 1)?.amountCents || 0, locale) }}
                </span>
              </div>
            </div>

            <div v-if="includeDeal" class="summary-deal">
              <div class="summary-deal-text">
                {{ t('results.deal') }}: {{ dealTypes.find(d => d.value === deal.dealType)?.label }}
                ({{ deal.affectedPositions.length }} {{ t('results.affectedPositions').toLowerCase() }})
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Banner -->
      <div v-if="errorMessage" class="error-banner">
        <IonIcon :icon="alertCircleOutline" class="error-icon" />
        <div class="error-content">
          <p class="error-title">{{ t('results.submitErrorTitle') }}</p>
          <p class="error-detail">{{ errorMessage }}</p>
        </div>
        <button @click="errorMessage = ''" class="error-dismiss">
          <IonIcon :icon="closeOutline" class="icon-sm" />
        </button>
      </div>

      <!-- Footer Navigation -->
      <div class="pp-modal-footer modal-footer-nav modal-header-shrink">
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
          <IonIcon v-if="submitting" :icon="refreshOutline" class="icon-sm pp-animate-spin" />
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
import { TournamentLiveStatus } from '~/types/enums'

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

const stepLabels = computed<Record<number, string>>(() => ({
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
  const removed = players.splice(index, 1)[0]
  if (removed) players.splice(newIndex, 0, removed)
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
          .filter(pos => customPayoutAmounts.value[pos] && orderedPlayers.value[pos - 1])
          .map(pos => ({
            userId: orderedPlayers.value[pos - 1]!.userId,
            amountCents: Math.round((customPayoutAmounts.value[pos] || 0) * 100)
          }))
      }

      input.deal = dealInput
    }

    await GqlEnterTournamentResults({ input })

    // Auto-finish the tournament after results are entered
    await GqlUpdateTournamentStatus({
      input: {
        tournamentId: props.tournamentId,
        liveStatus: TournamentLiveStatus.FINISHED
      }
    })

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

<style scoped>
.modal-flex-container {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow-y: hidden;
}

.modal-header-shrink {
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--pp-text-primary);
}

.modal-subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
}

/* Step Indicator */
.step-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid rgba(84, 84, 95, 0.3);
}

.step-bar {
  flex: 1;
  height: 0.375rem;
  border-radius: 9999px;
  transition: all 0.2s ease;
}

.step-bar--active {
  background-color: var(--pp-accent-gold);
}

.step-bar--inactive {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Scrollable Content */
.scrollable-content {
  overflow-y: auto;
  flex: 1;
  padding: 1.5rem;
}

.step-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.empty-message {
  text-align: center;
  padding: 2rem 0;
  color: rgba(255, 255, 255, 0.6);
}

/* Player Order List (Step 1) */
.player-order-list > * + * {
  margin-top: 0.5rem;
}

.player-order-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: rgba(24, 24, 26, 0.5);
  border-radius: 0.5rem;
  border: 1px solid rgba(84, 84, 95, 0.3);
}

.position-badge {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background-color: rgba(254, 231, 138, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--pp-accent-gold);
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.position-badge--sm {
  width: 1.75rem;
  height: 1.75rem;
  font-size: 0.75rem;
}

.player-order-info {
  flex: 1;
  min-width: 0;
}

.player-order-name {
  font-weight: 500;
  color: #ffffff;
}

.move-buttons {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.move-button {
  padding: 0.375rem;
  border-radius: 0.5rem;
  transition: color 0.15s ease, background-color 0.15s ease;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.move-button:hover:not(:disabled) {
  color: #ffffff;
  background-color: var(--pp-bg-primary);
}

.move-button--disabled,
.move-button:disabled {
  color: rgba(255, 255, 255, 0.2);
  cursor: not-allowed;
}

/* Payout Preview (Step 2) */
.template-selector {
  margin-bottom: 1rem;
}

.payout-list > * + * {
  margin-top: 0.5rem;
}

.payout-list {
  margin-bottom: 1.5rem;
}

.payout-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: rgba(24, 24, 26, 0.5);
  border-radius: 0.5rem;
  border: 1px solid rgba(84, 84, 95, 0.3);
}

.payout-row-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.payout-player-name {
  color: #ffffff;
  font-size: 0.875rem;
}

.payout-row-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.payout-percentage {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
}

.payout-amount {
  font-weight: 600;
  color: var(--pp-accent-gold);
  font-size: 0.875rem;
}

/* Deal Section */
.deal-section {
  border-top: 1px solid rgba(84, 84, 95, 0.3);
  padding-top: 1rem;
}

.deal-toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  margin-bottom: 1rem;
}

.deal-checkbox {
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  border: 1px solid var(--pp-border);
  background-color: var(--pp-bg-primary);
  accent-color: var(--pp-accent-gold);
}

.deal-toggle-label {
  color: #ffffff;
  font-weight: 500;
}

.deal-options {
  padding-left: 1.75rem;
}

.deal-options > * + * {
  margin-top: 1rem;
}

.deal-type-options {
  display: flex;
  gap: 0.5rem;
}

.deal-type-button {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--pp-border);
  background-color: var(--pp-bg-primary);
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
  cursor: pointer;
}

.deal-type-button--active {
  background-color: rgba(254, 231, 138, 0.2);
  color: var(--pp-accent-gold);
  border-color: rgba(254, 231, 138, 0.4);
}

.affected-positions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.affected-position-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background-color: var(--pp-bg-primary);
  border-radius: 0.5rem;
  border: 1px solid var(--pp-border);
  cursor: pointer;
  font-size: 0.875rem;
}

.affected-position-item:hover {
  border-color: rgba(254, 231, 138, 0.4);
}

.affected-position-checkbox {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 0.25rem;
  border: 1px solid var(--pp-border);
  background-color: var(--pp-bg-primary);
  accent-color: var(--pp-accent-gold);
}

.affected-position-label {
  color: rgba(255, 255, 255, 0.8);
}

.custom-payouts > * + * {
  margin-top: 0.5rem;
}

.custom-payout-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.custom-payout-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  min-width: 100px;
}

.custom-payout-input-wrapper {
  position: relative;
  flex: 1;
}

.custom-payout-prefix {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
}

.custom-payout-input {
  padding-left: 1.75rem;
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
  font-size: 0.875rem;
}

/* Step 3: Summary */
.summary-card {
  background-color: rgba(24, 24, 26, 0.5);
  border-radius: 0.5rem;
  border: 1px solid rgba(84, 84, 95, 0.3);
  padding: 1rem;
}

.summary-card > * + * {
  margin-top: 0.75rem;
}

.summary-title {
  font-weight: 600;
  color: var(--pp-text-primary);
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  padding: 0.25rem 0;
}

.summary-row-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-position {
  color: var(--pp-accent-gold);
  font-weight: 700;
}

.summary-name {
  color: #ffffff;
}

.summary-amount {
  color: var(--pp-accent-gold);
  font-weight: 500;
}

.summary-deal {
  padding-top: 0.75rem;
  border-top: 1px solid rgba(84, 84, 95, 0.3);
}

.summary-deal-text {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Error Banner */
.error-banner {
  margin: 0 1.5rem 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
}

.error-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--pp-red-400);
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  color: #fca5a5;
  font-weight: 500;
  font-size: 0.875rem;
}

.error-detail {
  color: rgba(248, 113, 113, 0.7);
  font-size: 0.75rem;
  margin-top: 0.125rem;
}

.error-dismiss {
  color: rgba(248, 113, 113, 0.6);
  padding: 0.25rem;
  cursor: pointer;
}

.error-dismiss:hover {
  color: #fca5a5;
}

/* Footer */
.modal-footer-nav {
  justify-content: space-between;
}

/* Shared icon sizes */
.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

.icon-sm {
  width: 1rem;
  height: 1rem;
}
</style>
