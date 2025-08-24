<template>
  <IonPage class="pp-page">
    <IonHeader :translucent="true" class="pp-header">
      <IonToolbar class="pp-toolbar">
        <IonTitle class="pp-title">{{ t('auth.login') }}</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent :fullscreen="true" class="pp-content">
      <div class="pp-login-container">
        <!-- Logo Section -->
        <div class="pp-logo-section">
          <div class="pp-logo">
            <img src="@/assets/icon-no-bg.png" alt="PocketPair" class="pp-logo-image" />
          </div>
          <h1 class="pp-app-title">PocketPair</h1>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="pp-login-form">
          <!-- Email Input -->
          <div class="pp-input-group">
            <IonItem class="pp-input-item" :class="{ 'pp-error': emailError }">
              <IonIcon :icon="mailOutline" slot="start" class="pp-input-icon" />
              <IonInput
                v-model="email"
                type="email"
                :placeholder="t('auth.email')"
                autocomplete="email"
                :disabled="isLoading"
                @ionInput="clearErrors"
                class="pp-input"
              />
            </IonItem>
            <div v-if="emailError" class="pp-error-text">{{ emailError }}</div>
          </div>

          <!-- Password Input -->
          <div class="pp-input-group">
            <IonItem class="pp-input-item" :class="{ 'pp-error': passwordError }">
              <IonIcon :icon="lockClosedOutline" slot="start" class="pp-input-icon" />
              <IonInput
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="t('auth.password')"
                autocomplete="current-password"
                :disabled="isLoading"
                @ionInput="clearErrors"
                class="pp-input"
              />
              <IonButton
                slot="end"
                fill="clear"
                @click="togglePasswordVisibility"
                class="pp-password-toggle"
              >
                <IonIcon :icon="showPassword ? eyeOffOutline : eyeOutline" />
              </IonButton>
            </IonItem>
            <div v-if="passwordError" class="pp-error-text">{{ passwordError }}</div>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="pp-form-options">
            <div class="pp-toggle-group">
              <IonToggle
                v-model="rememberMe"
                class="pp-toggle"
                :disabled="isLoading"
              />
              <IonLabel class="pp-toggle-label">{{ t('auth.rememberMe') }}</IonLabel>
            </div>
            
            <IonButton
              fill="clear"
              size="small"
              @click="forgotPassword"
              class="pp-forgot-password"
              :disabled="isLoading"
            >
              {{ t('auth.forgotPassword') }}
            </IonButton>
          </div>

          <!-- Login Button -->
          <IonButton
            type="submit"
            expand="block"
            class="pp-login-button"
            :disabled="!isFormValid || isLoading"
          >
            <span>{{ t('auth.login') }}</span>
          </IonButton>
        </form>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonContent,
  IonItem,
  IonInput,
  IonToggle,
  IonLabel,
} from '@ionic/vue'
import {
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
} from 'ionicons/icons'
import { ref, computed } from 'vue'
import { useAuthStore, type LoginCredentials } from '~/stores/useAuthStore'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { login, isLoading, isAuthenticated } = authStore

// Redirect if already authenticated
watch(() => authStore.isAuthenticated, (authenticated) => {
  if (authenticated) {
    const redirectTo = (route.query.redirect as string) || '/'
    router.replace(redirectTo)
  }
}, { immediate: true })

// Form state
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)

// Validation errors
const emailError = ref('')
const passwordError = ref('')

// Form validation
const isFormValid = computed(() => {
  return email.value.length > 0 && password.value.length > 0 && !emailError.value && !passwordError.value
})

// Validate email format
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Clear validation errors
const clearErrors = () => {
  emailError.value = ''
  passwordError.value = ''
}

// Toggle password visibility
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// Handle form submission
const handleLogin = async () => {
  clearErrors()
  
  // Validate form
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
    }
    
    const user = await login(credentials)
    if (user) {
      // Redirect to intended page or home
      const redirectTo = (route.query.redirect as string) || '/'
      
      // Small delay to ensure store is fully updated before redirect
      await nextTick()
      await router.replace(redirectTo)
    } else {
      // Login failed - show error
      emailError.value = 'Invalid email or password'
    }
  } catch (error) {
    // Show user-friendly error message
    emailError.value = 'Login failed. Please check your credentials and try again.'
  }
}

// Forgot password
const forgotPassword = async () => {
  console.warn('Forgot password functionality not implemented yet.')
}

// Error message helper
const getErrorMessage = (errors: any[]): string => {
  if (!errors || errors.length === 0) return ''
  return errors[0]?.message || t('auth.loginFailed')
}
</script>

<style scoped>
.pp-page {
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #18181a 0%, #1a1a1e 100%);
}

/* Header */
.pp-header {
  --background: rgba(24, 24, 26, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.pp-toolbar {
  --background: transparent;
  --border-color: #24242a;
  border-bottom: 1px solid #24242a;
}

.pp-title {
  color: #fee78a;
  font-weight: 700;
  font-size: 18px;
}

/* Content */
.pp-content {
  --background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.pp-login-container {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  margin: 0 auto;
}

/* Logo Section */
.pp-logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.pp-logo {
  width: 80px;
  height: 80px;
  background: #1a1b17;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  padding: 12px;
  box-shadow: 0 8px 32px rgba(254, 231, 138, 0.3);
}

.pp-logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pp-app-title {
  color: #fee78a;
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.pp-app-subtitle {
  color: #94a3b8;
  font-size: 16px;
  margin: 0;
}

/* Form */
.pp-login-form {
  margin-bottom: 30px;
}

.pp-input-group {
  margin-bottom: 20px;
}

.pp-input-item {
  --background: rgba(36, 36, 42, 0.6);
  --border-color: #54545f;
  --border-radius: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: all 0.3s ease;
}

.pp-input-item:hover {
  --border-color: #64748b;
}

.pp-input-item.ion-focused {
  --border-color: #fee78a;
  box-shadow: 0 0 0 2px rgba(254, 231, 138, 0.2);
}

.pp-input-item.pp-error {
  --border-color: #ef4444;
}

.pp-input-icon {
  color: #64748b;
  font-size: 20px;
  margin-right: 8px;
}

.pp-input {
  --color: #e2e8f0;
  --placeholder-color: #64748b;
  font-size: 16px;
}

.pp-password-toggle {
  --color: #64748b;
  --background-hover: rgba(100, 116, 139, 0.1);
  margin: 0;
}

.pp-error-text {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
  padding-left: 12px;
}

/* Form Options */
.pp-form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.pp-toggle-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pp-toggle {
  --track-background: #54545f;
  --track-background-checked: #fee78a;
  --handle-background: #e2e8f0;
  --handle-background-checked: #18181a;
  --border-radius: 16px;
  --handle-border-radius: 50%;
  --transition: all 0.3s ease;
}

.pp-toggle-label {
  color: #94a3b8;
  font-size: 14px;
}

.pp-forgot-password {
  --color: #fee78a;
  font-size: 14px;
  margin: 0;
}

/* Error Display */
.pp-auth-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  color: #ef4444;
  font-size: 14px;
}

/* Buttons */
.pp-login-button {
  --background: linear-gradient(135deg, #fee78a, #fbbf24);
  --color: #18181a;
  --border-radius: 12px;
  height: 50px;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.pp-login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(254, 231, 138, 0.4);
}

.pp-login-button:disabled {
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

/* Divider */
.pp-divider {
  position: relative;
  text-align: center;
  margin: 30px 0;
  color: #64748b;
  font-size: 14px;
}

.pp-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #54545f;
}

.pp-divider span {
  background: #18181a;
  padding: 0 16px;
  position: relative;
  z-index: 1;
}

/* Google Button */
.pp-google-button {
  --background: transparent;
  --color: #e2e8f0;
  --border-color: #54545f;
  --border-radius: 12px;
  height: 50px;
  font-weight: 500;
  margin-bottom: 30px;
  transition: all 0.3s ease;
}

.pp-google-button:hover {
  --border-color: #64748b;
  --background: rgba(100, 116, 139, 0.1);
}

/* Links */

.pp-register-link {
  color: #94a3b8;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.pp-link-button {
  --color: #fee78a;
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}


/* Responsive Design */
@media (max-width: 480px) {
  .pp-login-container {
    padding: 16px;
  }
  
  .pp-app-title {
    font-size: 28px;
  }
  
  .pp-logo {
    width: 70px;
    height: 70px;
    font-size: 35px;
  }
}
</style>