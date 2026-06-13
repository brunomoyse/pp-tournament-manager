<template>
  <Transition name="pp-banner">
    <div
      v-if="!isConnected"
      class="pp-connection-banner"
      :class="{ 'pp-connection-banner--reconnecting': isReconnecting }"
      role="status"
      aria-live="polite"
    >
      <span class="pp-connection-banner__dot" />
      {{ label }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNetworkStatus } from '~/composables/useNetworkStatus'
import { useI18n } from '~/composables/useI18n'

// Wires the (previously unused) network composable to a sticky banner so the
// manager surfaces lost connectivity instead of silently showing stale data.
const { connectionStatus } = useNetworkStatus()
const { t } = useI18n()

const isConnected = computed(() => connectionStatus.value === 'connected')
const isReconnecting = computed(() => connectionStatus.value === 'reconnecting')
const label = computed(() =>
  isReconnecting.value ? t('status.reconnecting') : t('status.offline'),
)
</script>

<style scoped>
.pp-connection-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-pp-bg);
  background: var(--color-pp-gold);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

.pp-connection-banner--reconnecting {
  color: var(--color-pp-text);
  background: var(--color-pp-surface-2, #26262a);
}

.pp-connection-banner__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: currentColor;
  animation: pp-banner-pulse 1.2s ease-in-out infinite;
}

@keyframes pp-banner-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

.pp-banner-enter-active,
.pp-banner-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.pp-banner-enter-from,
.pp-banner-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
