import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COR Explorer — Clasificarea Ocupațiilor din România 2026",
  description:
    "Caută rapid codul COR al ocupației tale. Nomenclatorul oficial al profesiilor din România, actualizat 2026. Peste 4.500 de ocupații, căutare rapidă după denumire sau cod.",
  keywords: [
    "COR",
    "clasificarea ocupatiilor",
    "cod COR",
    "ocupatii Romania",
    "nomenclator profesii",
    "COR 2026",
  ],
  openGraph: {
    title: "COR Explorer — Clasificarea Ocupațiilor din România",
    description: "Caută rapid codul COR al ocupației tale.",
    locale: "ro_RO",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Serif+Display&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
