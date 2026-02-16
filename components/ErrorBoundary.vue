<template>
  <div v-if="hasError" class="pp-error-boundary">
    <div class="pp-error-card">
      <div class="pp-error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>

      <h2 class="pp-error-title">{{ t('error.boundary.title') }}</h2>

      <p class="pp-error-message">
        {{ errorMessage || t('error.boundary.defaultMessage') }}
      </p>

      <div v-if="showDetails && errorDetails" class="pp-error-details">
        <button
          class="pp-error-toggle"
          @click="detailsExpanded = !detailsExpanded"
        >
          {{ detailsExpanded ? t('error.boundary.hideDetails') : t('error.boundary.showDetails') }}
        </button>

        <div v-if="detailsExpanded" class="pp-error-details-content">
          <pre>{{ errorDetails }}</pre>
        </div>
      </div>

      <div class="pp-error-actions">
        <button
          class="pp-action-button pp-action-button--primary"
          @click="handleRetry"
        >
          {{ t('error.boundary.retry') }}
        </button>

        <button
          v-if="showReset"
          class="pp-action-button pp-action-button--secondary"
          @click="handleReset"
        >
          {{ t('error.boundary.reset') }}
        </button>
      </div>
    </div>
  </div>

  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const props = defineProps<{
  fallbackMessage?: string
  showDetails?: boolean
  showReset?: boolean
  onRetry?: () => void | Promise<void>
  onReset?: () => void
}>()

const emit = defineEmits<{
  (e: 'error', error: Error): void
}>()

const { t } = useI18n()

const hasError = ref(false)
const errorMessage = ref<string>('')
const errorDetails = ref<string>('')
const detailsExpanded = ref(false)

onErrorCaptured((err: Error, instance, info) => {
  hasError.value = true

  // Use custom message or extract from error
  errorMessage.value = props.fallbackMessage || err.message || t('error.boundary.defaultMessage')

  // Store error details for debugging
  errorDetails.value = `${err.stack || err.toString()}\n\nComponent: ${info}`

  // Emit error event for logging
  emit('error', err)

  // Log to console in development
  if (import.meta.dev) {
    console.error('[ErrorBoundary] Caught error:', {
      error: err,
      instance,
      info,
    })
  }

  // Prevent error from propagating further
  return false
})

const handleRetry = async () => {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
  detailsExpanded.value = false

  if (props.onRetry) {
    try {
      await props.onRetry()
    } catch (err) {
      // If retry fails, show error again
      hasError.value = true
      errorMessage.value = (err as Error).message || t('error.boundary.retryFailed')
    }
  }
}

const handleReset = () => {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
  detailsExpanded.value = false

  if (props.onReset) {
    props.onReset()
  }
}
</script>

<style scoped>
.pp-error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 300px;
}

.pp-error-card {
  background: linear-gradient(135deg, #24242a 0%, #1a1a1e 100%);
  border: 1px solid #54545f;
  border-radius: 16px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.pp-error-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  color: #ef4444;
}

.pp-error-icon svg {
  width: 100%;
  height: 100%;
}

.pp-error-title {
  color: #e2e8f0;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.pp-error-message {
  color: #94a3b8;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 1.5rem 0;
}

.pp-error-details {
  margin: 1.5rem 0;
}

.pp-error-toggle {
  background: transparent;
  border: 1px solid #54545f;
  color: #fee78a;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.pp-error-toggle:hover {
  border-color: #fee78a;
  background: rgba(254, 231, 138, 0.1);
}

.pp-error-details-content {
  margin-top: 1rem;
  background: #18181a;
  border: 1px solid #54545f;
  border-radius: 8px;
  padding: 1rem;
  text-align: left;
  max-height: 300px;
  overflow-y: auto;
}

.pp-error-details-content pre {
  color: #94a3b8;
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.pp-error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Scrollbar styling for error details */
.pp-error-details-content::-webkit-scrollbar {
  width: 6px;
}

.pp-error-details-content::-webkit-scrollbar-track {
  background: #18181a;
  border-radius: 3px;
}

.pp-error-details-content::-webkit-scrollbar-thumb {
  background: #54545f;
  border-radius: 3px;
}

.pp-error-details-content::-webkit-scrollbar-thumb:hover {
  background: #fee78a;
}
</style>
