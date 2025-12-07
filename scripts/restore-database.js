#!/usr/bin/env node
/**
 * Database Restore Script
 * Restores data from a backup created by backup-database.js
 * 
 * Usage: node scripts/restore-database.js [backup-folder-name]
 * Example: node scripts/restore-database.js 2025-12-07T14-30-00
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const prisma = new PrismaClient();

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function restoreDatabase(backupName) {
  const backupsDir = path.join(__dirname, '..', 'backups');
  
  // List available backups if no name provided
  if (!backupName) {
    const backups = fs.readdirSync(backupsDir).filter(f => 
      fs.statSync(path.join(backupsDir, f)).isDirectory()
    );
    
    if (backups.length === 0) {
      console.log('❌ No backups found in ./backups/');
      return;
    }
    
    console.log('\n📦 Available backups:\n');
    backups.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));
    console.log('\nUsage: node scripts/restore-database.js [backup-folder-name]');
    return;
  }
  
  const backupDir = path.join(backupsDir, backupName);
  const fullBackupPath = path.join(backupDir, 'full-backup.json');
  
  if (!fs.existsSync(fullBackupPath)) {
    console.log(`❌ Backup not found: ${fullBackupPath}`);
    return;
  }
  
  console.log(`\n⚠️  WARNING: This will REPLACE all current data with backup data!`);
  console.log(`   Backup: ${backupName}\n`);
  
  const answer = await prompt('Are you sure? Type "yes" to continue: ');
  if (answer !== 'yes') {
    console.log('Restore cancelled.');
    return;
  }
  
  console.log('\n📦 Loading backup...');
  const backup = JSON.parse(fs.readFileSync(fullBackupPath, 'utf8'));
  
  console.log(`   Created: ${backup.metadata.created_at}`);
  console.log(`   Tables: ${backup.metadata.tables.length}\n`);
  
  // Restore order matters due to foreign keys
  // Delete in reverse order, then insert in forward order
  const restoreOrder = [
    'focus_settings',
    'focus_sessions',
    'attendance_sessions',
    'course_resources',
    'archived_events',
    'events',
    'courses',
    'semester_settings',
    'users',
  ];
  
  // Clear existing data (reverse order to respect foreign keys)
  console.log('🗑️  Clearing existing data...');
  for (const tableName of restoreOrder) {
    try {
      const model = getModel(tableName);
      if (model) {
        await model.deleteMany({});
        console.log(`   ✓ Cleared ${tableName}`);
      }
    } catch (error) {
      console.log(`   ⚠ Error clearing ${tableName}: ${error.message}`);
    }
  }
  
  // Insert new data (forward order)
  console.log('\n📥 Restoring data...');
  const insertOrder = [...restoreOrder].reverse();
  
  for (const tableName of insertOrder) {
    const records = backup.data[tableName];
    if (!records || records.length === 0) {
      console.log(`   - ${tableName}: no records`);
      continue;
    }
    
    try {
      const model = getModel(tableName);
      if (model) {
        // Insert records one by one to handle any issues
        let inserted = 0;
        for (const record of records) {
          try {
            await model.create({ data: record });
            inserted++;
          } catch (e) {
            // Try upsert if create fails (might already exist)
            try {
              await model.upsert({
                where: { id: record.id },
                create: record,
                update: record,
              });
              inserted++;
            } catch (e2) {
              console.log(`     ⚠ Could not insert record ${record.id}: ${e2.message}`);
            }
          }
        }
        console.log(`   ✓ ${tableName}: ${inserted}/${records.length} records`);
      }
    } catch (error) {
      console.log(`   ⚠ Error restoring ${tableName}: ${error.message}`);
    }
  }
  
  console.log('\n✅ Restore complete!\n');
}

function getModel(tableName) {
  const modelMap = {
    users: prisma.user,
    semester_settings: prisma.semesterSetting,
    courses: prisma.course,
    events: prisma.event,
    archived_events: prisma.archivedEvent,
    attendance_sessions: prisma.attendanceSession,
    focus_sessions: prisma.focusSession,
    focus_settings: prisma.focusSettings,
    course_resources: prisma.courseResource,
  };
  return modelMap[tableName];
}

// Run if executed directly
if (require.main === module) {
  const backupName = process.argv[2];
  restoreDatabase(backupName)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Restore failed:', error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { restoreDatabase };
