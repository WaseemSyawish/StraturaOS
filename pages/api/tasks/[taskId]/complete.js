import prisma from '../../../../lib/prisma';
import { resolveUser } from '../../../../lib/resolveUser';
import { TASK_EVENT_INCLUDE, eventToTask } from '../../../../lib/task-helpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const { taskId } = req.query;
  if (!taskId || Array.isArray(taskId)) {
    return res.status(400).json({ success: false, error: 'Task id required' });
  }

  try {
    const userId = await resolveUser(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const existing = await prisma.event.findUnique({
      where: { id: taskId },
      include: TASK_EVENT_INCLUDE,
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const requestedState = req.body && typeof req.body.completed === 'boolean' ? req.body.completed : null;
    const completed = requestedState === null ? !existing.completed : requestedState;

    const updated = await prisma.event.update({
      where: { id: taskId },
      data: {
        completed,
        updated_at: new Date(),
      },
      include: TASK_EVENT_INCLUDE,
    });

    return res.status(200).json({ success: true, task: eventToTask(updated) });
  } catch (error) {
    console.error(`[api/tasks/${req.query.taskId}/complete] Failed to update`, error);
    return res.status(500).json({ success: false, error: 'Failed to update task' });
  }
}
