import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import prisma from "@/lib/prisma";
import { normalize, escapeLike } from "@/lib/normalize";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

async function searchOccupations(q: string) {
  if (!q || q.length < 1) return [];
  const isCode = /^\d+$/.test(q);
  const qNorm = normalize(q);
  const qLike = escapeLike(qNorm);

  if (isCode) {
    return prisma.$queryRaw<
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
      SELECT o.code, o.name, o."grupaMajora", o."subgrupaMajora", o."grupaMinora",
             o."grupaDeBaza", gm.name as grupa_name, gb.name as baza_name,
             CASE
               WHEN o.code = ${q} THEN 100
               WHEN o.code LIKE ${q + "%"} THEN 80
               WHEN o."grupaDeBaza" = ${q} THEN 70
               WHEN o."grupaDeBaza" LIKE ${q + "%"} THEN 60
               WHEN o."grupaMinora" = ${q} THEN 55
               WHEN o.code LIKE ${"%" + q + "%"} THEN 40
               ELSE 0
             END as score
      FROM ocupatii o
      JOIN grupe_majore gm ON gm.code = o."grupaMajora"
      JOIN grupe_de_baza gb ON gb.code = o."grupaDeBaza"
      WHERE o.code = ${q}
         OR o.code LIKE ${q + "%"}
         OR o."grupaDeBaza" = ${q}
         OR o."grupaDeBaza" LIKE ${q + "%"}
         OR o."grupaMinora" = ${q}
         OR o.code LIKE ${"%" + q + "%"}
      ORDER BY score DESC, o.code ASC
      LIMIT 30
    `;
  } else {
    return prisma.$queryRaw<
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
      SELECT o.code, o.name, o."grupaMajora", o."subgrupaMajora", o."grupaMinora",
             o."grupaDeBaza", gm.name as grupa_name, gb.name as baza_name,
             CASE
               WHEN o."nameNormalized" = ${qNorm} THEN 100
               WHEN o."nameNormalized" LIKE ${qLike + "%"} THEN 85
               WHEN o."nameNormalized" LIKE ${"%" + qLike + "%"} THEN 60
               ELSE 30
             END as score
      FROM ocupatii o
      JOIN grupe_majore gm ON gm.code = o."grupaMajora"
      JOIN grupe_de_baza gb ON gb.code = o."grupaDeBaza"
      WHERE o."nameNormalized" LIKE ${"%" + qLike + "%"}
      ORDER BY score DESC, o.name ASC
      LIMIT 30
    `;
  }
}

const LEVELS: Record<string, string> = {
  "1": "Conducere",
  "2": "Studii Superioare (Nivel 4)",
  "3": "Studii Medii (Nivel 3)",
  "4": "Studii Medii (Nivel 3)",
  "5": "Nivel 2–3",
  "6": "Nivel 2",
  "7": "Nivel 2–3",
  "8": "Nivel 2",
  "9": "Nivel 1–2",
};

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const results = q.length >= 1 ? await searchOccupations(q) : [];

  const topResult = results.length > 0 && Number(results[0].score) >= 60 ? results[0] : null;
  const otherResults = topResult ? results.slice(1) : results;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 64px", width: "100%" }}>
        {/* Search bar */}
        <div style={{ marginBottom: 24 }}>
          <SearchBar initialQuery={q} compact autoFocus />
        </div>

        {/* Top result card */}
        {topResult && (
          <div className="animate-fade-up" style={{ marginBottom: 32 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--green)",
                letterSpacing: "0.04em",
                marginBottom: 12,
                display: "block",
              }}
            >
              REZULTAT IDENTIFICAT
            </span>

            <div
              style={{
                background: "#fff",
                borderRadius: "var(--radius)",
                padding: "clamp(20px, 3vw, 28px)",
                boxShadow: "var(--shadow)",
                border: "1px solid var(--border)",
                display: "flex",
                gap: 24,
                flexWrap: "wrap",
              }}
            >
              {/* Left */}
              <div style={{ flex: 1, minWidth: 260 }}>
                {Number(topResult.score) >= 80 && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--primary)",
                      marginBottom: 8,
                    }}
                  >
                    ✦ POTRIVIRE EXACTĂ
                  </div>
                )}
                <h2
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(22px, 3vw, 28px)",
                    fontWeight: 400,
                    marginBottom: 6,
                  }}
                >
                  {topResult.name}
                </h2>
                <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>
                  Denumire ocupație oficială în Clasificarea Ocupațiilor din România
                </p>

                <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                  <div>
                    <span style={metaLabelStyle}>Nivel Instruire</span>
                    <div style={metaValueStyle}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>
                      {LEVELS[topResult.grupaMajora] ?? "N/A"}
                    </div>
                  </div>
                  <div>
                    <span style={metaLabelStyle}>Grupă Majoră</span>
                    <div style={metaValueStyle}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>
                      {topResult.grupaMajora} – {topResult.grupa_name?.substring(0, 40)}…
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — code box + detail link */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 16 }}>
                <CopyCodeBox code={topResult.code} />
                <Link
                  href={`/ocupatie/${topResult.code}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--primary)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "10px 24px",
                    borderRadius: 8,
                    textDecoration: "none",
                  }}
                >
                  Detalii Complete
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Similar results */}
        {otherResults.length > 0 && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontSize: 20, fontWeight: 700 }}>
                {topResult ? "Rezultate similare" : "Rezultate"}
              </h3>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {results.length} ocupații găsite
              </span>
            </div>

            {otherResults.map((r, i) => (
              <Link
                key={r.code}
                href={`/ocupatie/${r.code}`}
                className={`animate-fade-up delay-${Math.min(i + 1, 4)}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: "#fff",
                  borderRadius: "var(--radius)",
                  padding: "16px 20px",
                  marginBottom: 8,
                  boxShadow: "var(--shadow)",
                  border: "1px solid var(--border)",
                  textDecoration: "none",
                  color: "var(--text)",
                }}
              >
                <div style={iconBoxStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 15, display: "block" }}>{r.name}</strong>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Cod COR: {r.code}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={chipStyle}>Subgrupa {r.grupaMinora}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty state */}
        {q.length >= 1 && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-muted)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 16px" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
              Niciun rezultat găsit
            </h3>
            <p style={{ fontSize: 14 }}>
              Încercați cu un alt termen de căutare sau verificați codul COR.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ─── Copy code box (client component inlined) ────────────────
function CopyCodeBox({ code }: { code: string }) {
  return (
    <div
      style={{
        background: "var(--border-light)",
        borderRadius: "var(--radius-sm)",
        padding: "12px 16px",
        border: "1px solid var(--border)",
        textAlign: "left",
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "var(--text-muted)",
          letterSpacing: "0.06em",
        }}
      >
        COD COR UNIC
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
        <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.02em" }}>
          {code}
        </span>
      </div>
    </div>
  );
}

// ─── Shared inline styles ────────────────────────────────────
const metaLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--text-muted)",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginBottom: 4,
  display: "block",
};
const metaValueStyle: React.CSSProperties = {
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "var(--text)",
};
const iconBoxStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  background: "var(--border-light)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--text-muted)",
  flexShrink: 0,
};
const chipStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
  background: "var(--border-light)",
  padding: "4px 10px",
  borderRadius: 6,
};
