<template>
  <div v-if="isOpen" class="pp-modal-overlay">
    <!-- Backdrop -->
    <div class="pp-modal-backdrop" @click="closeModal"></div>

    <!-- Modal Content -->
    <div class="pp-modal-content pp-modal-content--md">
      <!-- Header -->
      <div class="pp-modal-header">
        <div>
          <h3 class="modal-title">{{ t('entries.addEntry') }}</h3>
          <p v-if="player" class="modal-subtitle">{{ player.name }}</p>
        </div>
        <button @click="closeModal" class="pp-close-button">
          <IonIcon :icon="closeOutline" class="icon-md" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="pp-modal-body form-body">
        <!-- Entry Type -->
        <div class="form-group">
          <label class="pp-label">{{ t('entries.entryType') }}</label>
          <div class="entry-type-grid">
            <button
              v-for="type in entryTypes"
              :key="type.value"
              type="button"
              @click="form.entryType = type.value"
              :class="[
                'entry-type-button',
                form.entryType === type.value ? 'entry-type-button--active' : ''
              ]"
            >
              {{ type.label }}
            </button>
          </div>
        </div>

        <!-- Amount -->
        <div class="form-group">
          <label class="pp-label">{{ t('entries.amount') }}</label>
          <div class="input-with-prefix">
            <span class="input-prefix">&euro;</span>
            <input
              v-model.number="amountEuros"
              type="number"
              step="0.01"
              min="0"
              class="pp-input input-with-left-pad"
            />
          </div>
        </div>

        <!-- Chips Received -->
        <div class="form-group">
          <label class="pp-label">{{ t('entries.chipsReceived') }}</label>
          <input
            v-model.number="form.chipsReceived"
            type="number"
            min="0"
            class="pp-input"
          />
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label class="pp-label">{{ t('entries.notes') }}</label>
          <input
            v-model="form.notes"
            type="text"
            :placeholder="t('entries.notesPlaceholder')"
            class="pp-input"
          />
        </div>

        <!-- Actions -->
        <div class="pp-modal-footer form-actions">
          <button type="button" @click="closeModal" class="pp-action-button pp-action-button--secondary">
            {{ t('buttons.cancel') }}
          </button>
          <button type="submit" :disabled="submitting" class="pp-action-button pp-action-button--primary">
            <IonIcon v-if="submitting" :icon="refreshOutline" class="icon-sm pp-animate-spin" />
            {{ submitting ? t('entries.submitting') : t('entries.submit') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { closeOutline, refreshOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { EntryType } from '#gql/default'

interface Props {
  isOpen: boolean
  tournamentId: string
  player: { id: string; name: string } | null
  defaultAmountCents?: number
  defaultEntryType?: EntryType
}

const props = withDefaults(defineProps<Props>(), {
  defaultAmountCents: 0,
  defaultEntryType: EntryType.INITIAL
})

const emit = defineEmits<{
  close: []
  'entry-added': []
}>()

const { t } = useI18n()
const toast = useToast()

const submitting = ref(false)

const entryTypes = computed(() => [
  { value: 'INITIAL' as EntryType, label: t('entries.initial') },
  { value: 'REBUY' as EntryType, label: t('entries.rebuy') },
  { value: 'RE_ENTRY' as EntryType, label: t('entries.reEntry') },
  { value: 'ADDON' as EntryType, label: t('entries.addon') },
])

const form = ref({
  entryType: props.defaultEntryType as EntryType,
  amountCents: props.defaultAmountCents,
  chipsReceived: 0 as number | undefined,
  notes: ''
})

// Euro display for amount
const amountEuros = computed({
  get: () => form.value.amountCents / 100,
  set: (val: number) => { form.value.amountCents = Math.round(val * 100) }
})

// Reset form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    form.value = {
      entryType: props.defaultEntryType,
      amountCents: props.defaultAmountCents,
      chipsReceived: undefined,
      notes: ''
    }
  }
})

const handleSubmit = async () => {
  if (!props.player || submitting.value) return

  submitting.value = true
  try {
    await GqlAddTournamentEntry({
      input: {
        tournamentId: props.tournamentId,
        userId: props.player.id,
        entryType: form.value.entryType,
        amountCents: form.value.amountCents || undefined,
        chipsReceived: form.value.chipsReceived || undefined,
        notes: form.value.notes || undefined
      }
    })

    toast.success(t('toast.entryAddedSuccess'))
    emit('entry-added')
    closeModal()
  } catch (error) {
    console.error('Failed to add entry:', error)
    toast.error(t('toast.entryAddFailed'))
  } finally {
    submitting.value = false
  }
}

const closeModal = () => {
  emit('close')
}
</script>

<style scoped>
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

.form-body > * + * {
  margin-top: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.entry-type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.entry-type-button {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid var(--pp-border);
  background-color: var(--pp-bg-primary);
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
  cursor: pointer;
}

.entry-type-button:hover {
  border-color: var(--pp-border);
  color: #ffffff;
}

.entry-type-button--active {
  background-color: rgba(254, 231, 138, 0.2);
  color: var(--pp-accent-gold);
  border-color: rgba(254, 231, 138, 0.4);
}

.input-with-prefix {
  position: relative;
}

.input-prefix {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.875rem;
}

.input-with-left-pad {
  padding-left: 2rem;
}

.form-actions {
  padding: 1rem 0 0 0;
  border-top: 1px solid rgba(84, 84, 95, 0.5);
}

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

.icon-sm {
  width: 1rem;
  height: 1rem;
}
</style>
