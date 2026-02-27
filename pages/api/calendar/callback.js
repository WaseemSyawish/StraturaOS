/**
 * API: Calendar OAuth Callback — GET
 * GET /api/calendar/callback?code=...&state=...
 * Exchanges auth code for tokens and stores the CalendarConnection.
 */
import prisma from '../../../lib/prisma';
import withPrisma from '../../../lib/withPrisma';
import { exchangeGoogleCode } from '../../../lib/calendar-sync';

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    return res.redirect('/tasks?calendar_error=' + encodeURIComponent(oauthError));
  }

  if (!code || !state) {
    return res.status(400).json({ success: false, error: 'Missing code or state' });
  }

  let userId;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    userId = decoded.userId;
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid state parameter' });
  }

  if (!userId) return res.status(400).json({ success: false, error: 'Invalid state' });

  try {
    const tokens = await exchangeGoogleCode(code);

    // Upsert the CalendarConnection
    await prisma.calendarConnection.upsert({
      where: { user_id_provider: { user_id: userId, provider: 'google' } },
      create: {
        user_id: userId,
        provider: 'google',
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires: tokens.tokenExpires,
      },
      update: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken || undefined,
        token_expires: tokens.tokenExpires,
        updated_at: new Date(),
      },
    });

    // Redirect back to tasks page with success
    return res.redirect('/tasks?calendar_connected=true');
  } catch (err) {
    console.error('[calendar/callback] Error:', err);
    return res.redirect('/tasks?calendar_error=' + encodeURIComponent('Failed to connect calendar'));
  }
}

export default withPrisma(handler);
