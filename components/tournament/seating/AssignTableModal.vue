<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      @click="closeModal"
    ></div>
    
    <!-- Modal Content -->
    <div class="relative bg-pp-bg-secondary rounded-2xl p-6 w-full max-w-md border border-pp-border" style="background-color: #24242a !important;">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-pp-text-primary">Link Club Tables</h3>
        <button 
          @click="closeModal"
          class="p-2 text-white/60 hover:text-white rounded-lg hover:bg-pp-bg-primary/50"
        >
          <IonIcon :icon="closeOutline" class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <div class="text-white/60">Loading club tables...</div>
      </div>

      <!-- Table Selection -->
      <div v-else-if="clubTables && clubTables.length > 0" class="space-y-4">
        <p class="text-white/70 text-sm mb-4">
          Select tables from {{ clubName }} to assign to this tournament:
        </p>
        
        <div class="space-y-3 max-h-64 overflow-y-auto">
          <div 
            v-for="table in clubTables" 
            :key="table.id"
            :class="[
              'flex items-center justify-between p-3 rounded-xl border transition-all',
              table.isAssigned 
                ? 'bg-pp-bg-primary/10 border-pp-border/30 opacity-50 cursor-not-allowed'
                : 'bg-pp-bg-primary/30 border-pp-border/50 hover:border-pp-accent-gold/50'
            ]"
          >
            <div class="flex items-center gap-3">
              <input 
                :id="`table-${table.id}`"
                v-model="selectedTableIds"
                :value="table.id"
                :disabled="table.isAssigned"
                type="checkbox"
                :class="[
                  'w-4 h-4 text-pp-accent-gold bg-pp-bg-primary border-pp-border rounded focus:ring-pp-accent-gold focus:ring-2',
                  table.isAssigned && 'cursor-not-allowed opacity-50'
                ]"
              />
              <label 
                :for="`table-${table.id}`" 
                :class="[
                  'flex-1',
                  table.isAssigned ? 'cursor-not-allowed' : 'cursor-pointer'
                ]"
              >
                <div :class="[
                  'font-semibold',
                  table.isAssigned ? 'text-white/40' : 'text-white'
                ]">
                  {{ `Table ${table.tableNumber}` }}
                  {{ table.isAssigned ? ' (Already assigned)' : '' }}
                </div>
                <div :class="[
                  'text-xs',
                  table.isAssigned ? 'text-white/30' : 'text-white/60'
                ]">
                  {{ table.maxSeats }} seats • {{ table.location || 'No location' }}
                </div>
              </label>
            </div>
            <div :class="[
              'px-2 py-1 rounded-full text-xs font-medium',
              table.isAssigned 
                ? 'bg-gray-500/20 text-gray-400'
                : table.isActive 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
            ]">
              {{ table.isAssigned ? 'Assigned' : table.isActive ? 'Active' : 'Inactive' }}
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-pp-border/50">
          <button 
            @click="closeModal"
            class="px-4 py-2 text-white/70 hover:text-white rounded-lg hover:bg-pp-bg-primary/50"
          >
            Cancel
          </button>
          <button 
            @click="assignSelectedTables"
            :disabled="selectedTableIds.length === 0 || assigning"
            class="px-4 py-2 bg-pp-accent-gold hover:bg-pp-accent-gold/90 disabled:bg-pp-accent-gold/50 text-pp-bg-primary rounded-lg font-semibold flex items-center gap-2"
          >
            <IonIcon v-if="assigning" :icon="refreshOutline" class="w-4 h-4 animate-spin" />
            {{ assigning ? 'Linking...' : `Link ${selectedTableIds.length} Table${selectedTableIds.length !== 1 ? 's' : ''}` }}
          </button>
        </div>
      </div>

      <!-- No Tables State -->
      <div v-else-if="!loading" class="text-center py-8">
        <div class="text-white/60 mb-2">No tables found for this club</div>
        <div class="text-white/50 text-sm">Contact your club administrator to add tables</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { closeOutline, refreshOutline } from 'ionicons/icons'

interface ClubTable {
  id: string
  clubId: string
  tableNumber: number
  maxSeats: number
  isActive: boolean
  isAssigned?: boolean
}

interface Props {
  isOpen: boolean
  clubId: string
  clubName: string
  tournamentId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  tablesAssigned: []
}>()

// State
const loading = ref(false)
const assigning = ref(false)
const clubTables = ref<ClubTable[]>([])
const selectedTableIds = ref<string[]>([])

// Watch for modal opening to fetch tables
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen && props.clubId) {
    await fetchClubTables()
  }
})

// Methods
const fetchClubTables = async () => {
  if (!props.clubId) return
  
  try {
    loading.value = true
    const result = await GqlGetClubTables({ clubId: props.clubId })
    clubTables.value = result?.clubTables || []
  } catch (error) {
    console.error('Failed to fetch club tables:', error)
    clubTables.value = []
  } finally {
    loading.value = false
  }
}

const assignSelectedTables = async () => {
  if (selectedTableIds.value.length === 0) return
  
  try {
    assigning.value = true
    
    // Assign each selected table
    for (const clubTableId of selectedTableIds.value) {
      await GqlAssignTableToTournament({
        input: {
          tournamentId: props.tournamentId,
          clubTableId
        }
      })
    }
    
    emit('tablesAssigned')
    closeModal()
  } catch (error) {
    console.error('Failed to assign tables:', error)
    // TODO: Show error message
  } finally {
    assigning.value = false
  }
}

const closeModal = () => {
  selectedTableIds.value = []
  emit('close')
}
</script>