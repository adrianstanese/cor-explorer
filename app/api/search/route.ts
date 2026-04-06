import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalize, escapeLike } from "@/lib/normalize";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 20), 50);

  if (q.length < 1) {
    return NextResponse.json({ results: [], total: 0, query: q });
  }

  const isCode = /^\d+$/.test(q);
  const qNorm = normalize(q);
  const qLike = escapeLike(qNorm);

  let results;

  if (isCode) {
    // Code search: exact → prefix → contains
    results = await prisma.$queryRaw<
      Array<{
        code: string;
        name: string;
        grupaMajora: string;
        subgrupaMajora: string;
        grupaMinora: string;
        grupaDeBaza: string;
        grupa_name: string;
        baza_name: string;
        score: number;
      }>
    >`
      SELECT
        o.code,
        o.name,
        o."grupaMajora",
        o."subgrupaMajora",
        o."grupaMinora",
        o."grupaDeBaza",
        gm.name as grupa_name,
        gb.name as baza_name,
        CASE
          WHEN o.code = ${q} THEN 100
          WHEN o.code LIKE ${q + '%'} THEN 80
          WHEN o."grupaDeBaza" = ${q} THEN 70
          WHEN o."grupaDeBaza" LIKE ${q + '%'} THEN 60
          WHEN o."grupaMinora" = ${q} THEN 55
          WHEN o.code LIKE ${'%' + q + '%'} THEN 40
          ELSE 0
        END as score
      FROM ocupatii o
      JOIN grupe_majore gm ON gm.code = o."grupaMajora"
      JOIN grupe_de_baza gb ON gb.code = o."grupaDeBaza"
      WHERE o.code = ${q}
         OR o.code LIKE ${q + '%'}
         OR o."grupaDeBaza" = ${q}
         OR o."grupaDeBaza" LIKE ${q + '%'}
         OR o."grupaMinora" = ${q}
         OR o.code LIKE ${'%' + q + '%'}
      ORDER BY score DESC, o.code ASC
      LIMIT ${limit}
    `;
  } else {
    // Text search: exact → starts with → contains → word match
    results = await prisma.$queryRaw<
      Array<{
        code: string;
        name: string;
        grupaMajora: string;
        subgrupaMajora: string;
        grupaMinora: string;
        grupaDeBaza: string;
        grupa_name: string;
        baza_name: string;
        score: number;
      }>
    >`
      SELECT
        o.code,
        o.name,
        o."grupaMajora",
        o."subgrupaMajora",
        o."grupaMinora",
        o."grupaDeBaza",
        gm.name as grupa_name,
        gb.name as baza_name,
        CASE
          WHEN o."nameNormalized" = ${qNorm} THEN 100
          WHEN o."nameNormalized" LIKE ${qLike + '%'} THEN 85
          WHEN o."nameNormalized" LIKE ${'%' + qLike + '%'} THEN 60
          ELSE 30
        END as score
      FROM ocupatii o
      JOIN grupe_majore gm ON gm.code = o."grupaMajora"
      JOIN grupe_de_baza gb ON gb.code = o."grupaDeBaza"
      WHERE o."nameNormalized" LIKE ${'%' + qLike + '%'}
      ORDER BY score DESC, o.name ASC
      LIMIT ${limit}
    `;
  }

  const mapped = results.map((r) => ({
    code: r.code,
    name: r.name,
    grupaMajora: r.grupaMajora,
    subgrupaMajora: r.subgrupaMajora,
    grupaMinora: r.grupaMinora,
    grupaDeBaza: r.grupaDeBaza,
    grupaMajoraName: r.grupa_name,
    grupaDeBazaName: r.baza_name,
    score: Number(r.score),
  }));

  return NextResponse.json({
    results: mapped,
    total: mapped.length,
    query: q,
  });
}
