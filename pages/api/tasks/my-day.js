import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';
import {
  COURSE_FIELDS,
  TASK_EVENT_INCLUDE,
  TASK_FIELDS,
  eventToTask,
  filterTasksForMyDay,
} from '../../../lib/task-helpers';

const isDev = process.env.NODE_ENV === 'development';

const META_ERROR_HINTS = ['does not exist', 'no such column', 'unknown argument', 'unknown arg'];

const isMetaSchemaError = (error) => {
  if (!error) return false;
  const message = String(error.message || error).toLowerCase();
  if (!message.includes('meta')) return false;
  return META_ERROR_HINTS.some((hint) => message.includes(hint));
};

const selectWithoutMeta = (() => {
  const base = { ...TASK_FIELDS };
  delete base.meta;
  return {
    ...base,
    courses: {
      select: COURSE_FIELDS,
    },
  };
})();

const sortTasks = (tasks) =>
  [...tasks].sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.title.localeCompare(b.title);
  });

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  try {
    res.setHeader('Cache-Control', 'private, no-store');
    const userId = await resolveUser(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const where = { user_id: userId, archived: false };
    let events;

    try {
      events = await prisma.event.findMany({
        where,
        orderBy: { date: 'asc' },
        include: TASK_EVENT_INCLUDE,
      });
    } catch (err) {
      if (!isMetaSchemaError(err)) throw err;
      events = await prisma.event.findMany({
        where,
        orderBy: { date: 'asc' },
        select: selectWithoutMeta,
      });
    }

    const tasks = events.map(eventToTask);
    const myDay = sortTasks(filterTasksForMyDay(tasks));

    return res.status(200).json({
      success: true,
      tasks: myDay,
      total: tasks.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (isDev) console.error('[api/tasks/my-day] Failed to load tasks', error);
    return res.status(500).json({ success: false, error: 'Failed to load tasks' });
  }
}
