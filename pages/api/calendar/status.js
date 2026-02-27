/**
 * API: Calendar Status — GET
 * GET /api/calendar/status  → Check connected calendar(s) for the user
 */
import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';
import withPrisma from '../../../lib/withPrisma';

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const userId = await resolveUser(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

  const connections = await prisma.calendarConnection.findMany({
    where: { user_id: userId },
    select: {
      id: true,
      provider: true,
      calendar_id: true,
      last_synced: true,
      created_at: true,
    },
  });

  return res.status(200).json({
    success: true,
    connections: connections.map((c) => ({
      id: c.id,
      provider: c.provider,
      calendarId: c.calendar_id,
      lastSynced: c.last_synced,
      connectedAt: c.created_at,
    })),
  });
}

export default withPrisma(handler);
