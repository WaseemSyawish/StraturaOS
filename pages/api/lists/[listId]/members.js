/**
 * API: Task List Members — GET / POST / DELETE
 * GET    /api/lists/[listId]/members  → List members
 * POST   /api/lists/[listId]/members  → Add member (by email or share token)
 * DELETE /api/lists/[listId]/members  → Remove member
 * PATCH  /api/lists/[listId]/members  → Update member role
 */
import prisma from '../../../../lib/prisma';
import { resolveUser } from '../../../../lib/resolveUser';
import withPrisma from '../../../../lib/withPrisma';
import { logActivity, ACTIONS } from '../../../../lib/activity-logger';

async function handler(req, res) {
  const userId = await resolveUser(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

  const { listId } = req.query;
  if (!listId) return res.status(400).json({ success: false, error: 'Missing listId' });

  const list = await prisma.taskList.findUnique({
    where: { id: listId },
    select: { id: true, owner_id: true, is_shared: true, share_token: true },
  });

  if (!list) return res.status(404).json({ success: false, error: 'List not found' });

  const isOwner = list.owner_id === userId;
  const membership = await prisma.taskListMember.findUnique({
    where: { list_id_user_id: { list_id: listId, user_id: userId } },
  });
  const isAdmin = isOwner || membership?.role === 'admin';

  if (!isOwner && !membership) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  if (req.method === 'GET') {
    const members = await prisma.taskListMember.findMany({
      where: { list_id: listId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joined_at: 'asc' },
    });
    return res.status(200).json({ success: true, members });
  }

  if (req.method === 'POST') {
    if (!isAdmin) return res.status(403).json({ success: false, error: 'Only owner/admin can add members' });

    const { email, shareToken, role = 'member' } = req.body || {};

    // Join via share token
    if (shareToken) {
      if (shareToken !== list.share_token || !list.is_shared) {
        return res.status(400).json({ success: false, error: 'Invalid share link' });
      }
      const existing = await prisma.taskListMember.findUnique({
        where: { list_id_user_id: { list_id: listId, user_id: userId } },
      });
      if (existing) return res.status(200).json({ success: true, message: 'Already a member' });

      const member = await prisma.taskListMember.create({
        data: { list_id: listId, user_id: userId, role: 'member' },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      return res.status(201).json({ success: true, member });
    }

    // Add by email
    if (!email?.trim()) return res.status(400).json({ success: false, error: 'Email is required' });

    const targetUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!targetUser) return res.status(404).json({ success: false, error: 'User not found' });

    const existing = await prisma.taskListMember.findUnique({
      where: { list_id_user_id: { list_id: listId, user_id: targetUser.id } },
    });
    if (existing) return res.status(200).json({ success: true, message: 'Already a member' });

    const validRoles = ['admin', 'member', 'viewer'];
    const member = await prisma.taskListMember.create({
      data: {
        list_id: listId,
        user_id: targetUser.id,
        role: validRoles.includes(role) ? role : 'member',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    await logActivity(prisma, {
      userId,
      listId,
      action: ACTIONS.MEMBER_ADDED,
      details: { addedUserId: targetUser.id, email: targetUser.email, role: member.role },
    });

    return res.status(201).json({ success: true, member });
  }

  if (req.method === 'PATCH') {
    if (!isAdmin) return res.status(403).json({ success: false, error: 'Only owner/admin can change roles' });

    const { memberId, role } = req.body || {};
    if (!memberId || !role) return res.status(400).json({ success: false, error: 'memberId and role required' });

    const validRoles = ['admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) return res.status(400).json({ success: false, error: 'Invalid role' });

    const target = await prisma.taskListMember.findUnique({ where: { id: memberId } });
    if (!target || target.list_id !== listId) return res.status(404).json({ success: false, error: 'Member not found' });

    // Can't change owner's role
    if (target.user_id === list.owner_id) {
      return res.status(400).json({ success: false, error: "Cannot change owner's role" });
    }

    const updated = await prisma.taskListMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    await logActivity(prisma, {
      userId,
      listId,
      action: ACTIONS.MEMBER_ROLE_CHANGED,
      details: { memberId, newRole: role },
    });

    return res.status(200).json({ success: true, member: updated });
  }

  if (req.method === 'DELETE') {
    const { memberId } = req.body || {};
    if (!memberId) return res.status(400).json({ success: false, error: 'memberId is required' });

    const target = await prisma.taskListMember.findUnique({ where: { id: memberId } });
    if (!target || target.list_id !== listId) return res.status(404).json({ success: false, error: 'Member not found' });

    // Can't remove owner
    if (target.user_id === list.owner_id) {
      return res.status(400).json({ success: false, error: 'Cannot remove the owner' });
    }

    // Only admin/owner can remove others, members can remove themselves
    if (!isAdmin && target.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Cannot remove other members' });
    }

    await prisma.taskListMember.delete({ where: { id: memberId } });

    await logActivity(prisma, {
      userId,
      listId,
      action: ACTIONS.MEMBER_REMOVED,
      details: { removedUserId: target.user_id },
    });

    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', 'GET,POST,PATCH,DELETE');
  return res.status(405).end();
}

export default withPrisma(handler);
