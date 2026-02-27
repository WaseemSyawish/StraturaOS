const prisma = require('../lib/prisma').default || require('../lib/prisma');

function getOrderFromName(name) {
  const s = String(name || '').toLowerCase();
  if (/\b(first|1st|semester\s*1|s1)\b/.test(s)) return '1';
  if (/\b(second|2nd|semester\s*2|s2)\b/.test(s)) return '2';
  if (/\b(third|3rd|semester\s*3|s3)\b/.test(s)) return '3';
  return null;
}

async function main() {
  const courses = await prisma.course.findMany({
    where: { semester: { not: null } },
    select: { id: true, user_id: true, semester: true, name: true },
  });

  const legacy = courses.filter((c) => /^\d{4}-[1-3]$/.test(String(c.semester || '').trim()));
  if (legacy.length === 0) {
    console.log('[migrate-legacy-course-semesters] No legacy values found');
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const course of legacy) {
    const sem = String(course.semester).trim();
    const [yearPart, orderPart] = sem.split('-');

    const settings = await prisma.semesterSetting.findMany({
      where: { user_id: course.user_id },
      select: { id: true, name: true, start_date: true },
    });

    const matches = settings.filter((s) => {
      const y = String(new Date(s.start_date).getFullYear());
      const order = getOrderFromName(s.name);
      return y === yearPart && order === orderPart;
    });

    if (matches.length === 1) {
      await prisma.course.update({
        where: { id: course.id },
        data: { semester: matches[0].id },
      });
      updated += 1;
      console.log(`[migrate-legacy-course-semesters] Updated ${course.id} (${course.name}) ${sem} -> ${matches[0].id}`);
    } else {
      skipped += 1;
      console.log(`[migrate-legacy-course-semesters] Skipped ${course.id} (${course.name}) ${sem} (matches=${matches.length})`);
    }
  }

  console.log(`[migrate-legacy-course-semesters] Done. updated=${updated}, skipped=${skipped}`);
}

main()
  .catch((e) => {
    console.error('[migrate-legacy-course-semesters] Failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await prisma.$disconnect(); } catch (_) {}
  });
