// Migration script to update course semesters to match semester_settings
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateCourses() {
  try {
    console.log('🔍 Checking current state...\n');

    // Get all courses
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        semester: true,
        user_id: true
      }
    });

    console.log(`📚 Found ${courses.length} courses:`);
    courses.forEach(c => {
      console.log(`  - ${c.name} (semester: "${c.semester}")`);
    });

    // Get all semester settings
    const semesters = await prisma.semesterSetting.findMany({
      select: {
        id: true,
        name: true,
        start_date: true,
        end_date: true,
        user_id: true
      }
    });

    console.log(`\n📅 Found ${semesters.length} semester settings:`);
    semesters.forEach(s => {
      console.log(`  - ${s.name} (${s.start_date.toLocaleDateString()} - ${s.end_date.toLocaleDateString()})`);
    });

    // Find courses that need migration (have old format semester)
    const coursesToMigrate = courses.filter(course => {
      // Check if semester matches any existing semester_setting by ID
      const matchesSemesterId = semesters.some(sem => sem.id === course.semester);
      return !matchesSemesterId; // Needs migration if doesn't match any semester ID
    });

    if (coursesToMigrate.length === 0) {
      console.log('\n✅ All courses already use valid semester IDs. No migration needed!');
      return;
    }

    console.log(`\n🔄 Need to migrate ${coursesToMigrate.length} courses:`);
    coursesToMigrate.forEach(c => {
      console.log(`  - ${c.name} (current semester: "${c.semester}")`);
    });

    // AUTOMATIC MIGRATION OPTION
    // If you want to assign ALL old courses to a specific semester, set this:
    const AUTO_MIGRATE_TO_SEMESTER_NAME = "2025/2026 - Semester 1"; // Change this to match your semester name
    
    console.log('\n🔗 Migrating courses to semester...\n');

    const targetSemester = semesters.find(sem => sem.name === AUTO_MIGRATE_TO_SEMESTER_NAME);

    if (!targetSemester) {
      console.log(`❌ Target semester "${AUTO_MIGRATE_TO_SEMESTER_NAME}" not found!`);
      console.log('\nAvailable semesters:');
      semesters.forEach(s => console.log(`  - "${s.name}"`));
      console.log('\nUpdate AUTO_MIGRATE_TO_SEMESTER_NAME in the script and try again.');
      return;
    }

    console.log(`📌 Target semester: "${targetSemester.name}"`);
    console.log(`   Start: ${targetSemester.start_date.toLocaleDateString()}`);
    console.log(`   End: ${targetSemester.end_date.toLocaleDateString()}\n`);

    for (const course of coursesToMigrate) {
      console.log(`  ✅ Migrating "${course.name}": "${course.semester}" → "${targetSemester.name}"`);
      
      // Update the course
      await prisma.course.update({
        where: { id: course.id },
        data: { semester: targetSemester.id }
      });
    }

    console.log('\n✅ Migration complete!\n');

    // Show final state
    const updatedCourses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        semester: true
      }
    });

    console.log('📊 Final state:');
    updatedCourses.forEach(c => {
      const sem = semesters.find(s => s.id === c.semester);
      if (sem) {
        console.log(`  ✅ ${c.name} → ${sem.name}`);
      } else {
        console.log(`  ⚠️  ${c.name} → ${c.semester} (not linked to semester_settings)`);
      }
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateCourses();
