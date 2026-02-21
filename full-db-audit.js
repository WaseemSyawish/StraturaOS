const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditDatabase() {
  try {
    console.log('🔍 FULL DATABASE AUDIT\n');
    console.log('='.repeat(80));

    // Users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });
    console.log('\n👥 USERS:');
    users.forEach(u => console.log(`  ${u.email} (${u.id})`));

    // Courses
    console.log('\n📚 COURSES:');
    const coursesByUser = await prisma.course.groupBy({
      by: ['user_id'],
      _count: { id: true }
    });
    for (const item of coursesByUser) {
      const user = users.find(u => u.id === item.user_id);
      console.log(`  ${user?.email || 'UNKNOWN'} (${item.user_id}): ${item._count.id} courses`);
      const courses = await prisma.course.findMany({
        where: { user_id: item.user_id },
        select: { id: true, name: true }
      });
      courses.forEach(c => console.log(`    - ${c.name}`));
    }

    // Events
    console.log('\n📅 EVENTS:');
    const eventsByUser = await prisma.event.groupBy({
      by: ['user_id'],
      _count: { id: true }
    });
    for (const item of eventsByUser) {
      const user = users.find(u => u.id === item.user_id);
      console.log(`  ${user?.email || 'UNKNOWN'} (${item.user_id}): ${item._count.id} events`);
    }

    // Attendance
    console.log('\n✓ ATTENDANCE SESSIONS:');
    const attendanceByUser = await prisma.attendanceSession.groupBy({
      by: ['user_id'],
      _count: { id: true }
    });
    for (const item of attendanceByUser) {
      const user = users.find(u => u.id === item.user_id);
      console.log(`  ${user?.email || 'UNKNOWN'} (${item.user_id}): ${item._count.id} sessions`);
    }

    // Semester Settings
    console.log('\n⚙️ SEMESTER SETTINGS:');
    const semestersByUser = await prisma.semesterSetting.groupBy({
      by: ['user_id'],
      _count: { id: true }
    });
    for (const item of semestersByUser) {
      const user = users.find(u => u.id === item.user_id);
      console.log(`  ${user?.email || 'UNKNOWN'} (${item.user_id}): ${item._count.id} semesters`);
      const semesters = await prisma.semesterSetting.findMany({
        where: { user_id: item.user_id },
        select: { id: true, name: true }
      });
      semesters.forEach(s => console.log(`    - ${s.name}`));
    }

    // Assessments
    console.log('\n📝 ASSESSMENTS:');
    const assessments = await prisma.assessment.groupBy({
      by: ['course_id'],
      _count: { id: true }
    });
    if (assessments.length > 0) {
      for (const item of assessments) {
        console.log(`  Course ${item.course_id}: ${item._count.id} assessments`);
        const assList = await prisma.assessment.findMany({
          where: { course_id: item.course_id },
          select: { id: true, name: true, course_id: true }
        });
        assList.forEach(a => console.log(`    - ${a.name}`));
      }
    } else {
      console.log('  (none)');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n🎯 YOUR USER ID: 265c42f0-477b-4878-b1b6-f204d61de18c');
    console.log('🔴 RICKO USER ID: cfe5968c-be50-4080-84d9-fca017cd5c82');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

auditDatabase();
