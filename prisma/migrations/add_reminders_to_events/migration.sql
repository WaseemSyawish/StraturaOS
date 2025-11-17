-- Add reminders and remindersFired columns to events table
-- Migration for multi-stage event reminders feature

-- Add reminders column (array of reminder times)
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "reminders" TEXT[] DEFAULT '{}';

-- Add remindersFired column (array tracking which reminders have been shown)
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "remindersFired" TEXT[] DEFAULT '{}';
