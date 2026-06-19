<template>
  <div class="auth-page">
    <div class="gold-glow" aria-hidden="true" />

    <PpFadeUp class="auth-card-wrap">
      <div class="auth-card pp-glass">
        <PpFadeUp :delay="0.08">
          <div class="head">
            <p class="eyebrow">Tournament Manager</p>
            <h1 class="title">{{ t('auth.forgotPasswordTitle') }}</h1>
            <p class="subtitle">{{ t('auth.forgotPasswordInfo') }}</p>
          </div>
        </PpFadeUp>

        <!-- Generic success (shown regardless of whether the email exists) -->
        <PpFadeUp v-if="submitted" :delay="0.12">
          <p class="success">{{ t('auth.requestResetSuccess') }}</p>
          <NuxtLink to="/login" class="back-link">{{ t('auth.backToLogin') }}</NuxtLink>
        </PpFadeUp>

        <form v-else class="form" @submit.prevent="handleSubmit">
          <PpFadeUp :delay="0.12">
            <div>
              <label class="field-label">{{ t('auth.email') }}</label>
              <input
                v-model="email"
                type="email"
                inputmode="email"
                autocomplete="email"
                :placeholder="t('auth.email')"
                :disabled="isLoading"
                @input="emailError = ''"
                :class="['form-input', emailError ? 'form-input--error' : 'form-input--default']"
              />
              <p v-if="emailError" class="field-error">{{ emailError }}</p>
            </div>
          </PpFadeUp>

          <PpFadeUp :delay="0.18">
            <PpButton type="submit" block size="lg" :loading="isLoading" :disabled="isLoading">
              {{ t('auth.sendResetLink') }}
            </PpButton>
          </PpFadeUp>

          <PpFadeUp :delay="0.24">
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
  title: 'auth.forgotPasswordTitle',
})

import { ref } from 'vue'
import { useI18n } from '~/composables/useI18n'

const { t, locale } = useI18n()

const email = ref('')
const emailError = ref('')
const isLoading = ref(false)
const submitted = ref(false)

const validateEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const handleSubmit = async () => {
  emailError.value = ''
  if (!email.value) {
    emailError.value = t('auth.emailRequired')
    return
  }
  if (!validateEmail(email.value)) {
    emailError.value = t('auth.emailInvalid')
    return
  }

  isLoading.value = true
  try {
    // Backend always returns success (anti-enumeration); we mirror that and show
    // the same generic confirmation whether or not the address has an account.
    await GqlRequestPasswordReset({ input: { email: email.value, locale: locale.value } })
    submitted.value = true
  } catch {
    // Only a transport failure lands here.
    emailError.value = t('auth.requestResetError')
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

.field-error {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: var(--color-pp-danger);
  padding-left: 0.25rem;
}

.success {
  font-size: 0.95rem;
  color: var(--color-pp-text);
  text-align: center;
  line-height: 1.5;
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
