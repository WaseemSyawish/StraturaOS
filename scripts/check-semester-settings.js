const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSemesterSettings() {
  try {
    console.log('Checking semester settings in database...\n');
    
    const settings = await prisma.semesterSetting.findMany({
      include: {
        user: {
          select: { email: true }
        }
      },
      orderBy: { start_date: 'desc' }
    });
    
    console.log(`Found ${settings.length} semester setting(s):`);
    settings.forEach(setting => {
      console.log(`  - Name: ${setting.name}`);
      console.log(`    User: ${setting.user.email}`);
      console.log(`    Start: ${setting.start_date}`);
      console.log(`    End: ${setting.end_date}`);
      console.log('');
    });
    
    if (settings.length === 0) {
      console.log('⚠️  No semester settings found!');
      console.log('   The semester config UI will be empty until you create one.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSemesterSettings();
