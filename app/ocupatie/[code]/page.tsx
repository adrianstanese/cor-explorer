import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CopyButton from "./CopyButton";
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const occ = await prisma.ocupatie.findUnique({ where: { code } });
  if (!occ) return { title: "Ocupație negăsită" };
  return {
    title: `${occ.name} — Cod COR ${occ.code} | COR Explorer`,
    description: `Cod COR ${occ.code}: ${occ.name}. Detalii complete din Clasificarea Ocupațiilor din România 2026.`,
  };
}

const LEVELS: Record<string, string> = {
  "1": "Conducere / Management",
  "2": "Studii Superioare (Nivel 4 ISCED)",
  "3": "Studii Medii / Post-secundare (Nivel 3)",
  "4": "Studii Medii (Nivel 3)",
  "5": "Studii Medii / Profesionale (Nivel 2–3)",
  "6": "Calificare Profesională (Nivel 2)",
  "7": "Calificare Profesională (Nivel 2–3)",
  "8": "Calificare Minimă (Nivel 2)",
  "9": "Fără Cerințe Specifice (Nivel 1–2)",
};

export default async function OccupationPage({ params }: Props) {
  const { code } = await params;

  const occ = await prisma.ocupatie.findUnique({
    where: { code },
    include: {
      grupa: true,
      subgrupa: true,
      minor: true,
      baza: true,
    },
  });

  if (!occ) notFound();

  // Similar occupations in same grupa de baza
  const similar = await prisma.ocupatie.findMany({
    where: { grupaDeBaza: occ.grupaDeBaza, NOT: { code: occ.code } },
    orderBy: { code: "asc" },
    take: 10,
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 64px", width: "100%" }}>
        {/* Back link */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            color: "var(--text-muted)",
            fontWeight: 500,
            marginBottom: 20,
            textDecoration: "none",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Înapoi la căutare
        </Link>

        {/* Detail card */}
        <div
          className="animate-fade-up"
          style={{
            background: "#fff",
            borderRadius: "var(--radius)",
            padding: "clamp(24px, 4vw, 32px)",
            boxShadow: "var(--shadow)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Top row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 260 }}>
              <h1
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(24px, 4vw, 32px)",
                  fontWeight: 400,
                  marginBottom: 8,
                }}
              >
                {occ.name}
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                Denumire ocupație oficială în Clasificarea Ocupațiilor din România
              </p>
            </div>

            {/* Code box */}
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
                  {occ.code}
                </span>
                <CopyButton code={occ.code} />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--border)", margin: "24px 0" }} />

          {/* Metadata grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 20,
            }}
          >
            <div>
              <span style={labelStyle}>Nivel Instruire</span>
              <div style={valueStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>
                {LEVELS[occ.grupaMajora] ?? "N/A"}
              </div>
            </div>
            <div>
              <span style={labelStyle}>Grupă Majoră</span>
              <div style={valueStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>
                {occ.grupaMajora} – {occ.grupa.name}
              </div>
            </div>
            <div>
              <span style={labelStyle}>Subgrupă Majoră</span>
              <div style={valueStyle}>{occ.subgrupaMajora} – {occ.subgrupa.name}</div>
            </div>
            <div>
              <span style={labelStyle}>Grupă Minoră</span>
              <div style={valueStyle}>{occ.grupaMinora} – {occ.minor.name}</div>
            </div>
            <div>
              <span style={labelStyle}>Grupă de Bază</span>
              <div style={valueStyle}>{occ.grupaDeBaza} – {occ.baza.name}</div>
            </div>
          </div>
        </div>

        {/* Similar occupations */}
        {similar.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontSize: 20, fontWeight: 700 }}>Ocupații similare</h3>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {similar.length} în aceeași grupă de bază
              </span>
            </div>

            {similar.map((s, i) => (
              <Link
                key={s.code}
                href={`/ocupatie/${s.code}`}
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
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "var(--border-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 15, display: "block" }}>{s.name}</strong>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Cod COR: {s.code}
                  </span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-muted)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginBottom: 6,
  display: "block",
};
const valueStyle: React.CSSProperties = {
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "var(--text)",
  lineHeight: 1.5,
};
