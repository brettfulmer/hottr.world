/**
 * Generate translation JSON files for all 50 DANCEFLOOR languages.
 *
 * Usage:
 *   GOOGLE_TRANSLATE_API_KEY=your-key node scripts/generate-translations.mjs
 *
 * Reads src/i18n/locales/en.json as source and writes one JSON per language
 * into src/i18n/locales/{id}.json.
 *
 * Languages not supported by Google Translate get the English copy
 * with an "_untranslated": true flag.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales')

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY
if (!API_KEY) {
  console.error('Error: Set GOOGLE_TRANSLATE_API_KEY environment variable')
  process.exit(1)
}

// Map our language IDs to Google Translate language codes
const LANG_MAP = {
  en: 'en',
  zh: 'zh-CN',
  hi: 'hi',
  'ar-eg': 'ar',
  fr: 'fr',
  bn: 'bn',
  ru: 'ru',
  ur: 'ur',
  'pt-br': 'pt',
  id: 'id',
  de: 'de',
  'es-mx': 'es',
  ja: 'ja',
  pn: 'pa',    // Punjabi
  fa: 'fa',
  sw: 'sw',
  'ar-ma': 'ar', // Maghrebi -> standard Arabic
  vi: 'vi',
  yue: 'zh-TW', // Cantonese -> Traditional Chinese (closest)
  tr: 'tr',
  tl: 'tl',    // Tagalog
  ta: 'ta',
  ko: 'ko',
  ha: 'ha',
  pcm: null,   // Nigerian Pidgin — unsupported
  it: 'it',
  th: 'th',
  am: 'am',    // Amharic
  'es-co': 'es',
  yo: 'yo',
  'es-es': 'es',
  pl: 'pl',
  'es-ar': 'es',
  my: 'my',    // Burmese
  uk: 'uk',    // Ukrainian
  'ar-lv': 'ar', // Levantine -> standard Arabic
  ms: 'ms',    // Malay
  zu: 'zu',    // Zulu
  ro: 'ro',
  nl: 'nl',
  'es-cl': 'es',
  he: 'he',
  el: 'el',
  sv: 'sv',
  sr: 'sr',    // Serbian
  ca: 'ca',    // Catalan
  'pt-eu': 'pt',
  af: 'af',    // Afrikaans
  ga: 'ga',    // Irish
  kriol: null, // unsupported
}

const ALL_LANG_IDS = Object.keys(LANG_MAP)

async function translateText(text, targetLang) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, target: targetLang, source: 'en', format: 'text' }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.data.translations[0].translatedText
}

async function main() {
  const enPath = path.join(LOCALES_DIR, 'en.json')
  const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'))
  const keys = Object.keys(en)

  console.log(`Source: ${keys.length} keys from en.json`)
  console.log(`Generating translations for ${ALL_LANG_IDS.length - 1} languages...\n`)

  for (const langId of ALL_LANG_IDS) {
    if (langId === 'en') continue

    const googleCode = LANG_MAP[langId]
    const outPath = path.join(LOCALES_DIR, `${langId}.json`)
    const translated = {}

    if (!googleCode) {
      // Unsupported — copy English with flag
      for (const key of keys) translated[key] = en[key]
      translated._untranslated = true
      fs.writeFileSync(outPath, JSON.stringify(translated, null, 2))
      console.log(`  ${langId}.json  (copied English — unsupported)`)
      continue
    }

    try {
      for (const key of keys) {
        translated[key] = await translateText(en[key], googleCode)
        // Respect rate limits
        await new Promise(r => setTimeout(r, 50))
      }
      fs.writeFileSync(outPath, JSON.stringify(translated, null, 2))
      console.log(`  ${langId}.json  OK`)
    } catch (err) {
      // On error, write what we have + English fallback for the rest
      for (const key of keys) {
        if (!translated[key]) translated[key] = en[key]
      }
      translated._untranslated = true
      fs.writeFileSync(outPath, JSON.stringify(translated, null, 2))
      console.log(`  ${langId}.json  PARTIAL (error: ${err.message})`)
    }

    // Brief pause between languages
    await new Promise(r => setTimeout(r, 100))
  }

  console.log('\nDone!')
}

main().catch(console.error)
