# Fix for Prisma Shadow Database Issue on Railway

## Problem

Prisma migrate requires a "shadow database" for validation, but Railway/hosted databases often don't allow creating shadow databases, resulting in:

```
Error: P3006 - Can't reach database server
```

## Solutions (Choose One)

### ⭐ **Solution 1: Direct Migration Script (Recommended)**

Use the custom migration script that bypasses Prisma's shadow database:

```bash
node migrate-focus-direct.js
```

This script:

- Connects directly to your Railway database
- Applies the schema changes manually
- Checks if tables/columns already exist
- Safe to run multiple times (idempotent)

---

### **Solution 2: Disable Shadow Database**

Add this to your `prisma/schema.prisma` datasource:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL") // Add this line
}
```

Then in your `.env`:

```env
SHADOW_DATABASE_URL="" # Empty string disables shadow database
```

**Then run:**

```bash
npx prisma migrate dev --name add_focus_features --skip-seed --create-only
```

This creates the migration file but doesn't apply it. Then apply manually.

---

### **Solution 3: Use db push (Development Only)**

Instead of migrate, use `db push` which doesn't require shadow database:

```bash
npx prisma db push
```

**⚠️ Warning**: This syncs your schema directly without creating migration history. Only use in development.

---

### **Solution 4: Railway Proxy Settings**

Sometimes the issue is Railway's proxy. Try adding to your `.env`:

```env
DATABASE_URL="postgresql://user:pass@switchback.proxy.rlwy.net:10830/railway?connection_limit=5&connect_timeout=10"
```

Add these query parameters:

- `connection_limit=5` - Limits connections
- `connect_timeout=10` - Increases timeout
- `pool_timeout=10` - Pool timeout

---

## Recommended Workflow for Railway

1. **Development** (Local):

   ```bash
   npx prisma db push
   ```

2. **Production** (Railway):

   ```bash
   node migrate-focus-direct.js
   ```

3. **After Schema Changes**:
   ```bash
   npx prisma generate
   npm run dev
   ```

---

## Why This Happens

Railway and other hosted databases:

- Use connection pooling/proxies
- Don't allow temporary database creation
- Have strict connection limits
- Use proxy URLs (switchback.proxy.rlwy.net)

Prisma's shadow database needs:

- Permission to create temporary databases
- Direct database access (not through proxy)
- Multiple simultaneous connections

---

## Verification After Migration

Check if migration worked:

```bash
# 1. Open Prisma Studio
npx prisma studio

# 2. Look for:
#    - focus_settings table
#    - focus_sessions.task_name column
#    - focus_sessions.interrupted column

# 3. Or run this query in Railway dashboard:
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('focus_settings', 'focus_sessions');
```

---

## If All Else Fails

**Manual SQL Execution** (Railway Dashboard):

1. Go to Railway Dashboard → Your Database → Query
2. Paste and run:

```sql
-- Create focus_settings table
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

-- Add task_name to focus_sessions
ALTER TABLE "focus_sessions"
ADD COLUMN IF NOT EXISTS "task_name" TEXT;

-- Add interrupted to focus_sessions
ALTER TABLE "focus_sessions"
ADD COLUMN IF NOT EXISTS "interrupted" BOOLEAN NOT NULL DEFAULT false;

-- Create index
CREATE INDEX IF NOT EXISTS "idx_focus_sessions_task"
ON "focus_sessions"("task_id");
```

3. Then locally:

```bash
npx prisma db pull  # Sync schema
npx prisma generate # Update client
```

---

## Additional Tips

### Connection String Format

Make sure your `DATABASE_URL` is correct:

```
postgresql://username:password@host:port/database?sslmode=require
```

### Check Railway Status

```bash
# Verify database is reachable
npx prisma db execute --stdin <<< "SELECT 1;"
```

### Prisma Client Generation

After ANY schema change:

```bash
npx prisma generate
```

---

## Quick Test

After migration, test with:

```javascript
// test-focus-db.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
  try {
    // Test focus_settings
    const settings = await prisma.focusSettings.findMany();
    console.log("✅ focus_settings table works:", settings.length, "rows");

    // Test focus_sessions
    const sessions = await prisma.focusSession.findMany();
    console.log("✅ focus_sessions table works:", sessions.length, "rows");

    console.log("\n🎉 Database migration successful!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
```

Run: `node test-focus-db.js`

---

**Remember**: After migration, restart your dev server!

```bash
npm run dev
```

Then visit: `http://localhost:3000/focus-new`
