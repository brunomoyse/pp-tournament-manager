<script setup lang="ts">
import { IonIcon } from '@ionic/vue'

/**
 * PpEmptyState: shared empty/zero-state for lists and panels — icon + title +
 * description with an optional CTA in the `#action` slot. Replaces the per-page
 * `.empty-state`/`.centered-state` markup so every empty view looks the same.
 */
defineProps<{
  icon?: string
  title?: string
  description?: string
}>()
</script>

<template>
  <div class="pp-empty-state">
    <div v-if="icon" class="pp-empty-state__icon-wrapper">
      <IonIcon :icon="icon" class="pp-empty-state__icon" />
    </div>
    <h4 v-if="title" class="pp-empty-state__title">{{ title }}</h4>
    <p v-if="description" class="pp-empty-state__text">{{ description }}</p>
    <div v-if="$slots.action" class="pp-empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.pp-empty-state {
  text-align: center;
  padding: 5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pp-empty-state__icon-wrapper {
  width: 5rem;
  height: 5rem;
  background-color: var(--color-pp-surface-2);
  border: 1px solid var(--color-pp-border-strong);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.pp-empty-state__icon {
  width: 2.5rem;
  height: 2.5rem;
  color: rgba(255, 255, 255, 0.3);
}

.pp-empty-state__title {
  font-size: 1.125rem;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.pp-empty-state__text {
  color: rgba(255, 255, 255, 0.6);
  max-width: 28rem;
}

.pp-empty-state__action {
  margin-top: 1.5rem;
}
</style>
