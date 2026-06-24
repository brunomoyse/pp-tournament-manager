<template>
  <PpModal :open="isOpen" size="2xl" @close="closeModal">
    <!-- Form -->
    <template #header>
      <div class="tournament-form-header-sticky">
        <h2 class="tournament-form-title">
          {{
            mode === 'create' ? t('tournament.createTournament') : t('tournament.editTournament')
          }}
        </h2>
      </div>
    </template>

    <form @submit.prevent="handleSubmit" class="tournament-form">
      <!-- Basic Info Section -->
      <div class="tournament-form-section">
        <h3 class="tournament-form-section-title">{{ t('tournament.basicInfo') }}</h3>

        <!-- Name -->
        <div class="tournament-form-field">
          <label class="pp-label">
            {{ t('tournament.name') }} <span class="tournament-form-required">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            class="pp-input"
            :placeholder="t('tournament.namePlaceholder')"
          />
        </div>

        <!-- Description -->
        <div class="tournament-form-field">
          <label class="pp-label">
            {{ t('tournament.description') }}
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            class="pp-input"
            :placeholder="t('tournament.descriptionPlaceholder')"
          />
        </div>

        <!-- Start Time -->
        <div class="tournament-form-field">
          <label class="pp-label">
            {{ t('tournament.startTime') }} <span class="tournament-form-required">*</span>
          </label>
          <input v-model="form.startTime" type="datetime-local" required class="pp-input" />
        </div>

        <!-- Buy-in / Rake / Seat Cap row -->
        <div class="tournament-form-row tournament-form-row--3col">
          <div class="tournament-form-field">
            <label class="pp-label">
              {{ t('tournament.buyIn') }} (EUR) <span class="tournament-form-required">*</span>
            </label>
            <input
              v-model.number="buyInEuros"
              type="number"
              min="0"
              step="0.01"
              required
              class="pp-input"
            />
          </div>
          <div class="tournament-form-field">
            <label class="pp-label"> {{ t('tournament.rake') }} (EUR) </label>
            <input v-model.number="rakeEuros" type="number" min="0" step="0.01" class="pp-input" />
          </div>
          <div class="tournament-form-field">
            <label class="pp-label">
              {{ t('tournament.seatCap') }}
            </label>
            <input
              v-model.number="form.seatCap"
              type="number"
              min="2"
              class="pp-input"
              :placeholder="t('tournament.unlimited')"
            />
          </div>
        </div>

        <!-- Starting stack (default chips on the initial buy-in) -->
        <div class="tournament-form-field">
          <label class="pp-label">
            {{ t('tournament.startingStack') }}
          </label>
          <input
            v-model.number="form.startingStack"
            type="number"
            min="0"
            class="pp-input"
            :placeholder="t('tournament.startingStackPlaceholder')"
          />
          <p class="tournament-form-help">{{ t('tournament.startingStackHelp') }}</p>
        </div>

        <!-- Optional features: each is opt-in via a checkbox; the inputs only
             appear once the manager enables the feature. -->
        <div class="tournament-form-options">
          <p class="tournament-form-options-title">{{ t('tournament.optionsTitle') }}</p>
          <p class="tournament-form-help">{{ t('tournament.optionsHint') }}</p>

          <!-- Early-bird bonuses -->
          <label class="tournament-form-toggle">
            <input v-model="enableEarlyBird" type="checkbox" />
            <span>{{ t('tournament.optEarlyBird') }}</span>
          </label>
          <div v-if="enableEarlyBird" class="tournament-form-option-body">
            <div class="tournament-form-field">
              <label class="pp-label">{{ t('tournament.earlyBirdBonus') }}</label>
              <input
                v-model.number="form.earlyBirdBonusChips"
                type="number"
                min="0"
                class="pp-input"
                :placeholder="t('tournament.earlyBirdBonusPlaceholder')"
              />
            </div>
            <div class="tournament-form-field">
              <label class="pp-label">{{ t('tournament.levelTwoBonus') }}</label>
              <input
                v-model.number="form.levelTwoBonusChips"
                type="number"
                min="0"
                class="pp-input"
                :placeholder="t('tournament.levelTwoBonusPlaceholder')"
              />
            </div>
          </div>

          <!-- Re-entries -->
          <label class="tournament-form-toggle">
            <input v-model="enableReentry" type="checkbox" />
            <span>{{ t('tournament.optReentry') }}</span>
          </label>
          <div v-if="enableReentry" class="tournament-form-option-body">
            <div class="tournament-form-field">
              <label class="pp-label">{{ t('tournament.rebuyMax') }}</label>
              <input
                v-model.number="form.rebuyMax"
                type="number"
                min="0"
                class="pp-input"
                :placeholder="t('tournament.rebuyMaxPlaceholder')"
              />
            </div>
          </div>

          <!-- Add-ons -->
          <label class="tournament-form-toggle">
            <input v-model="enableAddon" type="checkbox" />
            <span>{{ t('tournament.optAddon') }}</span>
          </label>
          <div v-if="enableAddon" class="tournament-form-option-body">
            <div class="tournament-form-field">
              <label class="pp-label">{{ t('tournament.addonChips') }}</label>
              <input
                v-model.number="form.addonChips"
                type="number"
                min="0"
                class="pp-input"
                :placeholder="t('tournament.addonChipsPlaceholder')"
              />
            </div>
            <div class="tournament-form-field">
              <label class="pp-label">{{ t('tournament.addonPrice') }}</label>
              <input
                v-model.number="addonPriceEuros"
                type="number"
                min="0"
                step="0.5"
                class="pp-input"
                :placeholder="t('tournament.voucherValuePlaceholder')"
              />
            </div>
          </div>

          <!-- Mandatory drink voucher -->
          <label class="tournament-form-toggle">
            <input v-model="enableVoucher" type="checkbox" />
            <span>{{ t('tournament.optVoucher') }}</span>
          </label>
          <div v-if="enableVoucher" class="tournament-form-option-body">
            <div class="tournament-form-field">
              <label class="pp-label">{{ t('tournament.voucherValue') }}</label>
              <input
                v-model.number="voucherValueEuros"
                type="number"
                min="0"
                step="0.5"
                class="pp-input"
                :placeholder="t('tournament.voucherValuePlaceholder')"
              />
              <p class="tournament-form-help">{{ t('tournament.voucherValueHelp') }}</p>
            </div>
          </div>

          <!-- Late registration -->
          <label class="tournament-form-toggle">
            <input v-model="enableLateReg" type="checkbox" />
            <span>{{ t('tournament.optLateReg') }}</span>
          </label>
          <div v-if="enableLateReg" class="tournament-form-option-body">
            <div class="tournament-form-field">
              <label class="pp-label">{{ t('tournament.lateRegistrationLevel') }}</label>
              <input
                v-model.number="form.lateRegistrationLevel"
                type="number"
                min="1"
                class="pp-input"
                :placeholder="t('tournament.lateRegistrationLevelPlaceholder')"
              />
              <p class="tournament-form-help">{{ t('tournament.lateRegistrationLevelHelp') }}</p>
            </div>
          </div>

          <!-- Bounty / Knockout -->
          <label class="tournament-form-toggle">
            <input v-model="enableBounty" type="checkbox" />
            <span>{{ t('tournament.optBounty') }}</span>
          </label>
          <div v-if="enableBounty" class="tournament-form-option-body">
            <div class="tournament-form-field">
              <label class="pp-label">{{ t('tournament.bountyType') }}</label>
              <select v-model="form.bountyType" class="pp-select">
                <option value="FIXED">{{ t('tournament.bountyTypeFixed') }}</option>
                <option value="PROGRESSIVE">{{ t('tournament.bountyTypeProgressive') }}</option>
              </select>
              <p class="tournament-form-help">{{ t('tournament.bountyTypeHelp') }}</p>
            </div>
            <div class="tournament-form-field">
              <label class="pp-label">
                {{ t('tournament.bountyAmount') }} (EUR)
                <span class="tournament-form-required">*</span>
              </label>
              <input
                v-model.number="bountyAmountEuros"
                type="number"
                min="0"
                step="0.5"
                class="pp-input"
              />
              <p v-if="bountyTooLarge" class="tournament-form-error">
                {{ t('tournament.bountyAmountTooLarge') }}
              </p>
              <p v-else class="tournament-form-help">{{ t('tournament.bountyAmountHelp') }}</p>
            </div>
          </div>
        </div>

        <!-- League (configurable leaderboard) -->
        <div v-if="leagues.length" class="tournament-form-field">
          <label class="pp-label">{{ t('tournament.league') }}</label>
          <select v-model="form.leaderboardConfigId" class="pp-select">
            <option :value="null">{{ t('tournament.leagueNone') }}</option>
            <option v-for="lg in leagues" :key="lg.id" :value="lg.id">{{ lg.name }}</option>
          </select>
          <p class="tournament-form-help">{{ t('tournament.leagueHelp') }}</p>
        </div>
      </div>

      <!-- Blind Structure Template Section -->
      <div class="tournament-form-section">
        <h3 class="tournament-form-section-title">{{ t('tournament.blindStructure') }}</h3>

        <!-- Template Dropdown -->
        <div class="tournament-form-field">
          <label class="pp-label">
            {{ t('tournament.selectTemplate') }} <span class="tournament-form-required">*</span>
          </label>
          <select v-model="form.templateId" required class="pp-select">
            <option value="" disabled>{{ t('tournament.selectTemplatePlaceholder') }}</option>
            <option v-for="template in templates" :key="template.id" :value="template.id">
              {{ template.name }}
            </option>
          </select>
        </div>

        <!-- Template Description -->
        <p v-if="selectedTemplate?.description" class="tournament-form-template-description">
          {{ selectedTemplate.description }}
        </p>

        <!-- Template Preview -->
        <div v-if="selectedTemplate" class="tournament-form-template-preview">
          <p class="tournament-form-template-preview-label">
            {{ t('tournament.templatePreview') }}
          </p>
          <div class="tournament-form-template-levels">
            <div
              v-for="level in selectedTemplate.levels"
              :key="level.levelNumber"
              class="tournament-form-template-level-row"
            >
              <span>{{
                level.isBreak
                  ? t('tournament.break')
                  : t('tournament.level') + ' ' + level.levelNumber
              }}</span>
              <span v-if="!level.isBreak"
                >{{ level.smallBlind }}/{{ level.bigBlind }} ({{
                  level.ante > 0 ? 'Ante ' + level.ante : 'No Ante'
                }}) - {{ level.durationMinutes }}min</span
              >
              <span v-else>{{ level.durationMinutes }}min</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recurrence Section (create mode only) -->
      <div v-if="mode === 'create'" class="tournament-form-section">
        <h3 class="tournament-form-section-title">{{ t('tournament.recurrence.title') }}</h3>

        <label class="tournament-form-toggle">
          <input v-model="form.recurrenceEnabled" type="checkbox" />
          <span>{{ t('tournament.recurrence.enable') }}</span>
        </label>

        <div v-if="form.recurrenceEnabled" class="tournament-form-row">
          <div class="tournament-form-field">
            <label class="pp-label">{{ t('tournament.recurrence.frequency') }}</label>
            <select v-model="form.recurrenceFrequency" class="pp-select">
              <option value="WEEKLY">{{ t('tournament.recurrence.weekly') }}</option>
              <option value="MONTHLY">{{ t('tournament.recurrence.monthly') }}</option>
            </select>
          </div>
          <div class="tournament-form-field">
            <label class="pp-label">
              {{ t('tournament.recurrence.endDate') }}
              <span class="tournament-form-required">*</span>
            </label>
            <input v-model="form.recurrenceEndDate" type="date" class="pp-input" />
          </div>
        </div>

        <p v-if="form.recurrenceEnabled && recurrenceError" class="tournament-form-error">
          {{ recurrenceError }}
        </p>
        <p v-else-if="form.recurrenceEnabled && occurrenceCount > 0" class="tournament-form-help">
          {{ recurrenceSummary }}
        </p>
      </div>
    </form>

    <!-- Actions Footer -->
    <template #footer>
      <PpButton variant="secondary" @click="closeModal">
        {{ t('common.cancel') }}
      </PpButton>
      <PpButton
        variant="primary"
        type="submit"
        :disabled="!isFormValid || saving"
        :loading="saving"
        @click="handleSubmit"
      >
        {{
          saving
            ? t('status.saving')
            : mode === 'create'
              ? t('tournament.create')
              : t('tournament.save')
        }}
      </PpButton>
    </template>
  </PpModal>
</template>

<script setup lang="ts">
import { useI18n } from '~/composables/useI18n'
import type { Tournament, TournamentFormData, BlindStructureTemplate } from '~/types/tournament'

interface Props {
  isOpen: boolean
  tournament: Tournament | null
  mode: 'create' | 'edit'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  saved: []
}>()

const { t, locale } = useI18n()
const toast = useToast()
const clubStore = useClubStore()

// Fetch blind structure templates
const templates = ref<BlindStructureTemplate[]>([])

const fetchTemplates = async () => {
  const clubId = clubStore.club?.id
  if (!clubId) return
  try {
    const { blindStructureTemplates } = await GqlGetBlindStructureTemplates({ clubId })
    templates.value = blindStructureTemplates ?? []
  } catch (error) {
    console.error('Failed to fetch blind structure templates:', error)
  }
}

// Fetch the club's leagues (configurable leaderboards) for the optional selector.
const leagues = ref<{ id: string; name: string }[]>([])

const fetchLeagues = async () => {
  const clubId = clubStore.club?.id
  if (!clubId) return
  try {
    const { leaderboardConfigs } = await GqlGetLeaderboardConfigs({ clubId })
    leagues.value = (leaderboardConfigs || []).map((c) => ({ id: c.id, name: c.name }))
  } catch (error) {
    console.error('Failed to fetch leagues:', error)
  }
}

// Fetch templates on component mount
onMounted(() => {
  fetchTemplates()
  fetchLeagues()
})

// Computed to get selected template details
const selectedTemplate = computed(() => {
  return templates.value.find((t) => t.id === form.value.templateId)
})

// Form state
const form = ref<TournamentFormData>({
  name: '',
  description: '',
  startTime: '',
  endTime: '',
  buyInCents: 0,
  rakeCents: 0,
  seatCap: null,
  startingStack: null,
  earlyBirdBonusChips: null,
  levelTwoBonusChips: null,
  voucherValueCents: null,
  rebuyMax: null,
  addonChips: null,
  addonPriceCents: null,
  lateRegistrationLevel: null,
  bountyType: 'NONE',
  bountyAmountCents: null,
  leaderboardConfigId: null,
  templateId: '',
  recurrenceEnabled: false,
  recurrenceFrequency: 'WEEKLY',
  recurrenceEndDate: '',
})

const saving = ref(false)

// Opt-in toggles for the optional features. Each reveals its inputs and, when
// switched off, clears the underlying values so they are not submitted.
const enableEarlyBird = ref(false)
const enableReentry = ref(false)
const enableAddon = ref(false)
const enableVoucher = ref(false)
const enableLateReg = ref(false)
const enableBounty = ref(false)

watch(enableEarlyBird, (on) => {
  if (!on) {
    form.value.earlyBirdBonusChips = null
    form.value.levelTwoBonusChips = null
  }
})
watch(enableReentry, (on) => {
  if (!on) form.value.rebuyMax = null
})
watch(enableAddon, (on) => {
  if (!on) {
    form.value.addonChips = null
    form.value.addonPriceCents = null
  }
})
watch(enableVoucher, (on) => {
  if (!on) form.value.voucherValueCents = null
})
watch(enableLateReg, (on) => {
  if (!on) form.value.lateRegistrationLevel = null
})
watch(enableBounty, (on) => {
  if (on) {
    if (form.value.bountyType === 'NONE') form.value.bountyType = 'FIXED'
  } else {
    form.value.bountyType = 'NONE'
    form.value.bountyAmountCents = null
  }
})

/** Sync the opt-in toggles from the current form values (used on open). */
const syncOptionTogglesFromForm = () => {
  enableEarlyBird.value =
    form.value.earlyBirdBonusChips != null || form.value.levelTwoBonusChips != null
  enableReentry.value = form.value.rebuyMax != null
  enableAddon.value = form.value.addonChips != null || form.value.addonPriceCents != null
  enableVoucher.value = (form.value.voucherValueCents ?? 0) > 0
  enableLateReg.value = form.value.lateRegistrationLevel != null
  enableBounty.value = form.value.bountyType !== 'NONE'
}

// Computed for bounty amount in euros (display; stored as cents)
const bountyAmountEuros = computed({
  get: () => (form.value.bountyAmountCents ?? 0) / 100,
  set: (val: number) => {
    form.value.bountyAmountCents = val ? Math.round(val * 100) : null
  },
})

// The bounty slice is carved from each buy-in, so it must stay below it.
const bountyTooLarge = computed(
  () =>
    form.value.bountyType !== 'NONE' &&
    (form.value.bountyAmountCents ?? 0) >= form.value.buyInCents,
)

// Computed for voucher value in euros (display; stored as cents)
const voucherValueEuros = computed({
  get: () => (form.value.voucherValueCents ?? 0) / 100,
  set: (val: number) => {
    form.value.voucherValueCents = val ? Math.round(val * 100) : null
  },
})

// Computed for add-on price in euros (display; stored as cents)
const addonPriceEuros = computed({
  get: () => (form.value.addonPriceCents ?? 0) / 100,
  set: (val: number) => {
    form.value.addonPriceCents = val ? Math.round(val * 100) : null
  },
})

// Computed for buy-in in euros (display)
const buyInEuros = computed({
  get: () => form.value.buyInCents / 100,
  set: (val: number) => {
    form.value.buyInCents = Math.round(val * 100)
  },
})

// Computed for rake in euros (display)
const rakeEuros = computed({
  get: () => form.value.rakeCents / 100,
  set: (val: number) => {
    form.value.rakeCents = Math.round(val * 100)
  },
})

// Recurrence preview: how many independent tournaments will be created. The
// end date is treated as inclusive of its whole day (matches the submitted
// end-of-day timestamp).
const occurrenceCount = computed(() => {
  if (!form.value.recurrenceEnabled || !form.value.startTime || !form.value.recurrenceEndDate) {
    return 0
  }
  const start = new Date(form.value.startTime)
  const end = new Date(`${form.value.recurrenceEndDate}T23:59:59`)
  return countOccurrences(start, end, form.value.recurrenceFrequency)
})

const recurrenceError = computed(() => {
  if (!form.value.recurrenceEnabled) return ''
  if (!form.value.recurrenceEndDate) return t('tournament.recurrence.endDateRequired')
  if (occurrenceCount.value < 1) return t('tournament.recurrence.endDateAfterStart')
  return ''
})

const recurrenceSummary = computed(() =>
  t('tournament.recurrence.summary', {
    count: occurrenceCount.value,
    frequency: t(
      `tournament.recurrence.${form.value.recurrenceFrequency === 'WEEKLY' ? 'weekly' : 'monthly'}`,
    ).toLowerCase(),
    date: form.value.recurrenceEndDate
      ? new Date(`${form.value.recurrenceEndDate}T00:00:00`).toLocaleDateString(locale.value, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '',
  }),
)

// Validation
const isFormValid = computed(() => {
  return (
    form.value.name.trim() &&
    form.value.startTime &&
    form.value.buyInCents >= 0 &&
    form.value.templateId &&
    !bountyTooLarge.value &&
    (form.value.bountyType === 'NONE' || (form.value.bountyAmountCents ?? 0) > 0) &&
    (!form.value.recurrenceEnabled || (occurrenceCount.value >= 1 && !recurrenceError.value))
  )
})

// Helper to format date for datetime-local input
const formatDateTimeLocal = (isoString: string): string => {
  const date = new Date(isoString)
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Watch for mode/tournament changes to populate form
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.tournament && props.mode === 'edit') {
      form.value = {
        name: props.tournament.title,
        description: props.tournament.description || '',
        startTime: formatDateTimeLocal(props.tournament.startTime),
        endTime: props.tournament.endTime ? formatDateTimeLocal(props.tournament.endTime) : '',
        buyInCents: props.tournament.buyInCents,
        rakeCents: props.tournament.rakeCents || 0,
        seatCap: props.tournament.seatCap || null,
        startingStack: props.tournament.startingStack ?? null,
        earlyBirdBonusChips: props.tournament.earlyBirdBonusChips ?? null,
        levelTwoBonusChips: props.tournament.levelTwoBonusChips ?? null,
        voucherValueCents: props.tournament.voucherValueCents ?? null,
        rebuyMax: props.tournament.rebuyMax ?? null,
        addonChips: props.tournament.addonChips ?? null,
        addonPriceCents: props.tournament.addonPriceCents ?? null,
        lateRegistrationLevel: props.tournament.lateRegistrationLevel ?? null,
        bountyType: props.tournament.bountyType ?? 'NONE',
        bountyAmountCents: props.tournament.bountyAmountCents ?? null,
        leaderboardConfigId: props.tournament.leaderboardConfigId ?? null,
        templateId: templates.value[0]?.id ?? '',
        recurrenceEnabled: false,
        recurrenceFrequency: 'WEEKLY',
        recurrenceEndDate: '',
      }
    } else if (isOpen && props.mode === 'create') {
      form.value = {
        name: '',
        description: '',
        startTime: '',
        endTime: '',
        buyInCents: 0,
        rakeCents: 0,
        seatCap: null,
        startingStack: null,
        earlyBirdBonusChips: null,
        levelTwoBonusChips: null,
        voucherValueCents: null,
        rebuyMax: null,
        addonChips: null,
        addonPriceCents: null,
        lateRegistrationLevel: null,
        bountyType: 'NONE',
        bountyAmountCents: null,
        leaderboardConfigId: null,
        templateId: templates.value[0]?.id ?? '',
        recurrenceEnabled: false,
        recurrenceFrequency: 'WEEKLY',
        recurrenceEndDate: '',
      }
    }
    // Derive the opt-in toggles from whatever values were just loaded.
    if (isOpen) syncOptionTogglesFromForm()
  },
)

// Submit handler
const handleSubmit = async () => {
  if (!isFormValid.value) return

  saving.value = true
  try {
    if (props.mode === 'create') {
      await GqlCreateTournament({
        input: {
          clubId: clubStore.club?.id || '',
          name: form.value.name,
          description: form.value.description || undefined,
          startTime: new Date(form.value.startTime).toISOString(),
          endTime: form.value.endTime ? new Date(form.value.endTime).toISOString() : undefined,
          buyInCents: form.value.buyInCents,
          rakeCents: form.value.rakeCents || undefined,
          seatCap: form.value.seatCap || undefined,
          startingStack: form.value.startingStack || undefined,
          earlyBirdBonusChips: form.value.earlyBirdBonusChips || undefined,
          levelTwoBonusChips: form.value.levelTwoBonusChips || undefined,
          voucherValueCents: form.value.voucherValueCents ?? undefined,
          rebuyMax: form.value.rebuyMax ?? undefined,
          addonChips: form.value.addonChips || undefined,
          addonPriceCents: form.value.addonPriceCents ?? undefined,
          lateRegistrationLevel: form.value.lateRegistrationLevel || undefined,
          bountyType: form.value.bountyType,
          bountyAmountCents:
            form.value.bountyType === 'NONE' ? 0 : (form.value.bountyAmountCents ?? 0),
          leaderboardConfigId: form.value.leaderboardConfigId || undefined,
          templateId: form.value.templateId,
          // Recurrence: when enabled, the backend creates one independent
          // tournament per interval up to (and including) the end date.
          recurrenceFrequency: form.value.recurrenceEnabled
            ? form.value.recurrenceFrequency
            : undefined,
          recurrenceEndDate: form.value.recurrenceEnabled
            ? new Date(`${form.value.recurrenceEndDate}T23:59:59`).toISOString()
            : undefined,
        },
      })
      if (form.value.recurrenceEnabled && occurrenceCount.value > 1) {
        toast.success(t('tournament.recurrence.created', { count: occurrenceCount.value }))
      }
    } else if (props.tournament) {
      await GqlUpdateTournament({
        input: {
          id: props.tournament.id,
          name: form.value.name,
          description: form.value.description || undefined,
          startTime: new Date(form.value.startTime).toISOString(),
          endTime: form.value.endTime ? new Date(form.value.endTime).toISOString() : undefined,
          buyInCents: form.value.buyInCents,
          rakeCents: form.value.rakeCents || undefined,
          seatCap: form.value.seatCap || undefined,
          startingStack: form.value.startingStack || undefined,
          earlyBirdBonusChips: form.value.earlyBirdBonusChips || undefined,
          levelTwoBonusChips: form.value.levelTwoBonusChips || undefined,
          voucherValueCents: form.value.voucherValueCents ?? undefined,
          rebuyMax: form.value.rebuyMax ?? undefined,
          addonChips: form.value.addonChips || undefined,
          addonPriceCents: form.value.addonPriceCents ?? undefined,
          lateRegistrationLevel: form.value.lateRegistrationLevel || undefined,
          bountyType: form.value.bountyType,
          bountyAmountCents:
            form.value.bountyType === 'NONE' ? 0 : (form.value.bountyAmountCents ?? 0),
          leaderboardConfigId: form.value.leaderboardConfigId || undefined,
          templateId: form.value.templateId,
        },
      })
    }
    emit('saved')
  } catch (error) {
    console.error('Failed to save tournament:', error)
    toast.error(t('tournament.saveFailed'))
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  emit('close')
}
</script>

<style scoped>
.tournament-form-header-sticky {
  position: sticky;
  top: 0;
  z-index: 10;
}

.tournament-form-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-pp-text);
}

.tournament-form > * + * {
  margin-top: 1.5rem;
}

.tournament-form-section > * + * {
  margin-top: 1rem;
}

.tournament-form-section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-pp-text);
}

.tournament-form-field {
  display: flex;
  flex-direction: column;
}

.tournament-form-required {
  color: var(--pp-red-400);
}

.tournament-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.tournament-form-row--3col {
  grid-template-columns: 1fr 1fr 1fr;
}

.tournament-form-help {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.tournament-form-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-pp-text-muted);
  cursor: pointer;
}

/* Optional-features block: checkbox rows with revealed inputs */
.tournament-form-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--color-pp-border-strong);
  border-radius: 0.75rem;
  background-color: var(--color-pp-bg);
}

.tournament-form-options-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-pp-text);
}

/* Inputs revealed by a toggle, indented under it */
.tournament-form-option-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: -0.15rem 0 0.35rem 1.65rem;
  padding-left: 0.85rem;
  border-left: 2px solid var(--color-pp-border-strong);
}

.tournament-form-error {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #f87171;
}

.tournament-form-template-description {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.tournament-form-template-preview {
  padding: 0.75rem;
  background-color: var(--color-pp-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--color-pp-border-strong);
}

.tournament-form-template-preview-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
}

.tournament-form-template-levels {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  max-height: 8rem;
  overflow-y: auto;
}

.tournament-form-template-levels > * + * {
  margin-top: 0.25rem;
}

.tournament-form-template-level-row {
  display: flex;
  justify-content: space-between;
}
</style>
