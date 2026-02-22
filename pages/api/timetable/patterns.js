import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';
import fs from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';
const DATA_DIR = path.join(process.cwd(), 'data');

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

// Helper: Load holidays from local data files
function loadHolidays(startYear, endYear) {
  let holidays = [];
  
  // Load holidays for all years in the range
  for (let year = startYear; year <= endYear; year++) {
    try {
      const cacheFile = path.join(DATA_DIR, `holidays-IQ-${year}.json`);
      if (fs.existsSync(cacheFile)) {
        const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (Array.isArray(data)) holidays.push(...data);
      }
    } catch (err) {
      if (isDev) console.warn(`Failed to load holidays for ${year}`);
    }
  }
  
  // Load Kurdistan-specific holidays
  try {
    const kurdistanFile = path.join(DATA_DIR, 'holidays-iq-kurdistan.json');
    if (fs.existsSync(kurdistanFile)) {
      const kurdistanData = JSON.parse(fs.readFileSync(kurdistanFile, 'utf8'));
      if (Array.isArray(kurdistanData)) {
        const filtered = kurdistanData.filter(h => {
          const hYear = new Date(h.date).getFullYear();
          return hYear >= startYear && hYear <= endYear;
        });
        holidays.push(...filtered);
      }
    }
  } catch (err) {
    if (isDev) console.warn('Failed to load Kurdistan holidays');
  }
  
  // Load academic holidays
  try {
    const academicFile = path.join(DATA_DIR, `holidays-academic-${startYear}-${endYear}.json`);
    if (fs.existsSync(academicFile)) {
      const academicData = JSON.parse(fs.readFileSync(academicFile, 'utf8'));
      if (Array.isArray(academicData)) holidays.push(...academicData);
    }
  } catch (err) {
    if (isDev) console.warn('Failed to load academic holidays');
  }
  
  return holidays;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET,POST,DELETE,OPTIONS');
    return res.status(204).end();
  }

  try {
    const userId = await resolveUser(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    if (req.method === 'GET') {
      // Get all unique smart schedule patterns for this user
      // Returns grouped patterns by course + pattern characteristics
      
      const events = await prisma.event.findMany({
        where: {
          user_id: userId,
          type: 'class' // Only get class events (smart schedules)
        },
        include: {
          courses: true
        },
        orderBy: [
          { courses: { name: 'asc' } },
          { date: 'asc' }
        ]
      });

      // Filter to only those with schedulePattern metadata
      const patternEvents = events.filter(e => e.meta?.schedulePattern);

      // Group events by course and pattern to find unique patterns
      const patternMap = new Map(); // key = "${courseId}_${dayOfWeek}_${startTime}"
      
      patternEvents.forEach(event => {
        const pattern = event.meta.schedulePattern;
        if (!pattern) return;
        
        const key = `${pattern.courseId}_${pattern.dayOfWeek}_${pattern.startTime}`;
        
        if (!patternMap.has(key)) {
          patternMap.set(key, {
            id: null, // Generated ID for client
            courseId: pattern.courseId,
            courseName: event.courses?.name || 'Unknown Course',
            courseColor: event.courses?.color || '#7c3aed',
            sessionType: pattern.sessionType || 'Lecture',
            dayOfWeek: pattern.dayOfWeek,
            startTime: pattern.startTime,
            endTime: pattern.endTime,
            location: pattern.location || '',
            totalInstances: 0,
            firstEventDate: event.date,
            lastEventDate: event.date,
            sampleEventId: event.id // For operations like delete
          });
        }
        
        const patternData = patternMap.get(key);
        patternData.totalInstances++;
        patternData.lastEventDate = new Date(event.date) > new Date(patternData.lastEventDate) 
          ? event.date 
          : patternData.lastEventDate;
      });

      // Convert map to array and assign unique IDs
      const patterns = Array.from(patternMap.values()).map((p, idx) => ({
        ...p,
        id: `pattern_${idx}` // Generate client-side ID
      }));

      return res.status(200).json({
        success: true,
        patterns,
        total: patterns.length
      });
    }

    if (req.method === 'DELETE') {
      // Delete a specific pattern (all instances of it)
      // Pattern specified by query: courseId, dayOfWeek, startTime
      
      const { courseId, dayOfWeek, startTime } = req.query;
      
      if (!courseId || dayOfWeek === undefined || !startTime) {
        return res.status(400).json({
          success: false,
          error: 'Missing required query params: courseId, dayOfWeek, startTime'
        });
      }

      // Find and delete all events matching this pattern
      const deleted = await prisma.event.deleteMany({
        where: {
          user_id: userId,
          course_id: courseId,
          meta: {
            path: ['schedulePattern'],
            not: prisma.PrismaRaw('null')
          }
        }
      });

      // More precise deletion: filter by pattern in application layer
      const allPatternEvents = await prisma.event.findMany({
        where: {
          user_id: userId,
          course_id: courseId
        }
      });

      const toDelete = allPatternEvents.filter(e => {
        const p = e.meta?.schedulePattern;
        return p && 
               p.dayOfWeek === parseInt(dayOfWeek) && 
               p.startTime === startTime;
      });

      // Delete matched events
      const result = await prisma.event.deleteMany({
        where: {
          id: { in: toDelete.map(e => e.id) }
        }
      });

      return res.status(200).json({
        success: true,
        message: `Deleted ${result.count} instances of this pattern`,
        deletedCount: result.count
      });
    }

    if (req.method === 'POST') {
      // Update a pattern: delete old instances and create new ones
      // Body: { oldPattern: {...}, newPattern: {...}, semesterInfo: { start_date, end_date } }
      
      const { oldPattern, newPattern, semesterInfo } = req.body;
      
      if (!oldPattern || !newPattern || !semesterInfo) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: oldPattern, newPattern, semesterInfo'
        });
      }

      const { start_date, end_date } = semesterInfo;
      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: 'semesterInfo must contain start_date and end_date'
        });
      }

      // Find all events matching the old pattern
      const allPatternEvents = await prisma.event.findMany({
        where: {
          user_id: userId,
          course_id: oldPattern.courseId
        }
      });

      const toDelete = allPatternEvents.filter(e => {
        const p = e.meta?.schedulePattern;
        return p && 
               p.dayOfWeek === oldPattern.dayOfWeek && 
               p.startTime === oldPattern.startTime;
      });

      // Delete old instances
      let deletedCount = 0;
      if (toDelete.length > 0) {
        const result = await prisma.event.deleteMany({
          where: {
            id: { in: toDelete.map(e => e.id) }
          }
        });
        deletedCount = result.count;
      }

      // Get course details and verify authorization
      const course = await prisma.course.findUnique({
        where: { id: newPattern.courseId }
      });

      if (!course || course.user_id !== userId) {
        return res.status(404).json({ 
          success: false, 
          error: 'Course not found or unauthorized' 
        });
      }

      // Load holidays for the semester date range
      const startYear = new Date(start_date).getFullYear();
      const endYear = new Date(end_date).getFullYear();
      const holidays = loadHolidays(startYear, endYear);

      // Calculate all new occurrence dates with the NEW dayOfWeek
      const occurrences = calculateOccurrences(
        new Date(start_date),
        new Date(end_date),
        newPattern.dayOfWeek,
        holidays
      );

      // Build event title with session type suffix
      const sessionSuffix = newPattern.sessionType && newPattern.sessionType.toLowerCase() !== 'lecture' 
        ? ` - ${newPattern.sessionType}` 
        : '';
      const eventTitle = `${course.name}${sessionSuffix}`;

      // Prepare new events data
      const eventsData = occurrences.map(date => ({
        title: eventTitle,
        type: 'class',
        course_id: newPattern.courseId,
        date: date,
        time: `${newPattern.startTime}-${newPattern.endTime}`,
        description: newPattern.location || null,
        user_id: userId,
        completed: false,
        archived: false,
        meta: {
          schedulePattern: {
            courseId: newPattern.courseId,
            sessionType: newPattern.sessionType || 'Lecture',
            dayOfWeek: newPattern.dayOfWeek,
            startTime: newPattern.startTime,
            endTime: newPattern.endTime,
            location: newPattern.location || null
          },
          durationMinutes: calculateDuration(newPattern.startTime, newPattern.endTime)
        }
      }));

      // Bulk insert new events
      let createdCount = 0;
      if (eventsData.length > 0) {
        await prisma.event.createMany({
          data: eventsData
        });
        createdCount = eventsData.length;
      }

      if (isDev) {
        console.log(`Pattern update: deleted ${deletedCount}, created ${createdCount} for ${course.name}`);
      }

      return res.status(200).json({
        success: true,
        message: `Updated pattern: deleted ${deletedCount} old instances, created ${createdCount} new instances`,
        deletedCount,
        createdCount
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('Pattern API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
