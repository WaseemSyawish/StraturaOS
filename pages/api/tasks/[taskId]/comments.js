/**
 * API: Task Comments — GET / POST
 * GET  /api/tasks/[taskId]/comments  → List comments (threaded)
 * POST /api/tasks/[taskId]/comments  → Add a comment
 */
import prisma from '../../../../lib/prisma';
import { resolveUser } from '../../../../lib/resolveUser';
import withPrisma from '../../../../lib/withPrisma';
import { logActivity, ACTIONS } from '../../../../lib/activity-logger';

async function handler(req, res) {
  const userId = await resolveUser(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ success: false, error: 'Missing taskId' });

  // Verify the task exists and user has access
  const event = await prisma.event.findUnique({ where: { id: taskId }, select: { id: true, user_id: true, list_id: true } });
  if (!event) return res.status(404).json({ success: false, error: 'Task not found' });

  // Access check: owner or list member
  if (event.user_id !== userId) {
    if (!event.list_id) return res.status(403).json({ success: false, error: 'Access denied' });
    const membership = await prisma.taskListMember.findUnique({
      where: { list_id_user_id: { list_id: event.list_id, user_id: userId } },
    });
    if (!membership) return res.status(403).json({ success: false, error: 'Access denied' });
  }

  if (req.method === 'GET') {
    const comments = await prisma.comment.findMany({
      where: { event_id: taskId, parent_id: null },
      include: {
        user: { select: { id: true, name: true, email: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { created_at: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({ success: true, comments });
  }

  if (req.method === 'POST') {
    const { content, parentId } = req.body || {};
    if (!content?.trim()) return res.status(400).json({ success: false, error: 'Content is required' });

    // If replying, verify parent exists
    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.event_id !== taskId) {
        return res.status(400).json({ success: false, error: 'Invalid parent comment' });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        event_id: taskId,
        user_id: userId,
        content: content.trim(),
        parent_id: parentId || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Log activity
    await logActivity(prisma, {
      userId,
      eventId: taskId,
      action: ACTIONS.COMMENT_ADDED,
      details: { commentId: comment.id, preview: content.trim().slice(0, 100) },
    });

    return res.status(201).json({ success: true, comment });
  }

  if (req.method === 'DELETE') {
    const { commentId } = req.body || {};
    if (!commentId) return res.status(400).json({ success: false, error: 'Missing commentId' });

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ success: false, error: 'Comment not found' });
    if (comment.user_id !== userId) return res.status(403).json({ success: false, error: 'Can only delete your own comments' });

    await prisma.comment.delete({ where: { id: commentId } });

    await logActivity(prisma, {
      userId,
      eventId: taskId,
      action: ACTIONS.COMMENT_DELETED,
      details: { commentId },
    });

    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', 'GET,POST,DELETE');
  return res.status(405).end();
}

export default withPrisma(handler);
