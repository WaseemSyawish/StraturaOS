const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const event = await prisma.event.findUnique({
      where: { id: 'e4116953-754f-413a-9301-117c0abbab46' }
    });
    console.log('Raw event from database:');
    console.log(JSON.stringify(event, null, 2));
    
    if (event) {
      console.log('\n--- Date Analysis ---');
      console.log('date field:', event.date);
      console.log('start_date field:', event.start_date);
      console.log('end_date field:', event.end_date);
      console.log('time field:', event.time);
      console.log('meta field:', event.meta);
      
      if (event.date) {
        const d = new Date(event.date);
        console.log('\nParsed date as Date object:');
        console.log('  UTC:', d.toISOString());
        console.log('  Local:', d.toString());
        console.log('  getDate():', d.getDate());
        console.log('  getUTCDate():', d.getUTCDate());
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
