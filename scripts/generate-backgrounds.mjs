#!/usr/bin/env node
/**
 * Generates city gameplay backgrounds for Elaine's Dancefloor World Tour
 * Uses OpenAI Images API (DALL-E 3) with consistent art direction
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'public');
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error('OPENAI_API_KEY not set');
  process.exit(1);
}

// City landmark research
const CITIES = [
  // Melbourne already done — skip
  { file: 'gameplay_santiago', city: 'Santiago, Chile', landmarks: 'the Andes mountain range silhouette, Torre Entel tower, and Gran Torre Santiago skyscraper' },
  { file: 'gameplay_saopaulo', city: 'São Paulo, Brazil', landmarks: 'Edifício Itália tower, the Octávio Frias de Oliveira cable-stayed bridge, and a dense tropical skyline' },
  { file: 'gameplay_cairo', city: 'Cairo, Egypt', landmarks: 'the Great Pyramids of Giza silhouette, Cairo Tower, and a distant Nile waterfront' },
  { file: 'gameplay_paris', city: 'Paris, France', landmarks: 'the Eiffel Tower silhouette, Sacré-Cœur dome, and Parisian rooftop skyline' },
  { file: 'gameplay_mumbai', city: 'Mumbai, India', landmarks: 'the Gateway of India arch, Taj Mahal Palace hotel dome, and Mumbai high-rise skyline' },
  { file: 'gameplay_shanghai', city: 'Shanghai, China', landmarks: 'the Oriental Pearl Tower, Shanghai Tower, and Pudong skyline silhouette' },
  { file: 'gameplay_berlin', city: 'Berlin, Germany', landmarks: 'the Brandenburg Gate silhouette, Berlin TV Tower (Fernsehturm), and Reichstag dome' },
  { file: 'gameplay_tokyo', city: 'Tokyo, Japan', landmarks: 'Tokyo Tower, Tokyo Skytree, and a dense neon-lit skyline' },
  { file: 'gameplay_seoul', city: 'Seoul, South Korea', landmarks: 'N Seoul Tower on Namsan Mountain, Lotte World Tower, and traditional palace roofline' },
  { file: 'gameplay_nairobi', city: 'Nairobi, Kenya', landmarks: 'Kenyatta International Convention Centre tower, Nairobi skyline, and distant acacia tree silhouettes' },
  { file: 'gameplay_istanbul', city: 'Istanbul, Turkey', landmarks: 'Hagia Sophia dome, Blue Mosque minarets, and Bosphorus waterfront' },
  { file: 'gameplay_milan', city: 'Milan, Italy', landmarks: 'Milan Cathedral (Duomo) spires, Pirelli Tower, and Galleria Vittorio Emanuele arches' },
  { file: 'gameplay_bangkok', city: 'Bangkok, Thailand', landmarks: 'Wat Arun temple spire, Grand Palace roofline, and Chao Phraya River skyline' },
  { file: 'gameplay_lagos', city: 'Lagos, Nigeria', landmarks: 'Lagos Island skyline, Third Mainland Bridge, and Nigerian National Theatre dome' },
];

const MASTER_PROMPT = (city, landmarks) =>
  `Design a premium vertical mobile game background for a disco-themed game world, rendered in a stylised Pixar-inspired 3D look. This is background art only with no people, no character, no text, no UI, and no gameplay elements. Use a black and deep plum base with hot pink #FF0CB6 accents, soft white and silver highlights, and a glossy pink-and-white disco dancefloor in the foreground. Include a disco ball at the top with soft diffused light rays. Keep a strong empty centre zone for gameplay readability. In the far distance, add subtle, stylised background-only landmark cues for ${city}, specifically ${landmarks}, rendered as soft rounded silhouettes with low contrast, partially obscured by haze, and fully integrated into the same premium animated world. The image should feel cinematic, glossy, playful, expensive, and cohesive, with soft reflections, smooth gradients, and no photoreal detail.`;

async function generateImage(city) {
  const outputPath = path.join(OUTPUT_DIR, `${city.file}.png`);
  const webpPath = path.join(OUTPUT_DIR, `${city.file}.webp`);

  // Skip if WebP already exists
  if (fs.existsSync(webpPath)) {
    console.log(`⏭  ${city.city} — already exists, skipping`);
    return { city: city.city, status: 'skipped' };
  }

  const prompt = MASTER_PROMPT(city.city, city.landmarks);
  console.log(`🎨 Generating: ${city.city}...`);
  console.log(`   Landmarks: ${city.landmarks}`);

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1792', // portrait for mobile
        quality: 'standard',
        response_format: 'b64_json',
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const b64 = data.data[0].b64_json;
    const buffer = Buffer.from(b64, 'base64');

    // Save PNG
    fs.writeFileSync(outputPath, buffer);
    console.log(`   ✅ Saved PNG: ${city.file}.png (${(buffer.length / 1024).toFixed(0)}KB)`);

    return { city: city.city, file: city.file, landmarks: city.landmarks, prompt, status: 'generated' };
  } catch (err) {
    console.error(`   ❌ FAILED: ${city.city} — ${err.message}`);
    return { city: city.city, status: 'failed', error: err.message };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  Elaine\'s World Tour — Background Generator');
  console.log(`  ${CITIES.length} cities to process`);
  console.log('═══════════════════════════════════════════\n');

  const results = [];

  for (const city of CITIES) {
    const result = await generateImage(city);
    results.push(result);

    // Rate limit: wait 12s between calls (DALL-E 3 limit is ~5/min)
    if (result.status === 'generated') {
      console.log('   ⏳ Waiting 12s for rate limit...\n');
      await new Promise(r => setTimeout(r, 12000));
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════');
  const generated = results.filter(r => r.status === 'generated').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed = results.filter(r => r.status === 'failed').length;
  console.log(`  Generated: ${generated}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Failed:    ${failed}`);

  if (failed > 0) {
    console.log('\n  Failed cities:');
    results.filter(r => r.status === 'failed').forEach(r => console.log(`    - ${r.city}: ${r.error}`));
  }

  console.log('\n  Next step: run compress-backgrounds.mjs to convert PNGs to WebP');
}

main();
