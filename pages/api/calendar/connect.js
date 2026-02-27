/**
 * API: Calendar Connect — GET
 * GET /api/calendar/connect  → Returns OAuth URL for Google Calendar
 */
import { resolveUser } from '../../../lib/resolveUser';
import { getGoogleAuthUrl } from '../../../lib/calendar-sync';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const userId = await resolveUser(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

  const state = Buffer.from(JSON.stringify({ userId })).toString('base64url');
  const authUrl = getGoogleAuthUrl(state);

  return res.status(200).json({ success: true, authUrl });
}
