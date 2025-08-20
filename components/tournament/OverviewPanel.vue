<template>
    <ion-grid>
        <ion-row>
            <ion-col size="12" size-md="4">
                <ion-card>
                    <ion-card-header>
                        <ion-card-subtitle>
                            <ion-icon :icon="trophyOutline" class="mr-1"></ion-icon>
                            Tournament Status
                        </ion-card-subtitle>
                    </ion-card-header>
                    <ion-card-content>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-muted-foreground">Status</span>
                        <ion-badge :color="statusColor">{{ current.status }}</ion-badge>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-muted-foreground">Level</span>
                        <span class="text-sm font-medium">{{ current.currentLevel }}/{{ current.totalLevels }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-muted-foreground">Time Left</span>
                        <span class="text-sm font-medium">{{ current.timeRemaining }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-muted-foreground">Blinds</span>
                        <span class="text-sm font-medium">{{ current.blinds }}</span>
                    </div>
                </div>
                    </ion-card-content>
                </ion-card>
            </ion-col>

            <ion-col size="12" size-md="4">
                <ion-card>
                    <ion-card-header>
                        <ion-card-subtitle>
                            <ion-icon :icon="peopleOutline" class="mr-1"></ion-icon>
                            Players
                        </ion-card-subtitle>
                    </ion-card-header>
                    <ion-card-content>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-muted-foreground">Registered</span>
                        <span class="text-2xl font-bold">{{ current.registrations }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-muted-foreground">Checked In</span>
                        <span class="text-sm font-medium">{{ current.checkedIn }}</span>
                    </div>
                    <div class="space-y-1">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-muted-foreground">Capacity</span>
                            <span>{{ current.registrations }}/{{ current.maxPlayers }}</span>
                        </div>
                        <ion-progress-bar :value="current.registrations / current.maxPlayers"></ion-progress-bar>
                    </div>
                </div>
                    </ion-card-content>
                </ion-card>
            </ion-col>

            <ion-col size="12" size-md="4">
                <ion-card>
                    <ion-card-header>
                        <ion-card-subtitle>
                            <ion-icon :icon="trophyOutline" class="mr-1"></ion-icon>
                            Prize Pool
                        </ion-card-subtitle>
                    </ion-card-header>
                    <ion-card-content>
                <div class="space-y-3">
                    <div class="text-2xl font-bold text-primary">{{ current.prizePool }}</div>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between"><span class="text-muted-foreground">1st Place</span><span class="font-medium">€810 (40%)</span></div>
                        <div class="flex justify-between"><span class="text-muted-foreground">2nd Place</span><span class="font-medium">€405 (20%)</span></div>
                        <div class="flex justify-between"><span class="text-muted-foreground">3rd Place</span><span class="font-medium">€243 (12%)</span></div>
                    </div>
                </div>
                    </ion-card-content>
                </ion-card>
            </ion-col>
        </ion-row>
    </ion-grid>
</template>
<script setup lang="ts">
import { peopleOutline, trophyOutline } from 'ionicons/icons'
import type { Tournament } from '~/types/tournament'

const props = defineProps<{ current: Tournament }>()

const statusColor = computed(() =>
    props.current.status === 'running'
        ? 'success'
        : props.current.status === 'paused'
            ? 'warning'
            : 'primary'
)
</script>