#!/usr/bin/env node
/**
 * Generates city gameplay backgrounds for all 50 tour stops
 * Uses OpenAI Images API (DALL-E 3)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'public');
const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }

const CITIES = [
  // Already have these 15 — will skip
  { file:'gameplay_melbourne', city:'Melbourne, Australia', landmarks:'Melbourne Arts Centre spire, Yarra River skyline, and Flinders Street Station dome' },
  { file:'gameplay_santiago', city:'Santiago, Chile', landmarks:'the Andes mountain range silhouette, Torre Entel tower, and Gran Torre Santiago' },
  { file:'gameplay_saopaulo', city:'São Paulo, Brazil', landmarks:'Edifício Itália, Octávio Frias de Oliveira cable-stayed bridge, and dense tropical skyline' },
  { file:'gameplay_cairo', city:'Cairo, Egypt', landmarks:'the Great Pyramids of Giza silhouette, Cairo Tower, and distant Nile waterfront' },
  { file:'gameplay_paris', city:'Paris, France', landmarks:'Eiffel Tower silhouette, Sacré-Cœur dome, and Parisian rooftop skyline' },
  { file:'gameplay_mumbai', city:'Mumbai, India', landmarks:'Gateway of India arch, Taj Mahal Palace hotel dome, and Mumbai skyline' },
  { file:'gameplay_shanghai', city:'Shanghai, China', landmarks:'Oriental Pearl Tower, Shanghai Tower, and Pudong skyline' },
  { file:'gameplay_berlin', city:'Berlin, Germany', landmarks:'Brandenburg Gate silhouette, Berlin TV Tower, and Reichstag dome' },
  { file:'gameplay_tokyo', city:'Tokyo, Japan', landmarks:'Tokyo Tower, Tokyo Skytree, and dense neon-lit skyline' },
  { file:'gameplay_seoul', city:'Seoul, South Korea', landmarks:'N Seoul Tower, Lotte World Tower, and traditional palace roofline' },
  { file:'gameplay_nairobi', city:'Nairobi, Kenya', landmarks:'KICC tower, Nairobi skyline, and distant acacia trees' },
  { file:'gameplay_istanbul', city:'Istanbul, Turkey', landmarks:'Hagia Sophia dome, Blue Mosque minarets, and Bosphorus waterfront' },
  { file:'gameplay_milan', city:'Milan, Italy', landmarks:'Milan Cathedral spires, Pirelli Tower, and Galleria arches' },
  { file:'gameplay_bangkok', city:'Bangkok, Thailand', landmarks:'Wat Arun spire, Grand Palace roofline, and Chao Phraya skyline' },
  { file:'gameplay_lagos', city:'Lagos, Nigeria', landmarks:'Lagos Island skyline, Third Mainland Bridge, and National Theatre dome' },
  // NEW 35 cities
  { file:'gameplay_johannesburg', city:'Johannesburg, South Africa', landmarks:'Hillbrow Tower, Nelson Mandela Bridge, and gold mine headframes on the horizon' },
  { file:'gameplay_addis_ababa', city:'Addis Ababa, Ethiopia', landmarks:'African Union headquarters, Meskel Square monument, and Entoto mountain silhouette' },
  { file:'gameplay_beirut', city:'Beirut, Lebanon', landmarks:'Raouche sea rocks, Mohammad Al-Amin Mosque blue dome, and Mediterranean coastline' },
  { file:'gameplay_casablanca', city:'Casablanca, Morocco', landmarks:'Hassan II Mosque minaret, Art Deco downtown skyline, and Atlantic waterfront' },
  { file:'gameplay_dhaka', city:'Dhaka, Bangladesh', landmarks:'National Parliament Building curves, Lalbagh Fort walls, and dense river city skyline' },
  { file:'gameplay_yangon', city:'Yangon, Myanmar', landmarks:'Shwedagon Pagoda golden spire, Sule Pagoda, and colonial-era downtown' },
  { file:'gameplay_hongkong', city:'Hong Kong', landmarks:'Victoria Peak skyline, Bank of China tower, and Victoria Harbour waterfront' },
  { file:'gameplay_barcelona', city:'Barcelona, Spain', landmarks:'Sagrada Família spires, Torre Agbar, and Mediterranean beachfront' },
  { file:'gameplay_amsterdam', city:'Amsterdam, Netherlands', landmarks:'canal houses silhouette, Rijksmuseum towers, and A\'DAM Lookout tower' },
  { file:'gameplay_tehran', city:'Tehran, Iran', landmarks:'Milad Tower, Azadi Tower arch, and Alborz mountain range' },
  { file:'gameplay_athens', city:'Athens, Greece', landmarks:'Parthenon on the Acropolis hill, Lycabettus Hill, and white city rooftops' },
  { file:'gameplay_kano', city:'Kano, Nigeria', landmarks:'Kano city walls, Great Mosque of Kano minaret, and Sahel savanna horizon' },
  { file:'gameplay_telaviv', city:'Tel Aviv, Israel', landmarks:'Bauhaus White City rooftops, Azrieli Center towers, and Mediterranean seafront' },
  { file:'gameplay_bali', city:'Bali, Indonesia', landmarks:'traditional Balinese temple gate (pura), rice terrace contours, and Mount Agung' },
  { file:'gameplay_dublin', city:'Dublin, Ireland', landmarks:'Ha\'penny Bridge, Custom House dome, and Georgian townhouse roofline' },
  { file:'gameplay_kualalumpur', city:'Kuala Lumpur, Malaysia', landmarks:'Petronas Twin Towers, KL Tower, and tropical city skyline' },
  { file:'gameplay_warsaw', city:'Warsaw, Poland', landmarks:'Palace of Culture and Science tower, Old Town market square spires' },
  { file:'gameplay_lisbon', city:'Lisbon, Portugal', landmarks:'Torre de Belém, 25 de Abril Bridge, and São Jorge Castle on the hill' },
  { file:'gameplay_chandigarh', city:'Chandigarh, India', landmarks:'Open Hand Monument, Capitol Complex, and Sukhna Lake waterfront' },
  { file:'gameplay_bucharest', city:'Bucharest, Romania', landmarks:'Palace of the Parliament facade, Romanian Athenaeum dome, and wide boulevards' },
  { file:'gameplay_moscow', city:'Moscow, Russia', landmarks:'Saint Basil\'s Cathedral domes, Kremlin towers, and Moscow City skyscrapers' },
  { file:'gameplay_belgrade', city:'Belgrade, Serbia', landmarks:'Kalemegdan Fortress walls, Church of Saint Sava dome, and confluence of Danube and Sava rivers' },
  { file:'gameplay_buenosaires', city:'Buenos Aires, Argentina', landmarks:'Obelisco monument, Casa Rosada facade, and Puente de la Mujer bridge' },
  { file:'gameplay_medellin', city:'Medellín, Colombia', landmarks:'metro cable cars, Botero Plaza, and Aburrá Valley mountain ridges' },
  { file:'gameplay_madrid', city:'Madrid, Spain', landmarks:'Royal Palace, Gran Vía buildings, and Cibeles fountain' },
  { file:'gameplay_mexicocity', city:'Mexico City, Mexico', landmarks:'Palacio de Bellas Artes dome, Torre Latinoamericana, and distant volcanoes' },
  { file:'gameplay_stockholm', city:'Stockholm, Sweden', landmarks:'Gamla Stan old town spires, Stockholm City Hall tower, and waterfront islands' },
  { file:'gameplay_manila', city:'Manila, Philippines', landmarks:'Manila Bay sunset skyline, San Agustin Church, and Makati skyscrapers' },
  { file:'gameplay_chennai', city:'Chennai, India', landmarks:'Kapaleeshwarar Temple gopuram, Marina Beach lighthouse, and colonial-era High Court' },
  { file:'gameplay_kyiv', city:'Kyiv, Ukraine', landmarks:'Saint Sophia Cathedral domes, Motherland Monument statue, and Dnipro River' },
  { file:'gameplay_karachi', city:'Karachi, Pakistan', landmarks:'Mazar-e-Quaid marble dome, Port Grand, and Arabian Sea waterfront skyline' },
  { file:'gameplay_hochiminh', city:'Ho Chi Minh City, Vietnam', landmarks:'Bitexco Financial Tower, Notre-Dame Cathedral, and dense motorbike-era skyline' },
  { file:'gameplay_durban', city:'Durban, South Africa', landmarks:'Moses Mabhida Stadium arch, Golden Mile beachfront, and uShaka Marine World' },
  { file:'gameplay_northern_australia', city:'Northern Australia', landmarks:'red desert outback, ancient rock formations, and vast starlit horizon with single boab tree' },
];

const PROMPT = (city, landmarks) =>
  `Design a premium vertical mobile game background for a disco-themed game world, rendered in a stylised Pixar-inspired 3D look. This is background art only with no people, no character, no text, no UI, and no gameplay elements. Use a black and deep plum base with hot pink #FF0CB6 accents, soft white and silver highlights, and a glossy pink-and-white disco dancefloor in the foreground. Include a disco ball at the top with soft diffused light rays. Keep a strong empty centre zone for gameplay readability. In the far distance, add subtle, stylised background-only landmark cues for ${city}, specifically ${landmarks}, rendered as soft rounded silhouettes with low contrast, partially obscured by haze, and fully integrated into the same premium animated world. The image should feel cinematic, glossy, playful, expensive, and cohesive, with soft reflections, smooth gradients, and no photoreal detail.`;

async function gen(city) {
  const webp = path.join(OUTPUT_DIR, `${city.file}.webp`);
  if (fs.existsSync(webp)) { console.log(`⏭  ${city.city} — exists`); return 'skipped'; }

  console.log(`🎨 ${city.city}...`);
  try {
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method:'POST', headers:{'Authorization':`Bearer ${API_KEY}`,'Content-Type':'application/json'},
      body: JSON.stringify({ model:'dall-e-3', prompt:PROMPT(city.city,city.landmarks), n:1, size:'1024x1792', quality:'standard', response_format:'b64_json' }),
    });
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    const d = await r.json();
    const buf = Buffer.from(d.data[0].b64_json, 'base64');
    fs.writeFileSync(path.join(OUTPUT_DIR, `${city.file}.png`), buf);
    console.log(`   ✅ ${(buf.length/1024).toFixed(0)}KB`);
    return 'generated';
  } catch(e) { console.error(`   ❌ ${e.message}`); return 'failed'; }
}

async function main() {
  console.log(`\n═══ Generating ${CITIES.length} city backgrounds ═══\n`);
  let generated=0, skipped=0, failed=0;
  for (const c of CITIES) {
    const r = await gen(c);
    if (r==='generated') { generated++; console.log('   ⏳ 12s...\n'); await new Promise(r=>setTimeout(r,12000)); }
    else if (r==='skipped') skipped++;
    else failed++;
  }
  console.log(`\n═══ Done: ${generated} generated, ${skipped} skipped, ${failed} failed ═══`);
}
main();
