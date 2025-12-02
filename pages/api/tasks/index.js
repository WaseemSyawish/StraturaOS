import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';
import withPrisma from '../../../lib/withPrisma';
import {
  COURSE_FIELDS,
  TASK_EVENT_INCLUDE,
  TASK_FIELDS,
  buildEventWritePayload,
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

const fetchEvents = async (where) => {
  try {
    return await prisma.event.findMany({
      where,
      orderBy: { date: 'asc' },
      include: TASK_EVENT_INCLUDE,
    });
  } catch (error) {
    if (!isMetaSchemaError(error)) throw error;
    return prisma.event.findMany({
      where,
      orderBy: { date: 'asc' },
      select: selectWithoutMeta,
    });
  }
};

const createEvent = async (data) => {
  try {
    return await prisma.event.create({ data });
  } catch (error) {
    if (!isMetaSchemaError(error) || !data.meta) throw error;
    const safeData = { ...data };
    delete safeData.meta;
    return prisma.event.create({ data: safeData });
  }
};

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET,POST,OPTIONS');
    return res.status(204).end();
  }

  try {
    const userId = await resolveUser(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    if (req.method === 'GET') {
      const where = { user_id: userId, archived: false };
      if (req.query.completed === 'true') where.completed = true;
      if (req.query.completed === 'false') where.completed = false;

      const events = await fetchEvents(where);
      const tasks = sortTasks(events.map(eventToTask));
      const view = req.query.view;
      const payload = view === 'my-day' ? filterTasksForMyDay(tasks) : tasks;

      return res.status(200).json({ success: true, tasks: payload, total: tasks.length });
    }

    if (req.method === 'POST') {
      const data = buildEventWritePayload(req.body || {}, userId);
      const created = await createEvent(data);
      const persisted = await prisma.event.findUnique({
        where: { id: created.id },
        include: TASK_EVENT_INCLUDE,
      });
      return res.status(201).json({ success: true, task: eventToTask(persisted) });
    }

    res.setHeader('Allow', 'GET,POST,OPTIONS');
    return res.status(405).end();
  } catch (error) {
    if (isDev) console.error('[api/tasks] Error handling request', error);
    return res.status(500).json({ success: false, error: 'Task operation failed' });
  }
}

export default withPrisma(handler);
