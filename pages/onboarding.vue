<template>
  <div class="onboarding-page">
    <div class="gold-glow" aria-hidden="true" />
    <div class="grain-layer" aria-hidden="true" />

    <PpFadeUp class="onboarding-card-wrap">
      <div class="onboarding-card pp-glass">
        <PpFadeUp :delay="0.08">
          <div class="logo-section">
            <div class="logo-wrapper">
              <img src="@/assets/icon-no-bg.png" alt="PocketPair" class="logo-image" />
            </div>
            <p class="eyebrow">{{ t('onboarding.eyebrow') }}</p>
            <h1 class="app-title">
              <span class="pp-gold-text">{{ t('onboarding.title') }}</span>
            </h1>
            <p class="subtitle">{{ t('onboarding.subtitle') }}</p>
          </div>
        </PpFadeUp>

        <form @submit.prevent="handleSubmit" class="onboarding-form" novalidate>
          <!-- ── Account ─────────────────────────────── -->
          <PpFadeUp :delay="0.12">
            <p class="section-heading">{{ t('onboarding.sectionAccount') }}</p>
          </PpFadeUp>

          <PpFadeUp :delay="0.14">
            <div class="field-row">
              <div class="field">
                <label class="field-label">{{ t('onboarding.firstName') }}</label>
                <input
                  v-model.trim="firstName"
                  type="text"
                  autocomplete="given-name"
                  :disabled="isLoading"
                  :class="inputClass(firstNameError)"
                  @input="firstNameError = ''"
                />
                <p v-if="firstNameError" class="field-error">{{ firstNameError }}</p>
              </div>
              <div class="field">
                <label class="field-label">{{ t('onboarding.lastName') }}</label>
                <input
                  v-model.trim="lastName"
                  type="text"
                  autocomplete="family-name"
                  :disabled="isLoading"
                  :class="inputClass(lastNameError)"
                  @input="lastNameError = ''"
                />
                <p v-if="lastNameError" class="field-error">{{ lastNameError }}</p>
              </div>
            </div>
          </PpFadeUp>

          <PpFadeUp :delay="0.18">
            <div class="field">
              <label class="field-label">{{ t('auth.email') }}</label>
              <input
                v-model.trim="email"
                type="email"
                autocomplete="email"
                :disabled="isLoading"
                :class="inputClass(emailError)"
                @input="emailError = ''"
              />
              <p v-if="emailError" class="field-error">{{ emailError }}</p>
            </div>
          </PpFadeUp>

          <PpFadeUp :delay="0.22">
            <div class="field">
              <label class="field-label">{{ t('auth.password') }}</label>
              <div class="input-wrapper">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  :disabled="isLoading"
                  :class="[inputClass(passwordError), 'form-input--with-toggle']"
                  @input="passwordError = ''"
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                >
                  {{ showPassword ? t('onboarding.hide') : t('onboarding.show') }}
                </button>
              </div>
              <p v-if="passwordError" class="field-error">{{ passwordError }}</p>
              <p v-else class="field-hint">{{ t('onboarding.passwordHint') }}</p>
            </div>
          </PpFadeUp>

          <!-- ── Club ────────────────────────────────── -->
          <PpFadeUp :delay="0.26">
            <p class="section-heading section-heading--spaced">
              {{ t('onboarding.sectionClub') }}
            </p>
          </PpFadeUp>

          <PpFadeUp :delay="0.28">
            <div class="field">
              <label class="field-label">{{ t('onboarding.country') }}</label>
              <select v-model="country" :disabled="isLoading" class="form-input form-select">
                <option v-for="c in countries" :key="c.code" :value="c.code">
                  {{ t(c.nameKey) }}
                </option>
              </select>
            </div>
          </PpFadeUp>

          <PpFadeUp :delay="0.3">
            <div class="field">
              <label class="field-label">{{ t('onboarding.vatNumber') }}</label>
              <input
                v-model.trim="vatNumber"
                type="text"
                :disabled="isLoading"
                :placeholder="vatPlaceholder"
                :class="inputClass(vatError)"
                @input="vatError = ''"
                @blur="runLookup"
              />
              <!-- VIES lookup status -->
              <p v-if="vatError" class="field-error">{{ vatError }}</p>
              <p v-else-if="vatStatus === 'checking'" class="vat-status vat-status--checking">
                {{ t('onboarding.vatChecking') }}
              </p>
              <p v-else-if="vatStatus === 'found'" class="vat-status vat-status--found">
                {{ t('onboarding.vatFound', { name: legalName }) }}
              </p>
              <p v-else-if="vatStatus === 'unverified'" class="vat-status vat-status--unverified">
                {{ t('onboarding.vatUnverified') }}
              </p>
              <p v-else class="field-hint">
                {{ t('onboarding.vatHint', { example: vatPlaceholder }) }}
              </p>
            </div>
          </PpFadeUp>

          <!-- Company details: revealed once the VAT number resolves -->
          <PpFadeUp v-if="showCompanyDetails" :delay="0.04">
            <div class="company-details">
              <div v-if="showReviewWarning" class="review-warning">
                {{ t('onboarding.reviewWarning') }}
              </div>

              <div v-if="legalName" class="field">
                <label class="field-label">{{ t('onboarding.legalName') }}</label>
                <input
                  :value="legalName"
                  type="text"
                  disabled
                  class="form-input form-input--default form-input--readonly"
                />
                <p class="field-hint">{{ t('onboarding.legalNameHint') }}</p>
              </div>

              <div class="field">
                <label class="field-label">{{ t('onboarding.clubName') }}</label>
                <input
                  v-model.trim="clubName"
                  type="text"
                  :disabled="isLoading"
                  :class="inputClass(clubNameError)"
                  @input="clubNameError = ''"
                />
                <p v-if="clubNameError" class="field-error">{{ clubNameError }}</p>
                <p v-else class="field-hint">{{ t('onboarding.clubNameHint') }}</p>
              </div>

              <div class="field">
                <label class="field-label">{{ t('onboarding.address') }}</label>
                <input
                  v-model.trim="address"
                  type="text"
                  autocomplete="street-address"
                  :disabled="isLoading"
                  :class="inputClass(addressError)"
                  @input="addressError = ''"
                />
                <p v-if="addressError" class="field-error">{{ addressError }}</p>
              </div>

              <div class="field-row">
                <div class="field field--postal">
                  <label class="field-label">{{ t('onboarding.postalCode') }}</label>
                  <input
                    v-model.trim="postalCode"
                    type="text"
                    autocomplete="postal-code"
                    :disabled="isLoading"
                    :class="inputClass(postalCodeError)"
                    @input="postalCodeError = ''"
                  />
                  <p v-if="postalCodeError" class="field-error">{{ postalCodeError }}</p>
                </div>
                <div class="field field--city">
                  <label class="field-label">{{ t('onboarding.city') }}</label>
                  <input
                    v-model.trim="city"
                    type="text"
                    autocomplete="address-level2"
                    :disabled="isLoading"
                    :class="inputClass(cityError)"
                    @input="cityError = ''"
                  />
                  <p v-if="cityError" class="field-error">{{ cityError }}</p>
                </div>
              </div>
            </div>
          </PpFadeUp>

          <PpFadeUp :delay="0.4">
            <p v-if="formError" class="form-error">{{ formError }}</p>
            <PpButton
              type="submit"
              block
              size="lg"
              :loading="isLoading"
              :disabled="!isFormValid || isLoading"
            >
              {{ isLoading ? t('status.loading') : t('onboarding.createClub') }}
            </PpButton>
          </PpFadeUp>

          <PpFadeUp :delay="0.44">
            <p class="login-prompt">
              {{ t('auth.alreadyHaveAccount') }}
              <NuxtLink to="/login" class="login-link">{{ t('auth.login') }}</NuxtLink>
            </p>
          </PpFadeUp>
        </form>
      </div>
    </PpFadeUp>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  title: 'auth.createAccount',
})

import { ref, computed, watch } from 'vue'
import { useAuthStore, type OnboardClubInput } from '~/stores/useAuthStore'
import { ONBOARDING_COUNTRIES, isValidVatFormat, normalizeVat, vatExample } from '~/utils/vat'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { register, isLoading } = authStore

// Already signed in → leave onboarding
watch(
  () => authStore.isAuthenticated,
  (authenticated) => {
    if (authenticated) {
      const redirectTo = (route.query.redirect as string) || '/'
      router.replace(redirectTo)
    }
  },
  { immediate: true },
)

const countries = ONBOARDING_COUNTRIES

// Account
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)

// Club
const clubName = ref('')
const country = ref('BE')
const address = ref('')
const postalCode = ref('')
const city = ref('')
const vatNumber = ref('')

// Errors
const firstNameError = ref('')
const lastNameError = ref('')
const emailError = ref('')
const passwordError = ref('')
const clubNameError = ref('')
const addressError = ref('')
const postalCodeError = ref('')
const cityError = ref('')
const vatError = ref('')
const formError = ref('')

// VIES lookup state
type VatStatus = 'idle' | 'checking' | 'found' | 'notfound' | 'unverified'
const vatStatus = ref<VatStatus>('idle')
// Official/legal name from the registry, shown read-only for confirmation.
const legalName = ref('')
// Whether the looked-up company looks like a non-profit (ASBL/VZW). When a
// real company is found but isn't one, the club can still register but is
// flagged for review.
const nonProfit = ref(true)

// Company-detail fields appear once the VAT number resolves (found, or VIES
// unreachable so the user fills them in manually). Hidden while idle/checking
// or when the number isn't a real company.
const showCompanyDetails = computed(
  () => vatStatus.value === 'found' || vatStatus.value === 'unverified',
)

// Show the "will be reviewed" notice when a real company is found that doesn't
// look like a non-profit.
const showReviewWarning = computed(() => vatStatus.value === 'found' && !nonProfit.value)

const vatPlaceholder = computed(() => vatExample(country.value))
const inputClass = (error: string) => [
  'form-input',
  error ? 'form-input--error' : 'form-input--default',
]

const validateEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const validatePassword = (value: string): boolean =>
  value.length >= 8 && /[a-zA-Z]/.test(value) && /\d/.test(value)

// "found" (real company) or "unverified" (VIES down → soft pass) both unblock
// submit; "notfound"/"checking"/"idle" keep it disabled.
const vatVerified = computed(() => vatStatus.value === 'found' || vatStatus.value === 'unverified')

const isFormValid = computed(
  () =>
    !!firstName.value &&
    !!lastName.value &&
    validateEmail(email.value) &&
    validatePassword(password.value) &&
    !!clubName.value &&
    !!address.value &&
    !!postalCode.value &&
    !!city.value &&
    isValidVatFormat(country.value, vatNumber.value) &&
    vatVerified.value,
)

// Verify the company against VIES once the format is valid.
const runLookup = async () => {
  vatError.value = ''
  if (!vatNumber.value) {
    vatStatus.value = 'idle'
    return
  }
  if (!isValidVatFormat(country.value, vatNumber.value)) {
    vatStatus.value = 'idle'
    vatError.value = t('onboarding.vatInvalid', { example: vatPlaceholder.value })
    return
  }

  const queriedCountry = country.value
  const queriedNumber = normalizeVat(country.value, vatNumber.value)
  vatStatus.value = 'checking'
  legalName.value = ''
  nonProfit.value = true

  try {
    const res = await GqlLookupCompany({ country: queriedCountry, vatNumber: queriedNumber })

    // Stale-response guard: ignore if the field changed while in-flight
    if (
      country.value !== queriedCountry ||
      normalizeVat(country.value, vatNumber.value) !== queriedNumber
    ) {
      return
    }

    const lookup = res?.lookupCompany
    if (lookup?.available && lookup.valid) {
      vatStatus.value = 'found'
      legalName.value = lookup.name || ''
      nonProfit.value = !!lookup.nonProfit
      // Autofill empty fields from the registry (user can still edit). The
      // displayed club name defaults to the legal name but is theirs to change.
      if (!clubName.value && lookup.name) clubName.value = lookup.name
      if (!address.value && lookup.street) address.value = lookup.street
      if (!postalCode.value && lookup.postalCode) postalCode.value = lookup.postalCode
      if (!city.value && lookup.city) city.value = lookup.city
    } else if (lookup?.available && !lookup.valid) {
      vatStatus.value = 'notfound'
      vatError.value = t('onboarding.vatNotFound')
    } else {
      vatStatus.value = 'unverified'
    }
  } catch {
    vatStatus.value = 'unverified'
  }
}

// Re-verify when the country changes (different format + registry)
watch(country, () => {
  if (vatNumber.value) {
    runLookup()
  } else {
    vatStatus.value = 'idle'
    vatError.value = ''
    legalName.value = ''
  }
})

const validateAll = (): boolean => {
  firstNameError.value = firstName.value ? '' : t('onboarding.required')
  lastNameError.value = lastName.value ? '' : t('onboarding.required')
  emailError.value = !email.value
    ? t('auth.emailRequired')
    : !validateEmail(email.value)
      ? t('auth.emailInvalid')
      : ''
  passwordError.value = !password.value
    ? t('auth.passwordRequired')
    : !validatePassword(password.value)
      ? t('onboarding.passwordWeak')
      : ''
  clubNameError.value = clubName.value ? '' : t('onboarding.required')
  addressError.value = address.value ? '' : t('onboarding.required')
  postalCodeError.value = postalCode.value ? '' : t('onboarding.required')
  cityError.value = city.value ? '' : t('onboarding.required')
  if (!vatNumber.value) {
    vatError.value = t('onboarding.required')
  } else if (!isValidVatFormat(country.value, vatNumber.value)) {
    vatError.value = t('onboarding.vatInvalid', { example: vatPlaceholder.value })
  } else if (vatStatus.value === 'notfound') {
    vatError.value = t('onboarding.vatNotFound')
  }

  return (
    !firstNameError.value &&
    !lastNameError.value &&
    !emailError.value &&
    !passwordError.value &&
    !clubNameError.value &&
    !addressError.value &&
    !postalCodeError.value &&
    !cityError.value &&
    !vatError.value
  )
}

const handleSubmit = async () => {
  formError.value = ''
  if (!validateAll()) return

  // The company must have been verified (or VIES unreachable). If still idle,
  // run the lookup now and bail so the user sees the result before submitting.
  if (vatStatus.value === 'idle' || vatStatus.value === 'checking') {
    await runLookup()
    if (!vatVerified.value) return
  }

  const input: OnboardClubInput = {
    firstName: firstName.value,
    lastName: lastName.value,
    email: email.value,
    password: password.value,
    clubName: clubName.value,
    country: country.value,
    address: address.value,
    city: city.value,
    postalCode: postalCode.value,
    vatNumber: vatNumber.value,
  }

  try {
    const user = await register(input)
    if (user) {
      await nextTick()
      await router.replace('/')
    } else {
      formError.value = t('onboarding.genericError')
    }
  } catch (err: unknown) {
    const e = err as { gqlErrors?: { message?: string }[]; message?: string }
    const message = String(e?.gqlErrors?.[0]?.message || e?.message || '').toLowerCase()
    if (message.includes('email')) {
      emailError.value = t('onboarding.emailTaken')
    } else if (message.includes('company') || message.includes('vat')) {
      vatError.value = t('onboarding.vatNotFound')
    } else {
      formError.value = t('onboarding.genericError')
    }
  }
}
</script>

<style scoped>
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--color-pp-text);
  -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.05) inset;
  transition: background-color 5000s ease-in-out 0s;
}

.onboarding-page {
  height: 100dvh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2.5rem 1.5rem;
  background-color: var(--color-pp-bg);
  position: relative;
  /* Tall form: scroll the page itself, but keep the decorative glow from
     spilling sideways. */
  overflow-y: auto;
  overflow-x: hidden;
}

.gold-glow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 540px;
  height: 540px;
  background-color: rgba(var(--pp-accent-rgb), 0.07);
  border-radius: 9999px;
  filter: blur(120px);
  pointer-events: none;
}

.grain-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    radial-gradient(at 0% 0%, rgba(var(--pp-accent-rgb), 0.06) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(var(--pp-accent-rgb), 0.04) 0px, transparent 50%);
}

.onboarding-card-wrap {
  width: 100%;
  max-width: 32rem;
  position: relative;
}

.onboarding-card {
  border-radius: var(--radius-2xl);
  padding: 2rem;
  box-shadow: var(--shadow-card);
}

@media (min-width: 768px) {
  .onboarding-card {
    padding: 2.5rem;
  }
}

.logo-section {
  text-align: center;
  margin-bottom: 1.75rem;
}

.logo-wrapper {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 0.875rem;
  border-radius: 9999px;
  background-color: #1a1b17;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem;
  box-shadow: 0 8px 32px rgba(var(--pp-accent-rgb), 0.25);
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
}

.app-title {
  margin-top: 0.5rem;
  font-family: var(--font-display);
  font-size: 1.875rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.05;
}

.subtitle {
  margin-top: 0.625rem;
  font-size: 0.9rem;
  color: var(--color-pp-text-muted);
}

.onboarding-form > * + * {
  margin-top: 1rem;
}

.section-heading {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--color-pp-text-dim);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-pp-border);
}

.section-heading--spaced {
  margin-top: 0.5rem;
}

.field-row {
  display: flex;
  gap: 0.875rem;
}

.field {
  flex: 1;
  min-width: 0;
}

.field--postal {
  flex: 0 0 38%;
}

.field--city {
  flex: 1;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-pp-text-muted);
  margin-bottom: 0.4rem;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 0.7rem 1rem;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid;
  border-radius: 0.75rem;
  color: var(--color-pp-text);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
  outline: none;
  font-family: inherit;
  font-size: 0.95rem;
}

.form-input::placeholder {
  color: var(--color-pp-text-dim);
}

.form-select {
  appearance: none;
  cursor: pointer;
}

/* Revealed company-detail block: its fields are wrapped in one PpFadeUp, so
   space them here (the form's child spacing only applies to the wrappers). */
.company-details > * + * {
  margin-top: 1rem;
}

/* "Will be reviewed" notice for non-ASBL companies. */
.review-warning {
  padding: 0.7rem 0.9rem;
  border-radius: 0.6rem;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-pp-gold-strong);
  background-color: rgba(var(--pp-accent-rgb), 0.08);
  border: 1px solid rgba(var(--pp-accent-rgb), 0.25);
}

/* Read-only official name pulled from the registry. */
.form-input--readonly {
  background-color: rgba(255, 255, 255, 0.03);
  color: var(--color-pp-text-muted);
  cursor: default;
}
.form-input--readonly:disabled {
  opacity: 1;
  -webkit-text-fill-color: var(--color-pp-text-muted);
}

.form-input--with-toggle {
  padding-right: 3.5rem;
}

.form-input--default {
  border-color: var(--color-pp-border-strong);
}
.form-input--default:hover {
  border-color: rgba(255, 255, 255, 0.2);
}
.form-input--error {
  border-color: rgba(239, 68, 68, 0.6);
}

.form-input:focus {
  box-shadow: 0 0 0 3px rgba(var(--pp-accent-rgb), 0.18);
  border-color: var(--color-pp-gold);
  background-color: rgba(255, 255, 255, 0.07);
}

.field-error {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: var(--color-pp-danger);
  padding-left: 0.25rem;
}

.field-hint {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: var(--color-pp-text-dim);
  padding-left: 0.25rem;
}

.vat-status {
  margin-top: 0.4rem;
  font-size: 0.78rem;
  padding-left: 0.25rem;
}
.vat-status--checking {
  color: var(--color-pp-text-muted);
}
.vat-status--found {
  color: var(--color-pp-gold);
  font-weight: 500;
}
.vat-status--unverified {
  color: var(--color-pp-text-dim);
}

.password-toggle {
  position: absolute;
  right: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-pp-text-dim);
  cursor: pointer;
  transition: color 0.15s ease;
  background: transparent;
  border: 0;
}
.password-toggle:hover {
  color: var(--color-pp-text);
}

.form-error {
  font-size: 0.8rem;
  color: var(--color-pp-danger);
  text-align: center;
  margin-bottom: 0.25rem;
}

.login-prompt {
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-pp-text-muted);
}

.login-link {
  color: var(--color-pp-gold);
  font-weight: 500;
  margin-left: 0.25rem;
}
.login-link:hover {
  color: var(--color-pp-gold-strong);
}
</style>
