import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * App theme (brand skin). Themes redefine the same `--color-pp-*` tokens
 * under `<html data-theme="...">`, so every pp-* utility, Ionic component and
 * tokenized accent glow follows automatically (see assets/css/main.css).
 *
 * `pocketpair` is the default and carries NO data-theme attribute (the
 * `:root` defaults apply); other themes set `data-theme` to their id.
 */
export type ThemeId = 'pocketpair' | 'vip' | 'clover'

export interface ThemeOption {
  id: ThemeId
  labelKey: string
  /** Accent swatch shown in the switcher. */
  swatch: string
}

export const THEMES: ThemeOption[] = [
  { id: 'pocketpair', labelKey: 'theme.pocketpair', swatch: '#fee78a' },
  { id: 'vip', labelKey: 'theme.vip', swatch: '#e11d2a' },
  { id: 'clover', labelKey: 'theme.clover', swatch: '#3aaa5c' },
]

export const useThemeStore = defineStore(
  'theme',
  () => {
    const theme = ref<ThemeId>('pocketpair')

    /** Reflect the current theme onto <html> (call after hydration + on change). */
    const apply = () => {
      if (typeof document === 'undefined') return
      const el = document.documentElement
      if (theme.value === 'pocketpair') el.removeAttribute('data-theme')
      else el.setAttribute('data-theme', theme.value)
    }

    const setTheme = (id: ThemeId) => {
      theme.value = id
      apply()
    }

    return { theme, setTheme, apply }
  },
  {
    persist: { pick: ['theme'] },
  },
)
