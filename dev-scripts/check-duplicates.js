const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const YOUR_USER_ID = '265c42f0-477b-4878-b1b6-f204d61de18c';

async function main() {
  console.log('Checking for duplicate/problematic attendance records...\n');

  // Get embedded systems course
  const course = await prisma.course.findFirst({
    where: {
      user_id: YOUR_USER_ID,
      name: 'Embedded Systems'
    }
  });

  console.log(`Embedded Systems Course ID: ${course.id}\n`);

  // Get all sessions
  const sessions = await prisma.attendanceSession.findMany({
    where: {
      user_id: YOUR_USER_ID,
      course_id: course.id
    },
    orderBy: { date: 'asc' }
  });

  console.log(`Total sessions: ${sessions.length}\n`);

  // Check for duplicates (same date, same course, same user)
  const dateMap = {};
  const duplicates = [];

  sessions.forEach(session => {
    const dateKey = session.date.toISOString().split('T')[0];
    if (!dateMap[dateKey]) {
      dateMap[dateKey] = [];
    }
    dateMap[dateKey].push(session);
  });

  // Find dates with multiple records
  Object.entries(dateMap).forEach(([date, records]) => {
    if (records.length > 1) {
      duplicates.push({ date, count: records.length, records });
    }
  });

  console.log(`Dates with duplicates: ${duplicates.length}`);
  
  if (duplicates.length > 0) {
    console.log('\nDuplicate details:');
    duplicates.slice(0, 5).forEach(dup => {
      console.log(`\n${dup.date}: ${dup.count} records`);
      dup.records.forEach(r => {
        console.log(`  - Status: ${r.status}, Points: ${r.points}, ID: ${r.id}`);
      });
    });
  }

  // Count by status
  console.log('\nBreakdown by status:');
  const statuses = {};
  sessions.forEach(s => {
    statuses[s.status] = (statuses[s.status] || 0) + 1;
  });
  Object.entries(statuses).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  // Show first 10 and last 10
  console.log('\nFirst 5 sessions:');
  sessions.slice(0, 5).forEach(s => {
    console.log(`  ${s.date.toISOString().split('T')[0]}: ${s.status} (${s.points} points)`);
  });

  console.log('\nLast 5 sessions:');
  sessions.slice(-5).forEach(s => {
    console.log(`  ${s.date.toISOString().split('T')[0]}: ${s.status} (${s.points} points)`);
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
