## Testing Password Reset Locally (Without Email)

Since you don't have a Resend API key yet, here's how password reset works in development:

### How It Works Now

1. **User clicks "Forgot Password?" on signin page**
2. **Enters their email address**
3. **You see this in the terminal:**
   ```
   🔑 PASSWORD RESET REQUEST
      Email: user@example.com
      Token: abc123def456...
      🔗 Reset link: http://localhost:3001/reset-password?token=abc123def456...
      ⏰ Expires: 11/8/2025, 3:45:00 PM
   ```
4. **Copy the reset link from console**
5. **Paste it in browser or it opens automatically**
6. **User sets new password**

### Quick Test

1. **Start dev server** (already running on http://localhost:3001)

2. **Go to signin:** http://localhost:3001/signin

3. **Click "Forgot Password?"**

4. **Enter an email** that exists in your database (check Prisma Studio)

5. **Check your terminal** - you'll see the reset link

6. **Open the link** - it will take you to the reset password page

### Example Console Output

```bash
🔑 PASSWORD RESET REQUEST
   Email: waseem@test.com
   Token: 8f7a9c2b1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a
   🔗 Reset link: http://localhost:3001/reset-password?token=8f7a9c2b1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a
   ⏰ Expires: 11/8/2025, 4:23:17 PM

⚠️  RESEND_API_KEY not configured - email will not be sent
   For production, get a free API key from: https://resend.com/api-keys
```

### When You Add a Real API Key

Once you add your Resend API key to `.env`:

```env
RESEND_API_KEY="re_your_real_key_here"
```

Then:

- ✅ Email will be sent to the user
- ✅ Reset link still shown in console (for testing)
- ✅ Beautiful HTML email with branding
- ✅ Link expires in 1 hour

### For Vercel Production

When you deploy to Vercel:

1. **Add environment variables in Vercel dashboard:**

   - `RESEND_API_KEY` = your API key
   - `RESEND_FROM_EMAIL` = `StraturaOS <noreply@resend.dev>`
   - `NEXTAUTH_URL` = `https://your-app.vercel.app`

2. **That's it!** Emails will work automatically

3. **Monitor emails at:** https://resend.com/emails

### Getting a Free Resend API Key (2 minutes)

1. Go to: https://resend.com/signup
2. Sign up (free, no credit card)
3. Go to: https://resend.com/api-keys
4. Click "Create API Key"
5. Copy the key (starts with `re_`)
6. Paste in `.env`:
   ```env
   RESEND_API_KEY="re_paste_here"
   ```
7. Restart dev server: `npm run dev`

**Free tier includes:**

- 3,000 emails per month
- 100 emails per day
- Perfect for development and production

### Current Status

✅ Password reset API is working
✅ Reset tokens are generated
✅ Reset links work perfectly
✅ Links shown in console for testing
⚠️ Just missing Resend API key for actual email sending

You can use it now without email (console links) or add the API key whenever you want real emails!
