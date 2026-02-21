const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const YOUR_USER_ID = '265c42f0-477b-4878-b1b6-f204d61de18c';

async function main() {
  console.log('Checking ALL courses for duplicate attendance records...\n');

  // Get all your courses
  const courses = await prisma.course.findMany({
    where: { user_id: YOUR_USER_ID }
  });

  console.log(`Your courses: ${courses.length}`);
  
  let totalDuplicates = 0;

  for (const course of courses) {
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        user_id: YOUR_USER_ID,
        course_id: course.id
      },
      orderBy: [{ date: 'asc' }, { created_at: 'asc' }]
    });

    // Check for duplicates
    const dateMap = {};
    let courseDuplicates = 0;

    sessions.forEach(session => {
      const dateKey = session.date.toISOString().split('T')[0];
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(session);
    });

    Object.values(dateMap).forEach(records => {
      if (records.length > 1) {
        courseDuplicates += records.length - 1;
      }
    });

    if (courseDuplicates > 0) {
      console.log(`  ${course.name}: ${sessions.length} sessions, ${courseDuplicates} duplicates`);
      totalDuplicates += courseDuplicates;
    } else {
      console.log(`  ${course.name}: ${sessions.length} sessions (clean)`);
    }
  }

  console.log(`\nTotal duplicates across all courses: ${totalDuplicates}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
