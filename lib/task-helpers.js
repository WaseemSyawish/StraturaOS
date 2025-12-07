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
  const rawDate = event.date instanceof Date ? event.date.toISOString() : event.date ?? null;
  // Check if this task has no real due date (using placeholder date)
  const hasNoDueDate = meta.noDueDate === true || (rawDate && new Date(rawDate).getFullYear() >= 2099);
  const dueDate = hasNoDueDate ? null : rawDate;
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
    subtasks: Array.isArray(meta.subtasks) ? meta.subtasks : [],
    assignedTo: Array.isArray(meta.assignedTo) ? meta.assignedTo : [],
    attachments: Array.isArray(event.attachments) ? event.attachments : [],
  };
};

export const buildTaskMeta = (existingMeta, updates = {}) => {
  const next = { ...ensureMetaObject(existingMeta) };
  const fields = ['priority', 'important', 'myDay', 'tags', 'subtasks', 'assignedTo', 'course', 'courseColor', 'type', 'status', 'addedToMyDay', 'noDueDate'];
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
    // Default to far future date if no date provided (allows tasks without due dates)
    date: date || new Date('2099-12-31T23:59:59.999Z'),
  };

  if (time && !body.time) data.time = time;
  if (body.time) data.time = body.time;
  if (body.endDate) {
    const endDate = body.endDate instanceof Date ? body.endDate : new Date(body.endDate);
    if (!Number.isNaN(endDate.getTime())) data.end_date = endDate;
  }

  const meta = buildTaskMeta(existingMeta, body);
  // Track if the task has no real due date
  if (!date) {
    meta.noDueDate = true;
  }
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
      // Use far-future placeholder date since date field is required in DB
      data.date = new Date('2099-12-31T23:59:59.999Z');
      // Mark as having no due date via meta
      const existingMeta = ensureMetaObject(existing.meta);
      data.meta = { ...existingMeta, noDueDate: true };
    } else {
      const { date, time } = parseDueDateInput(body.dueDate);
      if (date) {
        data.date = date;
        // Clear the noDueDate flag when setting a real date
        const existingMeta = ensureMetaObject(existing.meta);
        data.meta = { ...existingMeta, noDueDate: false };
      }
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

  // Build meta from body fields, then merge any explicit meta set during date handling
  const baseMeta = buildTaskMeta(existing.meta, body);
  const finalMeta = data.meta ? { ...baseMeta, ...data.meta } : baseMeta;
  if (Object.keys(finalMeta).length) {
    data.meta = finalMeta;
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
