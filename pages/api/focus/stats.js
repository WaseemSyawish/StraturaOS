import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays } from 'date-fns';

export default async function handler(req, res) {
  const userId = await resolveUser(req);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { period = 'today' } = req.query;
    const now = new Date();
    
    let startDate, endDate;
    
    switch (period) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case '7days':
        startDate = subDays(now, 7);
        endDate = now;
        break;
      case '30days':
        startDate = subDays(now, 30);
        endDate = now;
        break;
      default:
        startDate = startOfDay(now);
        endDate = endOfDay(now);
    }

    // Get all completed focus sessions in period
    const sessions = await prisma.focusSession.findMany({
      where: {
        user_id: userId,
        completed: true,
        session_type: 'focus',
        started_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { started_at: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    // Calculate statistics
    const totalSessions = sessions.length;
    const totalFocusTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalFocusMinutes = Math.floor(totalFocusTime / 60);
    const totalFocusHours = Math.floor(totalFocusMinutes / 60);
    const remainingMinutes = totalFocusMinutes % 60;

    // Group by task
    const taskStats = {};
    sessions.forEach(session => {
      const taskKey = session.task_id || session.task_name || 'Untitled';
      const taskTitle = session.event?.title || session.task_name || 'Untitled Task';
      
      if (!taskStats[taskKey]) {
        taskStats[taskKey] = {
          taskId: session.task_id,
          taskName: taskTitle,
          sessions: 0,
          totalMinutes: 0,
          lastWorkedOn: session.started_at,
        };
      }
      
      taskStats[taskKey].sessions += 1;
      taskStats[taskKey].totalMinutes += Math.floor(session.duration / 60);
      
      if (new Date(session.started_at) > new Date(taskStats[taskKey].lastWorkedOn)) {
        taskStats[taskKey].lastWorkedOn = session.started_at;
      }
    });

    // Convert to array and sort by sessions completed
    const taskStatsArray = Object.values(taskStats).sort((a, b) => b.sessions - a.sessions);

    // Get daily breakdown for the week
    const dailyStats = {};
    sessions.forEach(session => {
      const dateKey = startOfDay(new Date(session.started_at)).toISOString();
      
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          sessions: 0,
          totalMinutes: 0,
        };
      }
      
      dailyStats[dateKey].sessions += 1;
      dailyStats[dateKey].totalMinutes += Math.floor(session.duration / 60);
    });

    const dailyStatsArray = Object.values(dailyStats).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Calculate streak (consecutive days with at least 1 session)
    let currentStreak = 0;
    const today = startOfDay(now);
    let checkDate = today;
    
    for (let i = 0; i < 365; i++) {
      const hasSessions = await prisma.focusSession.count({
        where: {
          user_id: userId,
          completed: true,
          session_type: 'focus',
          started_at: {
            gte: startOfDay(checkDate),
            lte: endOfDay(checkDate),
          },
        },
      });
      
      if (hasSessions > 0) {
        currentStreak += 1;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    // Get user's daily goal
    const focusSettings = await prisma.focusSettings.findUnique({
      where: { user_id: userId },
    });

    const stats = {
      period,
      totalSessions,
      totalFocusTime: {
        seconds: totalFocusTime,
        minutes: totalFocusMinutes,
        hours: totalFocusHours,
        formatted: `${totalFocusHours}h ${remainingMinutes}m`,
      },
      currentStreak,
      dailyGoal: focusSettings?.daily_goal_sessions || null,
      goalProgress: focusSettings?.daily_goal_sessions 
        ? Math.min(100, Math.round((totalSessions / focusSettings.daily_goal_sessions) * 100))
        : null,
      taskStats: taskStatsArray,
      dailyStats: dailyStatsArray,
      recentSessions: sessions.slice(0, 10).map(s => ({
        id: s.id,
        taskName: s.event?.title || s.task_name || 'Untitled Task',
        duration: Math.floor(s.duration / 60),
        completedAt: s.ended_at || s.started_at,
        interrupted: s.interrupted,
      })),
    };

    return res.status(200).json({ stats });
  } catch (error) {
    console.error('Focus stats API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
