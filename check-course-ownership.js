// Check which courses belong to which user
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCourseOwnership() {
  try {
    console.log('🔍 Checking course ownership...\n');

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    console.log('👥 Users:');
    users.forEach(u => {
      console.log(`  - ${u.email || 'No email'} (${u.name || 'No name'}) - ID: ${u.id}`);
    });

    // Get all courses with user info
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        semester: true,
        user_id: true
      }
    });

    console.log('\n📚 Courses by user:');
    users.forEach(user => {
      const userCourses = courses.filter(c => c.user_id === user.id);
      console.log(`\n  ${user.email || user.name || user.id}:`);
      if (userCourses.length === 0) {
        console.log('    (no courses)');
      } else {
        userCourses.forEach(c => {
          console.log(`    - ${c.name} (semester: ${c.semester})`);
        });
      }
    });

    // Get semester settings by user
    const semesters = await prisma.semesterSetting.findMany({
      select: {
        id: true,
        name: true,
        user_id: true
      }
    });

    console.log('\n📅 Semester Settings by user:');
    users.forEach(user => {
      const userSemesters = semesters.filter(s => s.user_id === user.id);
      console.log(`\n  ${user.email || user.name || user.id}:`);
      if (userSemesters.length === 0) {
        console.log('    (no semester settings)');
      } else {
        userSemesters.forEach(s => {
          console.log(`    - ${s.name} (ID: ${s.id})`);
        });
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCourseOwnership();
