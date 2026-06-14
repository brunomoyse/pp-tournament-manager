<template>
  <PpModal :open="isOpen" size="lg" @close="closeModal">
    <template #header>
      <div class="announcement-form-header-sticky">
        <h2 class="announcement-form-title">{{ t('announcements.create') }}</h2>
      </div>
    </template>

    <form @submit.prevent="handleSubmit" class="announcement-form">
      <!-- Scope -->
      <div class="announcement-form-field">
        <label class="pp-label">
          {{ t('announcements.scope') }} <span class="announcement-form-required">*</span>
        </label>
        <select v-model="form.scope" class="pp-select">
          <option value="TOURNAMENT">{{ t('announcements.scopeTournament') }}</option>
          <option value="CLUB">{{ t('announcements.scopeClub') }}</option>
          <option v-if="isAdmin" value="PLATFORM">{{ t('announcements.scopePlatform') }}</option>
        </select>
      </div>

      <!-- Tournament selector (tournament scope only) -->
      <div v-if="form.scope === 'TOURNAMENT'" class="announcement-form-field">
        <label class="pp-label">
          {{ t('announcements.tournament') }} <span class="announcement-form-required">*</span>
        </label>
        <select v-model="form.tournamentId" class="pp-select">
          <option value="" disabled>{{ t('announcements.tournamentPlaceholder') }}</option>
          <option v-for="trn in tournaments" :key="trn.id" :value="trn.id">
            {{ trn.title }}
          </option>
        </select>
      </div>

      <!-- Title -->
      <div class="announcement-form-field">
        <label class="pp-label">
          {{ t('announcements.titleLabel') }} <span class="announcement-form-required">*</span>
        </label>
        <input
          v-model="form.title"
          type="text"
          required
          maxlength="120"
          class="pp-input"
          :placeholder="t('announcements.titlePlaceholder')"
        />
      </div>

      <!-- Body -->
      <div class="announcement-form-field">
        <label class="pp-label">
          {{ t('announcements.bodyLabel') }} <span class="announcement-form-required">*</span>
        </label>
        <textarea
          v-model="form.body"
          rows="4"
          required
          maxlength="1000"
          class="pp-input"
          :placeholder="t('announcements.bodyPlaceholder')"
        />
      </div>

      <!-- Audience hint -->
      <p class="announcement-form-help">{{ audienceHint }}</p>
    </form>

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
        {{ saving ? t('status.saving') : t('announcements.send') }}
      </PpButton>
    </template>
  </PpModal>
</template>

<script setup lang="ts">
import { useI18n } from '~/composables/useI18n'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  saved: []
}>()

const { t } = useI18n()
const toast = useToast()
const clubStore = useClubStore()
const authStore = useAuthStore()

const isAdmin = computed(() => authStore.currentUser?.role === 'ADMIN')

const form = ref<{
  scope: 'TOURNAMENT' | 'CLUB' | 'PLATFORM'
  tournamentId: string
  title: string
  body: string
}>({
  scope: 'CLUB',
  tournamentId: '',
  title: '',
  body: '',
})
const saving = ref(false)

// Tournaments for the selector (tournament scope).
const tournaments = ref<{ id: string; title: string }[]>([])

const fetchTournaments = async () => {
  const clubId = clubStore.club?.id
  if (!clubId) return
  try {
    const { tournaments: result } = await GqlGetTournaments({ clubId })
    tournaments.value = (result?.items || []).map((trn) => ({ id: trn.id, title: trn.title }))
  } catch (error) {
    console.error('Failed to fetch tournaments:', error)
  }
}

const audienceHint = computed(() => {
  switch (form.value.scope) {
    case 'TOURNAMENT':
      return t('announcements.audienceTournament')
    case 'PLATFORM':
      return t('announcements.audiencePlatform')
    default:
      return t('announcements.audienceClub')
  }
})

const isFormValid = computed(() => {
  return (
    !!form.value.title.trim() &&
    !!form.value.body.trim() &&
    (form.value.scope !== 'TOURNAMENT' || !!form.value.tournamentId)
  )
})

// Reset the form whenever the modal opens, and refresh the tournament list.
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      form.value = { scope: 'CLUB', tournamentId: '', title: '', body: '' }
      fetchTournaments()
    }
  },
)

const handleSubmit = async () => {
  if (!isFormValid.value) return

  saving.value = true
  try {
    const input: Record<string, unknown> = {
      scope: form.value.scope,
      title: form.value.title.trim(),
      body: form.value.body.trim(),
    }
    if (form.value.scope === 'CLUB') {
      input.clubId = clubStore.club?.id
    } else if (form.value.scope === 'TOURNAMENT') {
      input.tournamentId = form.value.tournamentId
    }

    await GqlCreateAnnouncement({ input })
    toast.success(t('announcements.sent'))
    emit('saved')
  } catch (error) {
    console.error('Failed to create announcement:', error)
    toast.error(t('announcements.sendFailed'))
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  emit('close')
}
</script>

<style scoped>
.announcement-form-header-sticky {
  padding-bottom: 0.5rem;
}

.announcement-form-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-pp-text);
}

.announcement-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.announcement-form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.announcement-form-required {
  color: var(--pp-red-400, #f87171);
}

.announcement-form-help {
  font-size: 0.8rem;
  color: var(--color-pp-text-muted);
}
</style>
