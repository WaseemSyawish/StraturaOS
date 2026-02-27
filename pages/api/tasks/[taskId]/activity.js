/**
 * API: Task Activity Log — GET
 * GET /api/tasks/[taskId]/activity  → List activity entries for a task
 */
import prisma from '../../../../lib/prisma';
import { resolveUser } from '../../../../lib/resolveUser';
import withPrisma from '../../../../lib/withPrisma';

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const userId = await resolveUser(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ success: false, error: 'Missing taskId' });

  // Verify the task exists and user has access
  const event = await prisma.event.findUnique({ where: { id: taskId }, select: { id: true, user_id: true, list_id: true } });
  if (!event) return res.status(404).json({ success: false, error: 'Task not found' });

  if (event.user_id !== userId) {
    if (!event.list_id) return res.status(403).json({ success: false, error: 'Access denied' });
    const membership = await prisma.taskListMember.findUnique({
      where: { list_id_user_id: { list_id: event.list_id, user_id: userId } },
    });
    if (!membership) return res.status(403).json({ success: false, error: 'Access denied' });
  }

  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const cursor = req.query.cursor || undefined;

  const where = { event_id: taskId };
  const activities = await prisma.activityLog.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { created_at: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = activities.length > limit;
  const items = hasMore ? activities.slice(0, limit) : activities;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return res.status(200).json({
    success: true,
    activities: items,
    nextCursor,
    hasMore,
  });
}

export default withPrisma(handler);
