import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 48,
            fontWeight: 400,
            color: "var(--primary)",
            marginBottom: 16,
          }}
        >
          404
        </h1>
        <p style={{ fontSize: 16, color: "var(--text-muted)", marginBottom: 24 }}>
          Pagina căutată nu a fost găsită.
        </p>
        <Link
          href="/"
          style={{
            background: "var(--primary)",
            color: "#fff",
            padding: "10px 24px",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Înapoi la pagina principală
        </Link>
      </main>
      <Footer />
    </div>
  );
}
