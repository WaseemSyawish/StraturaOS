#!/usr/bin/env node
/**
 * scripts/fix-materialized-dates.js
 *
 * Safe migration helper to correct end_date (and normalize date) for materialized
 * event occurrences (rows with template_id). The script runs in dry-run mode
 * by default and will only apply updates when run with --apply.
 *
 * Behavior (dry-run default):
 *  - Scans events where template_id IS NOT NULL and id != excludedId
 *  - For each event, constructs an intended local start datetime using the
 *    event.date's local Y/M/D components and the event.time field (if present)
 *  - Determines duration using, in order of preference:
 *      1) event.meta.durationMinutes
 *      2) event.meta.endDate (ISO parsed relative to the same day)
 *      3) if event.end_date exists, uses its difference to the constructed start
 *  - If a reliable duration is found and the computed new end_date differs from
 *    the stored end_date, the row is marked as a candidate update.
 *
 *  - Summary is printed with a small preview of candidates. When --apply is
 *    provided the script performs the updates in a transaction and prints a
 *    concise report.
 *
 * Safety notes:
 *  - Script defaults to dry-run. No DB writes unless --apply is passed.
 *  - The excluded ID (provided by user) is always skipped.
 *  - Use --limit to preview only N rows.
 *
 * Usage:
 *  node scripts/fix-materialized-dates.js            # dry-run
 *  node scripts/fix-materialized-dates.js --apply   # perform updates
 *  node scripts/fix-materialized-dates.js --limit=50 --userId=<id>
 */

const prisma = require('../lib/prisma');

// Simple argv parsing to avoid external dependency on `minimist`.
const rawArgs = process.argv.slice(2);
const argv = rawArgs.reduce((acc, cur) => {
  if (!cur) return acc;
  if (cur.startsWith('--')) {
    const [k, v] = cur.slice(2).split('=');
    acc[k] = typeof v === 'undefined' ? true : v;
  } else if (cur.startsWith('-')) {
    const k = cur.slice(1);
    acc[k] = true;
  }
  return acc;
}, {});
const APPLY = !!argv.apply;
const LIMIT = argv.limit ? Number(argv.limit) : null;
const USER_ID = argv.userId ? String(argv.userId) : null;

// ID explicitly excluded from any mass DB shift per user request
const EXCLUDED_ID = '6c06d59c-8880-4687-b377-3f1a847225bf';

function pad(n) { return String(n).padStart(2, '0'); }

function safeParseTime(t) {
  if (!t || typeof t !== 'string') return null;
  const parts = t.split(':').map(x => Number(x));
  if (parts.length < 1 || Number.isNaN(parts[0])) return null;
  const hh = parts[0];
  const mm = parts.length > 1 && !Number.isNaN(parts[1]) ? parts[1] : 0;
  return { hh, mm };
}

function toIsoLocal(dt) {
  // return ISO-like string of local components (YYYY-MM-DDTHH:mm:ss)
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
}

(async () => {
  try {
    console.info('[fix-materialized-dates] Starting scan. apply=%s limit=%s userId=%s', APPLY, LIMIT || 'none', USER_ID || 'any');

    const where = {
      template_id: { not: null }
    };
    if (USER_ID) where.user_id = String(USER_ID);
    where.id = { not: EXCLUDED_ID };

    const findOpts = { where, orderBy: { date: 'asc' } };
    if (LIMIT) findOpts.take = LIMIT;

    const rows = await prisma.event.findMany(findOpts);
    console.info('[fix-materialized-dates] scanned rows count:', rows.length);

    const candidates = [];

    for (const ev of rows) {
      try {
        // Skip rows without date/time/end_date/meta that we can't reason about reliably
        if (!ev.date) continue;
        const y = ev.date.getFullYear();
        const mo = ev.date.getMonth();
        const d = ev.date.getDate();

        // Determine intended HH:MM for the start
        let hh = 0, mm = 0;
        const parsed = safeParseTime(ev.time);
        if (parsed) { hh = parsed.hh; mm = parsed.mm; }

        // Build expected local start datetime from the stored Y/M/D + time
        const intendedStart = new Date(y, mo, d, hh, mm, 0);

        // Determine duration (minutes) with preference to meta.durationMinutes
        let durationMinutes = null;
        try {
          if (ev.meta && ev.meta.durationMinutes) {
            durationMinutes = Number(ev.meta.durationMinutes);
          } else if (ev.meta && ev.meta.endDate) {
            // If meta.endDate is present, compute diff between meta.endDate and event.date's local start
            const metaEnd = new Date(String(ev.meta.endDate));
            if (!isNaN(metaEnd.getTime())) {
              // If metaEnd was recorded as an ISO for the actual end, compute duration from intendedStart
              durationMinutes = Math.round((metaEnd.getTime() - intendedStart.getTime()) / 60000);
            }
          } else if (ev.end_date) {
            // Fallback: compute duration using existing end_date relative to intendedStart.
            durationMinutes = Math.round((ev.end_date.getTime() - intendedStart.getTime()) / 60000);
          }
        } catch (e) { /* ignore computation errors */ }

        // If we couldn't determine a sensible duration, skip this row
        if (durationMinutes === null || Number.isNaN(durationMinutes)) continue;

        // If duration is unreasonable (<=0 or > 24h) skip to avoid destructive changes
        if (durationMinutes <= 0 || durationMinutes > 24 * 60) continue;

        const computedEnd = new Date(intendedStart.getTime() + durationMinutes * 60000);

        // Compare with stored end_date (if any). If stored is null or differs by more than 1 second, mark for update.
        let needsUpdate = false;
        if (!ev.end_date) needsUpdate = true;
        else if (Math.abs(ev.end_date.getTime() - computedEnd.getTime()) > 1000) needsUpdate = true;

        if (needsUpdate) {
          candidates.push({ id: ev.id, user_id: ev.user_id, title: ev.title, storedEnd: ev.end_date ? ev.end_date.toISOString() : null, intendedStart: intendedStart.toISOString(), computedEnd: computedEnd.toISOString(), durationMinutes });
        }
      } catch (e) {
        console.warn('[fix-materialized-dates] per-row error for id=%s: %s', ev.id, e && e.message ? e.message : e);
      }
    }

    console.info('[fix-materialized-dates] candidates to update:', candidates.length);
    if (candidates.length === 0) {
      console.info('[fix-materialized-dates] Nothing to do. Exiting.');
      process.exit(0);
    }

    // Print preview (up to 50)
    console.table(candidates.slice(0, 50).map(c => ({ id: c.id, title: c.title, user_id: c.user_id, storedEnd: c.storedEnd, computedEnd: c.computedEnd, durationMinutes: c.durationMinutes })));

    if (!APPLY) {
      console.info('\nDry-run complete. To apply these updates run with --apply.');
      process.exit(0);
    }

    // Apply updates in a transaction, batching for safety
    console.info('[fix-materialized-dates] Applying updates...');
    const updates = [];
    for (const c of candidates) {
      const intendedStart = new Date(c.intendedStart);
      const newEnd = new Date(c.computedEnd);
      // Also normalize the date column to be anchored to local noon for the Y-M-D (mirrors parseDateForStorage)
      const y = intendedStart.getFullYear();
      const mo = intendedStart.getMonth();
      const day = intendedStart.getDate();
      const normalizedDate = new Date(y, mo, day, 12, 0, 0);
      updates.push({ id: c.id, normalizedDate, newEnd });
    }

    // Execute updates sequentially to avoid issues with long-lived transactions
    // that some Prisma environments can reject (Transaction ID invalid errors).
    const results = [];
    for (const u of updates) {
      try {
        const r = await prisma.event.update({ where: { id: u.id }, data: { end_date: u.newEnd, date: u.normalizedDate } });
        results.push({ id: u.id, ok: true });
      } catch (e) {
        console.error('[fix-materialized-dates] update failed for id=%s: %s', u.id, e && e.message ? e.message : e);
        results.push({ id: u.id, ok: false, error: e && e.message ? e.message : String(e) });
      }
    }

    const appliedCount = results.filter(r => r.ok).length;
    console.info('[fix-materialized-dates] Applied updates count:', appliedCount, 'of', results.length);
    process.exit(0);
  } catch (err) {
    console.error('[fix-materialized-dates] Error:', err && err.stack ? err.stack : err);
    process.exit(1);
  } finally {
    try { await prisma.$disconnect(); } catch (e) { /* ignore */ }
  }
})();
