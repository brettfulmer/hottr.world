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
  let lang = countryLangMap.get(country)
  if (lang) return lang
  for (const [key, val] of countryLangMap) {
    if (key.toLowerCase() === country.toLowerCase()) return val
  }
  return undefined
}

// APIs tested to work from production HTTPS with CORS
async function tryIpApiCo(): Promise<{ country: string } | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    if (data.country_name) return { country: data.country_name }
  } catch { /* fall through */ }
  return null
}

async function tryCountryIs(): Promise<{ country: string } | null> {
  try {
    const res = await fetch('https://api.country.is', { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    if (data.country) {
      // Returns ISO code (AU, US, etc) — need to map to full name
      const codeMap: Record<string, string> = {
        AU:'Australia', US:'United States of America', GB:'United Kingdom',
        CA:'Canada', NZ:'New Zealand', IE:'Ireland', ZA:'South Africa',
        NG:'Nigeria', IN:'India', PH:'Philippines', SG:'Singapore',
        CN:'China', TW:'Taiwan', MY:'Malaysia', JP:'Japan', KR:'South Korea',
        ID:'Indonesia', TH:'Thailand', VN:'Vietnam', HK:'Hong Kong',
        BD:'Bangladesh', PK:'Pakistan', NP:'Nepal', LK:'Sri Lanka',
        EG:'Egypt', SA:'Saudi Arabia', IQ:'Iraq', JO:'Jordan', LB:'Lebanon',
        AE:'UAE', KW:'Kuwait', IR:'Iran', AF:'Afghanistan', TJ:'Tajikistan',
        FR:'France', BE:'Belgium', CH:'Switzerland', HT:'Haiti', SN:'Senegal',
        CM:'Cameroon', MG:'Madagascar', DE:'Germany', AT:'Austria',
        LI:'Liechtenstein', LU:'Luxembourg', MX:'Mexico', BR:'Brazil',
        PT:'Portugal', AO:'Angola', MZ:'Mozambique', CV:'Cape Verde',
        TL:'East Timor', RU:'Russia', BY:'Belarus', KZ:'Kazakhstan',
        KG:'Kyrgyzstan', UA:'Ukraine', PL:'Poland', RO:'Romania',
        MD:'Moldova', NL:'Netherlands', SR:'Suriname', SE:'Sweden',
        FI:'Finland', NO:'Norway', DK:'Denmark', GR:'Greece', CY:'Cyprus',
        TR:'Turkey', IL:'Israel', IT:'Italy', SM:'San Marino',
        ES:'Spain', AD:'Andorra', RS:'Serbia', BA:'Bosnia and Herzegovina',
        ME:'Montenegro', HR:'Croatia', CO:'Colombia', AR:'Argentina',
        UY:'Uruguay', CL:'Chile', PE:'Peru', VE:'Venezuela', EC:'Ecuador',
        KE:'Kenya', TZ:'Tanzania', UG:'Uganda', RW:'Rwanda', BI:'Burundi',
        ET:'Ethiopia', GH:'Ghana', NE:'Niger', TD:'Chad', BJ:'Benin',
        TG:'Togo', MA:'Morocco', DZ:'Algeria', TN:'Tunisia', LY:'Libya',
        MR:'Mauritania', MM:'Myanmar', BN:'Brunei', SZ:'Eswatini',
        LS:'Lesotho', NA:'Namibia', BW:'Botswana', FJ:'Fiji',
        MU:'Mauritius', TT:'Trinidad and Tobago', PS:'Palestine',
        SY:'Syria',
      }
      const name = codeMap[data.country]
      if (name) return { country: name }
    }
  } catch { /* fall through */ }
  return null
}

async function tryIpInfo(): Promise<{ country: string } | null> {
  try {
    const res = await fetch('https://ipinfo.io/json', { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    if (data.country) {
      // Also returns ISO code — reuse same approach
      const res2 = await tryCountryIs() // reuse the code map logic
      if (res2) return res2
    }
  } catch { /* fall through */ }
  return null
}

export async function detectUserCountry(): Promise<GeoResult | null> {
  // Try APIs in order — all support CORS from HTTPS origins
  const result = await tryIpApiCo() || await tryCountryIs()

  if (result) {
    const lang = matchCountry(result.country)
    if (lang) return { country: result.country, language: lang }
  }

  return null
}
