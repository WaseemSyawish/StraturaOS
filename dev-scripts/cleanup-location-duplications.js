const prisma = require('../lib/prisma').default || require('../lib/prisma');

async function main() {
  console.log('[cleanup-location-duplications] Starting global cleanup');

  const movePatternLocation = await prisma.$executeRawUnsafe(`
    UPDATE events
    SET location = COALESCE(location, meta->'schedulePattern'->>'location')
    WHERE (meta->'schedulePattern'->>'location') IS NOT NULL
      AND (location IS NULL OR btrim(location) = '')
  `);

  const clearDuplicatedDescription = await prisma.$executeRawUnsafe(`
    UPDATE events
    SET description = NULL
    WHERE description IS NOT NULL
      AND (
        (location IS NOT NULL AND btrim(description) = btrim(location))
        OR (
          (meta->'schedulePattern'->>'location') IS NOT NULL
          AND btrim(description) = btrim(meta->'schedulePattern'->>'location')
        )
      )
  `);

  console.log('[cleanup-location-duplications] Moved pattern location rows:', Number(movePatternLocation || 0));
  console.log('[cleanup-location-duplications] Cleared duplicated description rows:', Number(clearDuplicatedDescription || 0));
}

main()
  .catch((err) => {
    console.error('[cleanup-location-duplications] Failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await prisma.$disconnect(); } catch (_) {}
  });
