/**
 * Simple data restore script - restores backup JSON to Railway database
 * Run with: DATABASE_URL=... node scripts/quick-restore.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function quickRestore() {
  try {
    console.log('🔄 Starting quick data restore to Railway...\n');

    const backupPath = path.join(__dirname, '../backups/offline-backup-2026-01-12T14-43-32-870Z/data');

    // 1. Create/restore dev user
    console.log('👤 Creating dev user...');
    const devUser = {
      id: 'dev-user',
      email: 'dev@example.com',
      name: 'Local Developer',
    };
    
    await prisma.user.upsert({
      where: { id: devUser.id },
      update: devUser,
      create: devUser,
    });
    console.log(`✓ User: ${devUser.email}\n`);

    // 2. Restore courses
    console.log('📚 Restoring courses...');
    const coursesPath = path.join(backupPath, 'courses.json');
    if (fs.existsSync(coursesPath)) {
      const coursesFile = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
      const courses = Array.isArray(coursesFile) ? coursesFile : (coursesFile.courses || []);
      let created = 0;
      for (const course of courses) {
        try {
          await prisma.course.upsert({
            where: { id: course.id },
            update: { ...course, user_id: devUser.id },
            create: { ...course, user_id: devUser.id },
          });
          created++;
        } catch (err) {
          console.warn(`⚠ Skipped ${course.code}: ${err.message}`);
        }
      }
      console.log(`✓ Restored ${created}/${courses.length} courses\n`);
    }

    // 3. Restore attendance
    console.log('✅ Restoring attendance sessions...');
    const attendancePath = path.join(backupPath, 'attendance.json');
    if (fs.existsSync(attendancePath)) {
      const attendanceFile = JSON.parse(fs.readFileSync(attendancePath, 'utf8'));
      const sessions = Array.isArray(attendanceFile) ? attendanceFile : (attendanceFile.attendance || []);
      let created = 0;
      for (const session of sessions) {
        try {
          const sessionData = {
            ...session,
            user_id: devUser.id,
            date: new Date(session.date),
          };
          await prisma.attendanceSession.upsert({
            where: { id: session.id },
            update: sessionData,
            create: sessionData,
          });
          created++;
        } catch (err) {
          console.warn(`⚠ Skipped session: ${err.message}`);
        }
      }
      console.log(`✓ Restored ${created}/${sessions.length} attendance sessions\n`);
    }

    // 4. Restore events
    console.log('📅 Restoring events...');
    const eventsPath = path.join(backupPath, 'events.json');
    if (fs.existsSync(eventsPath)) {
      const eventsFile = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
      const events = Array.isArray(eventsFile) ? eventsFile : (eventsFile.events || []);
      let created = 0;
      for (const event of events) {
        try {
          // Parse date properly - convert to DateTime if it's just a date string
          let eventDate = event.date;
          if (eventDate && typeof eventDate === 'string' && eventDate.length === 10) {
            // It's just a date like "2025-09-19" - add time
            eventDate = eventDate + 'T00:00:00Z';
          }
          
          // Only include fields that exist in the schema
          const eventData = {
            id: event.id,
            title: event.title,
            type: event.type || undefined,
            date: eventDate ? new Date(eventDate) : undefined,
            time: event.time && event.time.length > 0 ? event.time : undefined,
            description: event.description || undefined,
            completed: event.completed || false,
            archived: event.archived || false,
            course_id: event.course_id || undefined,
            user_id: devUser.id,
            created_at: event.created_at ? new Date(event.created_at) : new Date(),
            updated_at: event.updated_at ? new Date(event.updated_at) : new Date(),
          };
          
          // Remove undefined fields
          Object.keys(eventData).forEach(key => eventData[key] === undefined && delete eventData[key]);
          
          await prisma.event.upsert({
            where: { id: event.id },
            update: eventData,
            create: eventData,
          });
          created++;
        } catch (err) {
          console.warn(`⚠ Skipped event: ${err.message}`);
        }
      }
      console.log(`✓ Restored ${created}/${events.length} events\n`);
    }

    // 5. Restore grades
    console.log('📊 Restoring grades...');
    const gradesPath = path.join(backupPath, 'grades.json');
    if (fs.existsSync(gradesPath)) {
      const gradesFile = JSON.parse(fs.readFileSync(gradesPath, 'utf8'));
      const grades = Array.isArray(gradesFile) ? gradesFile : (gradesFile.grades || []);
      let created = 0;
      for (const grade of grades) {
        try {
          await prisma.grade.upsert({
            where: { id: grade.id },
            update: { ...grade, user_id: devUser.id },
            create: { ...grade, user_id: devUser.id },
          });
          created++;
        } catch (err) {
          console.warn(`⚠ Skipped grade: ${err.message}`);
        }
      }
      console.log(`✓ Restored ${created}/${grades.length} grades\n`);
    }

    // Summary
    console.log('✅ Restore complete!\n');
    console.log('📊 Database Summary:');
    console.log(`   Users: ${await prisma.user.count()}`);
    console.log(`   Courses: ${await prisma.course.count()}`);
    console.log(`   Attendance: ${await prisma.attendanceSession.count()}`);
    console.log(`   Events: ${await prisma.event.count()}`);
    // Grades model may not exist in current schema
    try {
      console.log(`   Grades: ${await prisma.grade.count()}`);
    } catch (err) {
      console.log(`   Grades: (model not in schema)`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

quickRestore();
