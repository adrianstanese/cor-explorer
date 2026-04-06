/**
 * COR 2026 Full Data Scraper
 * 
 * Downloads the official COR 2026 PDF from rauflorin.ro and extracts all 4,500+ occupations.
 * Then imports them into the PostgreSQL database.
 *
 * Usage:
 *   npx tsx scripts/scrape-cor-pdf.ts
 *
 * Prerequisites:
 *   pip install pymupdf   (or: npm install pdf-parse)
 *   Database must be running with schema pushed (npx prisma db push)
 *
 * Source: ORD. MMFTSS/INS 2207/1607/2026 (MOR 1220/31.12.2025)
 *         ORD. MMFTSS/INS 66/51/2026 (MOR 230/25.03.2026)
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

const prisma = new PrismaClient();

const PDF_URL = "https://www.rauflorin.ro/legislatie/new/COR_2025.pdf";
const PDF_PATH = path.join(__dirname, "../tmp/cor_2026.pdf");
const TSV_PATH = path.join(__dirname, "../tmp/cor_2026.tsv");

// ─── Diacritics normalization ────────────────────────────────────
const DIAC: Record<string, string> = {
  ă: "a", â: "a", î: "i", ș: "s", ț: "t",
  Ă: "a", Â: "a", Î: "i", Ș: "s", Ț: "t",
  ş: "s", ţ: "t", Ş: "s", Ţ: "t",
};
function norm(t: string): string {
  return t.replace(/[ăâîșțĂÂÎȘȚşţŞŢ]/g, (m) => DIAC[m] ?? m).toLowerCase().trim();
}

// ─── Group names ─────────────────────────────────────────────────
const GROUP_NAMES: Record<string, string> = {
  "1": "Membrii corpului legislativ, ai executivului, conducători și funcționari superiori",
  "2": "Specialiști în diverse domenii de activitate",
  "3": "Tehnicieni și alți specialiști din domeniul tehnic",
  "4": "Funcționari administrativi",
  "5": "Lucrători în domeniul serviciilor și comerțului",
  "6": "Lucrători calificați în agricultură, silvicultură și pescuit",
  "7": "Muncitori calificați și asimilați",
  "8": "Operatori la instalații și mașini; asamblori de echipamente",
  "9": "Ocupații elementare",
};

// ─── Download PDF ────────────────────────────────────────────────
function downloadPdf(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith("https") ? https : http;

    const request = (protocol as typeof https).get(url, { 
      headers: { "User-Agent": "COR-Explorer-Scraper/1.0" } 
    }, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadPdf(redirectUrl, dest).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    });

    request.on("error", reject);
    request.setTimeout(30000, () => { request.destroy(); reject(new Error("Timeout")); });
  });
}

// ─── Extract text from PDF using Python pymupdf ─────────────────
function extractPdfText(pdfPath: string): string {
  const pyScript = `
import fitz  # pymupdf
import sys

doc = fitz.open("${pdfPath.replace(/\\/g, "/")}")
for page in doc:
    text = page.get_text()
    sys.stdout.write(text)
doc.close()
`;
  
  try {
    return execSync(`python3 -c '${pyScript.replace(/'/g, "'\\''")}'`, {
      maxBuffer: 50 * 1024 * 1024,
      encoding: "utf-8",
    });
  } catch {
    // Fallback: try with pdf-parse (Node.js)
    console.log("  pymupdf not found, trying pdf-parse...");
    try {
      const pdfParse = require("pdf-parse");
      const buffer = fs.readFileSync(pdfPath);
      // This is synchronous workaround
      let text = "";
      const { execSync: es } = require("child_process");
      const nodeScript = `
        const pdfParse = require('pdf-parse');
        const fs = require('fs');
        const buffer = fs.readFileSync('${pdfPath}');
        pdfParse(buffer).then(d => process.stdout.write(d.text));
      `;
      text = es(`node -e "${nodeScript.replace(/"/g, '\\"')}"`, {
        maxBuffer: 50 * 1024 * 1024,
        encoding: "utf-8",
      });
      return text;
    } catch (e2) {
      throw new Error(
        "Could not extract PDF text. Install pymupdf (pip install pymupdf) or pdf-parse (npm install pdf-parse)."
      );
    }
  }
}

// ─── Parse occupation entries from text ──────────────────────────
function parseOccupations(text: string): Array<{ code: string; name: string }> {
  const pattern = /(\d{6})\s+([a-zA-ZăâîșțĂÂÎȘȚşţŞŢéèêëàáãñüöïôûçßæœ\/\-\(\)\., ]{3,})/g;
  
  const entries: Array<{ code: string; name: string }> = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const code = match[1];
    let name = match[2].trim();

    // Stop at observation markers
    const markers = [
      "introdusa prin", "Ocupatie introdusa", "Ocupatie eliminata",
      "fosta ", "ocupatie RECODIFICATA", "ocupatia a fost",
      "denumirea initial", "pozitie RADIATA", "ocupatie RADIATA",
      "Fosta ", "pozitia a fost", "ocupatie eliminata",
      "a fost mutata", "a fost RECODIFICATA",
    ];
    for (const marker of markers) {
      const idx = name.indexOf(marker);
      if (idx > 0) name = name.substring(0, idx).trim();
    }

    // Clean trailing punctuation
    name = name.replace(/[\s.,;:\-/]+$/, "");

    // Skip noise
    if (name.length < 3) continue;
    if (/^(radiata|eliminata|recodificata)/i.test(name)) continue;
    if (/^(Page |CODURI|BAZA DE|Folositi|INSTRUMENT|EVALUAREA)/i.test(name)) continue;

    if (!seen.has(code)) {
      seen.add(code);
      entries.push({ code, name });
    }
  }

  return entries.sort((a, b) => a.code.localeCompare(b.code));
}

// ─── Import into database ────────────────────────────────────────
async function importToDb(entries: Array<{ code: string; name: string }>) {
  // Collect unique hierarchy elements
  const grupeMajore = new Set<string>();
  const subgrupeMajore = new Map<string, string>();
  const grupeMinore = new Map<string, string>();
  const grupeDeBaza = new Map<string, string>();

  for (const { code } of entries) {
    const gm = code[0];
    const sm = code.substring(0, 2);
    const mi = code.substring(0, 3);
    const gb = code.substring(0, 4);
    grupeMajore.add(gm);
    subgrupeMajore.set(sm, gm);
    grupeMinore.set(mi, sm);
    grupeDeBaza.set(gb, mi);
  }

  // 1) Grupe majore
  console.log(`  → ${grupeMajore.size} grupe majore`);
  for (const code of grupeMajore) {
    await prisma.grupaMajora.upsert({
      where: { code },
      update: {},
      create: { code, name: GROUP_NAMES[code] ?? `Grupa majoră ${code}` },
    });
  }

  // 2) Subgrupe majore
  console.log(`  → ${subgrupeMajore.size} subgrupe majore`);
  for (const [code, parent] of subgrupeMajore) {
    await prisma.subgrupaMajora.upsert({
      where: { code },
      update: {},
      create: { code, name: `Subgrupa majoră ${code}`, grupaMajora: parent },
    });
  }

  // 3) Grupe minore
  console.log(`  → ${grupeMinore.size} grupe minore`);
  for (const [code, parent] of grupeMinore) {
    await prisma.grupaMinora.upsert({
      where: { code },
      update: {},
      create: { code, name: `Grupa minoră ${code}`, subgrupaMajora: parent },
    });
  }

  // 4) Grupe de bază
  console.log(`  → ${grupeDeBaza.size} grupe de bază`);
  for (const [code, parent] of grupeDeBaza) {
    await prisma.grupaDeBaza.upsert({
      where: { code },
      update: {},
      create: { code, name: `Grupa de bază ${code}`, grupaMinora: parent },
    });
  }

  // 5) Ocupații
  console.log(`  → ${entries.length} ocupații`);
  let count = 0;
  for (const o of entries) {
    await prisma.ocupatie.upsert({
      where: { code: o.code },
      update: { name: o.name, nameNormalized: norm(o.name) },
      create: {
        code: o.code,
        name: o.name,
        nameNormalized: norm(o.name),
        grupaMajora: o.code[0],
        subgrupaMajora: o.code.substring(0, 2),
        grupaMinora: o.code.substring(0, 3),
        grupaDeBaza: o.code.substring(0, 4),
      },
    });
    count++;
    if (count % 500 === 0) console.log(`    ... ${count} imported`);
  }

  return count;
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  console.log("🇷🇴 COR 2026 Full Data Scraper\n");

  // Step 1: Download PDF
  console.log(`📥 Downloading COR PDF from ${PDF_URL}...`);
  if (fs.existsSync(PDF_PATH)) {
    console.log("  (Using cached PDF)");
  } else {
    await downloadPdf(PDF_URL, PDF_PATH);
    console.log(`  ✓ Downloaded ${(fs.statSync(PDF_PATH).size / 1024 / 1024).toFixed(1)} MB`);
  }

  // Step 2: Extract text
  console.log("\n📄 Extracting text from PDF...");
  const text = extractPdfText(PDF_PATH);
  console.log(`  ✓ Extracted ${text.length.toLocaleString()} characters`);

  // Step 3: Parse occupations
  console.log("\n🔍 Parsing occupation entries...");
  const entries = parseOccupations(text);
  console.log(`  ✓ Found ${entries.length} unique occupations`);

  // Step 4: Save TSV backup
  const tsvDir = path.dirname(TSV_PATH);
  if (!fs.existsSync(tsvDir)) fs.mkdirSync(tsvDir, { recursive: true });
  fs.writeFileSync(
    TSV_PATH,
    entries.map((e) => `${e.code}\t${e.name}`).join("\n"),
    "utf-8"
  );
  console.log(`  ✓ Saved TSV backup: ${TSV_PATH}`);

  // Step 5: Import to database
  console.log("\n💾 Importing to database...");
  const count = await importToDb(entries);

  console.log(`\n✅ Import complete: ${count} ocupații imported from official COR 2026 PDF`);
  console.log(`   Source: ORD. MMFTSS/INS 2207/1607/2026 (MOR 1220/31.12.2025)`);
}

main()
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
