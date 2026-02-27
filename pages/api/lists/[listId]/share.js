/**
 * API: Join list via share token
 * POST /api/lists/[listId]/share — Join a shared list using share_token
 * GET  /api/lists/[listId]/share — Get share info (link, is_shared status)
 * PATCH /api/lists/[listId]/share — Toggle sharing on/off, regenerate token
 */
import prisma from '../../../../lib/prisma';
import { resolveUser } from '../../../../lib/resolveUser';
import withPrisma from '../../../../lib/withPrisma';
import { logActivity, ACTIONS } from '../../../../lib/activity-logger';
import crypto from 'crypto';

async function handler(req, res) {
  const userId = await resolveUser(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

  const { listId } = req.query;
  if (!listId) return res.status(400).json({ success: false, error: 'Missing listId' });

  const list = await prisma.taskList.findUnique({
    where: { id: listId },
    select: { id: true, owner_id: true, is_shared: true, share_token: true, name: true },
  });

  if (!list) return res.status(404).json({ success: false, error: 'List not found' });

  if (req.method === 'GET') {
    // Anyone with access can view share info
    const isOwner = list.owner_id === userId;
    return res.status(200).json({
      success: true,
      isShared: list.is_shared,
      shareToken: isOwner ? list.share_token : undefined,
      shareUrl: isOwner && list.is_shared
        ? `${process.env.NEXTAUTH_URL || ''}/tasks?join=${list.share_token}`
        : undefined,
    });
  }

  if (req.method === 'POST') {
    // Join via share token
    const { token } = req.body || {};
    if (!token || token !== list.share_token || !list.is_shared) {
      return res.status(400).json({ success: false, error: 'Invalid or expired share link' });
    }

    const existing = await prisma.taskListMember.findUnique({
      where: { list_id_user_id: { list_id: listId, user_id: userId } },
    });
    if (existing) return res.status(200).json({ success: true, message: 'Already a member', listId: list.id });

    await prisma.taskListMember.create({
      data: { list_id: listId, user_id: userId, role: 'member' },
    });

    await logActivity(prisma, {
      userId,
      listId,
      action: ACTIONS.MEMBER_ADDED,
      details: { joinedViaToken: true },
    });

    return res.status(201).json({ success: true, listId: list.id, name: list.name });
  }

  if (req.method === 'PATCH') {
    // Only owner can toggle sharing
    if (list.owner_id !== userId) {
      return res.status(403).json({ success: false, error: 'Only the owner can manage sharing' });
    }

    const { enabled, regenerate } = req.body || {};
    const data = { updated_at: new Date() };

    if (typeof enabled === 'boolean') {
      data.is_shared = enabled;
    }

    if (regenerate) {
      data.share_token = crypto.randomBytes(16).toString('hex');
    }

    const updated = await prisma.taskList.update({ where: { id: listId }, data });

    await logActivity(prisma, {
      userId,
      listId,
      action: ACTIONS.LIST_SHARED,
      details: { isShared: updated.is_shared },
    });

    return res.status(200).json({
      success: true,
      isShared: updated.is_shared,
      shareToken: updated.share_token,
    });
  }

  res.setHeader('Allow', 'GET,POST,PATCH');
  return res.status(405).end();
}

export default withPrisma(handler);
