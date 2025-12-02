# Local Development vs Production Setup

## Overview

This project uses **different databases** for local development and production:

- **Local Development**: SQLite (`prisma/dev.db`)
- **Production (Vercel)**: PostgreSQL (Railway)

## How It Works

### Local Development (SQLite)

**Files used:**

- `prisma/schema.prisma` → SQLite provider
- `.env` → `DATABASE_URL="file:./prisma/dev.db"`

**Commands:**

```powershell
# Start dev server
npm run dev

# Open Prisma Studio
npx prisma studio

# Push schema changes
npx prisma db push
```

### Production Deployment (PostgreSQL)

**Files used:**

- `prisma/schema.postgres.prisma` → PostgreSQL provider (source of truth)
- Vercel environment variables → `DATABASE_URL="postgresql://..."`

**Build process:**

1. `scripts/vercel-build.js` detects Vercel environment
2. Copies `schema.postgres.prisma` → `schema.prisma`
3. Prisma generates PostgreSQL client
4. Next.js builds with PostgreSQL

## Vercel Configuration Required

### Environment Variables (Vercel Dashboard)

Go to: **Project Settings → Environment Variables**

Add these variables for **all environments** (Production, Preview, Development):

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
DIRECT_URL="postgresql://user:password@host:port/database?schema=public"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-app.vercel.app"
RESEND_API_KEY="re_your_key_here"
RESEND_FROM_EMAIL="University Planner <noreply@resend.dev>"
```

### Railway PostgreSQL Setup

If you're using Railway for the database:

1. Go to your Railway project dashboard
2. Navigate to your PostgreSQL service
3. Copy the **Public URL** or **Connection String**
4. Paste into Vercel's `DATABASE_URL` variable

**Example Railway connection string:**

```
postgresql://postgres:PASSWORD@HOST.proxy.rlwy.net:PORT/railway?schema=public
```

### First-Time Deployment Checklist

- [ ] Push code to GitHub
- [ ] Import repository in Vercel
- [ ] Add all environment variables (see above)
- [ ] Deploy
- [ ] Run migrations: `npx prisma migrate deploy` (in Vercel terminal or Railway CLI)

## Database Migrations

### Local (SQLite)

```powershell
npx prisma db push
```

### Production (PostgreSQL)

```bash
# Option 1: Via Railway CLI
railway run npx prisma migrate deploy

# Option 2: Via Vercel CLI
vercel env pull
npx prisma migrate deploy

# Option 3: Add to Vercel build (vercel.json)
# See: https://vercel.com/guides/how-to-run-prisma-migrations-on-vercel
```

## Schema Changes Workflow

When you need to update the database schema:

1. **Update the PostgreSQL schema** (source of truth):

   ```
   Edit: prisma/schema.postgres.prisma
   ```

2. **Copy changes to SQLite schema** for local dev:

   ```
   Copy relevant changes → prisma/schema.prisma
   Remove @db.* annotations (SQLite doesn't support them)
   ```

3. **Test locally:**

   ```powershell
   npx prisma db push
   npm run dev
   ```

4. **Deploy to production:**

   ```powershell
   git add .
   git commit -m "Update schema"
   git push
   # Vercel auto-deploys
   ```

5. **Run migrations on production** (if needed):
   ```bash
   railway run npx prisma migrate deploy
   ```

## Troubleshooting

### "Can't reach database server" on Vercel

**Cause:** Missing or incorrect `DATABASE_URL` in Vercel environment variables

**Fix:**

1. Go to Vercel → Project → Settings → Environment Variables
2. Verify `DATABASE_URL` is set correctly
3. Redeploy

### Build fails with "Provider 'sqlite' not supported"

**Cause:** `schema.prisma` has SQLite provider in production

**Fix:** The `scripts/vercel-build.js` should handle this automatically. If not:

1. Ensure `schema.postgres.prisma` exists
2. Check build logs for script output
3. Manually verify the build script runs

### Local dev fails after deployment

**Cause:** `schema.prisma` was overwritten with PostgreSQL schema

**Fix:**

```powershell
# Restore SQLite schema from backup
Copy-Item prisma/schema.sqlite.prisma prisma/schema.prisma
npx prisma generate
```

## Files Reference

```
prisma/
├── schema.prisma           # Active schema (SQLite for local dev)
├── schema.postgres.prisma  # PostgreSQL schema (for production)
├── schema.sqlite.prisma    # Backup of SQLite schema (auto-created)
└── dev.db                 # Local SQLite database

scripts/
└── vercel-build.js        # Build script that switches schemas

.env                       # Local config (SQLite) - NOT committed
.env.example              # Template for .env
```

## Why Two Databases?

**SQLite Advantages (Local):**

- ✅ No setup required
- ✅ File-based, easy to backup
- ✅ Fast for development
- ✅ No network latency

**PostgreSQL Advantages (Production):**

- ✅ Required for Vercel serverless
- ✅ Better for concurrent connections
- ✅ Advanced features (full-text search, JSON functions)
- ✅ Scales with production traffic

## Important Notes

- ⚠️ **Never commit `.env`** - it's in `.gitignore`
- ⚠️ **`schema.postgres.prisma` is the source of truth** for production
- ⚠️ **Local SQLite data is not synced** to production
- ✅ Both schemas must stay in sync manually when making changes
