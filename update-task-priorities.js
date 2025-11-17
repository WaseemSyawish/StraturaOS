// Script to update existing tasks to have urgent-important priority
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTaskPriorities() {
  try {
    console.log('Starting task priority update...');
    
    // Get all events
    const events = await prisma.event.findMany();
    
    let updatedCount = 0;
    
    for (const event of events) {
      const meta = event.meta || {};
      
      // Update if no priority or has old default
      if (!meta.priority || meta.priority === 'not-urgent-not-important') {
        await prisma.event.update({
          where: { id: event.id },
          data: {
            meta: {
              ...meta,
              priority: 'urgent-important'
            }
          }
        });
        updatedCount++;
      }
    }
    
    console.log(`✅ Updated ${updatedCount} tasks to urgent-important priority`);
    
    // Show summary of priorities
    const allEvents = await prisma.event.findMany();
    const priorityCounts = {};
    
    allEvents.forEach(event => {
      const priority = event.meta?.priority || 'no-priority';
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    });
    
    console.log('\nPriority distribution:');
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      console.log(`  ${priority}: ${count} tasks`);
    });
    
  } catch (error) {
    console.error('Error updating priorities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTaskPriorities();
