/**
 * Import COR data from a CSV file.
 *
 * Usage:
 *   npx tsx scripts/import-csv.ts path/to/cor-data.csv
 *
 * Expected CSV format (semicolon-separated, UTF-8 with BOM):
 *   cod;denumire
 *   111101;Ambasador
 *   111102;Consul general
 *   ...
 *
 * The script will:
 * 1. Parse the CSV
 * 2. Auto-derive all hierarchy levels from the 6-digit code
 * 3. Create missing grupe majore, subgrupe, grupe minore, grupe de baza
 * 4. Upsert all occupations with normalized names
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// ─── Diacritics normalization ────────────────────────────────────
const DIAC: Record<string, string> = {
  ă: "a", â: "a", î: "i", ș: "s", ț: "t",
  Ă: "a", Â: "a", Î: "i", Ș: "s", Ț: "t",
  ş: "s", ţ: "t", Ş: "s", Ţ: "t",
};
function norm(t: string): string {
  return t.replace(/[ăâîșțĂÂÎȘȚşţŞŢ]/g, (m) => DIAC[m] ?? m).toLowerCase().trim();
}

// ─── Group name defaults ─────────────────────────────────────────
const GROUP_NAMES: Record<string, string> = {
  "1": "Membrii corpului legislativ, ai executivului, conducători și funcționari superiori",
  "2": "Specialiști în diverse domenii de activitate",
  "3": "Tehnicieni și alți specialiști din domeniul tehnic",
  "4": "Funcționari administrativi",
  "5": "Lucrători în domeniul serviciilor și comerțului",
  "6": "Lucrători calificați în agricultură, silvicultură și pescuit",
  "7": "Muncitori calificați și asimilați",
  "8": "Operatori la instalații și mașini; asamblori de echipamente",
  "9": "Muncitori necalificați din agricultură și alte domenii",
};

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: npx tsx scripts/import-csv.ts <path-to-csv>");
    console.error("Expected CSV format: cod;denumire (semicolon-separated, UTF-8)");
    process.exit(1);
  }

  const fullPath = path.resolve(csvPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`📂 Reading ${fullPath}...`);
  let content = fs.readFileSync(fullPath, "utf-8");

  // Strip BOM
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);

  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  // Skip header if present
  const dataLines = lines[0].match(/^(cod|code)/i) ? lines.slice(1) : lines;

  console.log(`📊 Found ${dataLines.length} entries\n`);

  // Collect unique hierarchy elements
  const grupeMajore = new Set<string>();
  const subgrupeMajore = new Map<string, string>(); // code -> parent
  const grupeMinore = new Map<string, string>();
  const grupeDeBaza = new Map<string, string>();
  const ocupatii: Array<{ code: string; name: string }> = [];

  for (const line of dataLines) {
    // Support semicolon or comma separator
    const sep = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
    const parts = line.split(sep).map((p) => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 2) continue;

    const code = parts[0].replace(/\D/g, "");
    const name = parts[1];

    if (code.length !== 6 || !name) continue;

    const gm = code[0];
    const sm = code.substring(0, 2);
    const mi = code.substring(0, 3);
    const gb = code.substring(0, 4);

    grupeMajore.add(gm);
    subgrupeMajore.set(sm, gm);
    grupeMinore.set(mi, sm);
    grupeDeBaza.set(gb, mi);
    ocupatii.push({ code, name });
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
  console.log(`  → ${ocupatii.length} ocupații`);
  let count = 0;
  for (const o of ocupatii) {
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
    if (count % 500 === 0) console.log(`    ... ${count} inserted`);
  }

  console.log(`\n✅ Import complete: ${count} ocupații from CSV`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
