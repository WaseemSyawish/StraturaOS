const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const YOUR_USER_ID = '265c42f0-477b-4878-b1b6-f204d61de18c';
const RICKO_USER_ID = 'cfe5968c-be50-4080-84d9-fca017cd5c82';

async function main() {
  console.log('Fixing attendance records linked to wrong courses...\n');

  // Find all Embedded Systems courses
  const yourEmbedded = await prisma.course.findFirst({
    where: {
      user_id: YOUR_USER_ID,
      name: 'Embedded Systems'
    }
  });

  const rickoEmbedded = await prisma.course.findFirst({
    where: {
      user_id: RICKO_USER_ID,
      name: 'Embedded Systems'
    }
  });

  console.log('Your Embedded Systems:', yourEmbedded?.id);
  console.log('Ricko\'s Embedded Systems:', rickoEmbedded?.id);

  // Find attendance sessions linked to Ricko's Embedded Systems but owned by you
  const wrongSessions = await prisma.attendanceSession.findMany({
    where: {
      user_id: YOUR_USER_ID,
      course_id: rickoEmbedded?.id
    }
  });

  console.log(`\nFound ${wrongSessions.length} of your attendance sessions linked to Ricko's Embedded Systems`);

  if (wrongSessions.length > 0 && yourEmbedded) {
    console.log(`Fixing by linking them to your Embedded Systems course...`);
    
    await prisma.attendanceSession.updateMany({
      where: {
        user_id: YOUR_USER_ID,
        course_id: rickoEmbedded.id
      },
      data: {
        course_id: yourEmbedded.id
      }
    });

    console.log(`✅ Fixed ${wrongSessions.length} attendance records`);
  }

  // Verify
  console.log('\nVerification:');
  const verified = await prisma.attendanceSession.count({
    where: {
      user_id: YOUR_USER_ID,
      course_id: yourEmbedded?.id
    }
  });

  console.log(`Your Embedded Systems now has ${verified} attendance sessions`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
