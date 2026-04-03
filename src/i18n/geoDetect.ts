import { languages, type Language } from '../data/languages-50'

// Build reverse map: country name -> highest-speakerCount language
// languages-50 is already sorted by speakerCount descending,
// so first match per country is the best one
function buildCountryToLangMap(): Map<string, Language> {
  const map = new Map<string, Language>()
  for (const lang of languages) {
    for (const country of lang.countries) {
      const normalized = country.replace(/\s*\(.*\)/, '').trim()
      if (!map.has(normalized)) {
        map.set(normalized, lang)
      }
    }
  }
  return map
}

const countryLangMap = buildCountryToLangMap()

export interface GeoResult {
  country: string
  language: Language
}

export async function detectUserCountry(): Promise<GeoResult | null> {
  try {
    const res = await fetch('https://ipwho.is/', {
      signal: AbortSignal.timeout(3000),
    })
    const data = await res.json()
    if (data.success !== false && data.country) {
      const lang = countryLangMap.get(data.country)
      if (lang) return { country: data.country, language: lang }
    }
    return null
  } catch {
    return null
  }
}
