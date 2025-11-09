import prisma from '../../../lib/prisma';

async function resolveUserId(req) {
  try {
    const { getToken } = await import('next-auth/jwt');
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret' });
    const tokenUserId = token && (token.userId || token.sub) ? (token.userId || token.sub) : null;
    if (tokenUserId) return tokenUserId;

    if (process.env.NODE_ENV !== 'production' && req && req.cookies) {
      if (req.cookies.userId) return req.cookies.userId;
      if (req.cookies.debug_userId) return req.cookies.debug_userId;
    }
    return null;
  } catch (err) {
    console.error('resolveUserId error', err);
    return null;
  }
}

// Helper: Calculate all dates for a specific day of week between start and end dates
function calculateOccurrences(startDate, endDate, dayOfWeek, holidays = []) {
  const occurrences = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Find first occurrence of the target day
  let current = new Date(start);
  while (current.getDay() !== dayOfWeek && current <= end) {
    current.setDate(current.getDate() + 1);
  }
  
  // Collect all occurrences
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    
    // Skip if it's a holiday
    const isHoliday = holidays.some(h => {
      const holidayDate = new Date(h.date).toISOString().split('T')[0];
      return holidayDate === dateStr;
    });
    
    if (!isHoliday) {
      occurrences.push(new Date(current));
    }
    
    current.setDate(current.getDate() + 7); // Next week
  }
  
  return occurrences;
}

// Helper: Calculate duration in minutes
function calculateDuration(startTime, endTime) {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST,OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST,OPTIONS');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { semester, startDate, endDate, patterns } = req.body;

    if (!startDate || !endDate || !patterns || !Array.isArray(patterns)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: startDate, endDate, patterns' 
      });
    }

    console.log(`Bulk create request: ${patterns.length} patterns from ${startDate} to ${endDate}`);

    // Fetch holidays for the semester
    const year = new Date(startDate).getFullYear();
    let holidays = [];
    try {
      const holidayResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/holidays?year=${year}&country=IQ`);
      if (holidayResponse.ok) {
        const holidayData = await holidayResponse.json();
        holidays = holidayData.holidays || [];
      }
    } catch (err) {
      console.warn('Failed to fetch holidays:', err.message);
    }

    const summary = {};
    let totalEvents = 0;

    // Process each pattern
    for (const pattern of patterns) {
      const { courseId, sessionType, dayOfWeek, startTime, endTime, location } = pattern;

      if (!courseId || dayOfWeek === undefined || !startTime || !endTime) {
        console.warn('Skipping invalid pattern:', pattern);
        continue;
      }

      // Fetch course info
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course || course.user_id !== userId) {
        console.warn('Course not found or unauthorized:', courseId);
        continue;
      }

      // Calculate all occurrence dates
      const occurrences = calculateOccurrences(
        new Date(startDate),
        new Date(endDate),
        dayOfWeek,
        holidays
      );

      console.log(`Creating ${occurrences.length} events for ${course.name} on day ${dayOfWeek}`);

      // Prepare events data
      const eventsData = occurrences.map(date => ({
        title: `${course.name}${sessionType ? ' ' + sessionType : ''}`,
        type: 'class',
        course_id: courseId,
        date: date,
        time: `${startTime}-${endTime}`,
        description: location || null,
        color: course.color,
        user_id: userId,
        completed: false,
        archived: false,
        meta: {
          schedulePattern: {
            courseId,
            sessionType: sessionType || 'lecture',
            dayOfWeek,
            startTime,
            endTime,
            location: location || null
          },
          durationMinutes: calculateDuration(startTime, endTime)
        }
      }));

      // Bulk insert events
      await prisma.event.createMany({
        data: eventsData
      });

      // Update summary
      if (!summary[course.name]) {
        summary[course.name] = 0;
      }
      summary[course.name] += occurrences.length;
      totalEvents += occurrences.length;
    }

    console.log(`✅ Created ${totalEvents} events across ${Object.keys(summary).length} courses`);

    return res.status(201).json({
      success: true,
      eventsCreated: totalEvents,
      summary
    });

  } catch (error) {
    console.error('Bulk create error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create timetable events',
      details: error.message
    });
  }
}
