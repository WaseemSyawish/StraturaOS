export const COURSE_FIELDS = {
  name: true,
  code: true,
  color: true,
};

export const TASK_EVENT_INCLUDE = {
  courses: {
    select: COURSE_FIELDS,
  },
};

const DEFAULT_COLOR = '#94a3b8';

const ensureMetaObject = (meta) => (meta && typeof meta === 'object' ? meta : {});

export const eventToTask = (event = {}) => {
  const meta = ensureMetaObject(event.meta);
  const dueDate = event.date instanceof Date ? event.date.toISOString() : event.date ?? null;
  const updatedAt = event.updated_at instanceof Date ? event.updated_at.toISOString() : event.updated_at ?? null;
  const courseLabel = event.courses?.name || meta.course || null;
  const courseColor = event.courses?.color || meta.courseColor || null;

  return {
    id: event.id,
    title: event.title,
    description: event.description || '',
    dueDate,
    course: courseLabel,
    courseColor,
    courseId: event.course_id || meta.courseId || null,
    type: event.type || meta.type || 'task',
    priority: meta.priority || 'medium',
    important: Boolean(meta.important),
    myDay: meta.myDay ?? false,
    status: meta.status || 'backlog',
    completed: Boolean(event.completed),
    completedAt: event.completed ? updatedAt : null,
    reminders: Array.isArray(event.reminders) ? event.reminders : [],
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    assignedTo: Array.isArray(meta.assignedTo) ? meta.assignedTo : [],
    attachments: Array.isArray(event.attachments) ? event.attachments : [],
  };
};

export const buildTaskMeta = (existingMeta, updates = {}) => {
  const next = { ...ensureMetaObject(existingMeta) };
  const fields = ['priority', 'important', 'myDay', 'tags', 'assignedTo', 'course', 'courseColor', 'type', 'status', 'addedToMyDay'];
  fields.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(updates, key) && updates[key] !== undefined) {
      next[key] = updates[key];
    }
  });
  if (updates.courseId && !next.courseId) {
    next.courseId = updates.courseId;
  }
  return next;
};

export const parseDueDateInput = (value) => {
  if (!value) return { date: null, time: null };
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return { date: null, time: null };
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return { date, time: `${hours}:${minutes}` };
};

export const buildEventWritePayload = (body = {}, userId, existingMeta = {}) => {
  if (!userId) throw new Error('User ID is required');
  const { date, time } = parseDueDateInput(body.dueDate);

  const data = {
    title: body.title?.trim() || 'Untitled Task',
    description: body.description?.trim() || '',
    type: body.type || body.category || 'task',
    user_id: userId,
    course_id: body.courseId || null,
    completed: Boolean(body.completed),
    reminders: Array.isArray(body.reminders) ? body.reminders : undefined,
  };

  if (date) data.date = date;
  if (time && !body.time) data.time = time;
  if (body.time) data.time = body.time;
  if (body.endDate) {
    const endDate = body.endDate instanceof Date ? body.endDate : new Date(body.endDate);
    if (!Number.isNaN(endDate.getTime())) data.end_date = endDate;
  }

  const meta = buildTaskMeta(existingMeta, body);
  if (Object.keys(meta).length) {
    data.meta = meta;
  }

  return data;
};

export const buildTaskUpdatePayload = (body = {}, existing = {}) => {
  const data = {};

  if (Object.prototype.hasOwnProperty.call(body, 'title')) {
    const next = body.title && body.title.trim() ? body.title.trim() : existing.title || 'Untitled Task';
    data.title = next;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'description')) {
    data.description = body.description ?? '';
  }

  if (Object.prototype.hasOwnProperty.call(body, 'type')) {
    data.type = body.type || existing.type || 'task';
  }

  if (Object.prototype.hasOwnProperty.call(body, 'courseId')) {
    data.course_id = body.courseId || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'dueDate')) {
    if (!body.dueDate) {
      data.date = null;
    } else {
      const { date, time } = parseDueDateInput(body.dueDate);
      if (date) data.date = date;
      if (time) data.time = time;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'time')) {
    data.time = body.time || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'endDate')) {
    if (!body.endDate) {
      data.end_date = null;
    } else {
      const endDate = body.endDate instanceof Date ? body.endDate : new Date(body.endDate);
      if (!Number.isNaN(endDate.getTime())) data.end_date = endDate;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'completed')) {
    data.completed = Boolean(body.completed);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'reminders')) {
    data.reminders = Array.isArray(body.reminders) ? body.reminders : [];
  }

  const meta = buildTaskMeta(existing.meta, body);
  if (Object.keys(meta).length) {
    data.meta = meta;
  }

  return data;
};

export const filterTasksForMyDay = (tasks = []) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return tasks.filter((task) => {
    if (task.myDay) return true;
    if (task.important && !task.completed) return true;
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    if (Number.isNaN(due.getTime())) return false;
    if (due < now) return true;
    return due >= start && due < end;
  });
};

export const TASK_FIELDS = {
  id: true,
  title: true,
  type: true,
  location: true,
  archived: true,
  course_id: true,
  color: true,
  template_id: true,
  date: true,
  time: true,
  end_date: true,
  description: true,
  completed: true,
  meta: true,
  reminders: true,
  remindersFired: true,
  user_id: true,
  created_at: true,
  updated_at: true,
};
