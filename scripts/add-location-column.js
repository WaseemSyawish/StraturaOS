const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addLocationColumn() {
  try {
    console.log('Adding location column to events table...');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS location TEXT;
    `);
    
    console.log('✓ Location column added to events table');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE archived_events 
      ADD COLUMN IF NOT EXISTS location TEXT;
    `);
    
    console.log('✓ Location column added to archived_events table');
    
    console.log('\nAll done! Location fields added successfully.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addLocationColumn();
