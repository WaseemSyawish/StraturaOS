const prisma = require('../lib/prisma').default || require('../lib/prisma');

const USER_ID = '265c42f0-477b-4878-b1b6-f204d61de18c';

async function main() {
  console.log('[fix-user-schedule-data] Starting cleanup for user:', USER_ID);

  const thursdayClassToLab = await prisma.$executeRawUnsafe(`
    UPDATE events
    SET type = 'lab',
        meta = CASE
          WHEN meta IS NULL THEN jsonb_build_object('schedulePattern', jsonb_build_object('sessionType', 'Lab'))
          WHEN (meta->'schedulePattern') IS NULL THEN jsonb_set(meta, '{schedulePattern}', jsonb_build_object('sessionType', 'Lab'), true)
          ELSE jsonb_set(meta, '{schedulePattern,sessionType}', '"Lab"', true)
        END
    WHERE user_id = $1
      AND type = 'class'
      AND EXTRACT(DOW FROM date) = 4
  `, USER_ID);

  const movePatternLocation = await prisma.$executeRawUnsafe(`
    UPDATE events
    SET location = COALESCE(location, meta->'schedulePattern'->>'location')
    WHERE user_id = $1
      AND (meta->'schedulePattern'->>'location') IS NOT NULL
      AND (location IS NULL OR btrim(location) = '')
  `, USER_ID);

  const clearDuplicatedDescription = await prisma.$executeRawUnsafe(`
    UPDATE events
    SET description = NULL
    WHERE user_id = $1
      AND description IS NOT NULL
      AND (
        (location IS NOT NULL AND btrim(description) = btrim(location))
        OR (
          (meta->'schedulePattern'->>'location') IS NOT NULL
          AND btrim(description) = btrim(meta->'schedulePattern'->>'location')
        )
      )
  `, USER_ID);

  console.log('[fix-user-schedule-data] Updated Thursday class->lab rows:', Number(thursdayClassToLab || 0));
  console.log('[fix-user-schedule-data] Moved pattern location to location field:', Number(movePatternLocation || 0));
  console.log('[fix-user-schedule-data] Cleared duplicated description rows:', Number(clearDuplicatedDescription || 0));
}

main()
  .catch((err) => {
    console.error('[fix-user-schedule-data] Failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (_) {}
  });
