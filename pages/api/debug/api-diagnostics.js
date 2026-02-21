import { resolveUser } from '../../../lib/resolveUser';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const userId = await resolveUser(req);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    console.log('Running API diagnostics for user:', userId);

    // Test 1: Courses via Prisma
    const courses = await prisma.course.findMany({
      where: { user_id: userId },
      select: { id: true, name: true, user_id: true }
    });

    // Test 2: Events via Prisma
    const events = await prisma.event.findMany({
      where: { user_id: userId },
      select: { id: true, title: true, user_id: true },
      take: 5
    });

    // Test 3: Attendance via Prisma
    const attendance = await prisma.attendanceSession.findMany({
      where: { user_id: userId },
      select: { id: true, user_id: true },
      take: 5
    });

    // Test 4: Semester Settings via Prisma
    const semesters = await prisma.semesterSetting.findMany({
      where: { user_id: userId },
      select: { id: true, name: true, user_id: true }
    });

    // Test 5: Check ALL Semester Settings (should be empty for other users)
    const allSemesters = await prisma.semesterSetting.findMany({
      select: { id: true, name: true, user_id: true }
    });

    // Test 6: Check ALL Courses (should be all yours)
    const allCourses = await prisma.course.findMany({
      select: { id: true, name: true, user_id: true }
    });

    return res.status(200).json({
      user_id: userId,
      tests: {
        courses_for_user: {
          count: courses.length,
          data: courses.map(c => ({ name: c.name, owner_user_id: c.user_id }))
        },
        events_for_user: {
          count: events.length,
          data: events.map(e => ({ title: e.title, owner_user_id: e.user_id }))
        },
        attendance_for_user: {
          count: attendance.length
        },
        semesters_for_user: {
          count: semesters.length,
          data: semesters.map(s => ({ name: s.name, owner_user_id: s.user_id }))
        },
        all_semesters_in_db: {
          total: allSemesters.length,
          by_user: allSemesters.reduce((acc, s) => {
            if (!acc[s.user_id]) acc[s.user_id] = [];
            acc[s.user_id].push(s.name);
            return acc;
          }, {})
        },
        all_courses_in_db: {
          total: allCourses.length,
          by_user: allCourses.reduce((acc, c) => {
            if (!acc[c.user_id]) acc[c.user_id] = [];
            acc[c.user_id].push(c.name);
            return acc;
          }, {})
        }
      }
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
