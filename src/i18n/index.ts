import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'

const localeModules = import.meta.glob(['./locales/*.json', '!./locales/en.json'], { eager: false }) as Record<
  string,
  () => Promise<{ default: Record<string, string> }>
>

// Build langId -> loader map so lookups are reliable regardless of glob key format
const localeLoaders = new Map<string, () => Promise<{ default: Record<string, string> }>>()
for (const [key, loader] of Object.entries(localeModules)) {
  const match = key.match(/\/([^/]+)\.json$/)
  if (match) localeLoaders.set(match[1], loader)
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    lng: 'en',
    fallbackLng: 'en',
    load: 'currentOnly',
    interpolation: { escapeValue: false },
  })

export async function loadLocale(langId: string): Promise<void> {
  if (langId === 'en') {
    await i18n.changeLanguage('en')
    return
  }
  const loader = localeLoaders.get(langId)
  if (loader) {
    const mod = await loader()
    i18n.addResourceBundle(langId, 'translation', mod.default, true, true)
    await i18n.changeLanguage(langId)
  } else {
    console.warn(`[i18n] No locale found for "${langId}". Available:`, [...localeLoaders.keys()])
  }
}

export default i18n
