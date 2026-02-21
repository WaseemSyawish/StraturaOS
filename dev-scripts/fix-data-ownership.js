const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const YOUR_USER_ID = '265c42f0-477b-4878-b1b6-f204d61de18c';
const RICKO_USER_ID = 'cfe5968c-be50-4080-84d9-fca017cd5c82';

async function main() {
  console.log('Starting data ownership fix...\n');

  // 1. Get all Embedded Systems courses for your user
  const embeddedSystems = await prisma.course.findMany({
    where: {
      user_id: YOUR_USER_ID,
      name: 'Embedded Systems'
    }
  });

  console.log(`Found ${embeddedSystems.length} "Embedded Systems" courses for you`);

  if (embeddedSystems.length >= 2) {
    const courseToTransfer = embeddedSystems[embeddedSystems.length - 1]; // Transfer the last one
    console.log(`Transferring Embedded Systems (${courseToTransfer.id}) to Ricko...`);
    
    await prisma.course.update({
      where: { id: courseToTransfer.id },
      data: { user_id: RICKO_USER_ID }
    });

    // Transfer associated events
    const eventsToTransfer = await prisma.event.findMany({
      where: { course_id: courseToTransfer.id }
    });

    if (eventsToTransfer.length > 0) {
      await prisma.event.updateMany({
        where: { course_id: courseToTransfer.id },
        data: { user_id: RICKO_USER_ID }
      });
      console.log(`  Transferred ${eventsToTransfer.length} events`);
    }
  }

  // 2. Transfer "Alan Meetings" to Ricko
  console.log(`\nTransferring "Alan Meetings" to Ricko...`);
  const alanMeetings = await prisma.course.findFirst({
    where: {
      user_id: YOUR_USER_ID,
      name: 'Alan Meetings'
    }
  });

  if (alanMeetings) {
    await prisma.course.update({
      where: { id: alanMeetings.id },
      data: { user_id: RICKO_USER_ID }
    });

    // Transfer associated events
    const eventsToTransfer = await prisma.event.findMany({
      where: { course_id: alanMeetings.id }
    });

    if (eventsToTransfer.length > 0) {
      await prisma.event.updateMany({
        where: { course_id: alanMeetings.id },
        data: { user_id: RICKO_USER_ID }
      });
      console.log(`  Transferred ${eventsToTransfer.length} events`);
    }
  }

  // 3. Transfer "25/26 - Semester 1" to Ricko
  console.log(`\nTransferring "25/26 - Semester 1" to Ricko...`);
  const rickoBadSemester = await prisma.semesterSetting.findFirst({
    where: {
      user_id: YOUR_USER_ID,
      name: '25/26 - Semester 1'
    }
  });

  if (rickoBadSemester) {
    await prisma.semesterSetting.update({
      where: { id: rickoBadSemester.id },
      data: { user_id: RICKO_USER_ID }
    });
  }

  // Verify final state
  console.log('\n=== VERIFICATION ===\n');

  const yourCourses = await prisma.course.findMany({
    where: { user_id: YOUR_USER_ID }
  });

  const yourSemesters = await prisma.semesterSetting.findMany({
    where: { user_id: YOUR_USER_ID }
  });

  const rickosCourses = await prisma.course.findMany({
    where: { user_id: RICKO_USER_ID }
  });

  const rickosSemesters = await prisma.semesterSetting.findMany({
    where: { user_id: RICKO_USER_ID }
  });

  console.log('YOUR COURSES:');
  yourCourses.forEach(c => console.log(`  - ${c.name}`));

  console.log('\nYOUR SEMESTERS:');
  yourSemesters.forEach(s => console.log(`  - ${s.name}`));

  console.log('\nRICKO\'S COURSES:');
  rickosCourses.forEach(c => console.log(`  - ${c.name}`));

  console.log('\nRICKO\'S SEMESTERS:');
  rickosSemesters.forEach(s => console.log(`  - ${s.name}`));

  console.log('\n✅ Data ownership fix complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
