const p = require('../lib/prisma');
(async () => {
  try {
    const ids = [
      'c0ca85db-bd12-4c10-b740-c31de48bbc8b',
      '5f96cbfa-d527-4050-9afb-5aaf99f9420f',
    ];
    const rows = await p.event.findMany({
      where: { OR: ids.flatMap((id) => [{ id: id }, { template_id: id }]) },
      select: {
        id: true,
        template_id: true,
        title: true,
        date: true,
        end_date: true,
        time: true,
        meta: true,
        created_at: true,
      },
      orderBy: { date: 'asc' },
    });
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error('ERROR', e);
  } finally {
    await p.$disconnect();
  }
})();
