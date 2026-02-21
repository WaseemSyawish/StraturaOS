const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'backups', `db-backup-${timestamp}`);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log('📦 Starting database backup...');

    // Backup all tables
    const backup = {
      timestamp: new Date().toISOString(),
    };

    // Backup each table safely
    const tables = ['user', 'semester', 'course', 'module', 'assessment', 'attendance', 'event', 'grade', 'reminder', 'userSettings'];
    for (const table of tables) {
      try {
        if (prisma[table]) {
          backup[table] = await prisma[table].findMany();
        }
      } catch (e) {
        console.log(`⚠️  Skipping ${table}: not available`);
      }
    }

    const backupFile = path.join(backupDir, 'backup.json');
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    const stats = Object.entries(backup).map(([table, data]) => 
      `  ${table}: ${data.length} records`
    ).join('\n');

    console.log(`✅ Database backed up successfully!\n${stats}`);
    console.log(`📁 Location: ${backupFile}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();
