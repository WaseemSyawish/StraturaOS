import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';
import fs from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';
const DATA_DIR = path.join(process.cwd(), 'data');

function getSemesterOrderFromName(name) {
  const s = String(name || '').toLowerCase();
  if (/\b(first|1st|semester\s*1|s1)\b/.test(s)) return '1';
  if (/\b(second|2nd|semester\s*2|s2)\b/.test(s)) return '2';
  if (/\b(third|3rd|semester\s*3|s3)\b/.test(s)) return '3';
  return null;
}

function normalizeLabel(value) {
  return String(value || '').trim().toLowerCase().replace(/[-_\s]+/g, ' ');
}

// Map session types from SmartScheduleManager to actual event type values
function sessionTypeToEventType(sessionType) {
  if (!sessionType) return 'class';
  const lower = sessionType.toLowerCase();
  if (lower === 'lab') return 'lab';
  if (lower === 'tutorial') return 'tutorial';
  if (lower === 'seminar') return 'class';
  return 'class'; // Lecture and others default to 'class'
}

// Helper: Calculate all dates for a specific day of week between start and end dates
function calculateOccurrences(startDate, endDate, dayOfWeek, holidays = [], excludedRanges = []) {
  const occurrences = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Pre-compute excluded ranges as [startMs, endMs] pairs for fast lookup
  const excludedPairs = excludedRanges.map(r => [
    new Date(r.start + 'T00:00:00').getTime(),
    new Date(r.end + 'T23:59:59').getTime()
  ]);
  
  // Find first occurrence of the target day
  let current = new Date(start);
  while (current.getDay() !== dayOfWeek && current <= end) {
    current.setDate(current.getDate() + 1);
  }
  
  // Collect all occurrences
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const currentMs = current.getTime();
    
    // Skip if it's a holiday
    const isHoliday = holidays.some(h => {
      const holidayDate = new Date(h.date).toISOString().split('T')[0];
      return holidayDate === dateStr;
    });
    
    // Skip if it falls within an excluded period
    const isExcluded = excludedPairs.some(([s, e]) => currentMs >= s && currentMs <= e);
    
    if (!isHoliday && !isExcluded) {
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
      const activeSemester = await prisma.semesterSetting.findFirst({
        where: { user_id: userId, is_active: true },
        select: { id: true, name: true, start_date: true }
      });

      const activeYear = activeSemester?.start_date ? new Date(activeSemester.start_date).getFullYear() : null;
      const activeOrder = getSemesterOrderFromName(activeSemester?.name);
      const activeLegacy = activeYear && activeOrder ? `${activeYear}-${activeOrder}` : null;

      const isCourseInActiveSemester = (course) => {
        if (!activeSemester) return true;
        const semesterRaw = String(course?.semester || '').trim();
        if (!semesterRaw) return false;
        if (semesterRaw === String(activeSemester.id)) return true;
        if (activeLegacy && semesterRaw === activeLegacy) return true;
        if (normalizeLabel(semesterRaw) === normalizeLabel(activeSemester.name)) return true;
        return false;
      };
      
      const events = await prisma.event.findMany({
        where: {
          user_id: userId
        },
        include: {
          courses: true
        },
        orderBy: { date: 'asc' }
      });

      // Filter to only those with schedulePattern metadata
      const patternEvents = events.filter(e => e.meta?.schedulePattern && isCourseInActiveSemester(e.courses));

      // Group events by course and pattern to find unique patterns
      const patternMap = new Map(); // key = "${courseId}_${dayOfWeek}_${startTime}"
      
      patternEvents.forEach(event => {
        // Support both old format (meta.schedulePattern = true with fields at meta level)
        // and new format (meta.schedulePattern = { ...fields })
        const rawPattern = event.meta.schedulePattern;
        const pattern = typeof rawPattern === 'object' && rawPattern !== null
          ? rawPattern
          : {
              courseId: event.meta.courseId || event.courseId,
              dayOfWeek: event.meta.dayOfWeek ?? (event.date ? new Date(event.date).getDay() : 0),
              startTime: event.meta.startTime || event.time || '',
              endTime: event.meta.endTime || '',
              sessionType: event.meta.sessionType || 'lecture',
              location: event.meta.location || '',
              courseName: event.meta.courseName || '',
              courseCode: event.meta.courseCode || '',
              courseColor: event.meta.courseColor || '',
            };
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

      // Convert courseId to number for comparison
      const courseIdNum = parseInt(courseId);
      const dayOfWeekNum = parseInt(dayOfWeek);

      // Find all events for this user (no course filter, will check pattern metadata instead)
      const allPatternEvents = await prisma.event.findMany({
        where: {
          user_id: userId
        }
      });

      // Filter by exact pattern match (courseId, dayOfWeek, startTime)
      const toDelete = allPatternEvents.filter(e => {
        const p = e.meta?.schedulePattern;
        if (!p) return false;
        
        // Match all three pattern attributes
        // courseId might be stored as number or string, so compare both ways
        const courseIdMatch = p.courseId === courseIdNum || p.courseId === courseId || String(p.courseId) === courseId;
        const dayMatch = p.dayOfWeek === dayOfWeekNum;
        const timeMatch = p.startTime === startTime;
        
        return courseIdMatch && dayMatch && timeMatch;
      });

      if (toDelete.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No matching patterns found to delete',
          deletedCount: 0
        });
      }

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
      // Update a pattern by modifying currently available instances in-place.
      // Body: { oldPattern: {...}, newPattern: {...} }
      
      const { oldPattern, newPattern } = req.body;
      
      if (!oldPattern || !newPattern) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: oldPattern, newPattern'
        });
      }

      // Find all events matching the old pattern
      const allPatternEvents = await prisma.event.findMany({
        where: {
          user_id: userId,
          course_id: oldPattern.courseId
        }
      });

      const toUpdate = allPatternEvents.filter(e => {
        const p = e.meta?.schedulePattern;
        return p && 
               p.dayOfWeek === oldPattern.dayOfWeek && 
               p.startTime === oldPattern.startTime;
      });

      if (toUpdate.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No matching pattern instances found',
          modifiedCount: 0
        });
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

      // Build updated event title with session type suffix
      const sessionSuffix = newPattern.sessionType && newPattern.sessionType.toLowerCase() !== 'lecture' 
        ? ` - ${newPattern.sessionType}` 
        : '';
      const eventTitle = `${course.name}${sessionSuffix}`;

      // Shift each available instance date to target weekday within the same week window,
      // then update metadata and timing fields in-place.
      const updatePromises = toUpdate.map((event) => {
        const baseDate = event.date ? new Date(event.date) : null;
        let nextDate = baseDate;
        if (baseDate && !Number.isNaN(baseDate.getTime())) {
          const targetDow = Number(newPattern.dayOfWeek);
          const currentDow = baseDate.getDay();
          const delta = targetDow - currentDow;
          nextDate = new Date(baseDate);
          nextDate.setDate(baseDate.getDate() + delta);
        }

        const nextMeta = {
          ...(event.meta || {}),
          schedulePattern: {
            courseId: newPattern.courseId,
            sessionType: newPattern.sessionType || 'Lecture',
            dayOfWeek: Number(newPattern.dayOfWeek),
            startTime: newPattern.startTime,
            endTime: newPattern.endTime,
            location: newPattern.location || null
          },
          durationMinutes: calculateDuration(newPattern.startTime, newPattern.endTime)
        };

        return prisma.event.update({
          where: { id: event.id },
          data: {
            title: eventTitle,
            type: sessionTypeToEventType(newPattern.sessionType),
            course_id: newPattern.courseId,
            date: nextDate,
            time: `${newPattern.startTime}-${newPattern.endTime}`,
            location: newPattern.location || null,
            meta: nextMeta,
          }
        });
      });

      const updatedEvents = await prisma.$transaction(updatePromises);
      const modifiedCount = updatedEvents.length;

      if (isDev) {
        console.log(`Pattern update: modified ${modifiedCount} existing instances for ${course.name}`);
      }

      return res.status(200).json({
        success: true,
        message: `Updated ${modifiedCount} existing instance${modifiedCount === 1 ? '' : 's'}`,
        modifiedCount
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
