#!/usr/bin/env node
/**
 * Compresses all gameplay_*.png files to WebP
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'public');

const pngs = fs.readdirSync(dir).filter(f => f.startsWith('gameplay_') && f.endsWith('.png'));
console.log(`Found ${pngs.length} gameplay PNGs to compress\n`);

for (const png of pngs) {
  const webp = png.replace('.png', '.webp');
  const webpPath = path.join(dir, webp);
  if (fs.existsSync(webpPath)) {
    console.log(`⏭  ${webp} already exists`);
    continue;
  }
  console.log(`🗜  Compressing ${png}...`);
  try {
    execSync(`npx sharp-cli -i "${path.join(dir, png)}" -o "${webpPath}" --quality 75`, { stdio: 'pipe' });
    const pngSize = (fs.statSync(path.join(dir, png)).size / 1024).toFixed(0);
    const webpSize = (fs.statSync(webpPath).size / 1024).toFixed(0);
    console.log(`   ✅ ${pngSize}KB → ${webpSize}KB`);
  } catch (e) {
    console.error(`   ❌ Failed: ${e.message}`);
  }
}
console.log('\nDone.');
