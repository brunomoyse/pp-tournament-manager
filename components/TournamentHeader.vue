<template>
    <ion-header>
        <ion-toolbar>
            <ion-title slot="start">
                <div>
                    <h1 class="text-2xl font-bold text-pp-text-primary">Tournament Manager</h1>
                    <div class="flex items-center gap-2">
                        <p class="text-sm opacity-70 text-pp-text-secondary">Liège Poker Club</p>
                        <div class="flex items-center gap-1">
                            <div :class="['w-2 h-2 rounded-full', statusDot]" />
                            <span class="text-xs opacity-70 capitalize text-pp-text-secondary">{{ connectionStatus }}</span>
                        </div>
                    </div>
                </div>
            </ion-title>

            <ion-buttons slot="end">
                <ion-note class="mr-3">{{ t('labels.lastUpdate') }} {{ new Date(lastUpdate).toLocaleTimeString() }}</ion-note>
                <ion-select 
                    v-model="selectedId"
                    :placeholder="t('placeholders.selectTournament')"
                    interface="popover"
                    class="min-w-[200px]"
                >
                    <ion-select-option v-for="t in tournaments" :key="t.id" :value="t.id">
                        {{ t.title }}
                    </ion-select-option>
                </ion-select>
            </ion-buttons>
        </ion-toolbar>
    </ion-header>
</template>

<script setup lang="ts">
import type { Tournament } from '~/types/tournament'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n()

const props = defineProps<{ tournaments: Tournament[]; lastUpdate: number; connectionStatus: 'connected' | 'disconnected' | 'reconnecting'; modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const selectedId = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const statusDot = computed(() => {
    switch (props.connectionStatus) {
        case 'connected':
            return 'bg-pp-accent-gold'
        case 'reconnecting':
            return 'bg-pp-text-secondary animate-pulse'
        default:
            return 'bg-red-500'
    }
})

</script>