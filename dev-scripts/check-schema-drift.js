import prisma from '../lib/prisma.js';

async function checkTables() {
  const tables = ['events', 'courses', 'users', 'attachments', 'task_lists', 'task_list_members', 'comments', 'activity_logs', 'focus_sessions', 'focus_settings', 'calendar_connections', 'course_resources'];
  
  for (const table of tables) {
    try {
      const cols = await prisma.$queryRawUnsafe(
        `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' AND table_schema = 'public' ORDER BY ordinal_position`
      );
      console.log(`\n${table}: [${cols.map(c => c.column_name).join(', ')}]`);
    } catch (e) {
      console.log(`\n${table}: ERROR - ${e.message}`);
    }
  }
  
  await prisma.$disconnect();
}

checkTables().catch(e => { console.error(e); process.exit(1); });
