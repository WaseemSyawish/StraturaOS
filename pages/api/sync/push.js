/**
 * API: Sync Push — POST
 * POST /api/sync/push  → Receive batched offline changes from the client
 *
 * Body: { changes: [{ type: 'create'|'update'|'delete', taskId, payload, clientVersion }] }
 *
 * Returns: { results: [{ taskId, status: 'ok'|'conflict'|'error', serverVersion?, task? }] }
 */
import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';
import withPrisma from '../../../lib/withPrisma';
import { buildEventWritePayload, eventToTask, TASK_EVENT_INCLUDE } from '../../../lib/task-helpers';
import { logActivity, ACTIONS } from '../../../lib/activity-logger';

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const userId = await resolveUser(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

  const { changes } = req.body || {};
  if (!Array.isArray(changes) || changes.length === 0) {
    return res.status(400).json({ success: false, error: 'No changes provided' });
  }

  if (changes.length > 100) {
    return res.status(400).json({ success: false, error: 'Too many changes in a single push (max 100)' });
  }

  const results = [];

  for (const change of changes) {
    const { type, taskId, payload, clientVersion } = change;

    try {
      if (type === 'create') {
        // Create new task
        const writeData = buildEventWritePayload({
          ...payload,
          userId,
        });
        const event = await prisma.event.create({
          data: {
            ...writeData,
            user_id: userId,
            version: 1,
          },
          include: TASK_EVENT_INCLUDE,
        });

        await logActivity(prisma, {
          userId,
          eventId: event.id,
          action: ACTIONS.TASK_CREATED,
          details: { source: 'offline_sync' },
        });

        results.push({
          clientTaskId: taskId,
          taskId: event.id,
          status: 'ok',
          serverVersion: 1,
          task: eventToTask(event),
        });
      } else if (type === 'update') {
        // Optimistic concurrency: check version match
        const existing = await prisma.event.findFirst({
          where: { id: taskId, user_id: userId },
        });

        if (!existing) {
          results.push({ taskId, status: 'error', error: 'Task not found' });
          continue;
        }

        if (clientVersion !== undefined && existing.version > clientVersion) {
          // Conflict — server has newer version
          const serverEvent = await prisma.event.findUnique({
            where: { id: taskId },
            include: TASK_EVENT_INCLUDE,
          });
          results.push({
            taskId,
            status: 'conflict',
            serverVersion: existing.version,
            serverTask: eventToTask(serverEvent),
          });
          continue;
        }

        // Apply update
        const updateData = {};
        if (payload.title !== undefined) updateData.title = payload.title;
        if (payload.description !== undefined) updateData.description = payload.description;
        if (payload.start !== undefined) updateData.start_time = new Date(payload.start);
        if (payload.end !== undefined) updateData.end_time = new Date(payload.end);

        // Merge meta
        const existingMeta = (typeof existing.meta === 'object' && existing.meta) || {};
        const newMeta = { ...existingMeta };
        if (payload.priority !== undefined) newMeta.priority = payload.priority;
        if (payload.tags !== undefined) newMeta.tags = payload.tags;
        if (payload.subtasks !== undefined) newMeta.subtasks = payload.subtasks;
        if (payload.status !== undefined) newMeta.status = payload.status;
        if (payload.assignedTo !== undefined) newMeta.assignedTo = payload.assignedTo;
        if (payload.myDay !== undefined) newMeta.myDay = payload.myDay;
        if (payload.important !== undefined) newMeta.important = payload.important;
        if (payload.type !== undefined) newMeta.type = payload.type;
        if (payload.completed !== undefined) newMeta.status = payload.completed ? 'completed' : 'todo';
        updateData.meta = newMeta;

        const updated = await prisma.event.update({
          where: { id: taskId },
          data: {
            ...updateData,
            version: { increment: 1 },
            updated_at: new Date(),
          },
          include: TASK_EVENT_INCLUDE,
        });

        await logActivity(prisma, {
          userId,
          eventId: taskId,
          action: ACTIONS.TASK_UPDATED,
          details: { source: 'offline_sync', fields: Object.keys(payload) },
        });

        results.push({
          taskId,
          status: 'ok',
          serverVersion: updated.version,
          task: eventToTask(updated),
        });
      } else if (type === 'delete') {
        const existing = await prisma.event.findFirst({
          where: { id: taskId, user_id: userId },
        });

        if (!existing) {
          results.push({ taskId, status: 'ok' }); // Already deleted
          continue;
        }

        await prisma.event.delete({ where: { id: taskId } });

        await logActivity(prisma, {
          userId,
          eventId: taskId,
          action: ACTIONS.TASK_DELETED,
          details: { source: 'offline_sync' },
        });

        results.push({ taskId, status: 'ok' });
      } else {
        results.push({ taskId, status: 'error', error: `Unknown change type: ${type}` });
      }
    } catch (err) {
      console.error(`[sync/push] Error processing change ${type} for ${taskId}:`, err);
      results.push({ taskId, status: 'error', error: err.message });
    }
  }

  return res.status(200).json({ success: true, results });
}

export default withPrisma(handler);
