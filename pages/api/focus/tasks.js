import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';
import { subDays, addDays } from 'date-fns';

export default async function handler(req, res) {
  const userId = await resolveUser(req);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { search = '', limit = 20 } = req.query;
    console.log('[tasks API] User:', userId, 'Search:', search);
    const sevenDaysAgo = subDays(new Date(), 7);

    // Get tasks that were worked on recently via focus sessions
    const recentFocusSessions = await prisma.focusSession.findMany({
      where: {
        user_id: userId,
        task_id: { not: null },
        started_at: { gte: sevenDaysAgo },
      },
      select: {
        task_id: true,
        started_at: true,
      },
      orderBy: { started_at: 'desc' },
    });

    // Get unique task IDs from recent sessions
    const recentTaskIds = [...new Set(recentFocusSessions.map(s => s.task_id))];
    console.log('[tasks API] Recent task IDs:', recentTaskIds.length);

    // Build where clause - exclude "class" type events (those are schedule items, not tasks)
    const where = {
      user_id: userId,
      completed: false,
      archived: false,
      type: { not: 'class' }, // Exclude class/lecture schedule items
      ...(search && {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    };

    console.log('[tasks API] Where clause:', JSON.stringify(where, null, 2));

    // If no search, apply date/recency filters
    if (!search) {
      // Show tasks from the next 30 days or recently worked on
      const thirtyDaysFromNow = addDays(new Date(), 30);
      
      if (recentTaskIds.length > 0) {
        where.OR = [
          // Upcoming tasks (within next 30 days)
          {
            date: {
              lte: thirtyDaysFromNow,
            },
          },
          // Tasks worked on recently
          { id: { in: recentTaskIds } },
        ];
      } else {
        // Just show upcoming tasks if no recent work
        where.date = {
          lte: thirtyDaysFromNow,
        };
      }
    }

    const tasks = await prisma.event.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { created_at: 'desc' },
      ],
      take: parseInt(limit),
      select: {
        id: true,
        title: true,
        type: true,
        date: true,
        course_id: true,
        description: true,
        courses: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
          },
        },
      },
    });

    console.log('[tasks API] Found tasks:', tasks.length);
    if (tasks.length > 0) {
      console.log('[tasks API] Sample task:', JSON.stringify(tasks[0], null, 2));
    }

    // Format tasks for response
    const enrichedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      type: task.type,
      date: task.date,
      description: task.description,
      course: task.courses ? {
        id: task.courses.id,
        name: task.courses.name,
        code: task.courses.code,
        color: task.courses.color,
      } : null,
      isRecent: recentTaskIds.includes(task.id),
    }));

    console.log('[tasks API] Returning enriched tasks:', enrichedTasks.length);
    return res.status(200).json({
      tasks: enrichedTasks,
    });
  } catch (error) {
    console.error('Focus tasks API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
