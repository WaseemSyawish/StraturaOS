const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const YOUR_USER_ID = '265c42f0-477b-4878-b1b6-f204d61de18c';

async function main() {
  console.log('Checking attendance data for your courses...\n');

  // Get your courses
  const courses = await prisma.course.findMany({
    where: { user_id: YOUR_USER_ID }
  });

  console.log(`Your courses: ${courses.length}`);
  courses.forEach(c => console.log(`  - ${c.name} (${c.id})`));

  console.log('\nAttendance sessions per course:');
  
  for (const course of courses) {
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        course_id: course.id,
        user_id: YOUR_USER_ID
      }
    });

    console.log(`  ${course.name}: ${sessions.length} sessions`);
    
    if (sessions.length > 0) {
      // Show breakdown by status
      const breakdown = {
        present: sessions.filter(s => s.status === 'present').length,
        absent: sessions.filter(s => s.status === 'absent').length,
        late: sessions.filter(s => s.status === 'late').length,
        excused: sessions.filter(s => s.status === 'excused').length,
        holiday: sessions.filter(s => s.status === 'holiday').length
      };
      
      console.log(`    Breakdown: Present=${breakdown.present}, Absent=${breakdown.absent}, Late=${breakdown.late}, Excused=${breakdown.excused}, Holiday=${breakdown.holiday}`);
    }
  }

  // Total count
  const totalSessions = await prisma.attendanceSession.count({
    where: { user_id: YOUR_USER_ID }
  });

  console.log(`\nTotal attendance sessions: ${totalSessions}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
