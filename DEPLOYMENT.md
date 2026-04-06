# Deployment Guide — Vercel + Neon Postgres

## Prerequisites

- [Vercel account](https://vercel.com)
- [Neon account](https://neon.tech) (free tier works)
- Git repository (GitHub/GitLab/Bitbucket)

## Step 1: Create Neon Database

1. Go to [neon.tech](https://neon.tech) → Sign up / Log in
2. Click **New Project**
3. Name: `cor-explorer`
4. Region: Choose closest to your users (e.g., `eu-central-1` for Romania)
5. Copy the **Connection string** — it looks like:
   ```
   postgresql://user:pass@ep-xyz-123.eu-central-1.aws.neon.tech/cor_explorer?sslmode=require
   ```

## Step 2: Push Code to Git

```bash
git init
git add .
git commit -m "COR Explorer initial"
git remote add origin <your-repo-url>
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option B: Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Framework preset: **Next.js** (auto-detected)
4. Add environment variable:
   - Key: `DATABASE_URL`
   - Value: your Neon connection string
5. Click **Deploy**

## Step 4: Run Database Migration + Seed

After first deployment, run from your local machine:

```bash
# Set DATABASE_URL to your Neon connection string
export DATABASE_URL="postgresql://user:pass@ep-xyz.neon.tech/cor_explorer?sslmode=require"

# Push schema to Neon
npx prisma db push

# Seed with 500+ occupations
npm run db:seed
```

## Step 5: Import Full COR Dataset (Optional)

If you have the official COR PDF/CSV with all 4,500+ occupations:

1. Convert the PDF to CSV (semicolon-separated):
   ```
   cod;denumire
   111101;Ambasador
   111102;Consul general
   ...
   ```

2. Run the import script:
   ```bash
   npx tsx scripts/import-csv.ts path/to/cor-full.csv
   ```

This will auto-create all missing hierarchy levels and upsert all occupations.

## Step 6: Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain (e.g., `cor.yoursite.ro`)
3. Update DNS records as instructed

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | No | Public URL of the app |

## Updating Data

When new COR amendments are published:

1. Edit `prisma/data/ocupatii.ts` to add/modify occupations
2. Run `npm run db:seed` (safe to re-run, uses upsert)
3. Push to Git → Vercel auto-deploys

Or use the CSV import for bulk updates:
```bash
npx tsx scripts/import-csv.ts updated-cor-2026.csv
```

## Monitoring

- **Vercel Dashboard**: Deployment logs, analytics, errors
- **Neon Dashboard**: Query stats, database size, connection pooling
- **Prisma Studio**: Browse data visually with `npx prisma studio`

## Performance Notes

- The search API uses SQL `LIKE` queries with a normalized column index
- For 4,500 occupations, this is plenty fast (<10ms per query)
- If scaling to 100k+ records, consider adding PostgreSQL full-text search (`tsvector`)
- Neon auto-scales and has built-in connection pooling
