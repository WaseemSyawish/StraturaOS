const prisma = require('./lib/prisma').default;

(async () => {
  try {
    console.log('📚 Checking ALL Courses:');
    const courses = await prisma.course.findMany({
      select: { id: true, name: true, semester: true, user_id: true }
    });
    courses.forEach(c => {
      console.log(`  - ${c.name}: semester="${c.semester}" (user: ${c.user_id})`);
    });
    
    console.log('\n📅 Checking ALL Semester Settings:');
    const semesters = await prisma.semesterSetting.findMany({
      select: { id: true, name: true, user_id: true }
    });
    semesters.forEach(s => {
      console.log(`  - "${s.name}" (ID: ${s.id}, user: ${s.user_id})`);
    });
    
  } catch(e) {
    console.error('❌ Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
