<template>
  <div class="layout-root">
    <!-- [A] Backdrop overlay -->
    <div
      v-if="drawerOpen"
      class="backdrop"
      @click="drawerOpen = false"
    />

    <!-- [B] Sidebar drawer (always overlay, all sizes) -->
    <aside :class="['sidebar', drawerOpen ? 'sidebar--open' : 'sidebar--closed']">
      <!-- Brand -->
      <div class="sidebar-brand">
        <img src="/assets/icon-no-bg.png" alt="PocketPair" class="sidebar-logo" />
        <div class="sidebar-brand-text">
          <div class="sidebar-title">PocketPair</div>
          <div v-if="club" class="sidebar-club">{{ club.name }}</div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav pp-hide-scrollbar">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="['nav-link', isActive(item.to) ? 'nav-link--active' : 'nav-link--inactive']"
          @click="drawerOpen = false"
        >
          <IonIcon
            :icon="item.icon"
            :class="['nav-icon', isActive(item.to) ? 'nav-icon--active' : 'nav-icon--inactive']"
          />
          <span class="nav-label">{{ item.label }}</span>
          <div
            v-if="isActive(item.to)"
            class="nav-active-dot"
          />
        </NuxtLink>
      </nav>

      <!-- Live Tournament Quick Access -->
      <div v-if="activeTournamentId" class="live-section">
        <NuxtLink
          :to="`/tournament/${activeTournamentId}`"
          class="live-link"
          @click="drawerOpen = false"
        >
          <div class="pp-live-dot live-dot" />
          <div class="live-text">
            <div class="live-label">{{ t('status.live') }}</div>
            <div class="live-title">{{ activeTournamentTitle }}</div>
          </div>
        </NuxtLink>
      </div>

      <!-- User info + logout -->
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            {{ userInitials }}
          </div>
          <div class="user-details">
            <div class="user-name-wrapper">
              <div class="user-name">{{ userName }}</div>
            </div>
            <button
              @click="handleLogout"
              class="logout-button"
            >
              <IonIcon :icon="logOutOutline" class="icon-sm" />
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Hamburger button (fixed, z-30 to sit above Ionic's ion-page z-0) -->
    <button
      @click="drawerOpen = true"
      class="hamburger-button"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="hamburger-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <!-- [C] Main Content -->
    <main class="pp-main">
      <slot />
    </main>

    <!-- [D] Bottom Tab Bar (mobile/tablet only) -->
    <div class="bottom-tab-bar">
      <div class="tab-bar-inner">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="['tab-item', isActive(item.to) ? 'tab-item--active' : 'tab-item--inactive']"
        >
          <IonIcon :icon="item.icon" class="tab-icon" />
          <span class="tab-label">{{ item.label }}</span>
        </NuxtLink>
        <button
          class="tab-item tab-item--inactive"
          @click="drawerOpen = true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="tab-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span class="tab-label">{{ t('nav.menu') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  homeOutline,
  trophyOutline,
  peopleOutline,
  constructOutline,
  statsChartOutline,
  logOutOutline,
} from 'ionicons/icons'
import { useAuthStore } from '~/stores/useAuthStore'
import { useI18n } from '~/composables/useI18n'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const clubStore = useClubStore()
const { t } = useI18n()

const club = computed(() => clubStore.club)
const drawerOpen = ref(false)

// Active tournament tracking (for the "LIVE" quick access)
const activeTournamentId = ref<string | null>(null)
const activeTournamentTitle = ref('')

const navItems = computed(() => [
  { to: '/', icon: homeOutline, label: t('nav.dashboard') },
  { to: '/tournaments', icon: trophyOutline, label: t('nav.tournaments') },
  { to: '/players', icon: peopleOutline, label: t('nav.players') },
  { to: '/templates', icon: constructOutline, label: t('nav.templates') },
  { to: '/reports', icon: statsChartOutline, label: t('nav.reports') },
])

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const userInitials = computed(() => {
  const user = authStore.currentUser
  if (!user) return '?'
  const f = user.firstName?.charAt(0)?.toUpperCase() || ''
  const l = user.lastName?.charAt(0)?.toUpperCase() || ''
  return `${f}${l}` || user.username?.charAt(0)?.toUpperCase() || '?'
})

const userName = computed(() => {
  const user = authStore.currentUser
  if (!user) return ''
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  return user.username || user.email || ''
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// Auto-close drawer on route change
watch(() => route.path, () => {
  drawerOpen.value = false
})

// Try to find an active tournament for the quick-access link
onMounted(async () => {
  if (!club.value) return
  try {
    const res = await GqlGetTournaments({ clubId: club.value.id })
    const tournaments = res.tournaments?.items || []
    const active = tournaments.find((t: any) => t.status === 'IN_PROGRESS')
    if (active) {
      activeTournamentId.value = active.id
      activeTournamentTitle.value = active.title
    }
  } catch {
    // Non-critical, silently fail
  }
})
</script>

<style scoped>
/* Icon sizes */
.icon-sm {
  width: 1rem;
  height: 1rem;
}

/* Layout root */
.layout-root {
  min-height: 100dvh;
  background-color: var(--pp-bg-primary);
}

/* Backdrop */
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  transition: opacity 0.3s ease;
}

/* Sidebar */
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 50;
  width: 15rem;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--pp-border);
  background-color: var(--pp-bg-secondary);
  transition: transform 0.3s ease;
}

.sidebar--open {
  transform: translateX(0);
}

.sidebar--closed {
  transform: translateX(-100%);
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid rgba(84, 84, 95, 0.5);
}

.sidebar-logo {
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
}

.sidebar-brand-text {
  min-width: 0;
}

.sidebar-title {
  color: var(--pp-accent-gold);
  font-weight: 700;
  font-size: 1.125rem;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-club {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 1rem 0.75rem;
  overflow-y: auto;
}

.sidebar-nav > * + * {
  margin-top: 0.25rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
}

.nav-link--active {
  background-color: rgba(254, 231, 138, 0.15);
  color: var(--pp-accent-gold);
}

.nav-link--inactive {
  color: rgba(255, 255, 255, 0.6);
}

.nav-link--inactive:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.05);
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.nav-icon--active {
  color: var(--pp-accent-gold);
}

.nav-icon--inactive {
  color: rgba(255, 255, 255, 0.5);
}

.nav-link--inactive:hover .nav-icon--inactive {
  color: #ffffff;
}

.nav-label {
  font-size: 0.875rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-active-dot {
  margin-left: auto;
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  background-color: var(--pp-accent-gold);
}

/* Live Tournament Section */
.live-section {
  padding: 0 0.75rem 0.75rem;
}

.live-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  transition: all 0.2s ease;
}

.live-link:hover {
  background-color: rgba(239, 68, 68, 0.15);
}

.live-dot {
  width: 0.5rem;
  height: 0.5rem;
  background-color: var(--pp-red-500);
  border-radius: 9999px;
  flex-shrink: 0;
}

.live-text {
  min-width: 0;
}

.live-label {
  color: var(--pp-red-400);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.live-title {
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Sidebar Footer / User */
.sidebar-footer {
  border-top: 1px solid rgba(84, 84, 95, 0.5);
  padding: 0.75rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
}

.user-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background-color: rgba(254, 231, 138, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--pp-accent-gold);
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-name-wrapper {
  min-width: 0;
}

.user-name {
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-button {
  padding: 0.375rem;
  color: rgba(255, 255, 255, 0.4);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.logout-button:hover {
  color: var(--pp-red-400);
  background-color: rgba(239, 68, 68, 0.1);
}

/* Hamburger Button */
.hamburger-button {
  position: fixed;
  top: 0.75rem;
  left: 1rem;
  z-index: 30;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background-color: var(--pp-bg-secondary);
  border: 1px solid var(--pp-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s ease;
  box-shadow: var(--pp-shadow-lg);
  cursor: pointer;
}

.hamburger-button:hover {
  color: #ffffff;
}

.hamburger-button:active {
  transform: scale(0.95);
}

.hamburger-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Main Content */
.pp-main {
  min-height: 100dvh;
}

@media (max-width: 1023px) {
  .pp-main {
    padding-bottom: 70px;
  }
}

/* Push ion-content down so page content clears the fixed hamburger button */
.pp-main :deep(ion-content) {
  --padding-top: 52px;
}

/* Bottom Tab Bar */
.bottom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  border-top: 1px solid var(--pp-border);
  background-color: rgba(24, 24, 26, 0.95);
  backdrop-filter: blur(24px);
  height: 70px;
  padding-bottom: env(safe-area-inset-bottom);
}

@media (min-width: 1024px) {
  .bottom-tab-bar {
    display: none;
  }
}

.tab-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 100%;
  padding: 0 0.5rem;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  min-height: 44px;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tab-item--active {
  color: var(--pp-accent-gold);
}

.tab-item--inactive {
  color: rgba(255, 255, 255, 0.4);
}

.tab-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.tab-label {
  font-size: 10px;
  font-weight: 500;
}

/* Hide scrollbar utility */
.pp-hide-scrollbar {
  scrollbar-width: none;
}
.pp-hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
