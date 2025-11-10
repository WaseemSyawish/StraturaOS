const prisma = require('./lib/prisma').default;

(async () => {
  try {
    console.log('📅 Fetching raw event data from database:');
    const events = await prisma.event.findMany({
      where: { 
        type: { in: ['class', 'lecture', 'lab', 'tutorial'] }
      },
      select: {
        id: true,
        title: true,
        type: true,
        date: true,
        time: true,
        end_date: true,
        meta: true
      },
      take: 5
    });
    
    console.log('\nRaw events from database:');
    events.forEach(e => {
      console.log(`\n📝 ${e.title}`);
      console.log(`   Type: ${e.type}`);
      console.log(`   Date: ${e.date}`);
      console.log(`   Time: ${e.time}`);
      console.log(`   End Date: ${e.end_date}`);
      console.log(`   Meta:`, JSON.stringify(e.meta));
    });
    
  } catch(e) {
    console.error('❌ Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
