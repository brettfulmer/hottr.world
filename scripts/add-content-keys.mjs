import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tsContent = fs.readFileSync(path.resolve(__dirname, '../src/data/languages-50.ts'), 'utf-8')
const enPath = path.resolve(__dirname, '../src/i18n/locales/en.json')
const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'))

const re = /id:"([^"]+)".*?dialect:"((?:[^"\\]|\\.)*)"\s*,\s*whyThisCity:"((?:[^"\\]|\\.)*)"/g
let m
let count = 0
while ((m = re.exec(tsContent)) !== null) {
  const id = m[1]
  const dialect = m[2].replace(/\\"/g, '"')
  const whyCity = m[3].replace(/\\"/g, '"')
  en[`dialect.${id}`] = dialect
  en[`whyCity.${id}`] = whyCity
  count++
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2))
console.log(`Added ${count} dialect + ${count} whyCity keys (${Object.keys(en).length} total keys)`)
