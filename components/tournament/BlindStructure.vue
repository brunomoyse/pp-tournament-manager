<template>
    <ion-card>
        <ion-card-header>
            <ion-card-title>Blind Structure</ion-card-title>
        </ion-card-header>
        <ion-card-content>
            <ion-list>
                <ion-item
                    v-for="lvl in structure"
                    :key="lvl.level"
                    :color="lvl.level === currentLevel ? 'primary' : undefined"
                    lines="full"
                >
                    <ion-avatar slot="start">
                        <div :class="['w-full h-full flex items-center justify-center font-bold', lvl.level === currentLevel ? 'bg-primary text-white' : 'bg-gray-200']">
                            {{ lvl.level }}
                        </div>
                    </ion-avatar>
                    <ion-label>
                        <h2>{{ lvl.smallBlind }}/{{ lvl.bigBlind }}</h2>
                        <p v-if="lvl.ante > 0">Ante: {{ lvl.ante }}</p>
                    </ion-label>
                    <ion-note slot="end">{{ lvl.duration }}</ion-note>
                </ion-item>
            </ion-list>
        </ion-card-content>
    </ion-card>
</template>
<script setup lang="ts">
import type { BlindLevel } from '~/types/tournament'

const props = defineProps<{ structure: BlindLevel[]; currentLevel: number }>()
</script>