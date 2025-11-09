const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAttendance() {
  try {
    console.log('🔍 Checking attendance data...\n');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(u => console.log(`  - ${u.email} (${u.id})`));
    console.log();
    
    // Check attendance for each user
    for (const user of users) {
      const sessions = await prisma.attendanceSession.findMany({
        where: { user_id: user.id },
        include: {
          courses: {
            select: { name: true, code: true }
          }
        }
      });
      
      console.log(`📅 Attendance for ${user.email}:`);
      if (sessions.length === 0) {
        console.log('  (no attendance sessions)');
      } else {
        sessions.forEach(s => {
          console.log(`  - ${s.courses.name} (${s.courses.code}): ${s.status} on ${new Date(s.date).toLocaleDateString()}`);
        });
      }
      console.log();
    }
    
    console.log('✅ Attendance check complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkAttendance();
