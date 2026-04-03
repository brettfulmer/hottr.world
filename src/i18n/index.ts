import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'

const localeModules = import.meta.glob(['./locales/*.json', '!./locales/en.json'], { eager: false }) as Record<
  string,
  () => Promise<{ default: Record<string, string> }>
>

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export async function loadLocale(langId: string): Promise<void> {
  if (langId === 'en') {
    i18n.changeLanguage('en')
    return
  }
  const path = `./locales/${langId}.json`
  if (localeModules[path]) {
    const mod = await localeModules[path]()
    i18n.addResourceBundle(langId, 'translation', mod.default, true, true)
    i18n.changeLanguage(langId)
  }
}

export default i18n
