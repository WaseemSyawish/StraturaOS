/**
 * API: Single Task List — GET / PATCH / DELETE
 * GET    /api/lists/[listId]  → Get list with tasks
 * PATCH  /api/lists/[listId]  → Update list metadata
 * DELETE /api/lists/[listId]  → Delete list (owner only)
 */
import prisma from '../../../../lib/prisma';
import { resolveUser } from '../../../../lib/resolveUser';
import withPrisma from '../../../../lib/withPrisma';
import { logActivity, ACTIONS } from '../../../../lib/activity-logger';
import { eventToTask, TASK_EVENT_INCLUDE } from '../../../../lib/task-helpers';

async function handler(req, res) {
  const userId = await resolveUser(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

  const { listId } = req.query;
  if (!listId) return res.status(400).json({ success: false, error: 'Missing listId' });

  // Verify access
  const list = await prisma.taskList.findUnique({
    where: { id: listId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  if (!list) return res.status(404).json({ success: false, error: 'List not found' });

  const membership = list.members.find((m) => m.user_id === userId);
  const isOwner = list.owner_id === userId;
  if (!isOwner && !membership) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  if (req.method === 'GET') {
    const events = await prisma.event.findMany({
      where: { list_id: listId, archived: false },
      include: TASK_EVENT_INCLUDE,
      orderBy: { date: 'asc' },
    });

    return res.status(200).json({
      success: true,
      list,
      tasks: events.map(eventToTask),
    });
  }

  if (req.method === 'PATCH') {
    // Only owner/admin can update list settings
    if (!isOwner && membership?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only owner/admin can update list settings' });
    }

    const { name, description, color, icon, is_shared } = req.body || {};
    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (color !== undefined) data.color = color;
    if (icon !== undefined) data.icon = icon;
    if (is_shared !== undefined) data.is_shared = Boolean(is_shared);
    data.updated_at = new Date();

    const updated = await prisma.taskList.update({ where: { id: listId }, data });

    await logActivity(prisma, {
      userId,
      listId,
      action: ACTIONS.LIST_UPDATED,
      details: { changes: Object.keys(data).filter((k) => k !== 'updated_at') },
    });

    return res.status(200).json({ success: true, list: updated });
  }

  if (req.method === 'DELETE') {
    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Only the owner can delete a list' });
    }

    // Unlink tasks from list (don't delete them)
    await prisma.event.updateMany({
      where: { list_id: listId },
      data: { list_id: null },
    });

    await prisma.taskList.delete({ where: { id: listId } });

    await logActivity(prisma, {
      userId,
      listId,
      action: ACTIONS.LIST_DELETED,
      details: { name: list.name },
    });

    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', 'GET,PATCH,DELETE');
  return res.status(405).end();
}

export default withPrisma(handler);
