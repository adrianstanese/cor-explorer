"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { OcupatieResult } from "@/lib/types";

export default function SearchBar({
  initialQuery = "",
  compact = false,
  autoFocus = false,
}: {
  initialQuery?: string;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<OcupatieResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Fetch results
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        setResults(data.results);
        setOpen(data.results.length > 0);
        setActiveIdx(-1);
      } catch {
        setResults([]);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const goToSearch = useCallback(
    (q?: string) => {
      const searchQ = q ?? query;
      if (searchQ.trim().length < 1) return;
      setOpen(false);
      router.push(`/cauta?q=${encodeURIComponent(searchQ.trim())}`);
    },
    [query, router]
  );

  const goToOccupation = useCallback(
    (code: string) => {
      setOpen(false);
      router.push(`/ocupatie/${code}`);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && results[activeIdx]) {
        goToOccupation(results[activeIdx].code);
      } else {
        goToSearch();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const isCode = /^\d+$/.test(query);

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "#fff",
          borderRadius: compact ? "var(--radius)" : 48,
          padding: compact ? "10px 16px" : "6px 6px 6px 20px",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border)",
          transition: "box-shadow 0.2s",
        }}
      >
        {/* Search icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>

        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Caută după denumire sau cod COR..."
          style={{
            flex: 1,
            border: "none",
            fontSize: 15,
            color: "var(--text)",
            background: "transparent",
            minWidth: 0,
          }}
        />

        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            style={{
              display: "flex",
              padding: 4,
              color: "var(--text-muted)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        )}

        {isCode && query.length >= 2 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              background: "var(--border-light)",
              padding: "4px 10px",
              borderRadius: 6,
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
            }}
          >
            COD COR
          </span>
        )}

        {!compact && (
          <button
            onClick={() => goToSearch()}
            style={{
              background: "var(--primary)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              padding: "10px 24px",
              borderRadius: 40,
              whiteSpace: "nowrap",
            }}
          >
            Caută
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div
          className="animate-fade-in"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#fff",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--border)",
            overflow: "hidden",
            zIndex: 100,
          }}
        >
          {results.slice(0, 5).map((r, i) => (
            <div
              key={r.code}
              onClick={() => goToOccupation(r.code)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                cursor: "pointer",
                background:
                  i === activeIdx
                    ? "var(--border-light)"
                    : i === 0 && r.score && r.score >= 80
                    ? "#f8fafc"
                    : "transparent",
                borderBottom: "1px solid var(--border-light)",
                transition: "background 0.1s",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "var(--border-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: i === 0 && r.score && r.score >= 80 ? 15 : 14,
                    fontWeight: i === 0 && r.score && r.score >= 80 ? 600 : 400,
                    color:
                      i === 0 && r.score && r.score >= 80
                        ? "var(--primary)"
                        : "var(--text)",
                  }}
                >
                  {r.name}
                </span>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  background:
                    i === 0 && r.score && r.score >= 80
                      ? "var(--text)"
                      : "var(--border-light)",
                  color:
                    i === 0 && r.score && r.score >= 80
                      ? "#fff"
                      : "var(--text-muted)",
                  padding: "4px 10px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                }}
              >
                {r.code}
              </span>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 16px",
              borderTop: "1px solid var(--border)",
              fontSize: 12,
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>
              ↑↓ pentru navigare · Enter pentru selectare
            </span>
            <button
              onClick={() => goToSearch()}
              style={{
                color: "var(--primary)",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              Vezi toate rezultatele
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
