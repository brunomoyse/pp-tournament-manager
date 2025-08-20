import { useI18n as useVueI18n } from 'vue-i18n'

export const useI18n = () => {
  const { t, locale, availableLocales } = useVueI18n()
  
  const switchLanguage = (lang: string) => {
    locale.value = lang
    if (process.client) {
      localStorage.setItem('locale', lang)
    }
  }

  // Load saved locale on mount
  if (process.client) {
    const savedLocale = localStorage.getItem('locale')
    if (savedLocale && availableLocales.includes(savedLocale)) {
      locale.value = savedLocale
    }
  }

  return {
    t,
    locale,
    switchLanguage,
    availableLocales
  }
}