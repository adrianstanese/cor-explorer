#!/usr/bin/env node
/**
 * 🇷🇴 COR 2026 — One-Click Full Data Extraction
 * 
 * Downloads the official COR 2026 PDF and extracts ALL 4,500+ occupations
 * into a TSV file ready for database import.
 *
 * Usage:
 *   node scripts/extract-cor-data.mjs
 * 
 * Then import:
 *   npx tsx scripts/import-csv.ts prisma/data/cor_2026_full.tsv
 *
 * Source: ORD. MMFTSS/INS 2207/1607/2026 (MOR 1220/31.12.2025)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const PDF_URL = 'https://www.rauflorin.ro/legislatie/new/COR_2025.pdf';
const OUTPUT_TSV = path.join(__dirname, '..', 'prisma', 'data', 'cor_2026_full.tsv');
const TEMP_PDF = path.join(__dirname, '..', 'tmp', 'cor_2026.pdf');

// ─── Download file ───────────────────────────────────────────
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'COR-Explorer/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

// ─── Extract text from PDF using pdf-parse ───────────────────
async function extractText(pdfPath) {
  try {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(buffer);
    return data.text;
  } catch (e) {
    // Fallback: try python pymupdf
    const { execSync } = require('child_process');
    try {
      const pyScript = `
import fitz
doc = fitz.open("${pdfPath.replace(/\\/g, '/')}")
for page in doc:
    print(page.get_text())
doc.close()
`;
      return execSync(`python3 -c '${pyScript.replace(/'/g, "'\\''")}'`, {
        maxBuffer: 50 * 1024 * 1024,
        encoding: 'utf-8'
      });
    } catch (e2) {
      console.error('❌ Could not extract PDF text.');
      console.error('   Install one of:');
      console.error('     npm install pdf-parse');
      console.error('     pip install pymupdf');
      process.exit(1);
    }
  }
}

// ─── Parse occupations from text ─────────────────────────────
function parseOccupations(text) {
  const pattern = /(\d{6})\s+([A-Za-zăâîșțĂÂÎȘȚşţŞŢéèêàáãñüöïôûçß\/\-\(\)\.\,\' ]{2,})/g;
  const seen = new Map();
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const code = match[1];
    let name = match[2].trim();

    // Cut off at observation markers
    const markers = [
      'introdusa prin', 'Ocupatie introdusa', 'Ocupatie eliminata',
      'fosta ', 'ocupatie RECODIFICATA', 'ocupatia a fost',
      'denumirea initial', 'pozitie RADIATA', 'ocupatie RADIATA',
      'Fosta ', 'pozitia a fost', 'ocupatie eliminata',
      'a fost mutata', 'a fost RECODIFICATA', 'ORD. MM',
      'publicat in MOR', 'ocupatie introdusa'
    ];
    for (const marker of markers) {
      const idx = name.indexOf(marker);
      if (idx > 0) name = name.substring(0, idx).trim();
    }

    name = name.replace(/[\s.,;:\-\/]+$/, '');

    if (name.length < 2) continue;
    if (/radiata|eliminata|recodificata/i.test(name)) continue;

    if (!seen.has(code)) {
      seen.set(code, name);
    }
  }

  return [...seen.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, name]) => `${code}\t${name}`);
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log('🇷🇴 COR 2026 — Full Data Extraction\n');

  // Step 1: Download
  if (fs.existsSync(TEMP_PDF)) {
    console.log('📂 Using cached PDF...');
  } else {
    console.log(`📥 Downloading PDF from ${PDF_URL}...`);
    await download(PDF_URL, TEMP_PDF);
    const size = (fs.statSync(TEMP_PDF).size / 1024 / 1024).toFixed(1);
    console.log(`   ✓ Downloaded ${size} MB`);
  }

  // Step 2: Extract text
  console.log('📄 Extracting text...');
  const text = await extractText(TEMP_PDF);
  console.log(`   ✓ ${text.length.toLocaleString()} characters`);

  // Step 3: Parse
  console.log('🔍 Parsing occupations...');
  const entries = parseOccupations(text);
  console.log(`   ✓ ${entries.length} unique occupations found`);

  // Step 4: Save TSV
  const dir = path.dirname(OUTPUT_TSV);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT_TSV, entries.join('\n') + '\n', 'utf-8');
  console.log(`   ✓ Saved to ${OUTPUT_TSV}`);

  // Step 5: Summary
  console.log('\n✅ Done! Now import into database:');
  console.log('   npx tsx scripts/import-csv.ts prisma/data/cor_2026_full.tsv\n');
  
  // Show breakdown by grupa majora
  const groups = {};
  entries.forEach(e => {
    const g = e[0];
    groups[g] = (groups[g] || 0) + 1;
  });
  console.log('Breakdown by grupa majoră:');
  Object.entries(groups).sort().forEach(([g, count]) => {
    console.log(`  Grupa ${g}: ${count} ocupații`);
  });
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
