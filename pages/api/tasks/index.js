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
      // Build query for non-archived tasks
      const where = { 
        user_id: userId,
        archived: false,
      };
      
      // Add completed filter if specified
      if (req.query.completed === 'true') {
        where.completed = true;
      } else if (req.query.completed === 'false') {
        where.completed = false;
      }

      // Debug logging (enabled in both dev and prod temporarily)
      console.log('[api/tasks] GET request from userId:', userId);
      console.log('[api/tasks] Query where clause:', JSON.stringify(where));
      const events = await fetchEvents(where);
      console.log('[api/tasks] Found events count:', events.length);
      if (events.length > 0) {
        console.log('[api/tasks] First event sample:', JSON.stringify({ id: events[0].id, title: events[0].title, type: events[0].type, archived: events[0].archived }));
      }
      
      const tasks = sortTasks(events.map(eventToTask));
      const view = req.query.view;
      const payload = view === 'my-day' ? filterTasksForMyDay(tasks) : tasks;

      return res.status(200).json({ success: true, tasks: payload, total: tasks.length });
    }

    if (req.method === 'POST') {
      const data = buildEventWritePayload(req.body || {}, userId);
      console.log('[api/tasks] POST - Creating task with data:', JSON.stringify({ title: data.title, type: data.type, archived: data.archived, user_id: data.user_id }));
      const created = await createEvent(data);
      console.log('[api/tasks] POST - Created event id:', created.id);
      const persisted = await prisma.event.findUnique({
        where: { id: created.id },
        include: TASK_EVENT_INCLUDE,
      });
      console.log('[api/tasks] POST - Persisted event:', JSON.stringify({ id: persisted?.id, archived: persisted?.archived }));
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
