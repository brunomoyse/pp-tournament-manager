<template>
  <PpModal
    :open="isOpen"
    :title="
      mode === 'create' ? t('templates.createPayoutTemplate') : t('templates.editPayoutTemplate')
    "
    size="lg"
    @close="closeModal"
  >
    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="form-body">
      <!-- Name -->
      <div class="form-field">
        <label class="pp-label">{{ t('templates.name') }} <span class="required">*</span></label>
        <input
          v-model="form.name"
          type="text"
          required
          class="pp-input"
          :placeholder="t('templates.namePlaceholder')"
        />
      </div>

      <!-- Description -->
      <div class="form-field">
        <label class="pp-label">{{ t('templates.description') }}</label>
        <input
          v-model="form.description"
          type="text"
          class="pp-input"
          :placeholder="t('templates.descriptionPlaceholder')"
        />
      </div>

      <!-- Player Range -->
      <div class="form-row">
        <div class="form-field">
          <label class="pp-label"
            >{{ t('templates.minPlayers') }} <span class="required">*</span></label
          >
          <input v-model.number="form.minPlayers" type="number" min="2" required class="pp-input" />
        </div>
        <div class="form-field">
          <label class="pp-label">{{ t('templates.maxPlayers') }}</label>
          <input
            v-model.number="form.maxPlayers"
            type="number"
            :min="form.minPlayers"
            class="pp-input"
            :placeholder="t('templates.maxPlayersPlaceholder')"
          />
        </div>
      </div>

      <!-- Auto-generate (pay the top N%) -->
      <div class="auto-panel">
        <div class="auto-fields">
          <div class="form-field auto-field">
            <label class="pp-label">{{ t('templates.autoPlayers') }}</label>
            <input v-model.number="autoPlayers" type="number" min="2" class="pp-input" />
          </div>
          <div class="form-field auto-field">
            <label class="pp-label">{{ t('templates.autoPercent') }}</label>
            <div class="percentage-input-wrapper">
              <input
                v-model.number="autoPercent"
                type="number"
                min="1"
                max="100"
                step="1"
                class="pp-input percentage-input"
              />
              <span class="percentage-suffix">%</span>
            </div>
          </div>
          <PpButton
            type="button"
            variant="secondary"
            size="sm"
            :loading="generating"
            class="auto-btn"
            @click="generateAuto"
          >
            <IonIcon :icon="sparklesOutline" class="add-icon" />
            {{ t('templates.autoGenerate') }}
          </PpButton>
        </div>
        <p class="auto-hint">{{ t('templates.autoHint') }}</p>
      </div>

      <!-- Payout Structure -->
      <div class="form-field">
        <div class="structure-header">
          <label class="pp-label">{{ t('templates.payoutStructure') }}</label>
          <span :class="['total-badge', isPercentageValid ? 'total-valid' : 'total-invalid']">
            {{ t('templates.totalPercentage') }}: {{ totalPercentage.toFixed(1) }}%
            <span v-if="isPercentageValid" class="check-mark">&#10003;</span>
          </span>
        </div>

        <div class="structure-rows">
          <div v-for="(entry, index) in form.payoutStructure" :key="index" class="structure-row">
            <div class="position-number">{{ entry.position }}</div>
            <div class="percentage-input-wrapper">
              <input
                v-model.number="entry.percentage"
                type="number"
                step="0.1"
                min="0"
                max="100"
                class="pp-input percentage-input"
                placeholder="0.0"
              />
              <span class="percentage-suffix">%</span>
            </div>
            <button
              v-if="form.payoutStructure.length > 1"
              type="button"
              @click="removePosition(index)"
              class="remove-btn"
            >
              <IonIcon :icon="removeCircleOutline" class="remove-icon" />
            </button>
          </div>
        </div>

        <PpButton type="button" variant="secondary" size="sm" @click="addPosition" class="add-btn">
          <IonIcon :icon="addCircleOutline" class="add-icon" />
          {{ t('templates.addPosition') }}
        </PpButton>
      </div>
    </form>

    <!-- Actions -->
    <template #footer>
      <PpButton variant="secondary" @click="closeModal">
        {{ t('common.cancel') }}
      </PpButton>
      <PpButton
        type="submit"
        variant="primary"
        :disabled="!isFormValid || saving"
        :loading="saving"
        @click="handleSubmit"
      >
        {{
          saving
            ? t('status.saving')
            : mode === 'create'
              ? t('templates.create')
              : t('templates.save')
        }}
      </PpButton>
    </template>
  </PpModal>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { addCircleOutline, removeCircleOutline, sparklesOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import type { PayoutTemplate } from '~/types/tournament'

interface Props {
  isOpen: boolean
  template: PayoutTemplate | null
  mode: 'create' | 'edit'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  saved: []
}>()

const { t } = useI18n()
const toast = useToast()
const saving = ref(false)

interface PayoutEntry {
  position: number
  percentage: number
}

const form = ref({
  name: '',
  description: '',
  minPlayers: 2,
  maxPlayers: null as number | null,
  payoutStructure: [{ position: 1, percentage: 100 }] as PayoutEntry[],
})

// Auto-generate ("pay the top N%") — fills the structure with a decaying curve
// that the manager can still fine-tune before saving.
const autoPlayers = ref(20)
const autoPercent = ref(15)
const generating = ref(false)

const generateAuto = async () => {
  if (!autoPlayers.value || autoPlayers.value < 2) return
  generating.value = true
  try {
    const result = await GqlAutoPayoutPreview({
      numPlayers: autoPlayers.value,
      percentPaid: autoPercent.value,
    })
    const structure = result?.autoPayoutPreview || []
    if (structure.length) {
      form.value.payoutStructure = structure.map((e) => ({
        position: e.position,
        percentage: e.percentage,
      }))
    }
  } catch (error) {
    console.error('Failed to generate auto payout:', error)
    toast.error(t('templates.autoFailed'))
  } finally {
    generating.value = false
  }
}

const totalPercentage = computed(() => {
  return form.value.payoutStructure.reduce((sum, e) => sum + (e.percentage || 0), 0)
})

const isPercentageValid = computed(() => Math.abs(totalPercentage.value - 100) < 0.01)

const isFormValid = computed(() => {
  return form.value.name.trim() && form.value.minPlayers >= 2 && isPercentageValid.value
})

const addPosition = () => {
  const nextPosition = form.value.payoutStructure.length + 1
  form.value.payoutStructure.push({ position: nextPosition, percentage: 0 })
}

const removePosition = (index: number) => {
  form.value.payoutStructure.splice(index, 1)
  form.value.payoutStructure.forEach((e, i) => {
    e.position = i + 1
  })
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.template && props.mode === 'edit') {
      form.value = {
        name: props.template.name,
        description: props.template.description || '',
        minPlayers: props.template.minPlayers,
        maxPlayers: props.template.maxPlayers || null,
        payoutStructure: props.template.payoutStructure.map((e) => ({
          position: e.position,
          percentage: e.percentage,
        })),
      }
      // Seed the auto field size from the template's range for a sensible preview.
      autoPlayers.value = props.template.maxPlayers || props.template.minPlayers || 20
      autoPercent.value = 15
    } else if (isOpen && props.mode === 'create') {
      form.value = {
        name: '',
        description: '',
        minPlayers: 2,
        maxPlayers: null,
        payoutStructure: [{ position: 1, percentage: 100 }],
      }
      autoPlayers.value = 20
      autoPercent.value = 15
    }
  },
)

const handleSubmit = async () => {
  if (!isFormValid.value) return
  saving.value = true

  try {
    const input = {
      name: form.value.name,
      description: form.value.description || undefined,
      minPlayers: form.value.minPlayers,
      maxPlayers: form.value.maxPlayers || undefined,
      payoutStructure: form.value.payoutStructure.map((e) => ({
        position: e.position,
        percentage: e.percentage,
      })),
    }

    if (props.mode === 'create') {
      await GqlCreatePayoutTemplate({ input })
    } else if (props.template) {
      await GqlUpdatePayoutTemplate({ input: { id: props.template.id, ...input } })
    }
    emit('saved')
  } catch (error) {
    console.error('Failed to save payout template:', error)
    toast.error(t('templates.saveFailed'))
  } finally {
    saving.value = false
  }
}

const closeModal = () => emit('close')
</script>

<style scoped>
.form-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.required {
  color: var(--pp-red-400);
}

.auto-panel {
  padding: 0.85rem 1rem;
  background-color: rgba(var(--pp-accent-rgb), 0.06);
  border: 1px solid var(--color-pp-border-strong);
  border-radius: 0.75rem;
}

.auto-fields {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.auto-field {
  width: 7rem;
}

.auto-btn {
  margin-bottom: 1px;
}

.auto-hint {
  margin-top: 0.6rem;
  font-size: 0.75rem;
  color: var(--color-pp-text-dim);
}

.structure-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.total-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}

.total-valid {
  background-color: rgba(34, 197, 94, 0.2);
  color: var(--pp-green-400);
}

.total-invalid {
  background-color: rgba(239, 68, 68, 0.2);
  color: var(--pp-red-400);
}

.check-mark {
  margin-left: 0.25rem;
}

.structure-rows {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.structure-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.position-number {
  width: 2rem;
  text-align: center;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  flex-shrink: 0;
}

.percentage-input-wrapper {
  position: relative;
  flex: 1;
}

.percentage-input {
  padding-right: 2rem;
}

.percentage-suffix {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.875rem;
}

.remove-btn {
  color: rgba(255, 255, 255, 0.3);
  transition: color 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.remove-btn:hover {
  color: var(--pp-red-400);
}

.remove-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.add-btn {
  align-self: flex-start;
}

.add-icon {
  width: 1rem;
  height: 1rem;
}
</style>
