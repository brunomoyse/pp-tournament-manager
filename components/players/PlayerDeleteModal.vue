<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      @click="$emit('close')"
    ></div>

    <!-- Modal Content -->
    <div class="relative bg-pp-bg-secondary rounded-2xl w-full max-w-sm border border-pp-border shadow-2xl" style="background-color: #24242a !important;">
      <!-- Header -->
      <div class="p-6 text-center">
        <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <IonIcon :icon="warningOutline" class="w-8 h-8 text-red-400" />
        </div>
        <h2 class="text-xl font-bold text-pp-text-primary mb-2">
          {{ t('players.deactivateConfirmTitle') }}
        </h2>
        <p class="text-white/70">
          {{ t('players.deactivateConfirmMessage', { name: playerName }) }}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 p-6 border-t border-pp-border/50">
        <button
          @click="$emit('close')"
          class="flex-1 pp-action-button pp-action-button--secondary justify-center"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          @click="$emit('confirmed')"
          class="flex-1 pp-action-button pp-action-button--danger justify-center"
        >
          {{ t('players.deactivate') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { warningOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import type { User } from '~/types/user'

interface Props {
  isOpen: boolean
  player: User | null
}

const props = defineProps<Props>()
defineEmits<{
  close: []
  confirmed: []
}>()

const { t } = useI18n()

const playerName = computed(() => {
  if (!props.player) return ''
  if (props.player.firstName && props.player.lastName) {
    return `${props.player.firstName} ${props.player.lastName}`
  }
  return props.player.firstName || props.player.username || props.player.email
})
</script>
