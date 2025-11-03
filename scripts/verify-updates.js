const prisma = require('../lib/prisma');
(async () => {
  try {
    const rows = await prisma.event.findMany({ where: { template_id: { not: null } }, orderBy: { date: 'asc' }, take: 10 });
    for (const r of rows) {
      console.log('ID:', r.id);
      console.log('  title:', r.title);
      console.log('  user_id:', r.user_id);
      console.log('  date:', r.date ? r.date.toISOString() : null);
      console.log('  end_date:', r.end_date ? r.end_date.toISOString() : null);
      console.log('  time:', r.time);
      console.log('  meta.endDate:', r.meta && r.meta.endDate ? r.meta.endDate : null);
      console.log('---');
    }
  } catch (e) {
    console.error('verify-updates error', e);
  } finally {
    try { await prisma.$disconnect(); } catch (e) {}
  }
})();
