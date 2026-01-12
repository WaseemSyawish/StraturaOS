const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function loadJSON(rel) {
  const p = path.join(__dirname, '..', 'data', rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function toDate(s) {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d;
}

async function run() {
  try {
    // Users
    const devUser = await loadJSON('dev-user.json');
    if (devUser) {
      await prisma.user.upsert({
        where: { id: devUser.id },
        update: { email: devUser.email, name: devUser.name },
        create: { id: devUser.id, email: devUser.email, name: devUser.name },
      });
      console.log('Upserted dev user', devUser.id);
    }

    // Events
    const eventsFile = await loadJSON('events.json');
    if (eventsFile && eventsFile.events && eventsFile.events.length) {
      for (const ev of eventsFile.events) {
        // Only include fields that exist in the Prisma `Event` model
        // Ensure user exists; default to dev user if referenced user is missing
        let targetUserId = ev.user_id || (devUser && devUser.id) || null;
        if (targetUserId) {
          const found = await prisma.user.findUnique({ where: { id: targetUserId } });
          if (!found && devUser && devUser.id) targetUserId = devUser.id;
        } else if (devUser && devUser.id) {
          targetUserId = devUser.id;
        }

        const data = {
          id: String(ev.id),
          title: ev.title || 'Untitled',
          type: ev.type || 'assignment',
          archived: !!ev.archived,
          course_id: ev.course_id || null,
          date: toDate(ev.date) || new Date(ev.created_at || Date.now()),
          time: ev.time || null,
          description: ev.description || null,
          completed: !!ev.completed,
          user_id: targetUserId,
          meta: ev.meta || null,
          end_date: toDate(ev.end_date) || null,
          created_at: toDate(ev.created_at) || undefined,
          updated_at: toDate(ev.updated_at) || undefined,
        };
        // Upsert by id
        await prisma.event.upsert({
          where: { id: data.id },
          update: data,
          create: data,
        });
        console.log('Upserted event', data.id);
      }
    } else {
      console.log('No events found to import.');
    }

    await prisma.$disconnect();
    console.log('Import completed.');
  } catch (e) {
    console.error('IMPORT_ERR', e);
    try { await prisma.$disconnect(); } catch (e2) {}
    process.exit(1);
  }
}

run();
