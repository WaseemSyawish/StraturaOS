import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';
import fs from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';
const DATA_DIR = path.join(process.cwd(), 'data');

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
    const userId = await resolveUser(req);
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

    if (isDev) console.log(`Bulk create request: ${patterns.length} patterns from ${startDate} to ${endDate}`);

    // Load holidays directly from local data files for reliability
    const startYear = new Date(startDate).getFullYear();
    const endYear = new Date(endDate).getFullYear();
    let holidays = [];
    
    // Load holidays for all years in the range
    for (let year = startYear; year <= endYear; year++) {
      try {
        // Try cached file first
        const cacheFile = path.join(DATA_DIR, `holidays-IQ-${year}.json`);
        if (fs.existsSync(cacheFile)) {
          const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          if (Array.isArray(data)) holidays.push(...data);
        }
      } catch (err) {
        if (isDev) console.warn(`Failed to load holidays for ${year}:`, err.message);
      }
    }
    
    // Also load Kurdistan-specific holidays
    try {
      const kurdistanFile = path.join(DATA_DIR, 'holidays-iq-kurdistan.json');
      if (fs.existsSync(kurdistanFile)) {
        const kurdistanData = JSON.parse(fs.readFileSync(kurdistanFile, 'utf8'));
        if (Array.isArray(kurdistanData)) {
          // Filter to relevant years
          const filtered = kurdistanData.filter(h => {
            const hYear = new Date(h.date).getFullYear();
            return hYear >= startYear && hYear <= endYear;
          });
          holidays.push(...filtered);
        }
      }
    } catch (err) {
      if (isDev) console.warn('Failed to load Kurdistan holidays:', err.message);
    }
    
    // Also load academic holidays
    try {
      const academicFile = path.join(DATA_DIR, `holidays-academic-${startYear}-${endYear}.json`);
      if (fs.existsSync(academicFile)) {
        const academicData = JSON.parse(fs.readFileSync(academicFile, 'utf8'));
        if (Array.isArray(academicData)) holidays.push(...academicData);
      }
    } catch (err) {
      if (isDev) console.warn('Failed to load academic holidays:', err.message);
    }
    
    if (isDev) console.log(`Loaded ${holidays.length} holidays for date range`);

    // Load excluded academic periods (review weeks, finals, mid-semester breaks, etc.)
    let excludedRanges = [];
    try {
      const excludedFile = path.join(DATA_DIR, 'excluded-periods.json');
      if (fs.existsSync(excludedFile)) {
        const excludedData = JSON.parse(fs.readFileSync(excludedFile, 'utf8'));
        if (Array.isArray(excludedData)) {
          // Filter to ranges that overlap with our generation window
          excludedRanges = excludedData.filter(r => {
            const rStart = new Date(r.start);
            const rEnd = new Date(r.end);
            const genStart = new Date(startDate);
            const genEnd = new Date(endDate);
            return rStart <= genEnd && rEnd >= genStart;
          });
        }
      }
    } catch (err) {
      if (isDev) console.warn('Failed to load excluded periods:', err.message);
    }
    
    // Also accept client-supplied excluded ranges (merged with file-based ones)
    if (req.body.excludedRanges && Array.isArray(req.body.excludedRanges)) {
      excludedRanges.push(...req.body.excludedRanges);
    }
    
    if (isDev && excludedRanges.length) console.log(`Excluding ${excludedRanges.length} academic periods from generation`);

    const summary = {};;
    let totalEvents = 0;

    // Process each pattern
    for (const pattern of patterns) {
      const { courseId, sessionType, dayOfWeek, startTime, endTime, location } = pattern;

      if (!courseId || dayOfWeek === undefined || !startTime || !endTime) {
        if (isDev) console.warn('Skipping invalid pattern:', pattern);
        continue;
      }

      // Fetch course info
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course || course.user_id !== userId) {
        if (isDev) console.warn('Course not found or unauthorized:', courseId);
        continue;
      }

      // Calculate all occurrence dates
      const occurrences = calculateOccurrences(
        new Date(startDate),
        new Date(endDate),
        dayOfWeek,
        holidays,
        excludedRanges
      );

      if (isDev) console.log(`Creating ${occurrences.length} events for ${course.name} on day ${dayOfWeek}`);

      // Build title with session type suffix (if not Lecture, append it)
      const sessionSuffix = sessionType && sessionType.toLowerCase() !== 'lecture' 
        ? ` - ${sessionType}` 
        : '';
      const eventTitle = `${course.name}${sessionSuffix}`;

      // Prepare events data
      const eventsData = occurrences.map(date => ({
        title: eventTitle,
        type: 'class',
        course_id: courseId,
        date: date,
        time: `${startTime}-${endTime}`,
        description: null,
        location: location || null,
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

    if (isDev) console.log(`✅ Created ${totalEvents} events across ${Object.keys(summary).length} courses`);

    return res.status(201).json({
      success: true,
      eventsCreated: totalEvents,
      summary
    });

  } catch (error) {
    if (isDev) console.error('Bulk create error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create timetable events',
      details: error.message
    });
  }
}
