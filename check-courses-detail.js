const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCoursesByUser() {
  try {
    console.log('Checking courses in database by user_id:\n');

    const allCourses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        user_id: true,
      }
    });

    console.log(`Total courses in DB: ${allCourses.length}\n`);

    if (allCourses.length === 0) {
      console.log('No courses found!');
    } else {
      const grouped = {};
      for (const course of allCourses) {
        if (!grouped[course.user_id]) {
          grouped[course.user_id] = [];
        }
        grouped[course.user_id].push(course);
      }

      for (const userId in grouped) {
        console.log(`User: ${userId}`);
        grouped[userId].forEach(c => {
          console.log(`  - ${c.name} (ID: ${c.id})`);
        });
        console.log('');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCoursesByUser();
