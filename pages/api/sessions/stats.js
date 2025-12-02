import prisma from "../../../lib/prisma";
import { resolveUser } from "../../../lib/resolveUser";
import fs from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = await resolveUser(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Start week on Monday to match client-side overview week calculation
  const dayOfWeek = (todayStart.getDay() + 6) % 7; // 0 => Monday
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - dayOfWeek);

  try {
    // Try using Prisma first
    const todaySessions = await prisma.focusSession.findMany({
      where: {
        user_id: userId,
        started_at: { gte: todayStart },
      },
    });

    const weekSessions = await prisma.focusSession.findMany({
      where: {
        user_id: userId,
        started_at: { gte: weekStart },
      },
    });

    const todayDuration = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const weekDuration = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const todayCompleted = todaySessions.filter((s) => s.completed).length;
    const weekCompleted = weekSessions.filter((s) => s.completed).length;

    if (isDev) console.log('[api/sessions/stats] Prisma result - todaySessions=', todaySessions.length, 'weekSessions=', weekSessions.length, 'weekDuration=', weekDuration);

    return res.status(200).json({
      success: true,
      stats: {
        today: {
          total_sessions: todaySessions.length,
          completed_sessions: todayCompleted,
          total_duration: todayDuration,
          focus_duration: todaySessions
            .filter((s) => s.session_type === "focus")
            .reduce((sum, s) => sum + (s.duration || 0), 0),
        },
        week: {
          total_sessions: weekSessions.length,
          completed_sessions: weekCompleted,
          total_duration: weekDuration,
          focus_duration: weekSessions
            .filter((s) => s.session_type === "focus")
            .reduce((sum, s) => sum + (s.duration || 0), 0),
        },
      },
    });
  } catch (err) {
    if (isDev) console.error('[api/sessions/stats] Prisma error:', err && err.message ? err.message : err);
    // Dev fallback: when Prisma engine unavailable, read local dev file
    if (isDev && err && String(err.message || '').includes('Engine is not yet connected')) {
      try {
        const devFile = path.join(process.cwd(), 'data', 'dev-focus-sessions.json');
        let list = [];
        if (fs.existsSync(devFile)) {
          const raw = fs.readFileSync(devFile, 'utf8');
          list = raw ? JSON.parse(raw) : [];
        }

        // Filter by user and compute durations
        const todaySessions = (list || []).filter(s => String(s.user_id) === String(userId) && s.started_at && new Date(s.started_at) >= todayStart);
        const weekSessions = (list || []).filter(s => String(s.user_id) === String(userId) && s.started_at && new Date(s.started_at) >= weekStart);

        const parseDur = (v) => Number(v) || 0;
        const todayDuration = todaySessions.reduce((sum, s) => sum + parseDur(s.duration), 0);
        const weekDuration = weekSessions.reduce((sum, s) => sum + parseDur(s.duration), 0);
        const todayCompleted = todaySessions.filter((s) => s.completed).length;
        const weekCompleted = weekSessions.filter((s) => s.completed).length;

        if (isDev) console.log('[api/sessions/stats] Dev-file fallback - todaySessions=', todaySessions.length, 'weekSessions=', weekSessions.length, 'weekDuration=', weekDuration);

        return res.status(200).json({
          success: true,
          stats: {
            today: {
              total_sessions: todaySessions.length,
              completed_sessions: todayCompleted,
              total_duration: todayDuration,
              focus_duration: todaySessions.filter((s) => (s.session_type === 'focus')).reduce((sum, s) => sum + parseDur(s.duration), 0),
            },
            week: {
              total_sessions: weekSessions.length,
              completed_sessions: weekCompleted,
              total_duration: weekDuration,
              focus_duration: weekSessions.filter((s) => (s.session_type === 'focus')).reduce((sum, s) => sum + parseDur(s.duration), 0),
            },
          },
          fallback: 'dev-file'
        });
      } catch (fsErr) {
        if (isDev) console.error('[api/sessions/stats] dev fallback read failed:', fsErr);
        return res.status(500).json({ error: 'Failed to fetch stats (dev fallback failed)' });
      }
    }

    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
