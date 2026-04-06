"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        background: "#fff",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Link
            href="/"
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text)",
            }}
          >
            COR Explorer
          </Link>
          <div style={{ display: "flex", gap: 24 }}>
            <Link
              href="/"
              style={{
                fontSize: 14,
                fontWeight: pathname === "/" ? 600 : 500,
                color: pathname === "/" ? "var(--primary)" : "var(--text-muted)",
              }}
            >
              Caută
            </Link>
            <Link
              href="/explorare"
              style={{
                fontSize: 14,
                fontWeight: pathname === "/explorare" ? 600 : 500,
                color:
                  pathname === "/explorare"
                    ? "var(--primary)"
                    : "var(--text-muted)",
              }}
            >
              Grupuri
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
