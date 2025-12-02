# Email Service Setup (Password Reset)

The password reset feature requires email functionality to send reset links to users.

## Quick Setup with Resend

1. **Sign up for Resend** (Free tier available)

   - Go to: https://resend.com/signup
   - Create a free account (includes 3,000 emails/month, 100/day)

2. **Get your API Key**

   - After signing in, go to: https://resend.com/api-keys
   - Click "Create API Key"
   - Give it a name (e.g., "University Planner Dev")
   - Copy the API key (starts with `re_`)

3. **Add to .env file**

   ```bash
   RESEND_API_KEY="re_your_actual_api_key_here"
   RESEND_FROM_EMAIL="University Planner <noreply@yourdomain.com>"
   ```

4. **Restart your dev server**
   ```bash
   npm run dev
   ```

## Domain Setup (For Production)

For production, you'll need to verify your domain:

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain
4. Add the DNS records they provide to your domain's DNS settings
5. Wait for verification (usually takes a few minutes)
6. Update `RESEND_FROM_EMAIL` to use your verified domain

## Testing in Development

When `RESEND_API_KEY` is set and you're in development mode:

- The reset link will be logged to the console
- The email will be sent via Resend
- Check your inbox (or spam folder)

Without `RESEND_API_KEY`:

- You'll see an error: "Email service not configured"
- The reset token will still be logged to console for testing
- You can manually visit: `http://localhost:3000/reset-password?token=<token>`

## Alternative: Console-Only Mode (No Email)

If you don't want to set up email, you can still test password reset:

1. When a user requests password reset, check the server console
2. Look for: `🔗 Reset link: http://localhost:3000/reset-password?token=...`
3. Copy that link and open it in your browser
4. The user can then set a new password

## Troubleshooting

**Error: "Email service not configured"**

- Make sure `RESEND_API_KEY` is set in `.env`
- Restart your dev server after adding the key

**Email not received**

- Check spam folder
- Verify the API key is correct
- Check Resend dashboard for delivery logs
- Make sure you're using the email associated with a real user account

**API Key Invalid**

- Make sure you copied the full key (starts with `re_`)
- No quotes or extra spaces in the `.env` file
- The key should look like: `RESEND_API_KEY=re_abc123...` (no quotes in .env)

## Cost

Resend Free Tier:

- ✅ 3,000 emails per month
- ✅ 100 emails per day
- ✅ Perfect for development and small apps
- ✅ No credit card required

## Security Notes

- Never commit your API key to git
- `.env` file should be in `.gitignore`
- Use different API keys for development and production
- Rotate keys if they're ever exposed
