export default function Footer() {
  return (
    <footer
      style={{
        marginTop: "auto",
        borderTop: "1px solid var(--border)",
        background: "#fff",
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          fontSize: 13,
          color: "var(--text-muted)",
        }}
      >
        <span>© 2026 Clasificarea Ocupațiilor din România</span>
        <div style={{ display: "flex", gap: 24 }}>
          <span>Sursă: Monitorul Oficial al României</span>
        </div>
      </div>
    </footer>
  );
}
