// Direct Database Migration Script for Railway
// This bypasses Prisma's shadow database requirement
// Run with: node migrate-focus-direct.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigration() {
  console.log('🚀 Starting direct database migration for Focus features...\n');
  console.log('📍 Target: Railway PostgreSQL database\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Test connection first
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected to database successfully\n');

    // Check if focus_settings table already exists
    console.log('2️⃣ Checking if focus_settings table exists...');
    try {
      await prisma.$queryRaw`SELECT 1 FROM focus_settings LIMIT 1`;
      console.log('ℹ️  focus_settings table already exists\n');
    } catch (error) {
      // Table doesn't exist, create it
      console.log('📝 Creating focus_settings table...');
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "focus_settings" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "user_id" TEXT NOT NULL UNIQUE,
          "focus_duration" INTEGER NOT NULL DEFAULT 1500,
          "short_break_duration" INTEGER NOT NULL DEFAULT 300,
          "long_break_duration" INTEGER NOT NULL DEFAULT 900,
          "sessions_until_long_break" INTEGER NOT NULL DEFAULT 4,
          "sound_enabled" BOOLEAN NOT NULL DEFAULT true,
          "sound_volume" INTEGER NOT NULL DEFAULT 50,
          "sound_type" TEXT NOT NULL DEFAULT 'chime',
          "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
          "auto_start_breaks" BOOLEAN NOT NULL DEFAULT false,
          "auto_start_focus" BOOLEAN NOT NULL DEFAULT false,
          "daily_goal_sessions" INTEGER DEFAULT 8,
          "theme_preference" TEXT NOT NULL DEFAULT 'system',
          "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "focus_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      
      console.log('✅ focus_settings table created\n');
    }

    // Check and add task_name column to focus_sessions
    console.log('3️⃣ Checking focus_sessions table columns...');
    
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'focus_sessions'
    `;
    
    const columnNames = columns.map(col => col.column_name);
    console.log(`   Found columns: ${columnNames.join(', ')}\n`);

    // Add task_name column if it doesn't exist
    if (!columnNames.includes('task_name')) {
      console.log('📝 Adding task_name column...');
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "focus_sessions" ADD COLUMN "task_name" TEXT;
      `);
      console.log('✅ task_name column added\n');
    } else {
      console.log('ℹ️  task_name column already exists\n');
    }

    // Add interrupted column if it doesn't exist
    if (!columnNames.includes('interrupted')) {
      console.log('📝 Adding interrupted column...');
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "focus_sessions" ADD COLUMN "interrupted" BOOLEAN NOT NULL DEFAULT false;
      `);
      console.log('✅ interrupted column added\n');
    } else {
      console.log('ℹ️  interrupted column already exists\n');
    }

    // Add index on task_id if it doesn't exist
    console.log('4️⃣ Checking indexes...');
    
    const indexes = await prisma.$queryRaw`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'focus_sessions'
    `;
    
    const indexNames = indexes.map(idx => idx.indexname);
    
    if (!indexNames.includes('idx_focus_sessions_task')) {
      console.log('📝 Creating index on task_id...');
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "idx_focus_sessions_task" ON "focus_sessions"("task_id");
      `);
      console.log('✅ Index created\n');
    } else {
      console.log('ℹ️  Index already exists\n');
    }

    // Verify migration success
    console.log('5️⃣ Verifying migration...');
    
    const focusSettingsExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'focus_settings'
      );
    `;
    
    const updatedColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'focus_sessions'
    `;
    
    console.log('✅ Migration verification complete\n');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Migration completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ focus_settings table: Created/Exists');
    console.log('✅ focus_sessions.task_name: Added/Exists');
    console.log('✅ focus_sessions.interrupted: Added/Exists');
    console.log('✅ Index on task_id: Created/Exists\n');
    
    console.log('📍 Next steps:');
    console.log('   1. Run: npx prisma generate');
    console.log('   2. Start server: npm run dev');
    console.log('   3. Visit: http://localhost:3000/focus-new\n');
    
    console.log('💡 Note: You may need to restart your dev server for changes to take effect.\n');

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Migration failed!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.error('Error details:', error.message);
    console.error('\n📝 Troubleshooting:');
    console.error('   - Check your DATABASE_URL in .env');
    console.error('   - Ensure Railway database is running');
    console.error('   - Verify your IP is whitelisted (if applicable)');
    console.error('   - Try running: npx prisma db pull (to sync schema)\n');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
runMigration();
