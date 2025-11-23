// Database Setup Script for Focus Session Features
// Run with: node setup-focus-db.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupFocusFeatures() {
  console.log('🚀 Setting up Focus Session features...\n');

  try {
    // Check if focus_settings table exists
    console.log('1️⃣ Checking database schema...');
    
    const settingsCount = await prisma.focusSettings.count().catch(() => null);
    
    if (settingsCount === null) {
      console.log('❌ FocusSettings table not found.');
      console.log('📝 Please run the migration first:');
      console.log('   psql -d your_database -f migrations/add_focus_features.sql');
      console.log('   OR');
      console.log('   npx prisma migrate dev --name add_focus_features\n');
      return;
    }

    console.log('✅ Database schema is up to date\n');

    // Test creating a focus session
    console.log('2️⃣ Testing focus session creation...');
    
    // Get first user for testing
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('❌ No users found. Please create a user account first.\n');
      return;
    }

    console.log(`✅ Found user: ${user.email}\n`);

    // Create default settings if they don't exist
    console.log('3️⃣ Setting up default focus settings...');
    
    const existingSettings = await prisma.focusSettings.findUnique({
      where: { user_id: user.id },
    });

    if (existingSettings) {
      console.log('✅ Focus settings already exist for this user\n');
    } else {
      await prisma.focusSettings.create({
        data: {
          user_id: user.id,
          focus_duration: 1500,
          short_break_duration: 300,
          long_break_duration: 900,
          sessions_until_long_break: 4,
          sound_enabled: true,
          sound_volume: 50,
          sound_type: 'chime',
          notifications_enabled: true,
          auto_start_breaks: false,
          auto_start_focus: false,
          daily_goal_sessions: 8,
        },
      });
      console.log('✅ Created default focus settings\n');
    }

    // Test session statistics
    console.log('4️⃣ Checking session statistics...');
    
    const sessionCount = await prisma.focusSession.count({
      where: { user_id: user.id },
    });

    console.log(`✅ Found ${sessionCount} focus sessions for this user\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Focus Session setup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📍 Next steps:');
    console.log('   1. Start your dev server: npm run dev');
    console.log('   2. Navigate to: http://localhost:3000/focus-new');
    console.log('   3. Start focusing! 🎯\n');

  } catch (error) {
    console.error('❌ Error during setup:', error);
    console.error('\n📝 Troubleshooting:');
    console.error('   - Ensure your DATABASE_URL is correct in .env');
    console.error('   - Run the migration script first');
    console.error('   - Check that PostgreSQL is running\n');
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup
setupFocusFeatures();
