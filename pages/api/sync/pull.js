/**
 * API: Sync Pull — GET
 * GET /api/sync/pull?since=<ISO timestamp>&cursor=<taskId>
 *
 * Returns tasks updated since the given timestamp for incremental sync.
 * If no `since` param, returns all tasks (full sync).
 *
 * Response: { tasks: [...], syncTimestamp: ISO, hasMore: boolean }
 */
import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';
import withPrisma from '../../../lib/withPrisma';
import { eventToTask, TASK_EVENT_INCLUDE } from '../../../lib/task-helpers';

const PAGE_SIZE = 200;

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const userId = await resolveUser(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

  const { since, cursor } = req.query;
  const syncTimestamp = new Date().toISOString();

  const where = { user_id: userId };

  // Filter by update timestamp for incremental sync
  if (since) {
    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid since timestamp' });
    }
    where.updated_at = { gte: sinceDate };
  }

  // Cursor-based pagination
  const findArgs = {
    where,
    include: TASK_EVENT_INCLUDE,
    orderBy: { id: 'asc' },
    take: PAGE_SIZE + 1, // Fetch one extra to detect hasMore
  };

  if (cursor) {
    findArgs.cursor = { id: cursor };
    findArgs.skip = 1; // Skip the cursor itself
  }

  const events = await prisma.event.findMany(findArgs);

  const hasMore = events.length > PAGE_SIZE;
  const page = hasMore ? events.slice(0, PAGE_SIZE) : events;

  const tasks = page.map((e) => ({
    ...eventToTask(e),
    version: e.version,
    updatedAt: e.updated_at?.toISOString(),
  }));

  return res.status(200).json({
    success: true,
    tasks,
    syncTimestamp,
    hasMore,
    nextCursor: hasMore ? page[page.length - 1]?.id : null,
  });
}

export default withPrisma(handler);
