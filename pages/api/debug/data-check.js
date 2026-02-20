import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';

export default async function handler(req, res) {
  // Only in production - this is temporary debugging
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const userId = await resolveUser(req);
    
    if (!userId) {
      return res.status(200).json({
        status: 'error',
        message: 'Could not resolve user from cookies/token',
        debug: {
          cookies_received: Object.keys(req.cookies || {}),
          session_cookie_exists: !!req.cookies?.session,
          userId_cookie_exists: !!req.cookies?.userId,
          headers: {
            cookie: req.headers.cookie ? `[${req.headers.cookie.length} chars]` : 'none',
          },
        },
      });
    }

    // User found - now fetch their data
    const [users, courses, events, attendanceSessions] = await Promise.all([
      prisma.user.count(),
      prisma.course.findMany({ where: { user_id: userId }, select: { id: true, name: true, user_id: true } }),
      prisma.event.findMany({ where: { user_id: userId }, select: { id: true, title: true, user_id: true }, take: 5 }),
      prisma.attendanceSession.findMany({ where: { user_id: userId }, select: { id: true, user_id: true }, take: 5 }),
    ]);

    return res.status(200).json({
      status: 'ok',
      resolved_user_id: userId,
      data_counts: {
        total_users_in_db: users,
        courses_for_this_user: courses.length,
        events_for_this_user: events.length,
        attendance_sessions_for_this_user: attendanceSessions.length,
      },
      sample_data: {
        courses: courses.slice(0, 3),
        events: events.slice(0, 3),
        attendance_sessions: attendanceSessions.slice(0, 3),
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
