import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Import and use the same auth mechanism as other APIs
    const { resolveUser } = await import('../../lib/resolveUser');
    let userId = await resolveUser(req);
    
    console.log('[export-data] Resolved userId:', userId);
    
    // Development fallback
    if (!userId && process.env.NODE_ENV === 'development' && req.query && req.query.userId) {
      userId = String(req.query.userId);
      console.log('[export-data] Using dev fallback userId:', userId);
    }
    
    if (!userId) {
      console.error('[export-data] No userId found - unauthorized');
      return res.status(401).json({ error: 'Unauthorized - Please sign in' });
    }

    console.log('[export-data] Fetching data for userId:', userId);

    // Ensure userId is the correct type
    const userIdInt = typeof userId === 'string' ? parseInt(userId) : userId;
    console.log('[export-data] Using userId (as int):', userIdInt);

    // Fetch all user data in parallel
    const [events, courses, assessments, attendanceSessions, semesterSettings] = await Promise.all([
      // Events
      prisma.event.findMany({
        where: { user_id: userIdInt },
        orderBy: { date: 'asc' }
      }),
      
      // Courses
      prisma.course.findMany({
        where: { user_id: userIdInt },
        include: {
          categories: true
        },
        orderBy: { name: 'asc' }
      }),
      
      // Assessments (grades)
      prisma.assessment.findMany({
        where: {
          course: {
            user_id: userIdInt
          }
        },
        include: {
          course: {
            select: {
              name: true,
              code: true
            }
          }
        },
        orderBy: { date_assigned: 'desc' }
      }),
      
      // Attendance Sessions
      prisma.attendanceSession.findMany({
        where: { user_id: userIdInt },
        orderBy: { date: 'desc' }
      }),
      
      // Semester Settings
      prisma.semesterSetting.findMany({
        where: { user_id: userIdInt },
        orderBy: { start_date: 'desc' }
      })
    ]);

    // Build export data object
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        userId: userId,
        version: '1.0',
        application: 'University Planner'
      },
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        type: e.type,
        date: e.date,
        time: e.time,
        endDate: e.end_date,
        color: e.color,
        location: e.location,
        meta: e.meta,
        courseId: e.course_id,
        archived: e.archived,
        createdAt: e.created_at
      })),
      courses: courses.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        color: c.color,
        credits: c.credits,
        instructor: c.instructor,
        location: c.location,
        categories: c.categories?.map(cat => ({
          id: cat.id,
          name: cat.name,
          weight: cat.weight
        })) || []
      })),
      assessments: assessments.map(a => ({
        id: a.id,
        name: a.name,
        courseName: a.course?.name,
        courseCode: a.course?.code,
        score: a.score,
        maxScore: a.max_score,
        weight: a.weight,
        category: a.category,
        dateAssigned: a.date_assigned,
        dateDue: a.date_due,
        notes: a.notes
      })),
      attendance: attendanceSessions.map(s => ({
        id: s.id,
        courseName: s.course_name,
        date: s.date,
        status: s.status,
        notes: s.notes
      })),
      semesters: semesterSettings.map(s => ({
        id: s.id,
        name: s.name,
        startDate: s.start_date,
        endDate: s.end_date,
        isActive: s.is_active
      })),
      summary: {
        totalEvents: events.length,
        totalCourses: courses.length,
        totalAssessments: assessments.length,
        totalAttendanceSessions: attendanceSessions.length,
        totalSemesters: semesterSettings.length
      }
    };

    // Set headers for file download
    const filename = `university-planner-export-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    return res.status(200).json(exportData);
  } catch (error) {
    console.error('[export-data] Error:', error);
    console.error('[export-data] Error message:', error.message);
    console.error('[export-data] Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to export data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
