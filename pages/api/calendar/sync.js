/**
 * API: Calendar Sync — POST
 * POST /api/calendar/sync  → Trigger a sync cycle (pull + push)
 */
import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';
import withPrisma from '../../../lib/withPrisma';
import { syncCalendar } from '../../../lib/calendar-sync';
import { logActivity, ACTIONS } from '../../../lib/activity-logger';

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const userId = await resolveUser(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

  const connection = await prisma.calendarConnection.findUnique({
    where: { user_id_provider: { user_id: userId, provider: 'google' } },
  });

  if (!connection) {
    return res.status(404).json({ success: false, error: 'No calendar connected. Please connect Google Calendar first.' });
  }

  try {
    const result = await syncCalendar(prisma, connection);

    await logActivity(prisma, {
      userId,
      action: ACTIONS.CALENDAR_SYNCED,
      details: {
        imported: result.imported.length,
        cancelled: result.cancelled.length,
      },
    });

    return res.status(200).json({
      success: true,
      imported: result.imported.length,
      cancelled: result.cancelled.length,
      lastSynced: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[calendar/sync] Error:', err);
    return res.status(500).json({ success: false, error: 'Calendar sync failed: ' + err.message });
  }
}

export default withPrisma(handler);
