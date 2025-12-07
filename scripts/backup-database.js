#!/usr/bin/env node
/**
 * Database Backup Script
 * Creates a full backup of all database tables as JSON and SQL-like format
 * 
 * Usage: node scripts/backup-database.js
 * Output: Creates timestamped backup in ./backups/ folder
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(__dirname, '..', 'backups', timestamp);
  
  // Create backup directory
  fs.mkdirSync(backupDir, { recursive: true });
  
  console.log(`\n📦 Starting database backup...`);
  console.log(`📁 Backup directory: ${backupDir}\n`);
  
  const tables = {
    users: () => prisma.user.findMany(),
    semester_settings: () => prisma.semesterSetting.findMany(),
    courses: () => prisma.course.findMany(),
    events: () => prisma.event.findMany(),
    archived_events: () => prisma.archivedEvent.findMany(),
    attendance_sessions: () => prisma.attendanceSession.findMany(),
    focus_sessions: () => prisma.focusSession.findMany(),
    focus_settings: () => prisma.focusSettings.findMany(),
    course_resources: () => prisma.courseResource.findMany(),
  };
  
  const backup = {
    metadata: {
      created_at: new Date().toISOString(),
      database_url: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'), // Hide password
      tables: [],
    },
    data: {},
  };
  
  let totalRecords = 0;
  
  for (const [tableName, queryFn] of Object.entries(tables)) {
    try {
      console.log(`  📋 Backing up ${tableName}...`);
      const records = await queryFn();
      backup.data[tableName] = records;
      backup.metadata.tables.push({
        name: tableName,
        count: records.length,
      });
      totalRecords += records.length;
      console.log(`     ✓ ${records.length} records`);
      
      // Also save individual table files
      fs.writeFileSync(
        path.join(backupDir, `${tableName}.json`),
        JSON.stringify(records, null, 2)
      );
    } catch (error) {
      console.log(`     ⚠ Error: ${error.message}`);
      backup.metadata.tables.push({
        name: tableName,
        count: 0,
        error: error.message,
      });
    }
  }
  
  // Save complete backup
  const fullBackupPath = path.join(backupDir, 'full-backup.json');
  fs.writeFileSync(fullBackupPath, JSON.stringify(backup, null, 2));
  
  // Create a summary file
  const summaryPath = path.join(backupDir, 'BACKUP-INFO.txt');
  const summary = `
DATABASE BACKUP SUMMARY
=======================
Created: ${backup.metadata.created_at}
Total Records: ${totalRecords}

Tables:
${backup.metadata.tables.map(t => `  - ${t.name}: ${t.count} records${t.error ? ` (ERROR: ${t.error})` : ''}`).join('\n')}

Files in this backup:
  - full-backup.json (complete database dump)
  - [table-name].json (individual table dumps)
  - BACKUP-INFO.txt (this file)

To restore, use: node scripts/restore-database.js ${timestamp}
`;
  fs.writeFileSync(summaryPath, summary.trim());
  
  console.log(`\n✅ Backup complete!`);
  console.log(`   Total records: ${totalRecords}`);
  console.log(`   Location: ${backupDir}`);
  console.log(`   Full backup: ${fullBackupPath}\n`);
  
  return { backupDir, totalRecords, backup };
}

// Run if executed directly
if (require.main === module) {
  backupDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Backup failed:', error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { backupDatabase };
