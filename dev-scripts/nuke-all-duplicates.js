const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const YOUR_USER_ID = '265c42f0-477b-4878-b1b6-f204d61de18c';

async function main() {
  console.log('COMPREHENSIVE duplicate removal across ALL courses...\n');

  // Get all your courses
  const courses = await prisma.course.findMany({
    where: { user_id: YOUR_USER_ID }
  });

  let totalDeleted = 0;

  for (const course of courses) {
    console.log(`\n=== ${course.name} ===`);
    
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        user_id: YOUR_USER_ID,
        course_id: course.id
      },
      orderBy: [{ date: 'asc' }, { created_at: 'asc' }]
    });

    console.log(`Total sessions: ${sessions.length}`);

    // Group by date + status (exact duplicates must have same date AND status)
    const uniqueKey = {};
    const toDelete = [];

    sessions.forEach(session => {
      const key = `${session.date.toISOString().split('T')[0]}_${session.status}`;
      
      if (!uniqueKey[key]) {
        uniqueKey[key] = [];
      }
      uniqueKey[key].push(session.id);
    });

    // Keep first, delete rest
    Object.entries(uniqueKey).forEach(([key, ids]) => {
      if (ids.length > 1) {
        console.log(`  Duplicate found: ${key} appears ${ids.length} times`);
        toDelete.push(...ids.slice(1)); // Keep first, delete rest
      }
    });

    if (toDelete.length > 0) {
      console.log(`  Deleting ${toDelete.length} duplicates...`);
      
      await prisma.attendanceSession.deleteMany({
        where: { id: { in: toDelete } }
      });

      totalDeleted += toDelete.length;
      console.log(`  ✓ Deleted ${toDelete.length}`);
    }

    // Report final count
    const finalCount = await prisma.attendanceSession.count({
      where: {
        user_id: YOUR_USER_ID,
        course_id: course.id
      }
    });

    const finalSessions = await prisma.attendanceSession.findMany({
      where: {
        user_id: YOUR_USER_ID,
        course_id: course.id
      }
    });

    const breakdown = {};
    finalSessions.forEach(s => {
      breakdown[s.status] = (breakdown[s.status] || 0) + 1;
    });

    console.log(`  Final: ${finalCount} sessions - ${JSON.stringify(breakdown)}`);
  }

  console.log(`\n✅ TOTAL DUPLICATES REMOVED: ${totalDeleted}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
