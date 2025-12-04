# Password Reset - How It Works

## 🎯 TL;DR

**Right now (without email setup):**

- Password reset works perfectly
- Reset links appear in terminal console
- Just copy/paste the link to reset password
- **No email needed for development**

**For production (Vercel):**

- Add `RESEND_API_KEY` to Vercel environment variables
- Get free key from https://resend.com (2 minutes)
- Emails send automatically
- 3,000 free emails/month

---

## 📋 How It Works Now

### Local Development (Current Setup)

```
User clicks "Forgot Password?"
         ↓
Enters email address
         ↓
Terminal shows:
┌─────────────────────────────────────────────┐
│ 🔑 PASSWORD RESET REQUEST                   │
│    Email: user@example.com                  │
│    🔗 Reset link: http://localhost:3001/... │
│    ⏰ Expires: in 1 hour                     │
│                                             │
│ ⚠️  Email not configured (dev mode OK)      │
└─────────────────────────────────────────────┘
         ↓
Copy link from console → Open in browser
         ↓
User resets password ✅
```

### Production (Vercel with Email)

```
User clicks "Forgot Password?"
         ↓
Enters email address
         ↓
Resend API sends beautiful email
         ↓
User receives email in inbox
         ↓
Clicks link in email
         ↓
User resets password ✅
```

---

## 🚀 Quick Start Guide

### Right Now (No Setup Needed)

1. **Go to:** http://localhost:3001/signin
2. **Click:** "Forgot Password?"
3. **Enter:** Any email from your database
4. **Check:** Terminal console for reset link
5. **Copy/Paste:** Link in browser
6. **Done!** Set new password

### Add Email (Optional, 5 minutes)

1. **Sign up:** https://resend.com/signup (free)
2. **Get key:** https://resend.com/api-keys
3. **Add to `.env`:**
   ```env
   RESEND_API_KEY="re_abc123yourkeyhere"
   ```
4. **Restart:** `npm run dev`
5. **Test:** Actual emails sent!

---

## 🎨 What Users See

### The Modal (Forgot Password)

```
┌────────────────────────────────────────┐
│  Forgot Your Password?                 │
│                                        │
│  Enter your email address and we'll    │
│  send you a reset link                 │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ your@email.com                   │ │
│  └──────────────────────────────────┘ │
│                                        │
│     [ Send Reset Link ]  [Cancel]     │
└────────────────────────────────────────┘
```

### Success Message

```
✅ Reset instructions sent!
   Check your email for the reset link
```

### The Email (When Configured)

```html
┌─────────────────────────────────────────┐ │ 🎓 StraturaOS │ │ Password
Reset Request │ ├─────────────────────────────────────────┤ │ │ │ We received a
password reset request │ │ for your account. │ │ │ │ [ Reset Password ] ← Button
│ │ │ │ Link expires in 1 hour │ │ │ └─────────────────────────────────────────┘
```

---

## 🔧 For Vercel Deployment

### Environment Variables Needed

```env
# Required for all features
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="https://your-app.vercel.app"

# Required for email
RESEND_API_KEY="re_your_key"
RESEND_FROM_EMAIL="StraturaOS <noreply@resend.dev>"
```

### Where to Add in Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to: **Settings** → **Environment Variables**
4. Add each variable:
   - Name: `RESEND_API_KEY`
   - Value: `re_abc123...`
   - Environment: ✅ Production ✅ Preview ✅ Development
5. **Redeploy** (or just push new commit)

### Testing on Vercel

1. Deploy your app
2. Go to your production URL
3. Click "Forgot Password?"
4. Enter email
5. Check inbox (or Resend dashboard)
6. Click reset link
7. Done!

---

## 📊 Resend Free Tier

Perfect for starting out:

| Feature      | Free Tier    |
| ------------ | ------------ |
| Emails/month | 3,000        |
| Emails/day   | 100          |
| Cost         | $0 forever   |
| Credit card  | Not required |
| API calls    | Unlimited    |
| Webhooks     | ✅ Yes       |
| Analytics    | ✅ Yes       |

**Example usage:**

- 100 password resets/day = plenty for most apps
- 3,000/month = ~100/day average
- Only upgrade if you grow past this (good problem!)

---

## ❓ FAQ

### Q: Do I need email for local development?

**A:** No! Reset links show in console. Email is optional.

### Q: What happens if I deploy without RESEND_API_KEY?

**A:** Users will see "Email service not configured" error. They can't reset passwords.

### Q: How much does Resend cost?

**A:** Free tier = 3,000 emails/month. Pro = $20/month for 50,000 emails.

### Q: Can I use Gmail/Outlook instead?

**A:** Not easily. Resend is designed for transactional emails and is much simpler.

### Q: Is Resend secure?

**A:** Yes! Used by thousands of apps. DKIM/SPF/DMARC built-in.

### Q: What if user doesn't receive email?

**A:** Check:

1. Spam folder
2. Resend dashboard (https://resend.com/emails)
3. Verify email address is correct
4. Check Vercel logs for errors

### Q: Can I test emails without sending?

**A:** Yes! Use Resend's test mode or check their dashboard to see email content.

---

## 🎯 Next Steps

Choose one:

### Option 1: Keep Using Console Links (Easiest)

- ✅ Already working
- ✅ No setup needed
- ✅ Perfect for development
- ⚠️ Not for production

### Option 2: Add Email Service (Recommended)

- ✅ Takes 5 minutes
- ✅ Free forever (3K emails/month)
- ✅ Works in dev and production
- ✅ Professional appearance

### Option 3: Deploy to Vercel with Email

- ✅ Full production setup
- ✅ Real emails to users
- ✅ Monitor delivery
- ✅ Ready to scale

---

## 📚 Documentation Links

- **Resend:** https://resend.com/docs
- **Get API Key:** https://resend.com/api-keys
- **Verify Domain:** https://resend.com/domains
- **View Emails:** https://resend.com/emails
- **Vercel Deploy:** See `DEPLOY-VERCEL.md`
- **Test Locally:** See `TEST-PASSWORD-RESET.md`

---

**Need help?** Check the console logs or Resend dashboard for detailed error messages.
