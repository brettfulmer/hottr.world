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

function matchCountry(country: string): Language | undefined {
  // Exact match first
  let lang = countryLangMap.get(country)
  if (lang) return lang
  // Case-insensitive fallback
  for (const [key, val] of countryLangMap) {
    if (key.toLowerCase() === country.toLowerCase()) return val
  }
  return undefined
}

async function tryIpwhoIs(): Promise<{ country: string } | null> {
  try {
    const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    if (data.success !== false && data.country) return { country: data.country }
  } catch { /* fall through */ }
  return null
}

async function tryFreeIpApi(): Promise<{ country: string } | null> {
  try {
    const res = await fetch('https://freeipapi.com/api/json/', { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    if (data.countryName) return { country: data.countryName }
  } catch { /* fall through */ }
  return null
}

async function tryIpApi(): Promise<{ country: string } | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    if (data.country_name) return { country: data.country_name }
  } catch { /* fall through */ }
  return null
}

export async function detectUserCountry(): Promise<GeoResult | null> {
  // Try multiple APIs with fallback
  const result = await tryIpwhoIs() || await tryFreeIpApi() || await tryIpApi()

  if (result) {
    const lang = matchCountry(result.country)
    if (lang) return { country: result.country, language: lang }
  }

  return null
}
