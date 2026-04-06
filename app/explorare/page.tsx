export const dynamic = "force-dynamic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Explorare Grupuri COR | COR Explorer",
  description: "Explorează structura Clasificării Ocupațiilor din România pe grupe majore.",
};

export default async function ExplorePage() {
  const groups = await prisma.grupaMajora.findMany({
    orderBy: { code: "asc" },
    include: {
      _count: { select: { ocupatii: true } },
    },
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 24px 64px", width: "100%" }}>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 28,
            fontWeight: 400,
            marginBottom: 8,
          }}
        >
          Structura COR
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 32 }}>
          Explorează clasificarea pe cele 9 grupe majore de ocupații din România.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {groups.map((g, i) => (
            <Link
              key={g.code}
              href={`/cauta?q=${g.code}`}
              className={`animate-fade-up delay-${Math.min(i + 1, 4)}`}
              style={{
                background: "#fff",
                borderRadius: "var(--radius)",
                padding: 24,
                boxShadow: "var(--shadow)",
                border: "1px solid var(--border)",
                textDecoration: "none",
                color: "var(--text)",
                transition: "box-shadow 0.15s, transform 0.15s",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "var(--primary)",
                  marginBottom: 8,
                }}
              >
                {g.code}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                  lineHeight: 1.4,
                }}
              >
                {g.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {g._count.ocupatii} ocupații
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
