<template>
  <div v-if="isOpen" class="pp-modal-overlay">
    <div class="pp-modal-backdrop" @click="closeModal"></div>

    <div class="pp-modal-content pp-modal-content--2xl">
      <!-- Header -->
      <div class="pp-modal-header">
        <h2 class="modal-title">
          {{ mode === 'create' ? t('templates.createBlindStructure') : t('templates.editBlindStructure') }}
        </h2>
        <button @click="closeModal" class="pp-close-button">
          <IonIcon :icon="closeOutline" class="close-icon" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="pp-modal-body form-body">
        <!-- Name -->
        <div class="form-field">
          <label class="pp-label">{{ t('templates.name') }} <span class="required">*</span></label>
          <input v-model="form.name" type="text" required class="pp-input" :placeholder="t('templates.namePlaceholder')" />
        </div>

        <!-- Description -->
        <div class="form-field">
          <label class="pp-label">{{ t('templates.description') }}</label>
          <input v-model="form.description" type="text" class="pp-input" :placeholder="t('templates.descriptionPlaceholder')" />
        </div>

        <!-- Levels -->
        <div class="form-field">
          <div class="levels-header">
            <label class="pp-label">{{ t('templates.levels') }}</label>
            <span class="total-duration">
              {{ t('templates.totalDuration') }}: {{ totalDurationFormatted }}
            </span>
          </div>

          <div class="levels-scroll">
            <table class="levels-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ t('templates.smallBlind') }}</th>
                  <th>{{ t('templates.bigBlind') }}</th>
                  <th>{{ t('templates.ante') }}</th>
                  <th>{{ t('templates.duration') }}</th>
                  <th>{{ t('templates.isBreak') }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(level, index) in form.levels" :key="index" :class="{ 'break-row': level.isBreak }">
                  <td class="level-num">{{ level.levelNumber }}</td>
                  <td>
                    <input
                      v-model.number="level.smallBlind"
                      type="number" min="0"
                      class="pp-input level-input"
                      :disabled="level.isBreak"
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="level.bigBlind"
                      type="number" min="0"
                      class="pp-input level-input"
                      :disabled="level.isBreak"
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="level.ante"
                      type="number" min="0"
                      class="pp-input level-input"
                      :disabled="level.isBreak"
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="level.durationMinutes"
                      type="number" min="1"
                      class="pp-input level-input"
                    />
                  </td>
                  <td class="break-cell">
                    <button
                      type="button"
                      @click="level.isBreak = !level.isBreak"
                      :class="['break-toggle', level.isBreak ? 'break-toggle--active' : '']"
                    >
                      {{ level.isBreak ? t('labels.break') : '-' }}
                    </button>
                  </td>
                  <td>
                    <button
                      v-if="form.levels.length > 1"
                      type="button"
                      @click="removeLevel(index)"
                      class="remove-btn"
                    >
                      <IonIcon :icon="removeCircleOutline" class="remove-icon" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="level-actions">
            <button type="button" @click="addLevel(false)" class="pp-action-button pp-action-button--secondary add-btn">
              <IonIcon :icon="addCircleOutline" class="add-icon" />
              {{ t('templates.addLevel') }}
            </button>
            <button type="button" @click="addLevel(true)" class="pp-action-button pp-action-button--secondary add-btn">
              <IonIcon :icon="cafeOutline" class="add-icon" />
              {{ t('templates.addBreak') }}
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" @click="closeModal" class="pp-action-button pp-action-button--secondary">
            {{ t('common.cancel') }}
          </button>
          <button
            type="submit"
            :disabled="!isFormValid || saving"
            class="pp-action-button pp-action-button--primary"
          >
            <IonIcon v-if="saving" :icon="refreshOutline" class="spinner" />
            {{ saving ? t('status.saving') : (mode === 'create' ? t('templates.create') : t('templates.save')) }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { closeOutline, refreshOutline, addCircleOutline, removeCircleOutline, cafeOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import type { BlindStructureTemplate } from '~/types/tournament'

interface Props {
  isOpen: boolean
  template: BlindStructureTemplate | null
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

interface LevelEntry {
  levelNumber: number
  smallBlind: number
  bigBlind: number
  ante: number
  durationMinutes: number
  isBreak: boolean
}

const form = ref({
  name: '',
  description: '',
  levels: [
    { levelNumber: 1, smallBlind: 25, bigBlind: 50, ante: 0, durationMinutes: 20, isBreak: false }
  ] as LevelEntry[]
})

const totalDurationFormatted = computed(() => {
  const totalMinutes = form.value.levels.reduce((sum, l) => sum + (l.durationMinutes || 0), 0)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}${t('templates.hours')}`
  return `${hours}${t('templates.hours')}${mins}m`
})

const isFormValid = computed(() => {
  return form.value.name.trim() && form.value.levels.length > 0
})

const renumberLevels = () => {
  form.value.levels.forEach((l, i) => { l.levelNumber = i + 1 })
}

const addLevel = (isBreak: boolean) => {
  const lastLevel = form.value.levels[form.value.levels.length - 1]
  form.value.levels.push({
    levelNumber: form.value.levels.length + 1,
    smallBlind: isBreak ? 0 : (lastLevel ? lastLevel.smallBlind * 2 : 25),
    bigBlind: isBreak ? 0 : (lastLevel ? lastLevel.bigBlind * 2 : 50),
    ante: isBreak ? 0 : (lastLevel?.ante || 0),
    durationMinutes: isBreak ? 10 : (lastLevel?.durationMinutes || 20),
    isBreak
  })
}

const removeLevel = (index: number) => {
  form.value.levels.splice(index, 1)
  renumberLevels()
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.template && props.mode === 'edit') {
    form.value = {
      name: props.template.name,
      description: props.template.description || '',
      levels: props.template.levels.map(l => ({
        levelNumber: l.levelNumber,
        smallBlind: l.smallBlind,
        bigBlind: l.bigBlind,
        ante: l.ante,
        durationMinutes: l.isBreak ? (l.breakDurationMinutes || 10) : l.durationMinutes,
        isBreak: l.isBreak
      }))
    }
  } else if (isOpen && props.mode === 'create') {
    form.value = {
      name: '',
      description: '',
      levels: [
        { levelNumber: 1, smallBlind: 25, bigBlind: 50, ante: 0, durationMinutes: 20, isBreak: false }
      ]
    }
  }
})

const handleSubmit = async () => {
  if (!isFormValid.value) return
  saving.value = true

  try {
    const input = {
      name: form.value.name,
      description: form.value.description || undefined,
      levels: form.value.levels.map(l => ({
        levelNumber: l.levelNumber,
        smallBlind: l.isBreak ? 0 : l.smallBlind,
        bigBlind: l.isBreak ? 0 : l.bigBlind,
        ante: l.isBreak ? 0 : l.ante,
        durationMinutes: l.isBreak ? 0 : l.durationMinutes,
        isBreak: l.isBreak,
        breakDurationMinutes: l.isBreak ? l.durationMinutes : undefined
      }))
    }

    if (props.mode === 'create') {
      await GqlCreateBlindStructureTemplate({ input })
    } else if (props.template) {
      await GqlUpdateBlindStructureTemplate({ input: { id: props.template.id, ...input } })
    }
    emit('saved')
  } catch (error) {
    console.error('Failed to save blind structure template:', error)
    toast.error(t('templates.saveFailed'))
  } finally {
    saving.value = false
  }
}

const closeModal = () => emit('close')
</script>

<style scoped>
.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--pp-text-primary);
}

.close-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.form-body > * + * {
  margin-top: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.required {
  color: var(--pp-red-400);
}

.levels-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.total-duration {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.levels-scroll {
  overflow-x: auto;
  margin-bottom: 0.75rem;
}

.levels-table {
  width: 100%;
  font-size: 0.8125rem;
  min-width: 28rem;
}

.levels-table th {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.6875rem;
  padding: 0.375rem 0.25rem;
  border-bottom: 1px solid rgba(84, 84, 95, 0.5);
  white-space: nowrap;
}

.levels-table td {
  padding: 0.25rem;
  vertical-align: middle;
}

.break-row {
  background-color: rgba(254, 231, 138, 0.05);
}

.level-num {
  text-align: center;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  width: 2rem;
}

.level-input {
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  width: 100%;
  min-width: 3.5rem;
}

.break-cell {
  text-align: center;
}

.break-toggle {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.3);
}

.break-toggle--active {
  background-color: rgba(254, 231, 138, 0.15);
  color: var(--pp-accent-gold);
}

.remove-btn {
  color: rgba(255, 255, 255, 0.3);
  transition: color 0.2s ease;
  cursor: pointer;
}

.remove-btn:hover {
  color: var(--pp-red-400);
}

.remove-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.level-actions {
  display: flex;
  gap: 0.5rem;
}

.add-btn {
  font-size: 0.8125rem;
  padding: 0.375rem 0.75rem;
}

.add-icon {
  width: 1rem;
  height: 1rem;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--pp-border);
}

.spinner {
  width: 1rem;
  height: 1rem;
  animation: pp-spin 1s linear infinite;
}
</style>
