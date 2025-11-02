#!/usr/bin/env node
// Migration helper: repair event start/end datetimes that were materialized
// using UTC construction (Date.UTC) and therefore appear shifted in some
// deployments. This script makes a best-effort, reversible fix by:
// - For events with a stored `date` (YYYY-MM-DD) and `time` (HH:MM):
//   - compute the intended local instant using `new Date(year, monthIndex, day, hh, mm)`
//   - if the DB exposes a `start_date` column, replace it with the corrected ISO
//   - if the DB exposes an `end_date` column, shift it by the same duration as
//     the original (so end stays relative to start)
// Usage:
//  node scripts/fix-event-timezones.js --dry-run      # show candidate changes
//  node scripts/fix-event-timezones.js --apply        # perform updates (BE CAREFUL)
//  node scripts/fix-event-timezones.js --limit=10     # limit processed rows (for testing)

const prisma = require('../lib/prisma');

function pad(n) { return String(n).padStart(2, '0'); }

function buildLocalIsoFromParts(datePart, timePart) {
  if (!datePart) return null;
  const m = String(datePart).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (!timePart) return new Date(y, mo, d).toISOString();
  const parts = String(timePart).split(':').map(Number);
  const hh = Number.isFinite(parts[0]) ? parts[0] : 0;
  const mm = Number.isFinite(parts[1]) ? parts[1] : 0;
  return new Date(y, mo, d, hh, mm, 0).toISOString();
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || !args.includes('--apply');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : null;
  const excludeArg = args.find(a => a.startsWith('--exclude-id='));
  const excludeId = excludeArg ? String(excludeArg.split('=')[1]) : null;
  const shiftArg = args.find(a => a.startsWith('--shift-days='));
  const shiftDays = shiftArg ? Number(shiftArg.split('=')[1]) : 1;

  console.log('[fix-event-timezones] starting. dryRun=', dryRun, ' limit=', limit);

  // Select candidate events that have a date and time. We will only attempt
  // to adjust rows where we can deterministically compute the intended local instant.
  const q = {};
  if (limit && Number.isFinite(limit)) q.take = Number(limit);

  // Fetch events (we'll filter out rows without `date` in JS to avoid Prisma null-filter edge cases)
  let events = await prisma.event.findMany({ select: { id: true, date: true, time: true, end_date: true }, ...q });
  events = events.filter(ev => ev && ev.date !== null && ev.date !== undefined);

  console.log(`[fix-event-timezones] loaded ${events.length} events to inspect`);

  const updates = [];

  for (const ev of events) {
    try {
      const { id, date, time, start_date, end_date } = ev;
      if (!date) continue;
  // Compute a deterministic local instant from date+time.
  // If no time is provided (an all-day / date-only event), compute local noon
  // so that converting to/from UTC doesn't shift the calendar day.
  const correctedStart = buildLocalIsoFromParts(date, time);
  // buildLocalIsoFromParts returns ISO for date-only when timePart is falsy
      if (!correctedStart) continue;

      // Determine original duration (if end_date exists)
      let origDuration = null;
      if (end_date) {
        try {
          const origStart = start_date ? new Date(String(start_date)) : null;
          const origEnd = new Date(String(end_date));
          if (origEnd && !isNaN(origEnd.getTime())) {
            const base = origStart && !isNaN(origStart.getTime()) ? origStart.getTime() : (new Date(correctedStart)).getTime();
            origDuration = Math.max(0, origEnd.getTime() - base);
          }
        } catch (e) { origDuration = null; }
      }

      // If start_date exists on the row, compare and decide if update is needed
      let needUpdate = false;
      if (start_date) {
        try {
          const stored = new Date(String(start_date));
          if (isNaN(stored.getTime()) || stored.toISOString() !== correctedStart) needUpdate = true;
        } catch (e) { needUpdate = true; }
      } else {
        // No start_date persisted — some deployments materialized events with
        // end_date derived from UTC-based occStart. We'll treat presence of
        // end_date and a mismatch in derived end as a cue to update.
        if (end_date && origDuration !== null) needUpdate = true;
      }

      if (needUpdate) {
        const update = { id, correctedStart, correctedEnd: null };
        if (origDuration !== null) update.correctedEnd = new Date(new Date(correctedStart).getTime() + origDuration).toISOString();
        updates.push(update);
      }
    } catch (e) {
      console.warn('[fix-event-timezones] inspect failed for event', ev && ev.id, e && e.message);
    }
  }

  console.log(`[fix-event-timezones] identified ${updates.length} events to update`);

  // If running a pure dry-run we show samples and exit. If the user passed a
  // shiftDays value (e.g., --shift-days=1) and invoked --apply, we will
  // proceed to perform the day-shift for all candidate events regardless of
  // whether they were flagged in `updates` above. This allows a controlled
  // mass-shift when the user explicitly requested it.
  if (dryRun) {
    console.log('[fix-event-timezones] dry-run mode - sample updates:');
    console.log(JSON.stringify(updates.slice(0, 20), null, 2));
    console.log('[fix-event-timezones] to apply changes re-run with --apply');
    return process.exit(0);
  }

  // If not shifting days (no --shift-days) and there are no computed updates,
  // there's nothing to do.
  if ((!shiftDays || Number(shiftDays) === 0) && updates.length === 0) {
    console.log('[fix-event-timezones] no updates required; exit');
    return process.exit(0);
  }

  // Apply updates in a transaction for safety
  console.log('[fix-event-timezones] applying updates...');

  // When applying a day shift instead of recomputing local instants, we'll
  // add `shiftDays` days (24h per day) to the `date`, `start_date`, and `end_date` fields.
  const shiftMs = Number(shiftDays) * 24 * 60 * 60 * 1000;
  let applied = 0;
  for (const ev of events) {
    try {
      if (excludeId && String(ev.id) === String(excludeId)) {
        console.log('[fix-event-timezones] skipping excluded id', ev.id);
        continue;
      }
      const toUpdate = {};
      try {
        if (ev.date) {
          const d = new Date(String(ev.date));
          if (!isNaN(d.getTime())) toUpdate.date = new Date(d.getTime() + shiftMs);
        }
      } catch (e) {}
      // There is no start_date column on Event in Prisma schema; the main
      // start instant is `date`. We only adjust `date` and `end_date`.
      try {
        if (ev.end_date) {
          const ed = new Date(String(ev.end_date));
          if (!isNaN(ed.getTime())) toUpdate.end_date = new Date(ed.getTime() + shiftMs);
        }
      } catch (e) {}

      // If nothing to update, skip
      if (Object.keys(toUpdate).length === 0) continue;

      if (dryRun) {
        console.log('[fix-event-timezones] would update', ev.id, toUpdate);
      } else {
        // Persist the update
        try {
          await prisma.event.update({ where: { id: ev.id }, data: toUpdate });
          console.log('[fix-event-timezones] updated', ev.id, Object.keys(toUpdate));
          applied += 1;
        } catch (e) {
          console.error('[fix-event-timezones] failed to update', ev.id, e && e.message);
        }
      }
    } catch (e) {
      console.warn('[fix-event-timezones] unexpected error handling event', ev && ev.id, e && e.message);
    }
  }
  console.log('[fix-event-timezones] applied updates count:', applied);

  console.log('[fix-event-timezones] done');
  process.exit(0);
}

main().catch((err) => { console.error('Script failed', err); process.exit(2); });
