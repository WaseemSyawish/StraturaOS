const prisma = require('../lib/prisma').default || require('../lib/prisma');

async function main() {
  const rows = await prisma.course.findMany({ select: { user_id: true, semester: true } });
  const counts = new Map();
  for (const row of rows) {
    const key = String(row.semester || '');
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
  console.log(top);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await prisma.$disconnect(); } catch (_) {}
  });
