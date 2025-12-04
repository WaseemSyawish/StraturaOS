# Quick Vercel Deployment Guide

## ✅ Your Setup is Ready!

The project is now configured to work with:

- **Local Development**: SQLite (no setup needed)
- **Production (Vercel)**: PostgreSQL (Railway or any Postgres provider)

## 🚀 Deploy to Vercel in 3 Steps

### Step 1: Push Your Code

```powershell
git add .
git commit -m "Configure dual database setup"
git push origin main
```

### Step 2: Import to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel will auto-detect Next.js settings

### Step 3: Add Environment Variables

Before clicking "Deploy", add these in the Vercel dashboard:

#### Required Variables:

```env
DATABASE_URL
postgresql://postgres:VCxaAZoFSIJaeKTpkvgXgTfbLowdFEuc@switchback.proxy.rlwy.net:10830/railway?schema=public

DIRECT_URL
postgresql://postgres:VCxaAZoFSIJaeKTpkvgXgTfbLowdFEuc@switchback.proxy.rlwy.net:10830/railway?schema=public

NEXTAUTH_SECRET
2660431f69aa1a30a26cb86501fb4376

NEXTAUTH_URL
https://your-project-name.vercel.app

RESEND_API_KEY
re_DjpSwj6w_E2wnosfs3BTNXkok3UGnRkYz

RESEND_FROM_EMAIL
StraturaOS <onboarding@resend.dev>
```

**Important Notes:**

- Replace `your-project-name` in `NEXTAUTH_URL` with your actual Vercel domain
- The Railway `DATABASE_URL` above is from your `.env` - **verify it's still valid** in your Railway dashboard
- Set variables for **all environments**: Production, Preview, Development

### Step 4: Deploy! 🎉

Click "Deploy" in Vercel. The build will:

1. Run `scripts/vercel-build.js` (switches to PostgreSQL schema)
2. Run `prisma generate` (creates PostgreSQL client)
3. Build Next.js app
4. Deploy!

## 🔍 Verify Deployment

After deployment completes:

1. **Test the homepage**: https://your-app.vercel.app
2. **Test sign-in**: Make sure database connection works
3. **Check deployment logs**: Vercel Dashboard → Deployments → View Logs

## ⚠️ If Build Fails

### Common Issues:

**1. "Can't connect to database"**

- Verify `DATABASE_URL` is set in Vercel environment variables
- Check Railway database is running and accessible
- Verify the connection string is correct

**2. "Provider 'sqlite' is not supported"**

- The build script should handle this automatically
- Check if `prisma/schema.postgres.prisma` exists
- Look for build script logs in deployment logs

**3. "Missing environment variable"**

- Make sure all 6 variables are added
- Verify no typos in variable names
- Redeploy after adding variables

## 🔧 Railway Database Setup

If your Railway database credentials have changed:

1. Go to Railway dashboard: https://railway.app
2. Open your PostgreSQL service
3. Copy the **Public URL** connection string
4. Update `DATABASE_URL` and `DIRECT_URL` in Vercel
5. Redeploy

## 📦 Database Migrations

After first deployment, you may need to run migrations:

```bash
# Option 1: Via Railway CLI
railway login
railway link
railway run npx prisma migrate deploy

# Option 2: Via Vercel CLI
vercel env pull
npx prisma migrate deploy
```

## 🎯 Next Steps After Deployment

1. ✅ Test all features on production
2. ✅ Set up custom domain (Vercel Dashboard → Domains)
3. ✅ Configure Resend with your own domain for production emails
4. ✅ Monitor errors: Vercel Dashboard → Runtime Logs
5. ✅ Set up analytics (optional)

## 📚 Additional Resources

- See `LOCAL-VS-PRODUCTION.md` for detailed explanation of dual database setup
- See `DEPLOY-VERCEL.md` for complete deployment documentation
- See `VERCEL-ENV-VARS.md` for environment variable details

## 🆘 Need Help?

If deployment fails:

1. Check Vercel build logs for specific errors
2. Verify all environment variables are set
3. Test Railway database connection separately
4. Check Prisma schema is valid: `npx prisma validate`

---

**Your local development environment continues to work as-is with SQLite!**
