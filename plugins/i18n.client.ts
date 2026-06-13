import { createI18n } from 'vue-i18n'
import en from '~/i18n/locales/en.json'
import fr from '~/i18n/locales/fr.json'
import nl from '~/i18n/locales/nl.json'

export default defineNuxtPlugin(({ vueApp }) => {
  const i18n = createI18n({
    legacy: false, // to remove with next i18n version
    locale: 'fr',
    fallbackLocale: 'fr',
    messages: {
      en,
      fr,
      nl,
    },
  })

  vueApp.use(i18n)

  // Expose the instance so non-setup contexts (e.g. the global GraphQL error
  // handler plugin) can translate via `useNuxtApp().$i18n.global.t(...)`.
  return {
    provide: {
      i18n,
    },
  }
})
