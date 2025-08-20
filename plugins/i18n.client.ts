import { createI18n } from 'vue-i18n'
import en from '~/i18n/locales/en.json'
import fr from '~/i18n/locales/fr.json' 
import nl from '~/i18n/locales/nl.json'

export default defineNuxtPlugin(({ vueApp }) => {
  const i18n = createI18n({
    legacy: false, // Use Composition API mode
    globalInjection: true,
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      en,
      fr, 
      nl
    }
  })

  vueApp.use(i18n)
})