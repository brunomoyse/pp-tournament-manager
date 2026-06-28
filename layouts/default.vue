<template>
  <div class="layout-root">
    <!-- [A] Backdrop overlay (mobile drawer only) -->
    <div v-if="drawerOpen" class="backdrop" @click="drawerOpen = false" />

    <!-- [B] Sidebar rail (overlay drawer on phones, pinned rail on tablet/desktop) -->
    <aside :class="['sidebar', drawerOpen ? 'sidebar--open' : 'sidebar--closed']">
      <!-- Club switcher -->
      <div class="club-switcher">
        <div class="club-switcher__logo">
          <img src="/assets/icon-no-bg.png" alt="PocketPair" />
        </div>
        <div class="club-switcher__text">
          <div class="club-switcher__name">{{ club?.name || 'PocketPair' }}</div>
          <div class="club-switcher__sub">{{ clubSubLabel }}</div>
        </div>
      </div>

      <!-- Grouped navigation -->
      <nav class="sidebar-nav pp-hide-scrollbar" data-tour="nav">
        <div v-for="group in navGroups" :key="group.key" class="nav-group">
          <p class="nav-group__label">{{ group.label }}</p>
          <NuxtLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            :data-tour-nav="item.to"
            :class="['nav-link', isActive(item.to) ? 'nav-link--active' : 'nav-link--inactive']"
            @click="drawerOpen = false"
          >
            <IonIcon
              :icon="item.icon"
              :class="['nav-icon', isActive(item.to) ? 'nav-icon--active' : 'nav-icon--inactive']"
            />
            <span class="nav-label">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </nav>

      <!-- Live tournament quick access -->
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
          <IonIcon :icon="chevronForwardOutline" class="live-chevron" />
        </NuxtLink>
      </div>

      <!-- User footer -->
      <div class="sidebar-footer">
        <button type="button" class="footer-action" @click="replayTour">
          <IonIcon :icon="compassOutline" class="footer-action-icon" />
          <span>{{ t('nav.replayTour') }}</span>
        </button>
        <NuxtLink to="/settings" class="footer-action" @click="drawerOpen = false">
          <IonIcon :icon="settingsOutline" class="footer-action-icon" />
          <span>{{ t('nav.settings') }}</span>
        </NuxtLink>
        <div class="user-info">
          <div class="user-avatar">
            {{ userInitials }}
          </div>
          <div class="user-details">
            <div class="user-name-wrapper">
              <div class="user-name">{{ userName }}</div>
            </div>
            <button @click="handleLogout" class="logout-button" :aria-label="t('nav.logout')">
              <IonIcon :icon="logOutOutline" class="icon-sm" />
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Hamburger button (phones only; fixed, z-30 above Ionic's ion-page z-0) -->
    <button @click="drawerOpen = true" class="hamburger-button" :aria-label="t('nav.menu')">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="hamburger-icon"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <!-- [C] Main column: top bar (tablet/desktop) + page content -->
    <main class="pp-main">
      <header class="topbar">
        <div class="topbar__crumbs">
          <span v-if="club" class="topbar__club">{{ club.name }}</span>
          <IonIcon v-if="club" :icon="chevronForwardOutline" class="topbar__sep" />
          <span class="topbar__page">{{ currentPageLabel }}</span>
        </div>

        <div class="topbar__actions">
          <button type="button" class="topbar__search" @click="goToSearch">
            <IonIcon :icon="searchOutline" class="topbar__search-icon" />
            <span class="topbar__search-text">{{ t('nav.search') }}</span>
            <kbd class="topbar__kbd">{{ searchShortcut }}</kbd>
          </button>

          <button
            type="button"
            class="topbar__bell"
            :aria-label="t('nav.notifications')"
            @click="openNotifications"
          >
            <IonIcon :icon="notificationsOutline" class="topbar__bell-icon" />
            <span v-if="hasUnread" class="topbar__bell-dot" />
          </button>

          <PpButton size="sm" @click="openCreateTournament">
            <IonIcon :icon="addOutline" class="icon-sm" />
            {{ t('buttons.createTournament') }}
          </PpButton>
        </div>
      </header>

      <div class="pp-main__content">
        <slot />
      </div>
    </main>

    <!-- [D] Bottom tab bar (phones only; tablets/desktop use the side rail) -->
    <div class="bottom-tab-bar">
      <div class="tab-bar-inner" data-tour="nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :data-tour-nav="item.to"
          :class="['tab-item', isActive(item.to) ? 'tab-item--active' : 'tab-item--inactive']"
        >
          <IonIcon :icon="item.icon" class="tab-icon" />
          <span class="tab-label">{{ item.label }}</span>
        </NuxtLink>
        <button class="tab-item tab-item--inactive" @click="drawerOpen = true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="tab-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span class="tab-label">{{ t('nav.menu') }}</span>
        </button>
      </div>
    </div>

    <!-- Global quick-create tournament (top-bar CTA) -->
    <TournamentFormModal
      :isOpen="showCreateModal"
      :tournament="null"
      mode="create"
      @close="showCreateModal = false"
      @saved="onTournamentCreated"
    />

    <!-- Onboarding: welcome modal + guided tour overlay -->
    <TourHost />
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import TourHost from '~/components/tour/TourHost.vue'
import TournamentFormModal from '~/components/tournament/TournamentFormModal.vue'
import {
  homeOutline,
  trophyOutline,
  peopleOutline,
  constructOutline,
  statsChartOutline,
  podiumOutline,
  gridOutline,
  megaphoneOutline,
  logOutOutline,
  compassOutline,
  settingsOutline,
  ticketOutline,
  chevronForwardOutline,
  searchOutline,
  notificationsOutline,
  addOutline,
} from 'ionicons/icons'
import { useAuthStore } from '~/stores/useAuthStore'
import { useTourStore } from '~/stores/useTourStore'
import { useI18n } from '~/composables/useI18n'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const clubStore = useClubStore()
const tourStore = useTourStore()
const { t } = useI18n()

const replayTour = () => {
  drawerOpen.value = false
  tourStore.startTour()
}

const club = computed(() => clubStore.club)
const drawerOpen = ref(false)

// Active tournament tracking (for the "LIVE" quick access + the bell's dot)
const activeTournamentId = ref<string | null>(null)
const activeTournamentTitle = ref('')

// Mono sub-label under the club name in the switcher: prefer the club's city,
// fall back to the product name so the slot never reads empty.
const clubSubLabel = computed(() => (club.value as any)?.city || 'PocketPair')

// Bottom tab bar keeps the 5 primary items (unchanged on phones).
const navItems = computed(() => [
  { to: '/', icon: homeOutline, label: t('nav.dashboard') },
  { to: '/tournaments', icon: trophyOutline, label: t('nav.tournaments') },
  { to: '/players', icon: peopleOutline, label: t('nav.players') },
  { to: '/templates', icon: constructOutline, label: t('nav.templates') },
  { to: '/reports', icon: statsChartOutline, label: t('nav.reports') },
])

// Free ("Home Game") clubs are a private host tool - player-facing features
// (announcements, leagues) aren't part of that tier, so hide them.
const isFreePlan = computed(
  () => ((authStore.currentUser as any)?.managedClub?.plan ?? 'FREE') === 'FREE',
)

// Platform admins get the trial-code generator; managers/players never see it.
const isAdmin = computed(() => (authStore.currentUser as any)?.role === 'ADMIN')

// Rail navigation, split into "Manage" (daily operations) and "Club"
// (configuration, analytics, communication). Plan/admin gating mirrors the
// previous flat sidebar list.
const navGroups = computed(() => {
  const manage = [
    { to: '/', icon: homeOutline, label: t('nav.dashboard') },
    { to: '/tournaments', icon: trophyOutline, label: t('nav.tournaments') },
    { to: '/players', icon: peopleOutline, label: t('nav.players') },
    { to: '/tables', icon: gridOutline, label: t('nav.tables') },
  ]
  const clubItems = [
    { to: '/templates', icon: constructOutline, label: t('nav.templates') },
    { to: '/reports', icon: statsChartOutline, label: t('nav.reports') },
    ...(isFreePlan.value
      ? []
      : [
          { to: '/leagues', icon: podiumOutline, label: t('nav.leagues') },
          { to: '/announcements', icon: megaphoneOutline, label: t('nav.announcements') },
        ]),
    ...(isAdmin.value
      ? [{ to: '/redemption-codes', icon: ticketOutline, label: t('nav.redemptionCodes') }]
      : []),
  ]
  return [
    { key: 'manage', label: t('nav.groupManage'), items: manage },
    { key: 'club', label: t('nav.groupClub'), items: clubItems },
  ]
})

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

// Breadcrumb leaf: the active rail item, with sensible fallbacks for routes
// that aren't in the rail (settings, tournament/series detail).
const currentPageLabel = computed(() => {
  const item = navGroups.value.flatMap((g) => g.items).find((i) => isActive(i.to))
  if (item) return item.label
  if (route.path.startsWith('/settings')) return t('nav.settings')
  if (route.path.startsWith('/tournament/') || route.path.startsWith('/series/'))
    return t('nav.tournaments')
  return t('nav.dashboard')
})

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

// Top-bar search affordance: a real entry point to the searchable surfaces.
// Clicking it (or pressing the platform shortcut) lands on the tournaments
// list, where the search field lives.
const isMac = computed(
  () => import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
)
const searchShortcut = computed(() => (isMac.value ? '⌘K' : 'Ctrl K'))
const goToSearch = () => {
  drawerOpen.value = false
  router.push('/tournaments')
}
const onKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    goToSearch()
  }
}

// Notifications bell: the meaningful "needs attention" signal we have without a
// new query is a live tournament, so the dot tracks that and the bell jumps to it.
const hasUnread = computed(() => !!activeTournamentId.value)
const openNotifications = () => {
  if (activeTournamentId.value) router.push(`/tournament/${activeTournamentId.value}`)
}

// Global quick-create modal driven by the top-bar CTA.
const showCreateModal = ref(false)
const openCreateTournament = () => {
  showCreateModal.value = true
}
const onTournamentCreated = (created?: { id?: string }) => {
  showCreateModal.value = false
  router.push(created?.id ? `/tournament/${created.id}` : '/tournaments')
}

// Auto-close drawer on route change
watch(
  () => route.path,
  () => {
    drawerOpen.value = false
  },
)

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  if (!club.value) return
  try {
    const res = await GqlGetTournaments({ clubId: club.value.id })
    const tournaments = res.tournaments?.items || []
    const active = tournaments.find((tournament: any) => tournament.status === 'IN_PROGRESS')
    if (active) {
      activeTournamentId.value = active.id
      activeTournamentTitle.value = active.title
    }
  } catch {
    // Non-critical, silently fail
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
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
  background-color: var(--color-pp-bg);
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
  border-right: 1px solid var(--color-pp-border);
  background-color: var(--color-pp-surface);
  transition: transform 0.3s ease;
}

.sidebar--open {
  transform: translateX(0);
}

.sidebar--closed {
  transform: translateX(-100%);
}

/* Club switcher */
.club-switcher {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 1rem;
  margin: 0.5rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-pp-border);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.025), rgba(255, 255, 255, 0));
}

.club-switcher__logo {
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  border-radius: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-pp-border);
  background-color: rgba(var(--pp-accent-rgb), 0.08);
}

.club-switcher__logo img {
  width: 1.6rem;
  height: 1.6rem;
}

.club-switcher__text {
  min-width: 0;
}

.club-switcher__name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
  color: var(--color-pp-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.club-switcher__sub {
  margin-top: 0.1rem;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-pp-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 0.5rem 0.75rem 1rem;
  overflow-y: auto;
}

.nav-group + .nav-group {
  margin-top: 1.25rem;
}

.nav-group__label {
  padding: 0 0.85rem;
  margin-bottom: 0.4rem;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
}

.nav-group > .nav-link + .nav-link {
  margin-top: 0.15rem;
}

.nav-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.85rem;
  border-radius: 0.7rem;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.nav-link--active {
  background-color: rgba(var(--pp-accent-rgb), 0.1);
  color: var(--color-pp-gold);
}

.nav-link--active::before {
  content: '';
  position: absolute;
  left: -0.75rem;
  top: 20%;
  bottom: 20%;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background-color: var(--color-pp-gold);
  box-shadow: 0 0 12px rgba(var(--pp-accent-rgb), 0.45);
}

.nav-link--inactive {
  color: var(--color-pp-text-muted);
}

.nav-link--inactive:hover {
  color: var(--color-pp-text);
  background-color: rgba(255, 255, 255, 0.04);
}

.nav-icon {
  width: 1.2rem;
  height: 1.2rem;
  flex-shrink: 0;
}

.nav-icon--active {
  color: var(--color-pp-gold);
}

.nav-icon--inactive {
  color: var(--color-pp-text-dim);
}

.nav-link--inactive:hover .nav-icon--inactive {
  color: var(--color-pp-text);
}

.nav-label {
  font-size: 0.875rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Live tournament section */
.live-section {
  padding: 0 0.75rem 0.75rem;
}

.live-link {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.7rem 0.75rem;
  border-radius: var(--radius-xl);
  background-color: rgba(var(--pp-danger-rgb), 0.1);
  border: 1px solid rgba(var(--pp-danger-rgb), 0.3);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.live-link:hover {
  background-color: rgba(var(--pp-danger-rgb), 0.16);
  border-color: rgba(var(--pp-danger-rgb), 0.45);
}

.live-dot {
  width: 0.5rem;
  height: 0.5rem;
  background-color: var(--color-pp-danger);
  border-radius: 9999px;
  flex-shrink: 0;
}

.live-text {
  min-width: 0;
  flex: 1;
}

.live-label {
  color: #f87171;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.live-title {
  color: var(--color-pp-text);
  font-size: 0.85rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.live-chevron {
  width: 1rem;
  height: 1rem;
  color: #f87171;
  flex-shrink: 0;
}

/* Sidebar footer / user */
.sidebar-footer {
  border-top: 1px solid var(--color-pp-border);
  padding: 0.75rem;
}

.footer-action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.55rem 0.75rem;
  margin-bottom: 0.15rem;
  border-radius: 0.7rem;
  color: var(--color-pp-text-muted);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.footer-action:hover {
  color: var(--color-pp-text);
  background-color: rgba(255, 255, 255, 0.04);
}

.footer-action-icon {
  width: 1.2rem;
  height: 1.2rem;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.5rem 0.25rem;
}

.user-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background-color: rgba(var(--pp-accent-rgb), 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-pp-gold);
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 0.8rem;
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
  color: var(--color-pp-text);
  font-size: 0.85rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-button {
  padding: 0.375rem;
  color: var(--color-pp-text-dim);
  border-radius: 0.5rem;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
  cursor: pointer;
}

.logout-button:hover {
  color: #f87171;
  background-color: rgba(var(--pp-danger-rgb), 0.1);
}

/* Hamburger button (phones) */
.hamburger-button {
  position: fixed;
  /* Clear the status bar / notch on iPad + iPhone (Capacitor webview). */
  top: calc(0.75rem + env(safe-area-inset-top));
  left: 1rem;
  z-index: 30;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  background-color: var(--color-pp-surface-2);
  border: 1px solid var(--color-pp-border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-pp-text-muted);
  transition:
    color 0.15s ease,
    transform 0.15s ease;
  box-shadow: var(--pp-shadow-lg);
  cursor: pointer;
}

.hamburger-button:hover {
  color: var(--color-pp-text);
}

.hamburger-button:active {
  transform: scale(0.95);
}

.hamburger-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Main column */
.pp-main {
  min-height: 100dvh;
}

/* The content wrapper is transparent on phones (display: contents) so the
   page's absolutely-positioned <ion-page> keeps anchoring exactly as before;
   the desktop block below turns it into the positioned, sized containing box. */
.pp-main__content {
  display: contents;
}

/* Top bar lives on tablet/desktop only; phones keep the hamburger + tab bar. */
.topbar {
  display: none;
}

/* Phones only: reserve space for the fixed bottom tab bar. */
@media (max-width: 767px) {
  .pp-main {
    padding-bottom: 70px;
  }

  /* Push ion-content down so page content clears the fixed hamburger button
     (0.75rem top + 2.75rem button) plus the top safe-area inset. */
  .pp-main :deep(ion-content) {
    --padding-top: calc(56px + env(safe-area-inset-top));
  }
}

/* Bottom tab bar */
.bottom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  border-top: 1px solid var(--color-pp-border-strong);
  background-color: rgba(24, 24, 26, 0.95);
  backdrop-filter: blur(24px);
  height: 70px;
  padding-bottom: env(safe-area-inset-bottom);
}

/* Tablet (iPad portrait, 768px) and up: drop the bottom tab bar, pin the rail,
   and show the top bar. */
@media (min-width: 768px) {
  .bottom-tab-bar {
    display: none;
  }

  .sidebar--open,
  .sidebar--closed {
    transform: translateX(0);
  }

  .hamburger-button,
  .backdrop {
    display: none;
  }

  /* Main column: a flex column of [top bar | content], offset by the rail. */
  .pp-main {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    margin-left: 15rem;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-shrink: 0;
    height: 3.75rem;
    padding: 0 1.5rem;
    border-bottom: 1px solid var(--color-pp-border);
    background-color: rgba(24, 24, 26, 0.7);
    backdrop-filter: blur(12px);
  }

  /* Content fills the rest and is the positioned containing block for ion-page. */
  .pp-main__content {
    display: block;
    position: relative;
    flex: 1;
    min-height: 0;
  }

  .pp-main :deep(ion-content) {
    --padding-top: 0;
  }
}

/* Top bar: breadcrumb */
.topbar__crumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.topbar__club {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-pp-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar__sep {
  width: 0.85rem;
  height: 0.85rem;
  color: var(--color-pp-text-dim);
  flex-shrink: 0;
}

.topbar__page {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-pp-text);
  white-space: nowrap;
}

/* Top bar: actions */
.topbar__actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.topbar__search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.25rem;
  padding: 0 0.6rem 0 0.7rem;
  border-radius: 0.7rem;
  border: 1px solid var(--color-pp-border);
  background-color: var(--color-pp-bg);
  color: var(--color-pp-text-muted);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    color 0.15s ease;
}

.topbar__search:hover {
  border-color: var(--color-pp-border-strong);
  color: var(--color-pp-text);
}

.topbar__search-icon {
  width: 1rem;
  height: 1rem;
}

.topbar__search-text {
  font-size: 0.8rem;
  min-width: 7rem;
  text-align: left;
}

.topbar__kbd {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  padding: 0.1rem 0.35rem;
  border-radius: 0.35rem;
  border: 1px solid var(--color-pp-border-strong);
  color: var(--color-pp-text-dim);
}

.topbar__bell {
  position: relative;
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.7rem;
  border: 1px solid var(--color-pp-border);
  background-color: var(--color-pp-bg);
  color: var(--color-pp-text-muted);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    color 0.15s ease;
}

.topbar__bell:hover {
  border-color: var(--color-pp-border-strong);
  color: var(--color-pp-text);
}

.topbar__bell-icon {
  width: 1.15rem;
  height: 1.15rem;
}

.topbar__bell-dot {
  position: absolute;
  top: 0.5rem;
  right: 0.55rem;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 9999px;
  background-color: var(--color-pp-danger);
  border: 2px solid var(--color-pp-bg);
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
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
  cursor: pointer;
}

.tab-item--active {
  color: var(--color-pp-gold);
}

.tab-item--inactive {
  color: var(--color-pp-text-dim);
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
