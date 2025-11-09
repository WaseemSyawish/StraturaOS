const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

// PostgreSQL connection (explicitly use Railway URL)
const prismaPostgres = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// SQLite connection
const sqlitePath = path.join(__dirname, '../prisma/dev.db');
const sqlite = sqlite3(sqlitePath, { readonly: true });

async function migrateSQLiteToPostgres() {
  try {
    console.log('🔄 Starting migration from SQLite to PostgreSQL...\n');

    // Get current PostgreSQL user (the one you just created)
    const pgUsers = await prismaPostgres.user.findMany();
    if (pgUsers.length === 0) {
      console.error('❌ No user found in PostgreSQL. Please create an account first.');
      process.exit(1);
    }
    const currentPgUser = pgUsers[0];
    console.log(`✅ PostgreSQL user: ${currentPgUser.email} (${currentPgUser.id})\n`);

    // 1. Migrate Courses
    console.log('📚 Migrating courses...');
    const sqliteCourses = sqlite.prepare('SELECT * FROM courses').all();
    const courseIdMap = new Map(); // Map old SQLite IDs to new PostgreSQL IDs
    
    for (const oldCourse of sqliteCourses) {
      const newCourse = await prismaPostgres.course.create({
        data: {
          name: oldCourse.name,
          code: oldCourse.code,
          semester: oldCourse.semester,
          instructor: oldCourse.instructor,
          color: oldCourse.color,
          credits: oldCourse.credits,
          description: oldCourse.description,
          user_id: currentPgUser.id,
        }
      });
      courseIdMap.set(oldCourse.id, newCourse.id);
      console.log(`   ✓ ${newCourse.name} (${newCourse.code})`);
    }
    console.log(`✅ Migrated ${sqliteCourses.length} courses\n`);

    // 2. Migrate Events
    console.log('📅 Migrating events...');
    const sqliteEvents = sqlite.prepare('SELECT * FROM events').all();
    let eventCount = 0;
    
    for (const oldEvent of sqliteEvents) {
      try {
        // Map course_id from SQLite to PostgreSQL
        let newCourseId = null;
        if (oldEvent.course_id) {
          newCourseId = courseIdMap.get(oldEvent.course_id) || null;
        }

        await prismaPostgres.event.create({
          data: {
            title: oldEvent.title,
            type: oldEvent.type || 'assignment',
            date: new Date(oldEvent.date),
            time: oldEvent.time,
            description: oldEvent.description,
            completed: Boolean(oldEvent.completed),
            archived: Boolean(oldEvent.archived),
            user_id: currentPgUser.id,
            course_id: newCourseId,
            color: oldEvent.color,
            meta: oldEvent.meta ? JSON.parse(oldEvent.meta) : undefined,
            end_date: oldEvent.end_date ? new Date(oldEvent.end_date) : null,
          }
        });
        eventCount++;
      } catch (err) {
        console.log(`   ⚠️  Skipped event: ${oldEvent.title} (${err.message})`);
      }
    }
    console.log(`✅ Migrated ${eventCount} events\n`);

    // 3. Migrate Attendance Sessions
    console.log('✅ Migrating attendance sessions...');
    const sqliteAttendance = sqlite.prepare('SELECT * FROM attendance_sessions').all();
    let attendanceCount = 0;
    
    for (const oldSession of sqliteAttendance) {
      try {
        let newCourseId = null;
        if (oldSession.course_id) {
          newCourseId = courseIdMap.get(oldSession.course_id) || null;
        }

        if (newCourseId) {
          await prismaPostgres.attendanceSession.create({
            data: {
              date: new Date(oldSession.date),
              status: oldSession.status,
              points: oldSession.points,
              notes: oldSession.notes,
              user_id: currentPgUser.id,
              course_id: newCourseId,
            }
          });
          attendanceCount++;
        }
      } catch (err) {
        console.log(`   ⚠️  Skipped attendance session (${err.message})`);
      }
    }
    console.log(`✅ Migrated ${attendanceCount} attendance sessions\n`);

    console.log('🎉 Migration complete!\n');
    console.log('Summary:');
    console.log(`   - User: ${currentPgUser.email}`);
    console.log(`   - Courses: ${sqliteCourses.length}`);
    console.log(`   - Events: ${eventCount}`);
    console.log(`   - Attendance: ${attendanceCount}`);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    sqlite.close();
    await prismaPostgres.$disconnect();
  }
}

migrateSQLiteToPostgres();
