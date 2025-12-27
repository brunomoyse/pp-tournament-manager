<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      @click="closeModal"
    ></div>

    <!-- Modal Content -->
    <div class="relative bg-pp-bg-secondary rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-pp-border shadow-2xl" style="background-color: #24242a !important;">
      <!-- Header -->
      <div class="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-pp-border/50 bg-pp-bg-secondary" style="background-color: #24242a !important;">
        <h2 class="text-xl font-bold text-pp-text-primary">
          {{ mode === 'create' ? t('tournament.createTournament') : t('tournament.editTournament') }}
        </h2>
        <button
          @click="closeModal"
          class="p-2 text-white/60 hover:text-white rounded-lg hover:bg-pp-bg-primary/50 transition-colors"
        >
          <IonIcon :icon="closeOutline" class="w-5 h-5" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Basic Info Section -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-pp-text-primary">{{ t('tournament.basicInfo') }}</h3>

          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-white/70 mb-2">
              {{ t('tournament.name') }} <span class="text-red-400">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
              :placeholder="t('tournament.namePlaceholder')"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-white/70 mb-2">
              {{ t('tournament.description') }}
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
              :placeholder="t('tournament.descriptionPlaceholder')"
            />
          </div>

          <!-- Start Time / End Time row -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-white/70 mb-2">
                {{ t('tournament.startTime') }} <span class="text-red-400">*</span>
              </label>
              <input
                v-model="form.startTime"
                type="datetime-local"
                required
                class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-white/70 mb-2">
                {{ t('tournament.endTime') }}
              </label>
              <input
                v-model="form.endTime"
                type="datetime-local"
                class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
              />
            </div>
          </div>

          <!-- Buy-in / Seat Cap row -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-white/70 mb-2">
                {{ t('tournament.buyIn') }} (EUR) <span class="text-red-400">*</span>
              </label>
              <input
                v-model.number="buyInEuros"
                type="number"
                min="0"
                step="0.01"
                required
                class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-white/70 mb-2">
                {{ t('tournament.seatCap') }}
              </label>
              <input
                v-model.number="form.seatCap"
                type="number"
                min="2"
                class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
                :placeholder="t('tournament.unlimited')"
              />
            </div>
          </div>

          <!-- Early Bird Bonus -->
          <div>
            <label class="block text-sm font-medium text-white/70 mb-2">
              {{ t('tournament.earlyBirdBonus') }}
            </label>
            <input
              v-model.number="form.earlyBirdBonusChips"
              type="number"
              min="0"
              class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
              :placeholder="t('tournament.earlyBirdBonusPlaceholder')"
            />
          </div>
        </div>

        <!-- Blind Structure Section -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-pp-text-primary">{{ t('tournament.blindStructure') }}</h3>
            <button
              type="button"
              @click="addStructureLevel"
              class="px-3 py-1 text-sm bg-pp-accent-gold/20 text-pp-accent-gold rounded-lg hover:bg-pp-accent-gold/30 transition-colors"
            >
              <IonIcon :icon="addOutline" class="w-4 h-4 inline mr-1" />
              {{ t('tournament.addLevel') }}
            </button>
          </div>

          <!-- Structure Levels -->
          <div class="space-y-3 max-h-64 overflow-y-auto">
            <div
              v-for="(level, index) in form.structure"
              :key="index"
              class="p-3 bg-pp-bg-primary rounded-lg border border-pp-border"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-white">
                  {{ level.isBreak ? t('tournament.break') : t('tournament.level') + ' ' + level.levelNumber }}
                </span>
                <button
                  type="button"
                  @click="removeStructureLevel(index)"
                  class="p-1 text-red-400 hover:text-red-300 transition-colors"
                  :disabled="form.structure.length <= 1"
                >
                  <IonIcon :icon="trashOutline" class="w-4 h-4" />
                </button>
              </div>

              <div class="grid grid-cols-5 gap-2">
                <div>
                  <label class="text-xs text-white/60">SB</label>
                  <input
                    v-model.number="level.smallBlind"
                    type="number"
                    min="0"
                    :disabled="level.isBreak"
                    class="w-full px-2 py-1 text-sm bg-pp-bg-secondary border border-pp-border rounded text-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label class="text-xs text-white/60">BB</label>
                  <input
                    v-model.number="level.bigBlind"
                    type="number"
                    min="0"
                    :disabled="level.isBreak"
                    class="w-full px-2 py-1 text-sm bg-pp-bg-secondary border border-pp-border rounded text-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label class="text-xs text-white/60">Ante</label>
                  <input
                    v-model.number="level.ante"
                    type="number"
                    min="0"
                    :disabled="level.isBreak"
                    class="w-full px-2 py-1 text-sm bg-pp-bg-secondary border border-pp-border rounded text-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label class="text-xs text-white/60">{{ t('tournament.minutes') }}</label>
                  <input
                    v-model.number="level.durationMinutes"
                    type="number"
                    min="1"
                    class="w-full px-2 py-1 text-sm bg-pp-bg-secondary border border-pp-border rounded text-white"
                  />
                </div>
                <div class="flex items-end">
                  <label class="flex items-center gap-1 text-xs text-white/60 cursor-pointer">
                    <input
                      v-model="level.isBreak"
                      type="checkbox"
                      class="rounded border-pp-border"
                      @change="onBreakToggle(level)"
                    />
                    {{ t('tournament.break') }}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-pp-border/50">
          <button
            type="button"
            @click="closeModal"
            class="pp-action-button pp-action-button--secondary"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="submit"
            :disabled="!isFormValid || saving"
            class="pp-action-button pp-action-button--primary"
          >
            <IonIcon v-if="saving" :icon="refreshOutline" class="w-4 h-4 animate-spin" />
            {{ saving ? t('status.saving') : (mode === 'create' ? t('tournament.create') : t('tournament.save')) }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { closeOutline, refreshOutline, addOutline, trashOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import type { Tournament, TournamentFormData, TournamentStructureInput } from '~/types/tournament'

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

const { t } = useI18n()
const clubStore = useClubStore()

// Default structure template
const defaultStructure: TournamentStructureInput[] = [
  { levelNumber: 1, smallBlind: 25, bigBlind: 50, ante: 0, durationMinutes: 20, isBreak: false },
  { levelNumber: 2, smallBlind: 50, bigBlind: 100, ante: 0, durationMinutes: 20, isBreak: false },
  { levelNumber: 3, smallBlind: 75, bigBlind: 150, ante: 25, durationMinutes: 20, isBreak: false },
  { levelNumber: 4, smallBlind: 100, bigBlind: 200, ante: 25, durationMinutes: 20, isBreak: false },
  { levelNumber: 5, smallBlind: 150, bigBlind: 300, ante: 50, durationMinutes: 20, isBreak: false },
]

// Form state
const form = ref<TournamentFormData>({
  name: '',
  description: '',
  startTime: '',
  endTime: '',
  buyInCents: 0,
  seatCap: null,
  earlyBirdBonusChips: null,
  structure: [...defaultStructure.map(s => ({ ...s }))]
})

const saving = ref(false)

// Computed for buy-in in euros (display)
const buyInEuros = computed({
  get: () => form.value.buyInCents / 100,
  set: (val: number) => { form.value.buyInCents = Math.round(val * 100) }
})

// Validation
const isFormValid = computed(() => {
  return form.value.name.trim() &&
         form.value.startTime &&
         form.value.buyInCents >= 0 &&
         form.value.structure.length > 0
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
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.tournament && props.mode === 'edit') {
    form.value = {
      name: props.tournament.title,
      description: props.tournament.description || '',
      startTime: formatDateTimeLocal(props.tournament.startTime),
      endTime: props.tournament.endTime ? formatDateTimeLocal(props.tournament.endTime) : '',
      buyInCents: props.tournament.buyInCents,
      seatCap: props.tournament.seatCap || null,
      earlyBirdBonusChips: null,
      structure: props.tournament.structure?.length > 0
        ? props.tournament.structure.map(s => ({
            levelNumber: s.levelNumber,
            smallBlind: s.smallBlind,
            bigBlind: s.bigBlind,
            ante: s.ante,
            durationMinutes: s.durationMinutes,
            isBreak: s.isBreak,
            breakDurationMinutes: s.breakDurationMinutes || undefined
          }))
        : [...defaultStructure.map(s => ({ ...s }))]
    }
  } else if (isOpen && props.mode === 'create') {
    form.value = {
      name: '',
      description: '',
      startTime: '',
      endTime: '',
      buyInCents: 0,
      seatCap: null,
      earlyBirdBonusChips: null,
      structure: [...defaultStructure.map(s => ({ ...s }))]
    }
  }
})

// Structure management
const addStructureLevel = () => {
  const lastLevel = form.value.structure[form.value.structure.length - 1]
  const newLevel: TournamentStructureInput = {
    levelNumber: form.value.structure.length + 1,
    smallBlind: lastLevel ? lastLevel.bigBlind : 100,
    bigBlind: lastLevel ? lastLevel.bigBlind * 2 : 200,
    ante: lastLevel ? lastLevel.ante : 0,
    durationMinutes: 20,
    isBreak: false
  }
  form.value.structure.push(newLevel)
}

const removeStructureLevel = (index: number) => {
  if (form.value.structure.length <= 1) return
  form.value.structure.splice(index, 1)
  // Renumber levels
  form.value.structure.forEach((level, i) => {
    level.levelNumber = i + 1
  })
}

const onBreakToggle = (level: TournamentStructureInput) => {
  if (level.isBreak) {
    level.smallBlind = 0
    level.bigBlind = 0
    level.ante = 0
    level.breakDurationMinutes = level.durationMinutes
  }
}

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
          seatCap: form.value.seatCap || undefined,
          earlyBirdBonusChips: form.value.earlyBirdBonusChips || undefined,
          structure: form.value.structure
        }
      })
    } else if (props.tournament) {
      await GqlUpdateTournament({
        input: {
          id: props.tournament.id,
          name: form.value.name,
          description: form.value.description || undefined,
          startTime: new Date(form.value.startTime).toISOString(),
          endTime: form.value.endTime ? new Date(form.value.endTime).toISOString() : undefined,
          buyInCents: form.value.buyInCents,
          seatCap: form.value.seatCap || undefined,
          earlyBirdBonusChips: form.value.earlyBirdBonusChips || undefined,
          structure: form.value.structure
        }
      })
    }
    emit('saved')
  } catch (error) {
    console.error('Failed to save tournament:', error)
    alert(t('tournament.saveFailed'))
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  emit('close')
}
</script>
