const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

function toDate(val) {
  if (!val) return undefined;
  const d = new Date(val);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

async function upsertMany(modelClient, items, keys, idKey = 'id') {
  if (!items || !items.length) return;
  for (const it of items) {
    const id = it[idKey];
    if (!id) continue;
    const data = pick(it, keys);
    // convert known date fields
    for (const k of Object.keys(data)) {
      if (k.toLowerCase().includes('date') || k.endsWith('_at') || k.endsWith('expires')) {
        data[k] = toDate(data[k]) || undefined;
      }
    }
    try {
      await modelClient.upsert({ where: { id: String(id) }, update: data, create: data });
      console.log('Upserted', modelClient._modelName || modelClient.name || 'item', id);
    } catch (e) {
      console.error('Failed upsert', modelClient._modelName || modelClient.name || 'item', id, e.message);
    }
  }
}

async function run() {
  try {
    const folder = process.argv[2] || path.join(__dirname, '..', 'backups', '2025-12-07T15-55-41');
    console.log('Importing from', folder);

    const files = {
      users: 'users.json',
      semester_settings: 'semester_settings.json',
      courses: 'courses.json',
      course_resources: 'course_resources.json',
      focus_settings: 'focus_settings.json',
      focus_sessions: 'focus_sessions.json',
      events: 'events.json',
      archived_events: 'archived_events.json',
      attendance_sessions: 'attendance_sessions.json',
      full: 'full-backup.json'
    };

    // Load files
    const users = loadJSON(path.join(folder, files.users));
    const semester_settings = loadJSON(path.join(folder, files.semester_settings));
    const courses = loadJSON(path.join(folder, files.courses));
    const course_resources = loadJSON(path.join(folder, files.course_resources));
    const focus_settings = loadJSON(path.join(folder, files.focus_settings));
    const focus_sessions = loadJSON(path.join(folder, files.focus_sessions));
    const events = loadJSON(path.join(folder, files.events));
    const archived_events = loadJSON(path.join(folder, files.archived_events));
    const attendance_sessions = loadJSON(path.join(folder, files.attendance_sessions));
    const full = loadJSON(path.join(folder, files.full));

    // If full-backup exists and contains arrays, prefer its lists
    const use = (name) => {
      if (full && full[name] && Array.isArray(full[name])) return full[name];
      return eval(name);
    };

    // Upsert order: users -> semester_settings -> courses -> course_resources -> focus_settings -> focus_sessions -> events -> archived_events -> attendance_sessions

    if (users) {
      const list = Array.isArray(users) ? users : (users.users || users.rows || []);
      await upsertMany(prisma.user, list, ['id', 'email', 'name', 'settings', 'password_hash', 'password_reset_token', 'password_reset_expires', 'created_at', 'updated_at']);
    }

    if (semester_settings) {
      const list = Array.isArray(semester_settings) ? semester_settings : (semester_settings.semester_settings || []);
      await upsertMany(prisma.semesterSetting, list, ['id','user_id','name','start_date','end_date','is_active','created_at','updated_at']);
    }

    if (courses) {
      const list = Array.isArray(courses) ? courses : (courses.courses || []);
      await upsertMany(prisma.course, list, ['id','name','code','credits','color','semester','instructor','description','user_id','created_at','updated_at','course_website','office_hours','zoom_link']);
    }

    if (course_resources) {
      const list = Array.isArray(course_resources) ? course_resources : (course_resources.course_resources || course_resources || []);
      await upsertMany(prisma.courseResource, list, ['id','course_id','title','type','url','content','category','order','created_at','updated_at']);
    }

    if (focus_settings) {
      const list = Array.isArray(focus_settings) ? focus_settings : (focus_settings.focus_settings || []);
      await upsertMany(prisma.focusSettings, list, ['id','user_id','focus_duration','short_break_duration','long_break_duration','sessions_until_long_break','sound_enabled','sound_volume','sound_type','notifications_enabled','auto_start_breaks','auto_start_focus','daily_goal_sessions','theme_preference','created_at','updated_at']);
    }

    if (focus_sessions) {
      const list = Array.isArray(focus_sessions) ? focus_sessions : (focus_sessions.focus_sessions || []);
      await upsertMany(prisma.focusSession, list, ['id','user_id','task_id','session_type','duration','started_at','ended_at','completed','notes','created_at','updated_at','task_name','interrupted']);
    }

    if (events) {
      const list = Array.isArray(events) ? events : (events.events || []);
      // reuse earlier event import logic: map fields allowed
      for (const ev of list) {
        const id = String(ev.id);
        const data = {
          id,
          title: ev.title || 'Untitled',
          type: ev.type || 'assignment',
          archived: !!ev.archived,
          course_id: ev.course_id || null,
          date: toDate(ev.date),
          time: ev.time || null,
          description: ev.description || null,
          completed: !!ev.completed,
          user_id: ev.user_id || null,
          meta: ev.meta || null,
          end_date: toDate(ev.end_date) || undefined,
          created_at: toDate(ev.created_at) || undefined,
          updated_at: toDate(ev.updated_at) || undefined,
          template_id: ev.template_id || null,
          location: ev.location || null,
        };
        try {
          // Ensure user exists
          if (data.user_id) {
            const u = await prisma.user.findUnique({ where: { id: data.user_id } });
            if (!u) {
              // fallback to any user
              const anyUser = await prisma.user.findFirst();
              data.user_id = anyUser ? anyUser.id : null;
            }
          }
          await prisma.event.upsert({ where: { id }, update: data, create: data });
          console.log('Upserted event', id);
        } catch (e) {
          console.error('Event upsert failed', id, e.message);
        }
      }
    }

    if (archived_events) {
      const list = Array.isArray(archived_events) ? archived_events : (archived_events.archived_events || []);
      for (const ev of list) {
        const id = String(ev.id);
        const data = {
          id,
          original_event_id: ev.original_event_id || null,
          title: ev.title || 'Untitled',
          type: ev.type || 'assignment',
          archived: ev.archived !== undefined ? !!ev.archived : true,
          course_id: ev.course_id || null,
          date: toDate(ev.date),
          time: ev.time || null,
          description: ev.description || null,
          completed: !!ev.completed,
          user_id: ev.user_id || null,
          created_at: toDate(ev.created_at) || undefined,
          updated_at: toDate(ev.updated_at) || undefined,
          location: ev.location || null,
          meta: ev.meta || null,
          end_date: toDate(ev.end_date) || undefined,
        };
        try {
          if (data.user_id) {
            const u = await prisma.user.findUnique({ where: { id: data.user_id } });
            if (!u) {
              const anyUser = await prisma.user.findFirst();
              data.user_id = anyUser ? anyUser.id : null;
            }
          }
          await prisma.archivedEvent.upsert({ where: { id }, update: data, create: data });
          console.log('Upserted archived_event', id);
        } catch (e) {
          console.error('Archived event upsert failed', id, e.message);
        }
      }
    }

    if (attendance_sessions) {
      const list = Array.isArray(attendance_sessions) ? attendance_sessions : (attendance_sessions.sessions || attendance_sessions || []);
      for (const s of list) {
        const id = String(s.id);
        const data = {
          id,
          date: toDate(s.date),
          status: s.status,
          points: s.points !== undefined ? s.points : null,
          notes: s.notes || null,
          user_id: s.user_id || null,
          course_id: s.course_id || null,
          created_at: toDate(s.created_at) || undefined,
          updated_at: toDate(s.updated_at) || undefined,
        };
        try {
          // ensure user exists
          if (data.user_id) {
            const u = await prisma.user.findUnique({ where: { id: data.user_id } });
            if (!u) {
              const anyUser = await prisma.user.findFirst();
              data.user_id = anyUser ? anyUser.id : null;
            }
          }
          await prisma.attendanceSession.upsert({ where: { id }, update: data, create: data });
          console.log('Upserted attendance_session', id);
        } catch (e) {
          console.error('Attendance upsert failed', id, e.message);
        }
      }
    }

    console.log('\nImport finished.');
    await prisma.$disconnect();
  } catch (e) {
    console.error('IMPORT_ERR', e.message);
    try { await prisma.$disconnect(); } catch (e2) {}
    process.exit(1);
  }
}

run();
