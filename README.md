# 🇷🇴 COR Explorer — Clasificarea Ocupațiilor din România

A production-ready search website for the Romanian Classification of Occupations (COR 2026). Built with Next.js 15, Prisma, and PostgreSQL.

## Stack

| Layer       | Technology           | Why                                      |
|-------------|---------------------|------------------------------------------|
| Framework   | Next.js 15 (App Router) | SSR, API routes, Vercel-native          |
| Language    | TypeScript           | Type safety across stack                 |
| Database    | PostgreSQL 16        | Relational hierarchy + LIKE search       |
| ORM         | Prisma 6             | Type-safe queries, migrations            |
| Hosting     | Vercel + Neon/Supabase | Managed Postgres + edge deployment      |
| Styling     | CSS Variables + Inline | Zero runtime, no CSS-in-JS dependency   |

## Features

- **Diacritics-insensitive search** — `ș/ş/s`, `ț/ţ/t`, `ă/a`, `â/î/i` all match
- **Code search** — exact match, prefix, contains
- **Text search** — name matching with relevance scoring
- **Live dropdown** — instant results as you type
- **Keyboard navigation** — arrow keys + Enter
- **Responsive** — mobile-first, works everywhere
- **SEO** — per-page metadata, semantic HTML
- **COR 2026 data** — based on ORD. MMFTSS/INS 2207/1607/2026

## Project Structure

```
cor-explorer/
├── app/
│   ├── layout.tsx          # Root layout, fonts, metadata
│   ├── globals.css         # CSS variables, animations
│   ├── page.tsx            # Home — hero + search
│   ├── not-found.tsx       # 404
│   ├── cauta/
│   │   └── page.tsx        # Search results page
│   ├── ocupatie/
│   │   └── [code]/
│   │       ├── page.tsx    # Occupation detail
│   │       └── CopyButton.tsx
│   ├── explorare/
│   │   └── page.tsx        # Browse by grupe majore
│   └── api/
│       └── search/
│           └── route.ts    # Search API endpoint
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── SearchBar.tsx       # Live search with dropdown
├── lib/
│   ├── prisma.ts           # Prisma singleton
│   ├── normalize.ts        # Diacritics normalization
│   └── types.ts            # Shared TypeScript types
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # COR 2026 seed data (200+ occupations)
├── docker-compose.yml      # Local Postgres
├── .env.example
├── package.json
├── tsconfig.json
└── next.config.js
```

## Local Development

### 1. Clone and install

```bash
git clone <repo-url> cor-explorer
cd cor-explorer
cp .env.example .env
npm install
```

### 2. Start Postgres

```bash
docker compose up -d
```

### 3. Push schema and seed data

```bash
npx prisma db push

# Option A: Quick start with 605 occupations
npm run db:seed

# Option B: Full 4,500+ occupations from official PDF (RECOMMENDED)
pip install pymupdf   # one-time install
npm run db:scrape
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Production Deployment (Vercel)

### 1. Create a managed Postgres database

Use **Neon** (recommended, free tier) or **Supabase**:

- Go to [neon.tech](https://neon.tech) → Create project
- Copy the connection string

### 2. Deploy to Vercel

```bash
npx vercel
```

Set environment variables in Vercel dashboard:
```
DATABASE_URL=postgresql://user:pass@host:5432/cor_explorer?sslmode=require
```

### 3. Run migrations + seed

```bash
npx prisma db push
npm run db:seed
```

The `postinstall` script auto-generates the Prisma client on each deploy.

## Data Sources

| Source | Description |
|--------|------------|
| ORD. MMFTSS/INS 2207/1607/2026 | Latest COR amendments (MOR 1220/31.12.2025) |
| HG 1352/2010 | Base COR structure per ISCO-08 |
| HG 1161/2013 | Structural amendments |
| rubinian.com/cor | Reference implementation verification |

## Updating COR Data

When new amendments are published in Monitorul Oficial:

1. Add/modify entries in `prisma/seed.ts`
2. Run `npm run db:seed` (uses upsert — safe to re-run)
3. Deploy

## API

### `GET /api/search?q=<query>&limit=<n>`

Returns ranked occupation results.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| q | string | required | Search query (name or code) |
| limit | number | 20 | Max results (cap: 50) |

Response:
```json
{
  "results": [
    {
      "code": "251201",
      "name": "Programator",
      "grupaMajora": "2",
      "grupaMajoraName": "Specialiști în diverse domenii...",
      "score": 85
    }
  ],
  "total": 5,
  "query": "programator"
}
```

## License

MIT
