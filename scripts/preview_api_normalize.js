const p = require('../lib/prisma');
function isDateOnly(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }
function localDateOnlyString(d) {
  if (!d) return null;
  const dt = (Object.prototype.toString.call(d) === '[object Date]') ? d : new Date(String(d));
  if (isNaN(dt.getTime())) return null;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function parseDateForStorage(value) {
  if (!value) return new Date();
  if (Object.prototype.toString.call(value) === '[object Date]') return value;
  const s = String(value);
  if (isDateOnly(s)) {
    const parts = s.split('-').map(Number);
    return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1, 12, 0, 0);
  }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}
(async ()=>{
  try {
    const ids = ['c0ca85db-bd12-4c10-b740-c31de48bbc8b','5f96cbfa-d527-4050-9afb-5aaf99f9420f'];
    const rows = await p.event.findMany({ where: { OR: ids.flatMap(id=>[{ id }, { template_id: id }]) }, orderBy: { date: 'asc' } });
    const normalized = rows.map(out => {
      const ev = { ...out };
      // compute startDate
      try {
        const dateVal = ev.date || ev.created_at || null;
        if (dateVal) {
          let dt = null;
          try {
            const sVal = String(dateVal);
            if (/^\d{4}-\d{2}-\d{2}$/.test(sVal)) {
              const parts = sVal.split('-').map(Number);
              dt = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
            } else dt = new Date(sVal);
          } catch (e) { dt = new Date(String(dateVal)); }
          if (!isNaN(dt.getTime())) {
            const y = dt.getFullYear(); const m = dt.getMonth(); const day = dt.getDate();
            let hh = 12, mm = 0;
            try { const t = ev.time || null; if (t && typeof t === 'string' && t.indexOf(':') !== -1) { const parts = String(t).split(':').map(Number); hh = Number.isFinite(parts[0]) ? parts[0] : 0; mm = Number.isFinite(parts[1]) ? parts[1] : 0; } } catch(e){}
            const iso = new Date(y, m, day, hh, mm, 0).toISOString();
            ev.startDate = iso;
            // derive out.date
            try {
              const mmatch = String(ev.startDate).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
              if (mmatch) {
                const yy = Number(mmatch[1]); const momo = Number(mmatch[2]) - 1; const dd = Number(mmatch[3]); const hh2 = Number(mmatch[4]); const mm2 = Number(mmatch[5]);
                const localDt2 = new Date(yy, momo, dd, hh2, mm2, 0);
                const y2 = localDt2.getFullYear(); const m2s = String(localDt2.getMonth() + 1).padStart(2, '0'); const d2s = String(localDt2.getDate()).padStart(2, '0');
                ev.date = `${y2}-${m2s}-${d2s}`;
              }
            } catch(e){}
          }
        }
      } catch(e){}
      // compute endDate
      try {
        if (ev.end_date) {
          const ed = (Object.prototype.toString.call(ev.end_date) === '[object Date]') ? ev.end_date : new Date(String(ev.end_date));
          if (!isNaN(ed.getTime())) ev.endDate = ed.toISOString();
        } else if (ev.meta && ev.meta.endDate) {
          const ed2 = new Date(String(ev.meta.endDate)); if (!isNaN(ed2.getTime())) ev.endDate = ed2.toISOString();
        }
      } catch(e){}
      return { id: ev.id, template_id: ev.template_id, title: ev.title, raw_date: out.date, db_date: String(out.date), time: ev.time, computed_startDate: ev.startDate, computed_endDate: ev.endDate, db_end_date: String(out.end_date), meta: ev.meta };
    });
    console.log(JSON.stringify(normalized, null, 2));
  } catch (e) { console.error('ERR', e); }
  finally { await p.$disconnect(); }
})();
