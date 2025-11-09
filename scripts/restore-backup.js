const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreBackup() {
  try {
    console.log('🔄 Starting data restore...\n');

    // Get the current user (the one you just created)
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.error('❌ No user found. Please create an account first.');
      process.exit(1);
    }
    const currentUser = users[0]; // Use the first user
    console.log(`✅ Found user: ${currentUser.email} (${currentUser.id})\n`);

    // 1. Restore Courses/Modules
    console.log('📚 Restoring courses...');
    const gradesPath = path.join(__dirname, '../data/grades.json');
    const gradesData = JSON.parse(fs.readFileSync(gradesPath, 'utf8'));
    
    const courseMap = new Map(); // Map old course names to new course IDs
    
    for (const oldCourse of gradesData) {
      const newCourse = await prisma.course.create({
        data: {
          name: oldCourse.name,
          code: oldCourse.code,
          semester: oldCourse.semester || '2025-1',
          user_id: currentUser.id,
          color: '#3B82F6', // Default blue
          credits: 3
        }
      });
      courseMap.set(oldCourse.name, newCourse.id);
      console.log(`   ✓ Created: ${newCourse.name} (${newCourse.code})`);
    }
    console.log(`✅ Restored ${gradesData.length} courses\n`);

    // 2. Restore Events
    console.log('📅 Restoring events...');
    const eventsPath = path.join(__dirname, '../data/backup-events-2025-10-01T15-46-57-772Z.json');
    const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
    
    let restoredCount = 0;
    let skippedCount = 0;

    for (const oldEvent of eventsData) {
      try {
        // Find the new course_id if this event has a course
        let newCourseId = null;
        if (oldEvent.course_id) {
          // Try to find course by looking up in the backup
          const matchingCourse = gradesData.find(c => {
            // You might need to adjust this matching logic
            return true; // For now, we'll skip course matching
          });
        }

        await prisma.event.create({
          data: {
            title: oldEvent.title,
            type: oldEvent.type || 'assignment',
            date: new Date(oldEvent.date),
            time: oldEvent.time,
            description: oldEvent.description,
            completed: oldEvent.completed || false,
            archived: oldEvent.archived || false,
            user_id: currentUser.id,
            course_id: newCourseId,
            color: oldEvent.color,
            meta: oldEvent.meta || undefined,
            end_date: oldEvent.end_date ? new Date(oldEvent.end_date) : null,
          }
        });
        restoredCount++;

        if (restoredCount % 100 === 0) {
          console.log(`   ⏳ Restored ${restoredCount} events...`);
        }
      } catch (err) {
        skippedCount++;
        if (skippedCount <= 5) {
          console.log(`   ⚠️  Skipped event: ${oldEvent.title} (${err.message})`);
        }
      }
    }
    
    console.log(`✅ Restored ${restoredCount} events (${skippedCount} skipped)\n`);

    console.log('🎉 Restore complete!\n');
    console.log('Summary:');
    console.log(`   - User: ${currentUser.email}`);
    console.log(`   - Courses: ${gradesData.length}`);
    console.log(`   - Events: ${restoredCount}`);
    
  } catch (error) {
    console.error('❌ Error during restore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreBackup();
