// Per-country VAT / enterprise-number formats for self-serve club onboarding.
// The same rules are enforced server-side in pp-service
// (gql/domains/clubs/service.rs); keep the two in sync.

export type CountryCode = 'BE' | 'FR' | 'LU' | 'NL'

export interface CountryOption {
  code: CountryCode
  /** i18n key for the localized country name (e.g. `countries.BE`). */
  nameKey: string
  /** Example VAT number shown as helper text. */
  example: string
}

// Belgium first (preselected default), then the other supported countries.
export const ONBOARDING_COUNTRIES: CountryOption[] = [
  { code: 'BE', nameKey: 'countries.BE', example: 'BE0123456789' },
  { code: 'FR', nameKey: 'countries.FR', example: 'FR12345678901' },
  { code: 'LU', nameKey: 'countries.LU', example: 'LU12345678' },
  { code: 'NL', nameKey: 'countries.NL', example: 'NL123456789B01' },
]

// Patterns match the *bare* national number (country prefix already stripped).
const VAT_PATTERNS: Record<CountryCode, RegExp> = {
  BE: /^[01]\d{9}$/, // 10 digits starting 0 or 1
  FR: /^[0-9A-Z]{2}\d{9}$/, // 2 key chars + 9-digit SIREN
  LU: /^\d{8}$/, // 8 digits
  NL: /^\d{9}B\d{2}$/, // 9 digits + B + 2 digits
}

/** Strip non-alphanumerics, uppercase, and drop a leading country code. */
export function normalizeVat(country: string, value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const cc = country.toUpperCase()
  return cleaned.startsWith(cc) ? cleaned.slice(cc.length) : cleaned
}

/** Whether `value` is a syntactically valid VAT number for `country`. */
export function isValidVatFormat(country: string, value: string): boolean {
  const cc = country.toUpperCase() as CountryCode
  const pattern = VAT_PATTERNS[cc]
  if (!pattern) return false
  return pattern.test(normalizeVat(cc, value))
}

/** Example VAT number for the country, for helper text. */
export function vatExample(country: string): string {
  return ONBOARDING_COUNTRIES.find((c) => c.code === country.toUpperCase())?.example ?? ''
}
