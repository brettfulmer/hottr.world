/**
 * Generate translation JSON files for all 50 DANCEFLOOR languages.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=your-key node scripts/generate-translations.mjs
 *
 * Uses Claude to translate — handles ALL languages including Kriol,
 * Nigerian Pidgin, dialect-specific variants (Egyptian vs Levantine Arabic, etc.)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales')

const API_KEY = process.env.ANTHROPIC_API_KEY
if (!API_KEY) {
  console.error('Error: Set ANTHROPIC_API_KEY environment variable')
  process.exit(1)
}

// Language metadata for Claude's translation context
const LANG_INFO = {
  zh: { name: 'Mandarin Chinese', script: 'Simplified Chinese characters', note: 'Mainland Chinese, casual register' },
  hi: { name: 'Hindi', script: 'Devanagari', note: 'Mumbai spoken Hindi, casual' },
  'ar-eg': { name: 'Egyptian Arabic', script: 'Arabic', note: 'Cairo dialect, NOT Modern Standard Arabic' },
  fr: { name: 'French', script: 'Latin', note: 'Parisian French, casual spoken register' },
  bn: { name: 'Bengali', script: 'Bengali', note: 'Dhaka Bengali, conversational' },
  ru: { name: 'Russian', script: 'Cyrillic', note: 'Moscow spoken Russian, casual' },
  ur: { name: 'Urdu', script: 'Nastaliq/Arabic', note: 'Karachi Urdu, casual' },
  'pt-br': { name: 'Brazilian Portuguese', script: 'Latin', note: 'São Paulo Brazilian, casual with contractions' },
  id: { name: 'Indonesian', script: 'Latin', note: 'Casual bahasa gaul, not formal' },
  de: { name: 'German', script: 'Latin', note: 'Berlin spoken German, casual' },
  'es-mx': { name: 'Mexican Spanish', script: 'Latin', note: 'Mexico City casual, use Mexican vocabulary' },
  ja: { name: 'Japanese', script: 'Japanese (kanji/hiragana/katakana)', note: 'Casual Tokyo Japanese' },
  pn: { name: 'Punjabi', script: 'Gurmukhi', note: 'Chandigarh Punjabi' },
  fa: { name: 'Farsi', script: 'Arabic/Persian', note: 'Tehran colloquial Farsi, not formal literary Persian' },
  sw: { name: 'Swahili', script: 'Latin', note: 'Nairobi street Swahili' },
  'ar-ma': { name: 'Moroccan Arabic (Darija)', script: 'Arabic', note: 'Casablanca Darija, NOT Eastern Arabic' },
  vi: { name: 'Vietnamese', script: 'Latin with diacritics', note: 'Southern Vietnamese (Saigon)' },
  yue: { name: 'Cantonese', script: 'Traditional Chinese characters', note: 'Hong Kong Cantonese, casual' },
  tr: { name: 'Turkish', script: 'Latin', note: 'Istanbul spoken Turkish' },
  tl: { name: 'Tagalog', script: 'Latin', note: 'Manila Taglish — natural English code-switching is OK' },
  ta: { name: 'Tamil', script: 'Tamil', note: 'Chennai spoken Tamil, casual' },
  ko: { name: 'Korean', script: 'Hangul', note: 'Seoul casual banmal register' },
  ha: { name: 'Hausa', script: 'Latin with hooked letters', note: 'Kano Hausa, use proper hooked letter orthography' },
  pcm: { name: 'Nigerian Pidgin', script: 'Latin', note: 'Lagos street Pidgin as spoken in clubs' },
  it: { name: 'Italian', script: 'Latin', note: 'Milanese casual Italian' },
  th: { name: 'Thai', script: 'Thai', note: 'Bangkok spoken Thai, casual' },
  am: { name: 'Amharic', script: "Ge'ez (Ethiopic)", note: 'Addis Ababa spoken Amharic, casual' },
  'es-co': { name: 'Colombian Spanish', script: 'Latin', note: 'Medellín paisa register' },
  yo: { name: 'Yoruba', script: 'Latin with tonal marks', note: 'Lagos spoken Yoruba with full tonal marks' },
  'es-es': { name: 'Madrid Spanish (Castilian)', script: 'Latin', note: 'Madrid Castilian with distinción' },
  pl: { name: 'Polish', script: 'Latin', note: 'Warsaw spoken Polish, casual' },
  'es-ar': { name: 'Argentine Spanish', script: 'Latin', note: 'Buenos Aires voseo' },
  my: { name: 'Burmese', script: 'Burmese', note: 'Yangon casual spoken Burmese' },
  uk: { name: 'Ukrainian', script: 'Cyrillic', note: 'Kyiv spoken Ukrainian' },
  'ar-lv': { name: 'Levantine Arabic', script: 'Arabic', note: 'Beirut/Damascus dialect, NOT Egyptian' },
  ms: { name: 'Malay', script: 'Latin', note: 'Kuala Lumpur spoken Malay, distinct from Indonesian' },
  zu: { name: 'Zulu', script: 'Latin', note: 'Durban spoken Zulu' },
  ro: { name: 'Romanian', script: 'Latin', note: 'Bucharest casual Romanian' },
  nl: { name: 'Dutch', script: 'Latin', note: 'Amsterdam spoken Dutch' },
  'es-cl': { name: 'Chilean Spanish', script: 'Latin', note: 'Santiago Chilean with local slang' },
  he: { name: 'Hebrew', script: 'Hebrew', note: 'Tel Aviv spoken Modern Hebrew, not biblical' },
  el: { name: 'Greek', script: 'Greek', note: 'Athenian modern demotic Greek' },
  sv: { name: 'Swedish', script: 'Latin', note: 'Stockholm spoken Swedish' },
  sr: { name: 'Serbian', script: 'Latin (not Cyrillic)', note: 'Belgrade casual Serbian in Latin script' },
  ca: { name: 'Catalan', script: 'Latin', note: 'Central Catalan (Barcelona), NOT Spanish' },
  'pt-eu': { name: 'European Portuguese', script: 'Latin', note: 'Lisbon Portuguese, NOT Brazilian' },
  af: { name: 'Afrikaans', script: 'Latin', note: 'Johannesburg casual Afrikaans' },
  ga: { name: 'Irish Gaelic', script: 'Latin', note: 'Modern spoken Irish, not archaic' },
  kriol: { name: 'Kriol', script: 'Latin', note: 'Australian Kriol — English-lexified creole with its own grammar, NOT English' },
}

const ALL_LANG_IDS = Object.keys(LANG_INFO)

async function translateBatch(enJson, langId, langInfo) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Translate the following JSON values from English into ${langInfo.name}.

CRITICAL RULES:
- Use ${langInfo.script} script
- ${langInfo.note}
- This is for a music/club website — keep the tone energetic, modern, casual
- Preserve all {{interpolation}} placeholders exactly as-is (e.g. {{language}}, {{country}}, {{city}})
- Return ONLY valid JSON — no markdown, no explanation, no code fences
- Keep the same JSON keys, only translate the values
- For short UI labels (like "D", "H", "M", "S" for countdown), use the appropriate abbreviation in the target language

Source JSON:
${JSON.stringify(enJson, null, 2)}`
      }],
    }),
  })

  const data = await res.json()
  if (data.error) throw new Error(data.error.message)

  const text = data.content[0].text.trim()
  // Strip any accidental code fences
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  return JSON.parse(cleaned)
}

async function main() {
  const enPath = path.join(LOCALES_DIR, 'en.json')
  const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'))

  console.log(`Source: ${Object.keys(en).length} keys from en.json`)
  console.log(`Translating into ${ALL_LANG_IDS.length} languages using Claude...\n`)

  let success = 0, failed = 0

  for (const langId of ALL_LANG_IDS) {
    const info = LANG_INFO[langId]
    const outPath = path.join(LOCALES_DIR, `${langId}.json`)

    try {
      const translated = await translateBatch(en, langId, info)

      // Verify all keys present
      for (const key of Object.keys(en)) {
        if (!(key in translated)) translated[key] = en[key]
      }

      fs.writeFileSync(outPath, JSON.stringify(translated, null, 2))
      console.log(`  ✓ ${langId}.json  (${info.name})`)
      success++
    } catch (err) {
      // Fallback: write English with flag
      const fallback = { ...en, _untranslated: true }
      fs.writeFileSync(outPath, JSON.stringify(fallback, null, 2))
      console.log(`  ✗ ${langId}.json  FAILED: ${err.message}`)
      failed++
    }

    // Rate limit: ~1 req/sec to stay well within limits
    await new Promise(r => setTimeout(r, 1200))
  }

  console.log(`\nDone! ${success} translated, ${failed} failed.`)
}

main().catch(console.error)
