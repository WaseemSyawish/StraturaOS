-- Ensure User columns required by Prisma schema exist
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'en';
