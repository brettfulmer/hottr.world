/**
 * Rewrite dialect + whyThisCity for all 50 languages using Claude.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=your-key node scripts/rewrite-content.mjs
 *
 * Outputs a JSON file with the rewrites, then patches languages-50.ts.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_KEY = process.env.ANTHROPIC_API_KEY
if (!API_KEY) { console.error('Set ANTHROPIC_API_KEY'); process.exit(1) }

// Extract current language data
const tsPath = path.resolve(__dirname, '../src/data/languages-50.ts')
const tsContent = fs.readFileSync(tsPath, 'utf-8')

// Parse out the entries — extract id, name, city, dialect, whyThisCity
const entryRegex = /\{\s*id:"([^"]+)",\s*name:"([^"]+)",\s*city:"([^"]+)".*?dialect:"((?:[^"\\]|\\.)*)"\s*,\s*whyThisCity:"((?:[^"\\]|\\.)*)"/g
const entries = []
let match
while ((match = entryRegex.exec(tsContent)) !== null) {
  entries.push({
    id: match[1],
    name: match[2],
    city: match[3],
    oldDialect: match[4],
    oldWhy: match[5],
  })
}

console.log(`Found ${entries.length} languages to rewrite.\n`)

async function rewriteBatch(batch) {
  const langList = batch.map(e =>
    `- ${e.name} (${e.city}) [id: ${e.id}]`
  ).join('\n')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: `You're writing content for DANCEFLOOR — a world-first commercial dance track recorded in 50 languages across 50 cities. This is a premium music experience site.

For each language below, write two fields:

**dialect**: A fascinating, punchy insight about THIS specific dialect/version of the language. Something surprising that makes people want to tell their friends. Should feel like insider knowledge from someone who's been to those clubs. 2-3 sentences max. No dry linguistics — make it visceral and interesting.

**whyThisCity**: Why this exact city and its nightlife scene was chosen for this version of the track. What does the dancefloor FEEL like there? Make people want to visit. 2-3 sentences max. Tie it specifically to the music/club culture of that city.

RULES:
- No truncation — every entry must be a complete thought
- No "..." endings
- Escape any double quotes with backslash
- Be specific — name real venues, neighborhoods, local slang
- Write like a music journalist, not a textbook
- Keep each field under 250 characters
- Return ONLY valid JSON array — no markdown, no code fences

Languages:
${langList}

Return a JSON array of objects with: id, dialect, whyThisCity`
      }],
    }),
  })

  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  const text = data.content[0].text.trim()
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  return JSON.parse(cleaned)
}

async function main() {
  // Process in batches of 10 to stay within token limits
  const batchSize = 10
  const allResults = []

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize)
    console.log(`Rewriting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(entries.length/batchSize)}: ${batch.map(e => e.id).join(', ')}`)

    try {
      const results = await rewriteBatch(batch)
      allResults.push(...results)
      console.log(`  Done (${results.length} entries)`)
    } catch (err) {
      console.error(`  FAILED: ${err.message}`)
      // Keep old values for failed batch
      for (const e of batch) {
        allResults.push({ id: e.id, dialect: e.oldDialect, whyThisCity: e.oldWhy })
      }
    }

    await new Promise(r => setTimeout(r, 1500))
  }

  // Now patch the TypeScript file
  let patched = tsContent
  for (const result of allResults) {
    const entry = entries.find(e => e.id === result.id)
    if (!entry) continue

    // Escape for TypeScript string
    const newDialect = result.dialect.replace(/"/g, '\\"')
    const newWhy = result.whyThisCity.replace(/"/g, '\\"')

    // Replace old dialect
    patched = patched.replace(
      `dialect:"${entry.oldDialect}"`,
      `dialect:"${newDialect}"`
    )
    // Replace old whyThisCity
    patched = patched.replace(
      `whyThisCity:"${entry.oldWhy}"`,
      `whyThisCity:"${newWhy}"`
    )
  }

  fs.writeFileSync(tsPath, patched)
  console.log(`\nPatched ${allResults.length} entries in languages-50.ts`)

  // Also save raw JSON for reference
  const jsonPath = path.resolve(__dirname, 'content-rewrites.json')
  fs.writeFileSync(jsonPath, JSON.stringify(allResults, null, 2))
  console.log(`Saved raw JSON to scripts/content-rewrites.json`)
}

main().catch(console.error)
