const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const YOUR_USER_ID = '265c42f0-477b-4878-b1b6-f204d61de18c';

async function main() {
  console.log('Checking first few attendance sessions...\n');

  const sessions = await prisma.attendanceSession.findMany({
    where: { user_id: YOUR_USER_ID },
    take: 5,
    include: { courses: true }
  });

  console.log('Sample sessions:');
  sessions.forEach(s => {
    console.log(`\n${JSON.stringify(s, null, 2)}`);
  });

  // Check if any sessions have status set
  const withStatus = await prisma.attendanceSession.count({
    where: {
      user_id: YOUR_USER_ID,
      status: { not: null }
    }
  });

  const withoutStatus = await prisma.attendanceSession.count({
    where: {
      user_id: YOUR_USER_ID,
      status: null
    }
  });

  console.log(`\nStatus field summary:`);
  console.log(`  With status: ${withStatus}`);
  console.log(`  Without status: ${withoutStatus}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
