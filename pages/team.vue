<template>
  <IonPage class="page-bg">
    <IonContent class="content-bg">
      <div class="page-container">
        <PpFadeUp>
          <p class="eyebrow">{{ t('nav.groupClub') }}</p>
          <h1 class="page-title">{{ t('team.title') }}</h1>
          <p class="page-help">{{ t('team.help') }}</p>
        </PpFadeUp>

        <PpFadeUp :delay="0.12">
          <section class="team-section">
            <ul v-if="managers.length" class="team-list">
              <li v-for="m in managers" :key="m.id" class="team-row">
                <div class="team-row__info">
                  <span class="team-row__name">
                    {{ m.firstName }} {{ m.lastName ?? '' }}
                    <span v-if="m.userId === myUserId" class="team-row__you">{{
                      t('team.you')
                    }}</span>
                  </span>
                  <span class="team-row__email">{{ m.email }}</span>
                </div>

                <span
                  class="team-row__role"
                  :class="{ 'team-row__role--owner': m.role === 'OWNER' }"
                  data-testid="manager-role"
                >
                  {{ m.role === 'OWNER' ? t('team.roleOwner') : t('team.roleManager') }}
                </span>

                <!-- Owners manage everyone but themselves: stepping down means
                     promoting someone first and letting them demote you, which
                     keeps a club from ever losing its last owner by accident. -->
                <template v-if="isOwner && m.userId !== myUserId">
                  <PpButton
                    variant="ghost"
                    size="sm"
                    :disabled="isSavingRole === m.id"
                    test-id="toggle-manager-role"
                    @click="toggleRole(m)"
                  >
                    {{ m.role === 'OWNER' ? t('team.makeManager') : t('team.makeOwner') }}
                  </PpButton>
                  <PpButton
                    :variant="confirmingRevoke === m.id ? 'danger' : 'ghost'"
                    size="sm"
                    :disabled="isRevoking === m.id"
                    test-id="revoke-manager"
                    @click="onRevokeClick(m)"
                  >
                    {{ confirmingRevoke === m.id ? t('team.revokeConfirm') : t('team.revoke') }}
                  </PpButton>
                </template>
              </li>
            </ul>

            <!-- A brand-new club has exactly one manager (the owner), so this is
                 the real "empty" state for this page, not a zero-length list. -->
            <p v-if="isOwner && managers.length <= 1" class="team-alone">
              {{ t('team.onlyYouHint') }}
            </p>
            <p v-if="teamError" class="invite-error">{{ teamError }}</p>
          </section>
        </PpFadeUp>

        <PpFadeUp :delay="0.16">
          <!-- The tour spotlights this section, so it has to exist for managers
               too; only its contents change. -->
          <section class="team-section" data-tour="team">
            <div class="team-section__head">
              <h2 class="team-section__title">{{ t('team.inviteTitle') }}</h2>
              <p class="team-section__help">{{ t('team.inviteHelp') }}</p>
            </div>

            <p v-if="!isOwner" class="team-alone">{{ t('team.readOnlyHint') }}</p>

            <template v-else>
              <div class="invite-row">
                <input
                  v-model="inviteEmail"
                  type="email"
                  class="invite-input"
                  :placeholder="t('team.emailPlaceholder')"
                  :disabled="isInviting"
                  autocomplete="off"
                  spellcheck="false"
                  data-testid="invite-email"
                  @keyup.enter="invite"
                />
                <input
                  v-model="inviteFirstName"
                  class="invite-input invite-input--name"
                  :placeholder="t('team.firstNamePlaceholder')"
                  :disabled="isInviting"
                  autocomplete="off"
                  spellcheck="false"
                />
                <select
                  v-model="inviteRole"
                  class="invite-input invite-input--role"
                  :aria-label="t('team.inviteAs')"
                  :disabled="isInviting"
                  data-testid="invite-role"
                >
                  <option value="MANAGER">{{ t('team.roleManager') }}</option>
                  <option value="OWNER">{{ t('team.roleOwner') }}</option>
                </select>
                <PpButton
                  :loading="isInviting"
                  :disabled="isInviting || !inviteEmail.trim()"
                  test-id="invite-submit"
                  @click="invite"
                >
                  {{ t('team.inviteButton') }}
                </PpButton>
              </div>
              <p v-if="inviteError" class="invite-error">{{ inviteError }}</p>
              <p v-if="inviteSuccess" class="invite-success">{{ inviteSuccess }}</p>
            </template>
          </section>
        </PpFadeUp>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  title: 'nav.team',
})

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { IonPage, IonContent } from '@ionic/vue'
import { useI18n } from '~/composables/useI18n'
import { useAuthStore } from '~/stores/useAuthStore'

const { t, locale } = useI18n()
const authStore = useAuthStore()

type ClubRole = 'OWNER' | 'MANAGER'

type TeamManager = {
  id: string
  userId: string
  email: string
  firstName: string
  lastName?: string | null
  role: ClubRole
  assignedAt: string
}

const managers = ref<TeamManager[]>([])
const inviteEmail = ref('')
const inviteFirstName = ref('')
const inviteRole = ref<ClubRole>('MANAGER')
const isInviting = ref(false)
const isRevoking = ref<string | null>(null)
const isSavingRole = ref<string | null>(null)
const confirmingRevoke = ref<string | null>(null)
let confirmTimerId: ReturnType<typeof setTimeout> | null = null
const inviteError = ref('')
const inviteSuccess = ref('')
const teamError = ref('')

const myUserId = computed(() => (authStore.currentUser as any)?.id ?? '')
const clubId = computed(() => (authStore.currentUser as any)?.managedClub?.id ?? '')
const isOwner = computed(() => authStore.isClubOwner)

/**
 * Turn a server rejection into copy. The last-owner guard is the one a person
 * can actually trip, so it gets a real explanation; everything else falls back
 * to the caller's generic message rather than leaking backend phrasing.
 */
const failureCopy = (err: any, fallback: string) => {
  const message = String(err?.gqlErrors?.[0]?.message ?? '').toLowerCase()
  if (message.includes('last owner')) return t('team.lastOwnerError')
  return err?.gqlErrors?.[0]?.message || fallback
}

const loadManagers = async () => {
  if (!clubId.value) return
  try {
    const { clubManagers } = await GqlGetClubManagers({ clubId: clubId.value })
    managers.value = (clubManagers ?? []) as TeamManager[]
  } catch {
    // List is non-critical; the page still offers the invite form.
  }
}

const invite = async () => {
  inviteError.value = ''
  inviteSuccess.value = ''
  const email = inviteEmail.value.trim()
  if (!clubId.value || !email) return

  isInviting.value = true
  try {
    const { inviteClubManager } = await GqlInviteClubManager({
      input: {
        clubId: clubId.value,
        email,
        firstName: inviteFirstName.value.trim() || undefined,
        locale: locale.value,
        role: inviteRole.value,
      },
    })
    inviteEmail.value = ''
    inviteFirstName.value = ''
    inviteRole.value = 'MANAGER'
    inviteSuccess.value = !inviteClubManager.emailSent
      ? t('team.inviteNoEmail')
      : inviteClubManager.createdAccount
        ? t('team.inviteSentNew')
        : t('team.inviteSentExisting')
    await loadManagers()
  } catch (err: any) {
    inviteError.value = failureCopy(err, t('team.inviteError'))
  } finally {
    isInviting.value = false
  }
}

// Removing a manager is immediate and irreversible from here, so the first
// click only arms the button; it disarms itself if nothing follows.
const onRevokeClick = (m: TeamManager) => {
  if (confirmTimerId) clearTimeout(confirmTimerId)
  if (confirmingRevoke.value !== m.id) {
    confirmingRevoke.value = m.id
    confirmTimerId = setTimeout(() => {
      confirmingRevoke.value = null
    }, 4000)
    return
  }
  confirmingRevoke.value = null
  void revokeManager(m)
}

const revokeManager = async (m: TeamManager) => {
  teamError.value = ''
  isRevoking.value = m.id
  try {
    await GqlRevokeClubManager({ id: m.id })
    await loadManagers()
  } catch (err: any) {
    teamError.value = failureCopy(err, t('team.inviteError'))
  } finally {
    isRevoking.value = null
  }
}

const toggleRole = async (m: TeamManager) => {
  teamError.value = ''
  isSavingRole.value = m.id
  try {
    await GqlSetClubManagerRole({
      id: m.id,
      role: m.role === 'OWNER' ? 'MANAGER' : 'OWNER',
    })
    await loadManagers()
  } catch (err: any) {
    teamError.value = failureCopy(err, t('team.inviteError'))
  } finally {
    isSavingRole.value = null
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) void loadManagers()
})

onUnmounted(() => {
  if (confirmTimerId) clearTimeout(confirmTimerId)
})
</script>

<style scoped>
.page-bg,
.content-bg {
  background-color: var(--color-pp-bg);
}

.page-container {
  padding: 1.5rem 1rem;
  max-width: 720px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .page-container {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
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

.page-help {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-pp-text-muted);
}

.team-section {
  margin-top: 2rem;
}

.team-section__title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-pp-text);
}

.team-section__help {
  margin-top: 0.2rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: var(--color-pp-text-muted);
}

.team-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.team-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--color-pp-border);
  border-radius: 0.75rem;
  background-color: var(--color-pp-surface);
}

.team-row__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  /* Take the slack so the role badge and actions cluster on the right. */
  flex: 1;
}

.team-row__name {
  font-weight: 600;
  color: var(--color-pp-text);
}

.team-row__you {
  margin-left: 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-pp-gold-deep);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.team-row__email {
  font-size: 0.8rem;
  color: var(--color-pp-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
}

.team-alone {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: var(--color-pp-text-muted);
}

.team-row__role {
  flex-shrink: 0;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  border: 1px solid var(--color-pp-border-strong);
  font-family: var(--font-mono);
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-pp-text-dim);
}

/* Owner is the load-bearing distinction on this page, so it is the only badge
   that gets the accent. */
.team-row__role--owner {
  border-color: rgba(var(--pp-accent-rgb), 0.45);
  color: var(--color-pp-gold);
}

.invite-input--role {
  max-width: 150px;
  cursor: pointer;
}

.invite-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
  flex-wrap: wrap;
}

.invite-input {
  flex: 1;
  min-width: 0;
  padding: 0.7rem 0.9rem;
  border-radius: 0.7rem;
  border: 1px solid var(--color-pp-border);
  background-color: var(--color-pp-surface);
  color: var(--color-pp-text);
  font-size: 0.9rem;
}

.invite-input--name {
  max-width: 180px;
}

.invite-input::placeholder {
  color: var(--color-pp-text-dim);
}

.invite-input:focus {
  outline: none;
  border-color: var(--color-pp-gold);
}

.invite-error {
  margin-top: 0.6rem;
  font-size: 0.8rem;
  color: var(--color-pp-danger);
}

.invite-success {
  margin-top: 0.6rem;
  font-size: 0.85rem;
  color: var(--color-pp-gold);
}
</style>
