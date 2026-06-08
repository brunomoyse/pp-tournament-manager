<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { IonIcon } from '@ionic/vue'
import { closeOutline } from 'ionicons/icons'

/**
 * PpModal: slot-based dialog primitive. Replaces the repeated
 * `.pp-modal-overlay`/`.pp-modal-backdrop`/`.pp-modal-content` markup.
 *
 * Teleports to <body>, locks scroll + closes on Escape while open, dims
 * behind a blurred backdrop. Provide a `title` (or override the `#header`
 * slot), put body content in the default slot, and actions in `#footer`
 * (typically <PpButton>s).
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    closeOnBackdrop?: boolean
  }>(),
  {
    size: 'md',
    closeOnBackdrop: true,
  },
)

const emit = defineEmits<{ close: [] }>()

const onBackdrop = () => {
  if (props.closeOnBackdrop) emit('close')
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.open) emit('close')
}

watch(
  () => props.open,
  (open) => {
    if (typeof document === 'undefined') return
    if (open) {
      document.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
    }
  },
)

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="pp-modal">
      <div v-if="open" class="pp-modal-overlay" role="dialog" aria-modal="true">
        <div class="pp-modal-backdrop" @click="onBackdrop" />
        <div class="pp-modal-panel" :class="`pp-modal-panel--${size}`">
          <header v-if="title || $slots.header" class="pp-modal-header">
            <slot name="header">
              <h3 class="pp-modal-title">{{ title }}</h3>
            </slot>
            <button type="button" class="pp-modal-close" aria-label="Close" @click="emit('close')">
              <IonIcon :icon="closeOutline" />
            </button>
          </header>
          <div class="pp-modal-body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="pp-modal-footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pp-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.pp-modal-backdrop {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.pp-modal-panel {
  position: relative;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  background-color: var(--color-pp-surface-2);
  border: 1px solid var(--color-pp-border-strong);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-card);
}

.pp-modal-panel--sm {
  max-width: 24rem;
}
.pp-modal-panel--md {
  max-width: 28rem;
}
.pp-modal-panel--lg {
  max-width: 32rem;
}
.pp-modal-panel--xl {
  max-width: 36rem;
}
.pp-modal-panel--2xl {
  max-width: 42rem;
}

.pp-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-pp-border);
}

.pp-modal-title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-pp-text);
}

.pp-modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  border-radius: 9999px;
  color: var(--color-pp-text-muted);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.pp-modal-close:hover {
  color: var(--color-pp-text);
  background-color: rgba(255, 255, 255, 0.05);
}

.pp-modal-close ion-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.pp-modal-body {
  padding: 1.5rem;
}

.pp-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--color-pp-border);
}

/* Transition: fade the overlay, scale the panel */
.pp-modal-enter-active,
.pp-modal-leave-active {
  transition: opacity 0.2s ease;
}
.pp-modal-enter-from,
.pp-modal-leave-to {
  opacity: 0;
}
.pp-modal-enter-active .pp-modal-panel,
.pp-modal-leave-active .pp-modal-panel {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.pp-modal-enter-from .pp-modal-panel,
.pp-modal-leave-to .pp-modal-panel {
  transform: scale(0.96);
}
</style>
