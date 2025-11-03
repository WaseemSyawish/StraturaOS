#!/usr/bin/env node
/**
 * scripts/shift-series-day-back.js
 *
 * Shift all materialized series events (rows with template_id NOT NULL) one
 * day back (subtract 24 hours) to correct off-by-one-day storage issues.
 *
 * Safety:
 *  - Dry-run by default. Use --apply to perform updates.
 *  - Skips the EXCLUDED_ID hard-coded below.
 *  - Supports --limit and --userId for scoped runs.
 *
 * Usage:
 *  node scripts/shift-series-day-back.js         # dry-run
 *  node scripts/shift-series-day-back.js --apply # apply updates
 *  node scripts/shift-series-day-back.js --apply --limit=10 --userId=<id>
 */

const prisma = require('../lib/prisma');
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

const EXCLUDED_ID = '6c06d59c-8880-4687-b377-3f1a847225bf';
const MS_DAY = 24 * 60 * 60 * 1000;

(async () => {
  try {
    console.info('[shift-series-day-back] Starting. apply=%s limit=%s userId=%s', APPLY, LIMIT || 'none', USER_ID || 'any');
    const where = { template_id: { not: null }, id: { not: EXCLUDED_ID } };
    if (USER_ID) where.user_id = USER_ID;
    const opts = { where, orderBy: { date: 'asc' } };
    if (LIMIT) opts.take = LIMIT;

    const rows = await prisma.event.findMany(opts);
    console.info('[shift-series-day-back] matched rows count:', rows.length);
    if (!rows.length) return process.exit(0);

    const candidates = rows.map(r => {
      const oldDate = r.date instanceof Date ? r.date : new Date(String(r.date));
      const newDate = new Date(oldDate.getTime() - MS_DAY);
      const oldEnd = r.end_date instanceof Date ? r.end_date : (r.end_date ? new Date(String(r.end_date)) : null);
      const newEnd = oldEnd ? new Date(oldEnd.getTime() - MS_DAY) : null;
      // meta.endDate may exist as ISO string
      let metaEnd = null;
      if (r.meta && r.meta.endDate) {
        try { metaEnd = new Date(String(r.meta.endDate)); } catch (e) { metaEnd = null; }
      }
      const newMetaEnd = metaEnd ? new Date(metaEnd.getTime() - MS_DAY) : null;
      return { id: r.id, title: r.title, user_id: r.user_id, oldDate: oldDate.toISOString(), newDate: newDate.toISOString(), oldEnd: oldEnd ? oldEnd.toISOString() : null, newEnd: newEnd ? newEnd.toISOString() : null, hasMetaEnd: !!metaEnd, newMetaEnd: newMetaEnd ? newMetaEnd.toISOString() : null };
    });

    console.table(candidates.slice(0, 50).map(c => ({ id: c.id, title: c.title, user_id: c.user_id, oldDate: c.oldDate, newDate: c.newDate, oldEnd: c.oldEnd, newEnd: c.newEnd })));

    if (!APPLY) {
      console.info('[shift-series-day-back] Dry-run complete. Run with --apply to persist these changes.');
      return process.exit(0);
    }

    console.info('[shift-series-day-back] Applying updates...');
    const results = [];
    for (const c of candidates) {
      try {
        const newDateObj = new Date(c.newDate);
        const newEndObj = c.newEnd ? new Date(c.newEnd) : null;
        // Update meta.endDate if present
        const data = { date: newDateObj };
        if (newEndObj) data.end_date = newEndObj;

        // If the row had meta.endDate, update the meta JSON as well
        // We'll attempt to fetch current meta to avoid overwriting unrelated keys
        const current = await prisma.event.findUnique({ where: { id: c.id }, select: { meta: true } });
        if (current && current.meta && current.meta.endDate) {
          const newMeta = { ...current.meta };
          try { newMeta.endDate = new Date(String(newMeta.endDate)); newMeta.endDate = new Date(newMeta.endDate.getTime() - MS_DAY).toISOString(); } catch (e) { /* ignore */ }
          data.meta = newMeta;
        }

        await prisma.event.update({ where: { id: c.id }, data });
        results.push({ id: c.id, ok: true });
      } catch (e) {
        console.error('[shift-series-day-back] update failed for id=%s: %s', c.id, e && e.message ? e.message : e);
        results.push({ id: c.id, ok: false, error: e && e.message ? e.message : String(e) });
      }
    }

    const applied = results.filter(r => r.ok).length;
    console.info('[shift-series-day-back] Applied updates:', applied, 'of', results.length);
    process.exit(0);
  } catch (err) {
    console.error('[shift-series-day-back] Error:', err && err.stack ? err.stack : err);
    process.exit(1);
  } finally {
    try { await prisma.$disconnect(); } catch (e) { /* ignore */ }
  }
})();
