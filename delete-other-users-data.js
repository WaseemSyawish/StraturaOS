const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllOtherUsersData() {
  try {
    const targetUserId = '265c42f0-477b-4878-b1b6-f204d61de18c'; // waseemdenha72@gmail.com - YOUR ACCOUNT
    
    console.log('🚨 SECURITY: Deleting ALL data from other users...\n');
    console.log(`Target user to keep: ${targetUserId}\n`);

    // Get all user data counts BEFORE deletion
    console.log('📊 Data counts BEFORE deletion:');
    const coursesByUser = await prisma.course.groupBy({
      by: ['user_id'],
      _count: { id: true },
    });
    for (const item of coursesByUser) {
      console.log(`  Courses - user ${item.user_id}: ${item._count.id}`);
    }

    // Delete from ALL tables for non-target users
    const deleted = {
      courses: 0,
      events: 0,
      attendance: 0,
      focusSessions: 0,
      archived: 0,
      semester: 0,
      focusSettings: 0,
    };

    // Get all other user IDs
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    const otherUserIds = allUsers.filter(u => u.id !== targetUserId).map(u => u.id);

    console.log(`\nDeleting data for ${otherUserIds.length} other users: ${otherUserIds.join(', ')}\n`);

    if (otherUserIds.length > 0) {
      const res1 = await prisma.course.deleteMany({ where: { user_id: { in: otherUserIds } } });
      deleted.courses = res1.count;

      const res2 = await prisma.event.deleteMany({ where: { user_id: { in: otherUserIds } } });
      deleted.events = res2.count;

      const res3 = await prisma.attendanceSession.deleteMany({ where: { user_id: { in: otherUserIds } } });
      deleted.attendance = res3.count;

      const res4 = await prisma.focusSession.deleteMany({ where: { user_id: { in: otherUserIds } } });
      deleted.focusSessions = res4.count;

      const res5 = await prisma.archivedEvent.deleteMany({ where: { user_id: { in: otherUserIds } } });
      deleted.archived = res5.count;

      const res6 = await prisma.semesterSetting.deleteMany({ where: { user_id: { in: otherUserIds } } });
      deleted.semester = res6.count;

      const res7 = await prisma.focusSettings.deleteMany({ where: { user_id: { in: otherUserIds } } });
      deleted.focusSettings = res7.count;
    }

    console.log('✅ DELETED:');
    console.log(`  - ${deleted.courses} courses`);
    console.log(`  - ${deleted.events} events`);
    console.log(`  - ${deleted.attendance} attendance sessions`);
    console.log(`  - ${deleted.focusSessions} focus sessions`);
    console.log(`  - ${deleted.archived} archived events`);
    console.log(`  - ${deleted.semester} semester settings`);
    console.log(`  - ${deleted.focusSettings} focus settings`);
    
    const totalDeleted = Object.values(deleted).reduce((a, b) => a + b, 0);
    console.log(`\n🗑️  TOTAL RECORDS DELETED: ${totalDeleted}\n`);

    // Verify - show what remains
    console.log('📊 Remaining data (should ONLY be for your user):');
    const remainingCourses = await prisma.course.groupBy({
      by: ['user_id'],
      _count: { id: true },
    });
    for (const item of remainingCourses) {
      console.log(`  Courses - user ${item.user_id}: ${item._count.id}`);
    }

    const yourCourses = await prisma.course.count({ where: { user_id: targetUserId } });
    const yourEvents = await prisma.event.count({ where: { user_id: targetUserId } });
    const yourAttendance = await prisma.attendanceSession.count({ where: { user_id: targetUserId } });
    
    console.log(`\nYour data (${targetUserId}):`);
    console.log(`  📚 Courses: ${yourCourses}`);
    console.log(`  📅 Events: ${yourEvents}`);
    console.log(`  ✓ Attendance: ${yourAttendance}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllOtherUsersData();
