/**
 * API: Task Lists — GET / POST
 * GET  /api/lists  → List all task lists (owned + member of)
 * POST /api/lists  → Create a new task list
 */
import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';
import withPrisma from '../../../lib/withPrisma';
import { logActivity, ACTIONS } from '../../../lib/activity-logger';
import crypto from 'crypto';

async function handler(req, res) {
  const userId = await resolveUser(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

  if (req.method === 'GET') {
    // Fetch lists where user is owner OR member
    const [ownedLists, memberLists] = await Promise.all([
      prisma.taskList.findMany({
        where: { owner_id: userId },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          _count: { select: { events: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.taskListMember.findMany({
        where: { user_id: userId },
        include: {
          list: {
            include: {
              members: {
                include: { user: { select: { id: true, name: true, email: true } } },
              },
              owner: { select: { id: true, name: true, email: true } },
              _count: { select: { events: true } },
            },
          },
        },
      }),
    ]);

    // Merge and deduplicate
    const ownedIds = new Set(ownedLists.map((l) => l.id));
    const shared = memberLists.filter((m) => !ownedIds.has(m.list_id)).map((m) => ({
      ...m.list,
      role: m.role,
    }));

    return res.status(200).json({
      success: true,
      lists: {
        owned: ownedLists.map((l) => ({ ...l, role: 'owner' })),
        shared,
      },
    });
  }

  if (req.method === 'POST') {
    const { name, description, color, icon } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Name is required' });

    const list = await prisma.taskList.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || null,
        icon: icon || null,
        owner_id: userId,
        share_token: crypto.randomBytes(16).toString('hex'),
      },
    });

    // Add owner as a member with 'owner' role
    await prisma.taskListMember.create({
      data: {
        list_id: list.id,
        user_id: userId,
        role: 'owner',
      },
    });

    await logActivity(prisma, {
      userId,
      listId: list.id,
      action: ACTIONS.LIST_CREATED,
      details: { name: list.name },
    });

    return res.status(201).json({ success: true, list });
  }

  res.setHeader('Allow', 'GET,POST');
  return res.status(405).end();
}

export default withPrisma(handler);
