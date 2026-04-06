import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import prisma from "@/lib/prisma";

export default async function HomePage() {
  // Get live count from DB
  let occupationCount = "4.500+";
  try {
    const count = await prisma.ocupatie.count();
    occupationCount = count > 0 ? `${count.toLocaleString("ro-RO")}` : "4.500+";
  } catch {
    // fallback if DB not ready
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* ─── Hero ─────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(180deg, #f0f4ff 0%, #f5f7fb 100%)",
          paddingTop: 72,
          paddingBottom: 56,
        }}
      >
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            textAlign: "center",
            padding: "0 24px",
          }}
        >
          <span
            className="animate-fade-up"
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "var(--primary)",
              marginBottom: 16,
            }}
          >
            OFICIAL & DIGITAL
          </span>

          <h1
            className="animate-fade-up delay-1"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(28px, 5vw, 44px)",
              fontWeight: 400,
              lineHeight: 1.15,
              color: "var(--text)",
              marginBottom: 16,
            }}
          >
            Găsește drumul tău în
            <br />
            <span style={{ color: "var(--primary)" }}>Codul Ocupațiilor</span>
          </h1>

          <p
            className="animate-fade-up delay-2"
            style={{
              fontSize: 15,
              color: "var(--text-muted)",
              lineHeight: 1.6,
              marginBottom: 36,
            }}
          >
            Interfața modernă pentru consultarea nomenclatorului oficial al
            profesiilor din România. Rapid, clar și intuitiv.
          </p>

          {/* Search */}
          <div
            className="animate-fade-up delay-3"
            style={{ maxWidth: 560, margin: "0 auto" }}
          >
            <SearchBar />
          </div>

          {/* Popular tags */}
          <div
            className="animate-fade-up delay-4"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 24,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Popular:
            </span>
            {["Programator", "Medic", "Avocat", "Inginer", "Psiholog"].map(
              (t) => (
                <a
                  key={t}
                  href={`/cauta?q=${encodeURIComponent(t)}`}
                  style={{
                    fontSize: 13,
                    padding: "6px 14px",
                    borderRadius: 20,
                    border: "1px solid var(--border)",
                    background: "#fff",
                    color: "var(--text)",
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  {t}
                </a>
              )
            )}
          </div>
        </div>
      </section>

      {/* ─── Metrics ──────────────────────────────── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {[
            { value: occupationCount, label: "Ocupații Listate", icon: "briefcase" },
            { value: "2026", label: "Ultima Actualizare", icon: "globe" },
            { value: "Oficial", label: "Sursă Guvernamentală", icon: "file" },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "#fff",
                borderRadius: "var(--radius)",
                padding: "18px 20px",
                boxShadow: "var(--shadow)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)",
                }}
              >
                {m.icon === "briefcase" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                )}
                {m.icon === "globe" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                )}
                {m.icon === "file" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                )}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{m.value}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {m.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Info ─────────────────────────────────── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px 64px" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: "var(--radius)",
            padding: "clamp(24px, 4vw, 40px)",
            boxShadow: "var(--shadow)",
            border: "1px solid var(--border)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 28,
              fontWeight: 400,
              marginBottom: 24,
            }}
          >
            Ce este Codul Ocupațiilor?
          </h2>
          {[
            "Standard unitar de clasificare a tuturor activităților economice și sociale din țară, elaborat pe baza ISCO-08.",
            "Instrument esențial pentru contractele de muncă și raportările oficiale către stat. Toate firmele trebuie să încadreze salariații folosind coduri COR.",
            "Actualizat periodic prin ordine ale Ministerului Muncii și Institutului Național de Statistică, publicate în Monitorul Oficial.",
          ].map((text, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
              </svg>
              <span
                style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
