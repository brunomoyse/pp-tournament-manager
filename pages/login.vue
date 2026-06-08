<template>
  <div class="login-page">
    <div class="gold-glow" aria-hidden="true" />
    <div class="grain-layer" aria-hidden="true" />

    <PpFadeUp class="login-card-wrap">
      <div class="login-card pp-glass">
        <PpFadeUp :delay="0.08">
          <div class="logo-section">
            <div class="logo-wrapper">
              <img src="@/assets/icon-no-bg.png" alt="PocketPair" class="logo-image" />
            </div>
            <p class="eyebrow">Tournament Manager</p>
            <h1 class="app-title">
              <span class="pp-gold-text">PocketPair</span>
            </h1>
          </div>
        </PpFadeUp>

        <form @submit.prevent="handleLogin" class="login-form">
          <PpFadeUp :delay="0.14">
            <div>
              <label class="field-label">{{ t('auth.email') }}</label>
              <div class="input-wrapper">
                <svg
                  class="input-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                <input
                  v-model="email"
                  type="email"
                  :placeholder="t('auth.email')"
                  autocomplete="email"
                  :disabled="isLoading"
                  @input="clearErrors"
                  :class="[
                    'form-input form-input--with-icon',
                    emailError ? 'form-input--error' : 'form-input--default',
                  ]"
                />
              </div>
              <p v-if="emailError" class="field-error">{{ emailError }}</p>
            </div>
          </PpFadeUp>

          <PpFadeUp :delay="0.2">
            <div>
              <label class="field-label">{{ t('auth.password') }}</label>
              <div class="input-wrapper">
                <svg
                  class="input-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="t('auth.password')"
                  autocomplete="current-password"
                  :disabled="isLoading"
                  @input="clearErrors"
                  :class="[
                    'form-input form-input--with-icon form-input--with-toggle',
                    passwordError ? 'form-input--error' : 'form-input--default',
                  ]"
                />
                <button
                  type="button"
                  @click="togglePasswordVisibility"
                  class="password-toggle"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                >
                  <svg
                    v-if="!showPassword"
                    class="toggle-icon"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <svg
                    v-else
                    class="toggle-icon"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                </button>
              </div>
              <p v-if="passwordError" class="field-error">{{ passwordError }}</p>
            </div>
          </PpFadeUp>

          <PpFadeUp :delay="0.26">
            <div class="form-options">
              <label class="remember-label">
                <input
                  v-model="rememberMe"
                  type="checkbox"
                  :disabled="isLoading"
                  class="remember-checkbox"
                />
                <div class="toggle-switch" />
                <span class="remember-text">{{ t('auth.rememberMe') }}</span>
              </label>

              <button
                type="button"
                @click="forgotPassword"
                :disabled="isLoading"
                class="forgot-link"
              >
                {{ t('auth.forgotPassword') }}
              </button>
            </div>
          </PpFadeUp>

          <PpFadeUp :delay="0.32">
            <PpButton
              type="submit"
              block
              size="lg"
              :loading="isLoading"
              :disabled="!isFormValid || isLoading"
            >
              {{ isLoading ? t('status.loading') : t('auth.login') }}
            </PpButton>
          </PpFadeUp>
        </form>
      </div>
    </PpFadeUp>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

import { ref, computed } from 'vue'
import { useAuthStore, type LoginCredentials } from '~/stores/useAuthStore'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { login, isLoading } = authStore

watch(
  () => authStore.isAuthenticated,
  (authenticated) => {
    if (authenticated) {
      const redirectTo = (route.query.redirect as string) || '/'
      router.replace(redirectTo)
    }
  },
  { immediate: true },
)

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)

const emailError = ref('')
const passwordError = ref('')

const isFormValid = computed(() => {
  return (
    email.value.length > 0 && password.value.length > 0 && !emailError.value && !passwordError.value
  )
})

const validateEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const clearErrors = () => {
  emailError.value = ''
  passwordError.value = ''
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleLogin = async () => {
  clearErrors()

  if (!email.value) {
    emailError.value = t('auth.emailRequired')
    return
  }
  if (!validateEmail(email.value)) {
    emailError.value = t('auth.emailInvalid')
    return
  }
  if (!password.value) {
    passwordError.value = t('auth.passwordRequired')
    return
  }
  if (password.value.length < 5) {
    passwordError.value = t('auth.passwordTooShort')
    return
  }

  try {
    const credentials: LoginCredentials = {
      email: email.value,
      password: password.value,
      rememberMe: rememberMe.value,
    }
    const user = await login(credentials)
    if (user) {
      const redirectTo = (route.query.redirect as string) || '/'
      await nextTick()
      await router.replace(redirectTo)
    } else {
      emailError.value = t('auth.invalidCredentials')
    }
  } catch {
    emailError.value = t('auth.loginFailedGeneric')
  }
}

const forgotPassword = async () => {
  console.warn('Forgot password functionality not implemented yet.')
}
</script>

<style scoped>
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--color-pp-text);
  -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.05) inset;
  transition: background-color 5000s ease-in-out 0s;
}

.login-page {
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
  background-color: rgba(254, 231, 138, 0.07);
  border-radius: 9999px;
  filter: blur(120px);
  pointer-events: none;
}

.grain-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    radial-gradient(at 0% 0%, rgba(254, 231, 138, 0.06) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(254, 231, 138, 0.04) 0px, transparent 50%);
}

.login-card-wrap {
  width: 100%;
  max-width: 28rem;
  position: relative;
}

.login-card {
  border-radius: var(--radius-2xl);
  padding: 2rem;
  box-shadow: var(--shadow-card);
}

@media (min-width: 768px) {
  .login-card-wrap {
    max-width: 32rem;
  }
  .login-card {
    padding: 2.5rem;
  }
}

.logo-section {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-wrapper {
  width: 4.5rem;
  height: 4.5rem;
  margin: 0 auto 1rem;
  border-radius: 9999px;
  background-color: #1a1b17;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem;
  box-shadow: 0 8px 32px rgba(254, 231, 138, 0.25);
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
}

.app-title {
  margin-top: 0.75rem;
  font-family: var(--font-display);
  font-size: 2.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.05;
}

.login-form > * + * {
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

.input-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-pp-text-dim);
  pointer-events: none;
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

.form-input--with-icon {
  padding-left: 2.75rem;
}
.form-input--with-toggle {
  padding-right: 3rem;
}

.form-input--default {
  border-color: var(--color-pp-border-strong);
}
.form-input--default:hover {
  border-color: rgba(255, 255, 255, 0.2);
}
.form-input--error {
  border-color: rgba(239, 68, 68, 0.6);
}

.form-input:focus {
  box-shadow: 0 0 0 3px rgba(254, 231, 138, 0.18);
  border-color: var(--color-pp-gold);
  background-color: rgba(255, 255, 255, 0.07);
}

.field-error {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: var(--color-pp-danger);
  padding-left: 0.25rem;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.25rem;
  color: var(--color-pp-text-dim);
  cursor: pointer;
  transition: color 0.15s ease;
  background: transparent;
  border: 0;
}

.password-toggle:hover {
  color: var(--color-pp-text);
}

.toggle-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.remember-label {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  cursor: pointer;
  user-select: none;
}

.remember-checkbox {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.toggle-switch {
  width: 2.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  background-color: var(--color-pp-text);
  transition: transform 0.2s ease;
}

.remember-checkbox:checked + .toggle-switch {
  background-color: var(--color-pp-gold);
  border-color: var(--color-pp-gold);
}

.remember-checkbox:checked + .toggle-switch::after {
  transform: translateX(1rem);
  background-color: var(--color-pp-bg);
}

.remember-text {
  font-size: 0.875rem;
  color: var(--color-pp-text-muted);
}

.forgot-link {
  font-size: 0.875rem;
  color: rgba(254, 231, 138, 0.8);
  cursor: pointer;
  transition: color 0.15s ease;
  background: transparent;
  border: 0;
}

.forgot-link:hover {
  color: var(--color-pp-gold);
}
</style>
