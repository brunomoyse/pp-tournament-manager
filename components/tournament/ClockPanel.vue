<template>
    <ion-card>
        <ion-card-header>
            <ion-card-title>
                <ion-icon :icon="timeOutline" class="mr-2"></ion-icon>
                Tournament Clock
                <ion-badge v-if="running" color="danger" class="ml-2">
                    <div class="flex items-center gap-1">
                        <div class="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE
                    </div>
                </ion-badge>
            </ion-card-title>
        </ion-card-header>
        <ion-card-content class="space-y-6">
            <div class="text-center space-y-2">
                <div :class="['text-6xl font-mono font-bold text-primary', running ? 'animate-pulse' : '']">{{ time }}</div>
                <div class="text-sm text-muted-foreground">Time Remaining</div>
            </div>

            <div class="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div class="text-center">
                    <div class="text-2xl font-bold text-primary">{{ blinds }}</div>
                    <div class="text-sm text-muted-foreground">Current Blinds</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-muted-foreground">{{ nextBlinds }}</div>
                    <div class="text-sm text-muted-foreground">Next Blinds</div>
                </div>
            </div>

            <div class="flex gap-2">
                <ion-button expand="block" :color="running ? 'danger' : 'primary'" @click="toggle">
                    <ion-icon slot="start" :icon="running ? pauseOutline : playOutline"></ion-icon>
                    {{ running ? 'Pause' : 'Start' }}
                </ion-button>
                <ion-button fill="outline" @click="reset()">
                    <ion-icon slot="icon-only" :icon="stopOutline"></ion-icon>
                </ion-button>
            </div>

            <div class="flex gap-2">
                <ion-button expand="block" fill="outline" @click="$emit('previousLevel')">
                    <ion-icon slot="start" :icon="playSkipBackOutline"></ion-icon>
                    Previous Level
                </ion-button>
                <ion-button expand="block" fill="outline" @click="$emit('nextLevel')">
                    <ion-icon slot="start" :icon="playSkipForwardOutline"></ion-icon>
                    Next Level
                </ion-button>
            </div>

            <div class="flex gap-2">
                <ion-button expand="block" fill="outline">
                    <ion-icon slot="start" :icon="cafeOutline"></ion-icon>
                    Start Break
                </ion-button>
                <slot name="announce" />
            </div>
        </ion-card-content>
    </ion-card>
</template>
<script setup lang="ts">
import { timeOutline, pauseOutline, playOutline, stopOutline, playSkipBackOutline, playSkipForwardOutline, cafeOutline } from 'ionicons/icons'

const props = defineProps<{ time: string; running: boolean; blinds: string; nextBlinds: string }>()
const emit = defineEmits(['start', 'pause', 'reset', 'previousLevel', 'nextLevel'])

function toggle() {
    props.running ? emit('pause') : emit('start')
}
function reset() {
    emit('reset')
}
</script>