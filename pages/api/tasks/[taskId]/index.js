import prisma from '../../../../lib/prisma';
import { resolveUser } from '../../../../lib/resolveUser';
import { TASK_EVENT_INCLUDE, buildTaskUpdatePayload, eventToTask } from '../../../../lib/task-helpers';

const requireTaskId = (taskId) => {
  if (!taskId || Array.isArray(taskId)) {
    throw new Error('Task id required');
  }
  return taskId;
};

const loadTask = async (taskId) =>
  prisma.event.findUnique({
    where: { id: taskId },
    include: TASK_EVENT_INCLUDE,
  });

export default async function handler(req, res) {
  const { taskId: taskIdRaw } = req.query;

  try {
    const taskId = requireTaskId(taskIdRaw);
    const userId = await resolveUser(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const existing = await loadTask(taskId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    if (existing.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, task: eventToTask(existing) });
    }

    if (req.method === 'PATCH') {
      const data = buildTaskUpdatePayload(req.body || {}, existing);
      if (!Object.keys(data).length) {
        return res.status(400).json({ success: false, error: 'No updates supplied' });
      }
      const updated = await prisma.event.update({
        where: { id: taskId },
        data,
        include: TASK_EVENT_INCLUDE,
      });
      return res.status(200).json({ success: true, task: eventToTask(updated) });
    }

    if (req.method === 'DELETE') {
      await prisma.event.delete({ where: { id: taskId } });
      return res.status(204).end();
    }

    res.setHeader('Allow', 'GET,PATCH,DELETE');
    return res.status(405).end();
  } catch (error) {
    if (error.message === 'Task id required') {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error(`[api/tasks/${req.query.taskId}] Error`, error);
    return res.status(500).json({ success: false, error: 'Task update failed' });
  }
}
