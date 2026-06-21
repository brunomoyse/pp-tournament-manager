<template>
  <IonPage class="page-bg">
    <IonContent class="content-bg">
      <div class="page-container">
        <PpFadeUp>
          <div class="page-header">
            <p class="eyebrow">{{ t('nav.templates') }}</p>
            <h1 class="page-title">{{ t('templates.title') }}</h1>
          </div>
        </PpFadeUp>

        <!-- Tabs -->
        <div class="tabs" data-tour="templates">
          <button
            :class="['tab', activeTab === 'payouts' ? 'tab--active' : 'tab--inactive']"
            @click="activeTab = 'payouts'"
          >
            {{ t('templates.payoutTemplates') }}
          </button>
          <button
            :class="['tab', activeTab === 'blinds' ? 'tab--active' : 'tab--inactive']"
            @click="activeTab = 'blinds'"
          >
            {{ t('templates.blindStructures') }}
          </button>
        </div>

        <!-- Tab Content: Payout Templates -->
        <div v-if="activeTab === 'payouts'">
          <!-- Toolbar -->
          <div class="toolbar">
            <div class="search-wrapper">
              <IonIcon :icon="searchOutline" class="search-icon" />
              <input
                v-model="payoutSearch"
                type="text"
                :placeholder="t('templates.search')"
                class="search-input"
              />
            </div>
            <PpButton v-if="canManage" magnetic @click="openPayoutCreate">
              <IonIcon :icon="addOutline" class="icon-md" />
              {{ t('templates.addPayoutTemplate') }}
            </PpButton>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="centered-state">
            <div class="muted-text">{{ t('status.loading') }}</div>
          </div>

          <!-- Empty State -->
          <PpEmptyState
            v-else-if="filteredPayoutTemplates.length === 0"
            :icon="trophyOutline"
            :title="t('templates.noPayoutTemplates')"
            :description="t('templates.createFirstPayout')"
          >
            <template v-if="canManage" #action>
              <PpButton @click="openPayoutCreate">
                <IonIcon :icon="addOutline" class="icon-md" />
                {{ t('templates.addPayoutTemplate') }}
              </PpButton>
            </template>
          </PpEmptyState>

          <!-- Card Grid -->
          <div v-else class="card-grid">
            <TemplatesPayoutTemplateCard
              v-for="(tmpl, index) in filteredPayoutTemplates"
              :key="tmpl.id"
              :template="tmpl"
              :is-admin="canManage"
              class="pp-stagger-item"
              :style="{ animationDelay: `${index * 50}ms` }"
              @edit="openPayoutEdit"
              @delete="confirmDeletePayout"
            />
          </div>
        </div>

        <!-- Tab Content: Blind Structures -->
        <div v-if="activeTab === 'blinds'">
          <!-- Toolbar -->
          <div class="toolbar">
            <div class="search-wrapper">
              <IonIcon :icon="searchOutline" class="search-icon" />
              <input
                v-model="blindSearch"
                type="text"
                :placeholder="t('templates.search')"
                class="search-input"
              />
            </div>
            <PpButton v-if="canManage" magnetic @click="openBlindCreate">
              <IonIcon :icon="addOutline" class="icon-md" />
              {{ t('templates.addBlindStructure') }}
            </PpButton>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="centered-state">
            <div class="muted-text">{{ t('status.loading') }}</div>
          </div>

          <!-- Empty State -->
          <PpEmptyState
            v-else-if="filteredBlindTemplates.length === 0"
            :icon="layersOutline"
            :title="t('templates.noBlindStructures')"
            :description="t('templates.createFirstBlind')"
          >
            <template v-if="canManage" #action>
              <PpButton @click="openBlindCreate">
                <IonIcon :icon="addOutline" class="icon-md" />
                {{ t('templates.addBlindStructure') }}
              </PpButton>
            </template>
          </PpEmptyState>

          <!-- Card Grid -->
          <div v-else class="card-grid">
            <TemplatesBlindStructureTemplateCard
              v-for="(tmpl, index) in filteredBlindTemplates"
              :key="tmpl.id"
              :template="tmpl"
              :is-admin="canManage"
              class="pp-stagger-item"
              :style="{ animationDelay: `${index * 50}ms` }"
              @edit="openBlindEdit"
              @delete="confirmDeleteBlind"
            />
          </div>
        </div>
      </div>
    </IonContent>

    <!-- Payout Template Form Modal -->
    <TemplatesPayoutTemplateFormModal
      :is-open="showPayoutForm"
      :template="selectedPayoutTemplate"
      :mode="payoutFormMode"
      @close="closePayoutForm"
      @saved="handlePayoutSaved"
    />

    <!-- Blind Structure Form Modal -->
    <TemplatesBlindStructureTemplateFormModal
      :is-open="showBlindForm"
      :template="selectedBlindTemplate"
      :mode="blindFormMode"
      @close="closeBlindForm"
      @saved="handleBlindSaved"
    />

    <!-- Delete Confirmation Modal -->
    <TemplatesTemplateDeleteConfirmModal
      :is-open="showDeleteModal"
      :template-name="deleteTemplateName"
      :is-payout="deleteIsPayout"
      :deleting="deleting"
      @close="closeDeleteModal"
      @confirmed="handleDeleteConfirmed"
    />
  </IonPage>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  title: 'nav.templates',
})

import { IonPage, IonContent, IonIcon } from '@ionic/vue'
import { searchOutline, addOutline, trophyOutline, layersOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { useAuthStore } from '~/stores/useAuthStore'
import type { PayoutTemplate, BlindStructureTemplate } from '~/types/tournament'

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()
const clubStore = useClubStore()

// Templates are club-scoped: any admin or club manager can manage their club's
// own templates (the backend enforces ownership per club).
const canManage = computed(
  () => authStore.currentUser?.role === 'ADMIN' || authStore.currentUser?.role === 'MANAGER',
)

// State
const activeTab = ref<'payouts' | 'blinds'>('payouts')
const loading = ref(true)
const payoutTemplates = ref<PayoutTemplate[]>([])
const blindTemplates = ref<BlindStructureTemplate[]>([])
const payoutSearch = ref('')
const blindSearch = ref('')

// Payout form state
const showPayoutForm = ref(false)
const selectedPayoutTemplate = ref<PayoutTemplate | null>(null)
const payoutFormMode = ref<'create' | 'edit'>('create')

// Blind form state
const showBlindForm = ref(false)
const selectedBlindTemplate = ref<BlindStructureTemplate | null>(null)
const blindFormMode = ref<'create' | 'edit'>('create')

// Delete state
const showDeleteModal = ref(false)
const deleteTemplateName = ref('')
const deleteIsPayout = ref(false)
const deleteTemplateId = ref('')
const deleting = ref(false)

// Computed filtered lists
const filteredPayoutTemplates = computed(() => {
  if (!payoutSearch.value) return payoutTemplates.value
  const search = payoutSearch.value.toLowerCase()
  return payoutTemplates.value.filter(
    (t) => t.name.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search),
  )
})

const filteredBlindTemplates = computed(() => {
  if (!blindSearch.value) return blindTemplates.value
  const search = blindSearch.value.toLowerCase()
  return blindTemplates.value.filter(
    (t) => t.name.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search),
  )
})

// Fetch data
const fetchPayoutTemplates = async () => {
  const clubId = clubStore.club?.id
  if (!clubId) return
  try {
    const result = await GqlGetPayoutTemplates({ clubId })
    payoutTemplates.value = (result?.payoutTemplates || []) as PayoutTemplate[]
  } catch (error) {
    console.error('Failed to fetch payout templates:', error)
  }
}

const fetchBlindTemplates = async () => {
  const clubId = clubStore.club?.id
  if (!clubId) return
  try {
    const result = await GqlGetBlindStructureTemplates({ clubId })
    blindTemplates.value = (result?.blindStructureTemplates || []) as BlindStructureTemplate[]
  } catch (error) {
    console.error('Failed to fetch blind structure templates:', error)
  }
}

const fetchAll = async () => {
  loading.value = true
  await Promise.all([fetchPayoutTemplates(), fetchBlindTemplates()])
  loading.value = false
}

// Payout form handlers
const openPayoutCreate = () => {
  selectedPayoutTemplate.value = null
  payoutFormMode.value = 'create'
  showPayoutForm.value = true
}

const openPayoutEdit = (tmpl: PayoutTemplate) => {
  selectedPayoutTemplate.value = tmpl
  payoutFormMode.value = 'edit'
  showPayoutForm.value = true
}

const closePayoutForm = () => {
  showPayoutForm.value = false
  selectedPayoutTemplate.value = null
}

const handlePayoutSaved = async () => {
  closePayoutForm()
  await fetchPayoutTemplates()
}

// Blind form handlers
const openBlindCreate = () => {
  selectedBlindTemplate.value = null
  blindFormMode.value = 'create'
  showBlindForm.value = true
}

const openBlindEdit = (tmpl: BlindStructureTemplate) => {
  selectedBlindTemplate.value = tmpl
  blindFormMode.value = 'edit'
  showBlindForm.value = true
}

const closeBlindForm = () => {
  showBlindForm.value = false
  selectedBlindTemplate.value = null
}

const handleBlindSaved = async () => {
  closeBlindForm()
  await fetchBlindTemplates()
}

// Delete handlers
const confirmDeletePayout = (tmpl: PayoutTemplate) => {
  deleteTemplateName.value = tmpl.name
  deleteIsPayout.value = true
  deleteTemplateId.value = tmpl.id
  showDeleteModal.value = true
}

const confirmDeleteBlind = (tmpl: BlindStructureTemplate) => {
  deleteTemplateName.value = tmpl.name
  deleteIsPayout.value = false
  deleteTemplateId.value = tmpl.id
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteTemplateName.value = ''
  deleteTemplateId.value = ''
}

const handleDeleteConfirmed = async () => {
  deleting.value = true
  try {
    if (deleteIsPayout.value) {
      await GqlDeletePayoutTemplate({ id: deleteTemplateId.value })
      await fetchPayoutTemplates()
    } else {
      await GqlDeleteBlindStructureTemplate({ id: deleteTemplateId.value })
      await fetchBlindTemplates()
    }
    toast.success(t('templates.deleteSuccess'))
    closeDeleteModal()
  } catch (error: any) {
    console.error('Failed to delete template:', error)
    const message = error?.gqlErrors?.[0]?.message || ''
    if (message.includes('in use') || message.includes('foreign key')) {
      toast.error(t('templates.deleteInUseFailed'))
    } else {
      toast.error(t('templates.deleteFailed'))
    }
  } finally {
    deleting.value = false
  }
}

// Lifecycle
onMounted(fetchAll)
</script>

<style scoped>
.page-bg {
  background-color: var(--color-pp-bg);
}

.content-bg {
  background-color: var(--color-pp-bg);
}

.page-container {
  padding: 1.5rem 1rem;
}

@media (min-width: 640px) {
  .page-container {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .page-container {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

/* Page Header */
.page-header {
  margin-bottom: 1.25rem;
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
}

.page-title {
  margin-top: 0.65rem;
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 3vw + 0.5rem, 2.5rem);
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-pp-text);
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  background-color: var(--color-pp-surface-2);
  border-radius: 0.75rem;
  padding: 0.25rem;
  border: 1px solid var(--color-pp-border-strong);
}

.tab {
  flex: 1;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.tab--active {
  background-color: rgba(var(--pp-accent-rgb), 0.15);
  color: var(--color-pp-gold);
}

.tab--inactive {
  color: rgba(255, 255, 255, 0.5);
}

.tab--inactive:hover {
  color: rgba(255, 255, 255, 0.8);
  background-color: rgba(255, 255, 255, 0.05);
}

/* Toolbar */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .toolbar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.search-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: rgba(255, 255, 255, 0.6);
}

.search-input {
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  background-color: var(--color-pp-bg);
  border: 1px solid var(--color-pp-border-strong);
  border-radius: 0.5rem;
  color: #ffffff;
  width: 100%;
}

@media (min-width: 640px) {
  .search-input {
    width: 16rem;
  }
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--pp-accent-rgb), 0.4);
  border-color: var(--color-pp-gold);
}

/* States */
.centered-state {
  text-align: center;
  padding: 3rem 0;
}

.muted-text {
  color: rgba(255, 255, 255, 0.6);
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.empty-text {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.5rem;
}

/* Card Grid */
.card-grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1280px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
