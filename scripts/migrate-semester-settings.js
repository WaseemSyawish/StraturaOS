const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('📝 Creating semester_settings table...');
    
    // Create table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "semester_settings" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "user_id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "start_date" TIMESTAMP(3) NOT NULL,
        "end_date" TIMESTAMP(3) NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "semester_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    
    console.log('📝 Creating index...');
    
    // Create index
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_semester_settings_user" ON "semester_settings"("user_id")
    `);
    
    console.log('✅ semester_settings table created successfully');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
