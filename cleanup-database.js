const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDatabase() {
  try {
    const targetUserId = '265c42f0-477b-4878-b1b6-f204d61de18c'; // waseemdenha72@gmail.com - Waseem
    const targetUserEmail = 'waseemdenha72@gmail.com';

    console.log('🧹 Cleaning database - keeping ONLY your data...\n');
    console.log(`Target user: ${targetUserEmail} (${targetUserId})\n`);

    // Find all OTHER users
    const allUsers = await prisma.user.findMany({ select: { id: true, email: true } });
    const otherUsers = allUsers.filter(u => u.id !== targetUserId);
    
    console.log('Found other users to remove data from:');
    for (const user of otherUsers) {
      console.log(`  - ${user.email} (${user.id})`);
    }
    console.log('');

    // Delete data from other users
    let totalDeleted = 0;

    for (const user of otherUsers) {
      const courses = await prisma.course.deleteMany({ where: { user_id: user.id } });
      const events = await prisma.event.deleteMany({ where: { user_id: user.id } });
      const attendance = await prisma.attendanceSession.deleteMany({ where: { user_id: user.id } });
      const focusSessions = await prisma.focusSession.deleteMany({ where: { user_id: user.id } });
      const archived = await prisma.archivedEvent.deleteMany({ where: { user_id: user.id } });
      const semesterSettings = await prisma.semesterSetting.deleteMany({ where: { user_id: user.id } });
      const focusSettings = await prisma.focusSettings.deleteMany({ where: { user_id: user.id } });

      const deleted = courses.count + events.count + attendance.count + focusSessions.count + archived.count + semesterSettings.count + focusSettings.count;
      totalDeleted += deleted;

      console.log(`✓ Deleted ${deleted} records from ${user.email}`);
    }

    console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} records.\n`);

    // Show your final data
    console.log('Your data:');
    const yourCourses = await prisma.course.count({ where: { user_id: targetUserId } });
    const yourEvents = await prisma.event.count({ where: { user_id: targetUserId } });
    const yourAttendance = await prisma.attendanceSession.count({ where: { user_id: targetUserId } });
    console.log(`  📚 Courses: ${yourCourses}`);
    console.log(`  📅 Events: ${yourEvents}`);
    console.log(`  ✓ Attendance Sessions: ${yourAttendance}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDatabase();
