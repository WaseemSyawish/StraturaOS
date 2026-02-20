const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function reassignDataToCorrectUser() {
  try {
    const oldUserId = 'dd4eb982-6298-4ebb-be9c-4c10b8865b44'; // waseemsyawish72@gmail.com (from backup)
    const newUserId = '265c42f0-477b-4878-b1b6-f204d61de18c'; // waseemdenha72@gmail.com (current)

    console.log('🔄 Reassigning all data from old user to new user...\n');
    console.log(`Old user: ${oldUserId}`);
    console.log(`New user: ${newUserId}\n`);

    // Update courses
    const coursesUpdated = await prisma.course.updateMany({
      where: { user_id: oldUserId },
      data: { user_id: newUserId },
    });
    console.log(`✓ Updated ${coursesUpdated.count} courses`);

    // Update events
    const eventsUpdated = await prisma.event.updateMany({
      where: { user_id: oldUserId },
      data: { user_id: newUserId },
    });
    console.log(`✓ Updated ${eventsUpdated.count} events`);

    // Update attendance sessions
    const attendanceUpdated = await prisma.attendanceSession.updateMany({
      where: { user_id: oldUserId },
      data: { user_id: newUserId },
    });
    console.log(`✓ Updated ${attendanceUpdated.count} attendance sessions`);

    // Update focus sessions
    const focusSessionsUpdated = await prisma.focusSession.updateMany({
      where: { user_id: oldUserId },
      data: { user_id: newUserId },
    });
    console.log(`✓ Updated ${focusSessionsUpdated.count} focus sessions`);

    // Update archived events
    const archivedUpdated = await prisma.archivedEvent.updateMany({
      where: { user_id: oldUserId },
      data: { user_id: newUserId },
    });
    console.log(`✓ Updated ${archivedUpdated.count} archived events`);

    // Update semester settings
    const semesterUpdated = await prisma.semesterSetting.updateMany({
      where: { user_id: oldUserId },
      data: { user_id: newUserId },
    });
    console.log(`✓ Updated ${semesterUpdated.count} semester settings`);

    // Update focus settings
    const focusSettingsUpdated = await prisma.focusSettings.updateMany({
      where: { user_id: oldUserId },
      data: { user_id: newUserId },
    });
    console.log(`✓ Updated ${focusSettingsUpdated.count} focus settings`);

    console.log('\n✅ All data successfully reassigned!');
    console.log('\nYour data is now:');
    const courses = await prisma.course.count({ where: { user_id: newUserId } });
    const events = await prisma.event.count({ where: { user_id: newUserId } });
    const attendance = await prisma.attendanceSession.count({ where: { user_id: newUserId } });
    console.log(`  📚 Courses: ${courses}`);
    console.log(`  📅 Events: ${events}`);
    console.log(`  ✓ Attendance Sessions: ${attendance}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

reassignDataToCorrectUser();
