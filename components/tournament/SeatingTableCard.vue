<template>
    <ion-card>
        <ion-card-header>
            <ion-card-subtitle>{{ occupied }}/{{ table.maxSeats }} seats occupied</ion-card-subtitle>
            <ion-card-title>
                Table {{ table.number }}
                <ion-badge :color="statusColor(table.status)" class="ml-2">{{ table.status }}</ion-badge>
            </ion-card-title>
        </ion-card-header>
        <ion-card-content>
            <div class="relative">
                <div class="w-full h-48 border-4 border-primary/30 rounded-full bg-primary/5 relative">
                    <div
                        v-for="(p, i) in table.seats"
                        :key="i"
                        :class="['absolute w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors', p ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-muted-foreground/30 text-muted-foreground hover:bg-muted/80']"
                        :style="seatStyle(i)"
                        :title="p ? p.name : `Seat ${i + 1} - Empty`"
                    >
                        {{ p ? initials(p.name) : i + 1 }}
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="text-center">
                            <div class="text-lg font-bold text-primary">T{{ table.number }}</div>
                            <div class="text-xs text-muted-foreground">{{ occupied }}/{{ table.maxSeats }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-4 space-y-2">
                <div class="text-sm font-medium">Seated Players:</div>
                <div class="space-y-1">
                    <template v-for="(p, i) in table.seats" :key="`${table.id}-${i}`">
                        <div v-if="p" class="flex items-center justify-between text-sm">
                            <span>Seat {{ i + 1 }}: {{ p.name }}</span>
                            <ion-button size="small" fill="clear">
                                <ion-icon slot="icon-only" :icon="moveOutline"></ion-icon>
                            </ion-button>
                        </div>
                    </template>
                    <div v-if="occupied === 0" class="text-sm text-muted-foreground">No players seated</div>
                </div>
            </div>
        </ion-card-content>
    </ion-card>
</template>
<script setup lang="ts">
import { moveOutline } from 'ionicons/icons'
import type { TableModel } from '~/types/tournament'

const props = defineProps<{ table: TableModel }>()
const occupied = computed(() => props.table.seats.filter(s => s).length)

function statusColor(s: TableModel['status']) {
    return s === 'active'
        ? 'success'
        : s === 'breaking'
            ? 'warning'
            : 'danger'
}
function initials(n?: string) {
    return (n || '')
        .split(' ')
        .map(x => x[0])
        .join('')
}
function seatStyle(seatIndex: number) {
    const angle = (seatIndex / props.table.maxSeats) * 2 * Math.PI - Math.PI / 2
    const radius = 80
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    return { left: `calc(50% + ${x}px - 24px)`, top: `calc(50% + ${y}px - 24px)` }
}
</script>