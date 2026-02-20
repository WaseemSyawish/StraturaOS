const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDataOwnership() {
  try {
    console.log('📊 Checking data ownership in database...\n');

    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
    });
    console.log('Users in DB:', users);
    console.log('');

    // Check what user_id owns the data
    const coursesByUser = await prisma.course.groupBy({
      by: ['user_id'],
      _count: { id: true },
    });
    console.log('Courses by user_id:');
    for (const item of coursesByUser) {
      const user = users.find(u => u.id === item.user_id);
      console.log(`  ${item.user_id} (${user?.email || 'UNKNOWN USER'}): ${item._count.id} courses`);
    }
    console.log('');

    const eventsByUser = await prisma.event.groupBy({
      by: ['user_id'],
      _count: { id: true },
    });
    console.log('Events by user_id:');
    for (const item of eventsByUser) {
      const user = users.find(u => u.id === item.user_id);
      console.log(`  ${item.user_id} (${user?.email || 'UNKNOWN USER'}): ${item._count.id} events`);
    }
    console.log('');

    const attendanceByUser = await prisma.attendanceSession.groupBy({
      by: ['user_id'],
      _count: { id: true },
    });
    console.log('Attendance sessions by user_id:');
    for (const item of attendanceByUser) {
      const user = users.find(u => u.id === item.user_id);
      console.log(`  ${item.user_id} (${user?.email || 'UNKNOWN USER'}): ${item._count.id} sessions`);
    }

    console.log('\n');
    console.log('💡 YOUR USER ID: 265c42f0-477b-4878-b1b6-f204d61de18c (waseemdenha72@gmail.com)');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDataOwnership();
