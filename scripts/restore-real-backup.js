/**
 * Restore REAL backup data from December 7, 2025
 * This has all the actual user data: courses, attendance, events, users, etc.
 * Run with: DATABASE_URL=... node scripts/restore-real-backup.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreRealBackup() {
  try {
    console.log('🔄 Restoring REAL backup from December 7, 2025...\n');

    const backupPath = path.join(__dirname, '../backups/2025-12-07T15-55-41');

    // 1. Restore users first
    console.log('👤 Restoring users...');
    const usersPath = path.join(backupPath, 'users.json');
    let primaryUserId = null;
    
    if (fs.existsSync(usersPath)) {
      const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      const users = Array.isArray(usersData) ? usersData : (usersData.users || []);
      
      let created = 0;
      for (const user of users) {
        try {
          const result = await prisma.user.upsert({
            where: { id: user.id },
            update: user,
            create: user,
          });
          if (!primaryUserId) primaryUserId = result.id;
          created++;
        } catch (err) {
          console.warn(`⚠ Skipped user ${user.email}: ${err.message}`);
        }
      }
      console.log(`✓ Restored ${created} users\n`);
    }

    if (!primaryUserId) {
      throw new Error('No users in backup - cannot continue');
    }

    // 2. Restore courses
    console.log('📚 Restoring courses...');
    const coursesPath = path.join(backupPath, 'courses.json');
    if (fs.existsSync(coursesPath)) {
      const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
      const courses = Array.isArray(coursesData) ? coursesData : (coursesData.courses || []);
      
      let created = 0;
      for (const course of courses) {
        try {
          const courseData = {
            ...course,
            user_id: primaryUserId,
          };
          await prisma.course.upsert({
            where: { id: course.id },
            update: courseData,
            create: courseData,
          });
          created++;
        } catch (err) {
          console.warn(`⚠ Skipped course ${course.code}: ${err.message}`);
        }
      }
      console.log(`✓ Restored ${created}/${courses.length} courses\n`);
    }

    // 3. Restore attendance sessions
    console.log('✅ Restoring attendance sessions...');
    const attendancePath = path.join(backupPath, 'attendance_sessions.json');
    if (fs.existsSync(attendancePath)) {
      const attendanceData = JSON.parse(fs.readFileSync(attendancePath, 'utf8'));
      const sessions = Array.isArray(attendanceData) ? attendanceData : (attendanceData.sessions || []);
      
      let created = 0;
      for (const session of sessions) {
        try {
          const sessionData = {
            ...session,
            user_id: primaryUserId,
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
      const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
      const events = Array.isArray(eventsData) ? eventsData : (eventsData.events || []);
      
      let created = 0;
      for (const event of events) {
        try {
          // Parse dates properly
          let eventDate = event.date || event.start_time;
          if (eventDate && typeof eventDate === 'string' && eventDate.length === 10) {
            eventDate = eventDate + 'T00:00:00Z';
          }
          
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
            user_id: primaryUserId,
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

    // 5. Restore semester settings
    console.log('🎓 Restoring semester settings...');
    const semesterPath = path.join(backupPath, 'semester_settings.json');
    if (fs.existsSync(semesterPath)) {
      const semesterData = JSON.parse(fs.readFileSync(semesterPath, 'utf8'));
      const semesters = Array.isArray(semesterData) ? semesterData : (semesterData.semesters || []);
      
      let created = 0;
      for (const semester of semesters) {
        try {
          const semesterCreateData = {
            ...semester,
            user_id: primaryUserId,
            start_date: new Date(semester.start_date),
            end_date: new Date(semester.end_date),
          };
          await prisma.semesterSetting.upsert({
            where: { id: semester.id },
            update: semesterCreateData,
            create: semesterCreateData,
          });
          created++;
        } catch (err) {
          console.warn(`⚠ Skipped semester: ${err.message}`);
        }
      }
      console.log(`✓ Restored ${created}/${semesters.length} semester settings\n`);
    }

    // Summary
    console.log('✅ REAL backup restoration complete!\n');
    console.log('📊 Database Summary:');
    console.log(`   Users: ${await prisma.user.count()}`);
    console.log(`   Courses: ${await prisma.course.count()}`);
    console.log(`   Attendance Sessions: ${await prisma.attendanceSession.count()}`);
    console.log(`   Events: ${await prisma.event.count()}`);
    console.log(`   Semester Settings: ${await prisma.semesterSetting.count()}`);
    console.log('\n✨ Your data is restored!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restoreRealBackup();
