<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal"></div>

    <!-- Modal Content -->
    <div class="relative bg-pp-bg-secondary rounded-2xl w-full max-w-md border border-pp-border shadow-2xl" style="background-color: #24242a !important;">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-pp-border/50">
        <div>
          <h2 class="text-xl font-bold text-pp-text-primary">{{ t('entries.addEntry') }}</h2>
          <p v-if="player" class="text-sm text-white/60 mt-1">{{ player.name }}</p>
        </div>
        <button
          @click="closeModal"
          class="p-2 text-white/60 hover:text-white rounded-lg hover:bg-pp-bg-primary/50 transition-colors"
        >
          <IonIcon :icon="closeOutline" class="w-5 h-5" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-5">
        <!-- Entry Type -->
        <div>
          <label class="block text-sm font-medium text-white/70 mb-2">{{ t('entries.entryType') }}</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="type in entryTypes"
              :key="type.value"
              type="button"
              @click="form.entryType = type.value"
              :class="[
                'px-3 py-2 rounded-lg text-sm font-medium border transition-all',
                form.entryType === type.value
                  ? 'bg-pp-accent-gold/20 text-pp-accent-gold border-pp-accent-gold/40'
                  : 'bg-pp-bg-primary border-pp-border text-white/70 hover:border-pp-border hover:text-white'
              ]"
            >
              {{ type.label }}
            </button>
          </div>
        </div>

        <!-- Amount -->
        <div>
          <label class="block text-sm font-medium text-white/70 mb-2">{{ t('entries.amount') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">&euro;</span>
            <input
              v-model.number="amountEuros"
              type="number"
              step="0.01"
              min="0"
              class="w-full pl-8 pr-4 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
            />
          </div>
        </div>

        <!-- Chips Received -->
        <div>
          <label class="block text-sm font-medium text-white/70 mb-2">{{ t('entries.chipsReceived') }}</label>
          <input
            v-model.number="form.chipsReceived"
            type="number"
            min="0"
            class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
          />
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium text-white/70 mb-2">{{ t('entries.notes') }}</label>
          <input
            v-model="form.notes"
            type="text"
            :placeholder="t('entries.notesPlaceholder')"
            class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
          />
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-pp-border/50">
          <button type="button" @click="closeModal" class="pp-action-button pp-action-button--secondary">
            {{ t('buttons.cancel') }}
          </button>
          <button type="submit" :disabled="submitting" class="pp-action-button pp-action-button--primary">
            <IonIcon v-if="submitting" :icon="refreshOutline" class="w-4 h-4 animate-spin" />
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
import type { EntryType } from '~/types/tournament'

interface Props {
  isOpen: boolean
  tournamentId: string
  player: { id: string; name: string } | null
  defaultAmountCents?: number
  defaultEntryType?: EntryType
}

const props = withDefaults(defineProps<Props>(), {
  defaultAmountCents: 0,
  defaultEntryType: 'INITIAL'
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
