# Deploying to Vercel with Email Support

## Prerequisites

Before deploying to Vercel, you need:

1. A Vercel account (free at https://vercel.com)
2. A Resend API key (free at https://resend.com)
3. Your GitHub repository connected to Vercel

## Step 1: Get Your Resend API Key

### For Testing (Free Forever)

1. Sign up at https://resend.com/signup
2. Go to https://resend.com/api-keys
3. Click "Create API Key"
4. Name it (e.g., "University Planner")
5. Copy the key (starts with `re_`)

**Free tier includes:**

- ✅ 3,000 emails/month
- ✅ 100 emails/day
- ✅ No credit card required

### For Production (Verify Your Domain)

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `universityplanner.app`)
4. Add the provided DNS records to your domain
5. Wait for verification (5-10 minutes)
6. Your emails will come from `noreply@yourdomain.com`

**Without a verified domain:**

- Emails will come from `onboarding@resend.dev`
- Still works fine for testing
- May have lower deliverability

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Push your code to GitHub**

   ```bash
   git add .
   git commit -m "Add password reset functionality"
   git push origin main
   ```

2. **Import project in Vercel**

   - Go to https://vercel.com/new
   - Import your repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables** (IMPORTANT!)

   Before clicking "Deploy", add these environment variables:

   ```
   DATABASE_URL = postgresql://postgres:kUAxJgHqDPBqoIDHDdpCqUgyaPCfTLPV@shuttle.proxy.rlwy.net:28550/railway

   NEXTAUTH_SECRET = 2660431f69aa1a30a26cb86501fb4376

   NEXTAUTH_URL = https://your-app.vercel.app

   RESEND_API_KEY = re_your_actual_key_here

   RESEND_FROM_EMAIL = University Planner <noreply@resend.dev>
   ```

   **Notes:**

   - Replace `your-app` with your actual Vercel domain
   - Replace `re_your_actual_key_here` with your real Resend API key
   - If you verified a domain, use `noreply@yourdomain.com`

4. **Click Deploy**

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (first time)
vercel

# Follow prompts and add environment variables when asked

# Deploy to production
vercel --prod
```

## Step 3: Configure Environment Variables in Vercel

If you forgot to add them during deployment:

1. Go to your project on Vercel
2. Click "Settings"
3. Click "Environment Variables"
4. Add each variable:
   - Click "Add New"
   - Enter Name: `RESEND_API_KEY`
   - Enter Value: `re_your_key_here`
   - Select all environments (Production, Preview, Development)
   - Click "Save"

**Required Variables:**

- ✅ `DATABASE_URL` - Your PostgreSQL connection string
- ✅ `NEXTAUTH_SECRET` - Your NextAuth secret
- ✅ `NEXTAUTH_URL` - Your production URL (e.g., `https://university-planner.vercel.app`)
- ✅ `RESEND_API_KEY` - Your Resend API key (starts with `re_`)
- ✅ `RESEND_FROM_EMAIL` - Email address for sending (e.g., `University Planner <noreply@resend.dev>`)

**After adding variables:**

- Redeploy your app (Vercel > Deployments > click ⋯ > Redeploy)
- Or just push a new commit

## Step 4: Test Password Reset

1. Visit your production site: `https://your-app.vercel.app`
2. Go to Sign In page
3. Click "Forgot Password?"
4. Enter your email
5. Check your inbox (and spam folder)
6. Click the reset link in the email

## Troubleshooting on Vercel

### Email not sending

**Check Vercel Logs:**

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments"
3. Click latest deployment
4. Click "Runtime Logs" tab
5. Look for errors with "Email send error"

**Common issues:**

- ❌ `RESEND_API_KEY` not set or wrong
  - Solution: Check Settings → Environment Variables
  - Make sure key starts with `re_`
- ❌ `Validation error: "from" is not a verified domain`

  - Solution: Use `noreply@resend.dev` for testing
  - Or verify your domain at https://resend.com/domains

- ❌ `Authentication failed`
  - Solution: API key is invalid or expired
  - Generate a new one at https://resend.com/api-keys

### Check if variables are loaded

Add this to your API route temporarily:

```javascript
console.log("Env check:", {
  hasResendKey: !!process.env.RESEND_API_KEY,
  fromEmail: process.env.RESEND_FROM_EMAIL,
});
```

### Database issues

If you see "Database requires migration":

```bash
# Connect to your production database
DATABASE_URL="your-prod-db-url" npx prisma migrate deploy
```

## Monitoring Email Delivery

1. Go to https://resend.com/emails
2. See all sent emails, delivery status, opens, clicks
3. Debug delivery issues
4. View email content

## Development vs Production

### Development (Local)

```env
RESEND_API_KEY="your-resend-api-key-here"  # Optional - will show link in console if missing
NEXTAUTH_URL="http://localhost:3000"
```

- Without API key: Reset link shown in console
- With API key: Email sent + link in console

### Production (Vercel)

```env
RESEND_API_KEY="re_abc123..."  # REQUIRED
NEXTAUTH_URL="https://your-app.vercel.app"  # REQUIRED
```

- API key is required
- Users receive emails
- No console fallback

## Cost Breakdown

**Free Tier (Perfect for starting out):**

- 3,000 emails/month = ~100 password resets/day
- No credit card needed
- Forever free

**Pro Tier ($20/month):**

- 50,000 emails/month
- Custom domains
- Better deliverability
- Email analytics

**For a university planner app:**

- Free tier is more than enough
- Only pay if you get >3000 users resetting passwords/month
- That's a good problem to have! 🎉

## Security Best Practices

### DO:

- ✅ Use different API keys for dev and production
- ✅ Keep API keys in environment variables only
- ✅ Add `.env` to `.gitignore`
- ✅ Rotate keys if exposed
- ✅ Monitor Resend dashboard for unusual activity

### DON'T:

- ❌ Commit API keys to git
- ❌ Share API keys in screenshots/videos
- ❌ Use same key across multiple projects
- ❌ Hard-code API keys in source code

## Quick Reference

```bash
# Test locally
npm run dev
# Check console for reset link if no API key

# Deploy to Vercel
git push origin main
# Auto-deploys if connected to GitHub

# View logs
vercel logs your-app-name

# Set environment variable
vercel env add RESEND_API_KEY production
```

## Need Help?

- **Resend Docs:** https://resend.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Check logs:** Vercel Dashboard → Runtime Logs
- **Test emails:** https://resend.com/emails
