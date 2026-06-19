<template>
  <IonPage class="page-bg">
    <IonContent class="content-bg">
      <div class="page-container">
        <PpFadeUp>
          <p class="eyebrow">{{ t('nav.redemptionCodes') }}</p>
          <h1 class="page-title">{{ t('redemptionCodes.title') }}</h1>
          <p class="page-subtitle">{{ t('redemptionCodes.subtitle') }}</p>
        </PpFadeUp>

        <!-- Generate -->
        <PpFadeUp :delay="0.08">
          <PpCard as="section" padding="lg" class="generate-card">
            <label class="field-label" for="code-note">{{ t('redemptionCodes.noteLabel') }}</label>
            <input
              id="code-note"
              v-model="noteInput"
              class="field-input"
              :placeholder="t('redemptionCodes.notePlaceholder')"
              :disabled="isGenerating"
              maxlength="80"
              @keyup.enter="generate"
            />

            <p class="field-label duration-label">{{ t('redemptionCodes.durationLabel') }}</p>
            <div
              class="duration-options"
              role="radiogroup"
              :aria-label="t('redemptionCodes.durationLabel')"
            >
              <button
                v-for="opt in durationOptions"
                :key="opt.days"
                type="button"
                role="radio"
                class="duration-option"
                :class="{ 'duration-option--active': selectedDays === opt.days }"
                :aria-checked="selectedDays === opt.days"
                :disabled="isGenerating"
                @click="selectedDays = opt.days"
              >
                {{ opt.label }}
              </button>
            </div>

            <PpButton
              block
              size="lg"
              class="generate-btn"
              :loading="isGenerating"
              :disabled="isGenerating"
              @click="generate"
            >
              {{ t('redemptionCodes.generate') }}
            </PpButton>

            <!-- Freshly generated code, front and centre -->
            <div v-if="lastCreated" class="fresh">
              <p class="fresh__label">{{ t('redemptionCodes.freshLabel') }}</p>
              <button type="button" class="fresh__code" @click="copy(lastCreated.code)">
                <span class="fresh__value">{{ formatCode(lastCreated.code) }}</span>
                <IonIcon
                  :icon="copiedCode === lastCreated.code ? checkmarkOutline : copyOutline"
                  class="fresh__icon"
                />
              </button>
              <p class="fresh__hint">{{ t('redemptionCodes.freshHint') }}</p>
            </div>
          </PpCard>
        </PpFadeUp>

        <!-- List -->
        <PpFadeUp :delay="0.12">
          <h2 class="section-title">{{ t('redemptionCodes.historyTitle') }}</h2>

          <div v-if="loading" class="loading">
            <IonSpinner name="crescent" class="spinner" />
          </div>

          <PpEmptyState
            v-else-if="codes.length === 0"
            :icon="ticketOutline"
            :title="t('redemptionCodes.emptyTitle')"
            :description="t('redemptionCodes.emptyDescription')"
          />

          <PpStagger v-else class="codes">
            <PpStaggerItem v-for="code in codes" :key="code.id">
              <PpCard padding="md" class="code-card">
                <div class="code-main">
                  <button type="button" class="code-value" @click="copy(code.code)">
                    {{ formatCode(code.code) }}
                    <IonIcon
                      :icon="copiedCode === code.code ? checkmarkOutline : copyOutline"
                      class="code-copy"
                    />
                  </button>
                  <p v-if="code.note" class="code-note">{{ code.note }}</p>
                  <p class="code-meta">
                    {{ t('redemptionCodes.trialDays', { days: code.trialDays }) }} ·
                    {{
                      t('redemptionCodes.usesLabel', {
                        used: code.usedCount,
                        max: code.maxUses ?? '∞',
                      })
                    }}
                    <template v-if="code.expiresAt">
                      · {{ t('redemptionCodes.validUntil', { date: formatDate(code.expiresAt) }) }}
                    </template>
                  </p>
                </div>
                <PpBadge :variant="statusVariant(code)">{{
                  t(`redemptionCodes.status.${status(code)}`)
                }}</PpBadge>
              </PpCard>
            </PpStaggerItem>
          </PpStagger>
        </PpFadeUp>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin'],
  title: 'nav.redemptionCodes',
})

import { ref, computed, onMounted } from 'vue'
import { IonPage, IonContent, IonIcon, IonSpinner } from '@ionic/vue'
import { copyOutline, checkmarkOutline, ticketOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { useToast } from '~/composables/useToast'

const { t, locale } = useI18n()
const toast = useToast()

const loading = ref(true)
const isGenerating = ref(false)
const noteInput = ref('')
const selectedDays = ref(90)
const durationOptions = computed(() => [
  { days: 30, label: t('redemptionCodes.duration1Month') },
  { days: 90, label: t('redemptionCodes.duration3Months') },
  { days: 180, label: t('redemptionCodes.duration6Months') },
])
const codes = ref<any[]>([])
const lastCreated = ref<any | null>(null)
const copiedCode = ref<string | null>(null)

// Stored bare as PPXXXXXXXX; show it grouped as PP-XXXX-XXXX (the redeem screen
// strips separators, so a copy of the pretty form still resolves).
const formatCode = (code: string) => {
  const c = (code || '').toUpperCase()
  if (c.startsWith('PP') && c.length === 10) return `PP-${c.slice(2, 6)}-${c.slice(6)}`
  return c
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(locale.value || 'fr-BE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

const status = (code: any): 'expired' | 'redeemed' | 'active' => {
  if (code.expiresAt && new Date(code.expiresAt).getTime() < Date.now()) return 'expired'
  if (code.maxUses != null && code.usedCount >= code.maxUses) return 'redeemed'
  return 'active'
}
const statusVariant = (code: any) => {
  const s = status(code)
  return s === 'active' ? 'success' : s === 'redeemed' ? 'neutral' : 'danger'
}

const fetchCodes = async () => {
  loading.value = true
  try {
    const res = await GqlRedemptionCodes()
    codes.value = res.redemptionCodes ?? []
  } catch {
    toast.error(t('redemptionCodes.fetchError'))
  } finally {
    loading.value = false
  }
}

const copy = async (code: string) => {
  try {
    await navigator.clipboard.writeText(formatCode(code))
    copiedCode.value = code
    setTimeout(() => {
      if (copiedCode.value === code) copiedCode.value = null
    }, 2000)
  } catch {
    toast.error(t('redemptionCodes.copyError'))
  }
}

const generate = async () => {
  isGenerating.value = true
  try {
    const note = noteInput.value.trim()
    const res = await GqlCreateRedemptionCode({
      input: { note: note || null, trialDays: selectedDays.value },
    })
    lastCreated.value = res.createRedemptionCode
    noteInput.value = ''
    await fetchCodes()
    if (lastCreated.value?.code) await copy(lastCreated.value.code)
    toast.success(t('redemptionCodes.generated'))
  } catch (err: any) {
    toast.error(err?.gqlErrors?.[0]?.message || t('redemptionCodes.generateError'))
  } finally {
    isGenerating.value = false
  }
}

onMounted(() => {
  fetchCodes()
})
</script>

<style scoped>
.page-bg,
.content-bg {
  background-color: var(--color-pp-bg);
}

.page-container {
  padding: 1.5rem 1rem;
  max-width: 720px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .page-container {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
}

.page-title {
  margin-top: 0.65rem;
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 3vw + 0.5rem, 2.5rem);
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-pp-text);
}

.page-subtitle {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-pp-text-muted);
}

.generate-card {
  margin-top: 1.75rem;
}

.field-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--color-pp-text-dim);
  margin-bottom: 0.5rem;
}

.field-input {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border-radius: 0.7rem;
  border: 1px solid var(--color-pp-border);
  background-color: var(--color-pp-surface);
  color: var(--color-pp-text);
  font-size: 0.9rem;
}

.field-input:focus {
  outline: none;
  border-color: var(--color-pp-gold);
}

.duration-label {
  margin-top: 1.1rem;
}

.duration-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.duration-option {
  padding: 0.6rem 0.5rem;
  border-radius: 0.7rem;
  border: 1px solid var(--color-pp-border);
  background-color: var(--color-pp-surface);
  color: var(--color-pp-text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.duration-option:hover {
  color: var(--color-pp-text);
  border-color: var(--color-pp-border-strong);
}

.duration-option--active {
  color: var(--color-pp-text);
  border-color: var(--color-pp-gold);
  background-color: var(--color-pp-surface-2);
}

.generate-btn {
  margin-top: 1rem;
}

.fresh {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-pp-border);
  text-align: center;
}

.fresh__label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--color-pp-text-dim);
}

.fresh__code {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.6rem;
  padding: 0.6rem 1rem;
  border-radius: 0.8rem;
  border: 1px solid var(--color-pp-gold);
  background-color: rgba(var(--pp-accent-rgb), 0.08);
  cursor: pointer;
}

.fresh__value {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--color-pp-gold);
}

.fresh__icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-pp-gold);
}

.fresh__hint {
  margin-top: 0.6rem;
  font-size: 0.8rem;
  color: var(--color-pp-text-dim);
}

.section-title {
  margin-top: 2.25rem;
  margin-bottom: 1rem;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-pp-text);
}

.loading {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.spinner {
  width: 2rem;
  height: 2rem;
  color: var(--color-pp-gold);
}

.codes {
  display: grid;
  gap: 0.75rem;
}

.code-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.code-main {
  min-width: 0;
}

.code-value {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--color-pp-text);
  cursor: pointer;
}

.code-copy {
  width: 1rem;
  height: 1rem;
  color: var(--color-pp-text-dim);
}

.code-value:hover .code-copy {
  color: var(--color-pp-gold);
}

.code-note {
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: var(--color-pp-text-muted);
}

.code-meta {
  margin-top: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-pp-text-dim);
}
</style>
