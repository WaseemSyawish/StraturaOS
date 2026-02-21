const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const YOUR_USER_ID = '265c42f0-477b-4878-b1b6-f204d61de18c';

async function main() {
  console.log('Removing duplicate attendance records...\n');

  // Get embedded systems course
  const course = await prisma.course.findFirst({
    where: {
      user_id: YOUR_USER_ID,
      name: 'Embedded Systems'
    }
  });

  console.log(`Embedded Systems Course ID: ${course.id}\n`);

  // Get all sessions ordered by date and creation time
  const sessions = await prisma.attendanceSession.findMany({
    where: {
      user_id: YOUR_USER_ID,
      course_id: course.id
    },
    orderBy: [{ date: 'asc' }, { created_at: 'asc' }]
  });

  // Group by date and find duplicates
  const dateMap = {};
  const toDelete = [];

  sessions.forEach(session => {
    const dateKey = session.date.toISOString().split('T')[0];
    if (!dateMap[dateKey]) {
      dateMap[dateKey] = [];
    }
    dateMap[dateKey].push(session);
  });

  // Keep first record per date, mark rest for deletion
  Object.entries(dateMap).forEach(([date, records]) => {
    if (records.length > 1) {
      console.log(`${date}: Keeping ${records[0].id}, deleting ${records.length - 1} duplicates`);
      records.slice(1).forEach(r => {
        toDelete.push(r.id);
      });
    }
  });

  console.log(`\nTotal duplicates to delete: ${toDelete.length}`);

  if (toDelete.length > 0) {
    await prisma.attendanceSession.deleteMany({
      where: {
        id: { in: toDelete }
      }
    });

    console.log(`✅ Deleted ${toDelete.length} duplicate records`);
  }

  // Verify
  const finalCount = await prisma.attendanceSession.count({
    where: {
      user_id: YOUR_USER_ID,
      course_id: course.id
    }
  });

  console.log(`\nFinal session count: ${finalCount}`);
  
  // Show final breakdown
  const finalSessions = await prisma.attendanceSession.findMany({
    where: {
      user_id: YOUR_USER_ID,
      course_id: course.id
    }
  });

  const statuses = {};
  finalSessions.forEach(s => {
    statuses[s.status] = (statuses[s.status] || 0) + 1;
  });

  console.log('\nFinal breakdown:');
  Object.entries(statuses).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
