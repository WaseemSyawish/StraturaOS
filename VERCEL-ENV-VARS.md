# Vercel Environment Variables

Copy these into Vercel Dashboard → Settings → Environment Variables

## Required Variables

```
DATABASE_URL
Value: postgresql://postgres:kUAxJgHqDPBqoIDHDdpCqUgyaPCfTLPV@shuttle.proxy.rlwy.net:28550/railway

NEXTAUTH_SECRET
Value: 2660431f69aa1a30a26cb86501fb4376

NEXTAUTH_URL
Value: https://your-app-name.vercel.app
(Replace "your-app-name" with your actual Vercel domain)

RESEND_API_KEY
Value: re_DjpSwj6w_E2wnosfs3BTNXkok3UGnRkYz

RESEND_FROM_EMAIL
Value: University Planner <onboarding@resend.dev>
```

## How to Add in Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project (or import from GitHub first)
3. Go to: **Settings** → **Environment Variables**
4. For each variable above:
   - Click "Add New"
   - Enter the Name (e.g., `RESEND_API_KEY`)
   - Enter the Value (e.g., `re_DjpSwj6w_E2wnosfs3BTNXkok3UGnRkYz`)
   - Select: ✅ Production ✅ Preview ✅ Development
   - Click "Save"
5. After adding all variables, go to **Deployments**
6. Click the ⋯ menu on latest deployment
7. Click "Redeploy" (or just push a new commit)

## Important Notes

- **NEXTAUTH_URL**: Must be your actual Vercel domain (e.g., `https://university-planner.vercel.app`)
- **RESEND_FROM_EMAIL**: Using `onboarding@resend.dev` (free, no domain verification needed)
- All variables should be added to all three environments (Production, Preview, Development)

## Testing After Deploy

1. Visit your production URL: `https://your-app.vercel.app`
2. Go to `/signin`
3. Click "Forgot Password?"
4. Enter your email
5. Check inbox (and spam folder)
6. You should receive a beautiful HTML email!

## Monitor Emails

View all sent emails at: https://resend.com/emails

- See delivery status
- View email content
- Check for errors
- See open rates

## Troubleshooting

If emails aren't sending on Vercel:

1. **Check Vercel Logs:**

   - Dashboard → Deployments → Click latest → Runtime Logs
   - Look for "Email send error" messages

2. **Verify Environment Variables:**

   - Settings → Environment Variables
   - Make sure all variables are set correctly
   - Check for typos in the API key

3. **Check Resend Dashboard:**

   - https://resend.com/emails
   - See if API calls are being made
   - Check for error messages

4. **Common Issues:**
   - Missing `RESEND_API_KEY` → Add it and redeploy
   - Wrong `NEXTAUTH_URL` → Update to match your Vercel domain
   - API key invalid → Copy it exactly from Resend (no spaces)

## Success!

Once configured, your password reset emails will:

- ✅ Send automatically to users
- ✅ Include beautiful HTML design with your branding
- ✅ Contain secure reset links that expire in 1 hour
- ✅ Be tracked in Resend dashboard
- ✅ Work for 3,000 emails/month (free tier)

**Current Status:**

- ✅ Local development: Ready (API key configured)
- ⏳ Vercel production: Add variables above when you deploy
