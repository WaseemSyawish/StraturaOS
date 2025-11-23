// FIXED: Migrate only YOUR courses, not other users' courses
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMigration() {
  try {
    console.log('🔧 FIXING MIGRATION - Only migrating YOUR courses\n');

    const YOUR_USER_ID = '265c42f0-477b-4878-b1b6-f204d61de18c'; // waseemdenha72@gmail.com
    const YOUR_SEMESTER_ID = 'a1712b67-d6ca-4b4d-8073-b8fcdd779280'; // "2025/2026 - Semester 1"
    
    // Step 1: Restore Ricko's courses to "2025-1"
    console.log('⏮️  Step 1: Restoring other users\' courses...');
    
    const otherUsersCourses = await prisma.course.findMany({
      where: {
        user_id: { not: YOUR_USER_ID },
        semester: YOUR_SEMESTER_ID // These were wrongly migrated
      },
      include: {
        users: { select: { email: true } }
      }
    });

    for (const course of otherUsersCourses) {
      await prisma.course.update({
        where: { id: course.id },
        data: { semester: '2025-1' }
      });
      console.log(`  ✅ Restored: ${course.users.email} - ${course.name} → "2025-1"`);
    }

    // Step 2: Ensure YOUR courses are correctly migrated
    console.log('\n✅ Step 2: Ensuring YOUR courses are migrated...');
    
    const yourCourses = await prisma.course.findMany({
      where: { user_id: YOUR_USER_ID }
    });

    for (const course of yourCourses) {
      if (course.semester !== YOUR_SEMESTER_ID) {
        await prisma.course.update({
          where: { id: course.id },
          data: { semester: YOUR_SEMESTER_ID }
        });
        console.log(`  ✅ Migrated: ${course.name} → "2025/2026 - Semester 1"`);
      } else {
        console.log(`  ✓ Already correct: ${course.name}`);
      }
    }

    console.log('\n✅ FIX COMPLETE!\n');

    // Show final state
    const allCourses = await prisma.course.findMany({
      include: {
        users: { select: { email: true } }
      },
      orderBy: { user_id: 'asc' }
    });

    console.log('📊 Final state:');
    let currentUser = null;
    allCourses.forEach(c => {
      if (currentUser !== c.users.email) {
        currentUser = c.users.email;
        console.log(`\n  ${currentUser}:`);
      }
      const semesterDisplay = c.semester === YOUR_SEMESTER_ID 
        ? '"2025/2026 - Semester 1" ✅' 
        : `"${c.semester}"`;
      console.log(`    - ${c.name} → ${semesterDisplay}`);
    });

    console.log('\n\n💡 SUMMARY:');
    console.log('  ✅ YOUR courses (waseemdenha72): Linked to "2025/2026 - Semester 1"');
    console.log('  ✅ Ricko\'s courses: Restored to "2025-1" (they need to create their own semester)');
    console.log('\n  Ricko can now:');
    console.log('    1. Create their own semester in the modules page');
    console.log('    2. Their courses will automatically match by name, OR');
    console.log('    3. They can manually reassign courses through the edit form');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    if (error.message.includes("Can't reach database")) {
      console.log('\n⚠️  Database is down. Run this script again when it\'s back online.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixMigration();
