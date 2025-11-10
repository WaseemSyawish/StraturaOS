// Debug script to check event times in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugEventTimes() {
  try {
    console.log('🔍 Checking event times in database...\n');

    const events = await prisma.event.findMany({
      where: {
        type: { in: ['class', 'lecture', 'event'] }
      },
      select: {
        id: true,
        title: true,
        type: true,
        date: true,
        time: true,
        end_date: true,
        meta: true,
        courses: {
          select: {
            name: true,
            code: true
          }
        }
      },
      take: 10,
      orderBy: { date: 'desc' }
    });

    console.log(`Found ${events.length} events\n`);

    events.forEach(ev => {
      console.log(`📅 ${ev.title}`);
      console.log(`   Type: ${ev.type}`);
      console.log(`   Course: ${ev.courses?.name || 'N/A'} (${ev.courses?.code || 'N/A'})`);
      console.log(`   Date: ${ev.date}`);
      console.log(`   Time: ${ev.time}`);
      console.log(`   End Date: ${ev.end_date}`);
      if (ev.meta) {
        try {
          const meta = typeof ev.meta === 'string' ? JSON.parse(ev.meta) : ev.meta;
          console.log(`   Meta:`, meta);
        } catch (e) {
          console.log(`   Meta: ${ev.meta}`);
        }
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugEventTimes();
