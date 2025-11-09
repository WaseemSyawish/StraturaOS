const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking users in database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        created_at: true
      }
    });
    
    console.log(`Found ${users.length} user(s):`);
    users.forEach(user => {
      console.log(`  - ID: ${user.id}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Created: ${user.created_at}`);
      console.log('');
    });
    
    if (users.length === 0) {
      console.log('⚠️  No users found! This is why auth is failing.');
      console.log('   You need to either:');
      console.log('   1. Sign up through the app, OR');
      console.log('   2. Create a test user manually');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
