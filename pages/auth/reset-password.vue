<template>
  <div class="auth-page">
    <div class="gold-glow" aria-hidden="true" />

    <PpFadeUp class="auth-card-wrap">
      <div class="auth-card pp-glass">
        <PpFadeUp :delay="0.08">
          <div class="head">
            <p class="eyebrow">Tournament Manager</p>
            <h1 class="title">{{ t('auth.resetPasswordTitle') }}</h1>
            <p class="subtitle">{{ t('auth.resetPasswordSubtitle') }}</p>
          </div>
        </PpFadeUp>

        <!-- No / invalid token: dead end with a way back to request a new link -->
        <PpFadeUp v-if="!token" :delay="0.12">
          <p class="notice notice--error">{{ t('auth.resetMissingToken') }}</p>
          <NuxtLink to="/forgot-password" class="back-link">{{ t('auth.sendResetLink') }}</NuxtLink>
        </PpFadeUp>

        <form v-else class="form" @submit.prevent="handleSubmit">
          <PpFadeUp :delay="0.12">
            <div>
              <label class="field-label">{{ t('auth.newPassword') }}</label>
              <div class="input-wrapper">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  :placeholder="t('auth.newPassword')"
                  :disabled="isLoading"
                  @input="error = ''"
                  :class="[
                    'form-input form-input--with-toggle',
                    error ? 'form-input--error' : 'form-input--default',
                  ]"
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                >
                  <IonIcon :icon="showPassword ? eyeOffOutline : eyeOutline" class="toggle-icon" />
                </button>
              </div>
            </div>
          </PpFadeUp>

          <PpFadeUp :delay="0.18">
            <div>
              <label class="field-label">{{ t('auth.confirmPassword') }}</label>
              <input
                v-model="confirm"
                type="password"
                autocomplete="new-password"
                :placeholder="t('auth.confirmPassword')"
                :disabled="isLoading"
                @input="error = ''"
                :class="['form-input', error ? 'form-input--error' : 'form-input--default']"
              />
            </div>
          </PpFadeUp>

          <PpFadeUp v-if="error" :delay="0.02">
            <p class="field-error">{{ error }}</p>
          </PpFadeUp>

          <PpFadeUp :delay="0.24">
            <PpButton type="submit" block size="lg" :loading="isLoading" :disabled="isLoading">
              {{ t('auth.resetPasswordTitle') }}
            </PpButton>
          </PpFadeUp>

          <PpFadeUp :delay="0.3">
            <NuxtLink to="/login" class="back-link">{{ t('auth.backToLogin') }}</NuxtLink>
          </PpFadeUp>
        </form>
      </div>
    </PpFadeUp>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  title: 'auth.resetPasswordTitle',
})

import { ref, computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { eyeOutline, eyeOffOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { useToast } from '~/composables/useToast'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const token = computed(() => (route.query.token as string) || '')
const password = ref('')
const confirm = ref('')
const showPassword = ref(false)
const error = ref('')
const isLoading = ref(false)

// Same rule as onboarding: 8+ chars, at least one letter and one digit.
const isStrong = (v: string): boolean => v.length >= 8 && /[a-zA-Z]/.test(v) && /\d/.test(v)

const handleSubmit = async () => {
  error.value = ''
  if (!isStrong(password.value)) {
    error.value = t('auth.passwordWeak')
    return
  }
  if (password.value !== confirm.value) {
    error.value = t('auth.passwordsDoNotMatch')
    return
  }

  isLoading.value = true
  try {
    const res = await GqlResetPassword({
      input: { token: token.value, newPassword: password.value },
    })
    if (res?.resetPassword?.success) {
      toast.success(t('auth.resetSuccess'))
      await router.replace('/login')
    } else {
      // Token invalid / expired / already used — backend signals via success:false.
      error.value = t('auth.resetInvalid')
    }
  } catch {
    error.value = t('auth.resetError')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: var(--color-pp-bg);
  position: relative;
  overflow: hidden;
}

.gold-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 540px;
  height: 540px;
  background-color: rgba(var(--pp-accent-rgb), 0.07);
  border-radius: 9999px;
  filter: blur(120px);
  pointer-events: none;
}

.auth-card-wrap {
  width: 100%;
  max-width: 28rem;
  position: relative;
}

.auth-card {
  border-radius: var(--radius-2xl);
  padding: 2rem;
  box-shadow: var(--shadow-card);
}

@media (min-width: 768px) {
  .auth-card {
    padding: 2.5rem;
  }
}

.head {
  text-align: center;
  margin-bottom: 1.75rem;
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
}

.title {
  margin-top: 0.6rem;
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-pp-text);
}

.subtitle {
  margin-top: 0.6rem;
  font-size: 0.9rem;
  color: var(--color-pp-text-muted);
}

.form > * + * {
  margin-top: 1.25rem;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-pp-text-muted);
  margin-bottom: 0.4rem;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid;
  border-radius: 0.75rem;
  color: var(--color-pp-text);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
  outline: none;
  font-family: inherit;
  font-size: 0.95rem;
}

.form-input::placeholder {
  color: var(--color-pp-text-dim);
}

.form-input--with-toggle {
  padding-right: 3rem;
}

.form-input--default {
  border-color: var(--color-pp-border-strong);
}
.form-input--error {
  border-color: rgba(239, 68, 68, 0.6);
}

.form-input:focus {
  box-shadow: 0 0 0 3px rgba(var(--pp-accent-rgb), 0.18);
  border-color: var(--color-pp-gold);
  background-color: rgba(255, 255, 255, 0.07);
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.25rem;
  cursor: pointer;
  background: transparent;
  border: 0;
  color: var(--color-pp-text-dim);
  transition: color 0.15s ease;
}

.password-toggle:hover {
  color: var(--color-pp-text);
}

.toggle-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.field-error {
  font-size: 0.8rem;
  color: var(--color-pp-danger);
  padding-left: 0.25rem;
}

.notice {
  font-size: 0.95rem;
  text-align: center;
  line-height: 1.5;
}

.notice--error {
  color: var(--color-pp-danger);
}

.back-link {
  display: block;
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-pp-text-muted);
  transition: color 0.15s ease;
}

.back-link:hover {
  color: var(--color-pp-gold);
}
</style>
