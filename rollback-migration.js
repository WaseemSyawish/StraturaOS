// ROLLBACK: Restore courses to their original state
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function rollbackMigration() {
  try {
    console.log('⏮️  ROLLING BACK MIGRATION...\n');

    // Ricko's courses - restore to "2025-1"
    const rickoCourses = [
      'Alan Meetings',
      'Embedded Systems'
    ];

    const rickoUserId = 'cfe5968c-be50-4080-84d9-fca017cd5c82';

    console.log('🔄 Restoring Ricko\'s courses to "2025-1"...');
    
    for (const courseName of rickoCourses) {
      const course = await prisma.course.findFirst({
        where: {
          name: courseName,
          user_id: rickoUserId
        }
      });

      if (course) {
        await prisma.course.update({
          where: { id: course.id },
          data: { semester: '2025-1' }
        });
        console.log(`  ✅ Restored: ${courseName} → "2025-1"`);
      }
    }

    console.log('\n✅ Rollback complete!\n');

    // Show final state
    const allCourses = await prisma.course.findMany({
      include: {
        users: {
          select: { email: true }
        }
      }
    });

    console.log('📊 Final state:');
    allCourses.forEach(c => {
      console.log(`  ${c.users.email}: ${c.name} → ${c.semester}`);
    });

  } catch (error) {
    console.error('❌ Rollback failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

rollbackMigration();
