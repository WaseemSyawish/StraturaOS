/**
 * Timezone handling utilities
 * 
 * Strategy: Store all dates in UTC, let clients handle display conversion.
 * This avoids timezone-related bugs and ensures consistency across deployments.
 */

/**
 * Check if a string is a date-only format (YYYY-MM-DD)
 * @param {string} value 
 * @returns {boolean}
 */
export function isDateOnly(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Check if a string is an ISO datetime
 * @param {string} value 
 * @returns {boolean}
 */
export function isISODateTime(value) {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value);
}

/**
 * Parse a date string for database storage (always returns UTC Date)
 * 
 * Handles:
 * - ISO datetime strings (preserved as-is)
 * - Date-only strings (YYYY-MM-DD) - interpreted at noon UTC to avoid day shifts
 * - Date objects (preserved)
 * 
 * @param {string|Date} value - Input date value
 * @param {string} [time] - Optional time string (HH:MM) to apply
 * @param {string} [clientTimezone] - Client's IANA timezone (e.g., 'Asia/Baghdad')
 * @returns {Date}
 */
export function parseDateForStorage(value, time = null, clientTimezone = null) {
  if (!value) return new Date();
  
  // Already a Date object
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return isNaN(value.getTime()) ? new Date() : value;
  }
  
  const str = String(value);
  
  // ISO datetime string - parse directly
  if (isISODateTime(str)) {
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  
  // Date-only string (YYYY-MM-DD)
  if (isDateOnly(str)) {
    const [year, month, day] = str.split('-').map(Number);
    
    // If time is provided, use it
    let hours = 12, minutes = 0; // Default to noon UTC
    if (time && typeof time === 'string') {
      const timeParts = time.split(':').map(Number);
      hours = Number.isFinite(timeParts[0]) ? timeParts[0] : 12;
      minutes = Number.isFinite(timeParts[1]) ? timeParts[1] : 0;
    }
    
    // If client timezone is provided, we need to convert from local to UTC
    if (clientTimezone) {
      try {
        // Create a date string with the local time
        const localDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
        
        // Use Intl to get the UTC equivalent
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: clientTimezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
        
        // This approach works by creating a UTC date and checking the offset
        const testDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
        const parts = formatter.formatToParts(testDate);
        const getPart = (type) => parts.find(p => p.type === type)?.value;
        
        // Calculate the offset
        const localYear = parseInt(getPart('year'), 10);
        const localMonth = parseInt(getPart('month'), 10);
        const localDay = parseInt(getPart('day'), 10);
        const localHour = parseInt(getPart('hour'), 10);
        const localMinute = parseInt(getPart('minute'), 10);
        
        // Create a local date from these parts
        const localDate = new Date(localYear, localMonth - 1, localDay, localHour, localMinute);
        const offsetMs = localDate.getTime() - testDate.getTime();
        
        // Adjust for the offset
        return new Date(Date.UTC(year, month - 1, day, hours, minutes) - offsetMs);
      } catch (e) {
        // Fall back to UTC interpretation
        console.warn('[timezone] Failed to parse with timezone:', e.message);
      }
    }
    
    // Default: interpret as UTC with the given time (or noon)
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  }
  
  // Try to parse as a regular date string
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Format a Date to a date-only string (YYYY-MM-DD)
 * Uses local date components by default to preserve the user's intended date.
 * @param {Date} date 
 * @param {string} [timezone] - Optional IANA timezone for output
 * @returns {string|null}
 */
export function toDateString(date, timezone = null) {
  if (!date) return null;
  
  const d = (Object.prototype.toString.call(date) === '[object Date]') 
    ? date 
    : new Date(String(date));
  
  if (isNaN(d.getTime())) return null;
  
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(d);
    } catch (e) {
      // Fall back to local
    }
  }
  
  // Use local date components (getFullYear, getMonth, getDate)
  // This preserves the user's intended date when they created the event
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date to a time string (HH:MM)
 * @param {Date} date 
 * @param {string} [timezone] - Optional IANA timezone for output
 * @returns {string|null}
 */
export function toTimeString(date, timezone = null) {
  if (!date) return null;
  
  const d = (Object.prototype.toString.call(date) === '[object Date]') 
    ? date 
    : new Date(String(date));
  
  if (isNaN(d.getTime())) return null;
  
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      return formatter.format(d);
    } catch (e) {
      // Fall back to UTC
    }
  }
  
  // Default to UTC
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Convert a UTC Date to an ISO string in a specific timezone
 * @param {Date} date - UTC date
 * @param {string} timezone - IANA timezone (e.g., 'America/New_York')
 * @returns {string}
 */
export function toLocalISOString(date, timezone) {
  if (!date || !timezone) return date?.toISOString() || null;
  
  const d = (Object.prototype.toString.call(date) === '[object Date]') 
    ? date 
    : new Date(String(date));
  
  if (isNaN(d.getTime())) return null;
  
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(d);
    const getPart = (type) => parts.find(p => p.type === type)?.value || '00';
    
    return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
  } catch (e) {
    return d.toISOString();
  }
}

/**
 * Get the timezone offset in minutes for a specific timezone at a specific date
 * @param {Date} date 
 * @param {string} timezone - IANA timezone
 * @returns {number} Offset in minutes (positive = behind UTC)
 */
export function getTimezoneOffset(date, timezone) {
  if (!date || !timezone) return 0;
  
  try {
    const d = new Date(date);
    const utcDate = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(d.toLocaleString('en-US', { timeZone: timezone }));
    return (utcDate.getTime() - tzDate.getTime()) / 60000;
  } catch (e) {
    return 0;
  }
}

/**
 * Check if a date is before today (in a specific timezone)
 * @param {Date|string} date 
 * @param {string} [timezone] - IANA timezone, defaults to UTC
 * @returns {boolean}
 */
export function isBeforeToday(date, timezone = 'UTC') {
  if (!date) return false;
  
  const d = (Object.prototype.toString.call(date) === '[object Date]') 
    ? date 
    : new Date(String(date));
  
  if (isNaN(d.getTime())) return false;
  
  const todayStr = toDateString(new Date(), timezone);
  const dateStr = toDateString(d, timezone);
  
  return dateStr < todayStr;
}

/**
 * Normalize event dates for API response
 * Converts stored UTC dates to the client's timezone if provided
 * 
 * @param {object} event - Event object with date fields
 * @param {string} [clientTimezone] - Client's IANA timezone
 * @returns {object} Event with normalized date fields
 */
export function normalizeEventDates(event, clientTimezone = null) {
  if (!event) return event;
  
  const normalized = { ...event };
  
  // Always provide an ISO startDate for unambiguous parsing
  if (event.date) {
    const dateObj = parseDateForStorage(event.date, event.time);
    normalized.startDate = dateObj.toISOString();
    
    // Provide timezone-aware date string if timezone is specified
    if (clientTimezone) {
      normalized.date = toDateString(dateObj, clientTimezone);
      normalized.localTime = toTimeString(dateObj, clientTimezone);
    } else {
      normalized.date = toDateString(dateObj);
    }
  }
  
  // Normalize end_date
  if (event.end_date) {
    const endObj = (Object.prototype.toString.call(event.end_date) === '[object Date]')
      ? event.end_date
      : new Date(String(event.end_date));
    
    if (!isNaN(endObj.getTime())) {
      normalized.endDate = endObj.toISOString();
    }
  }
  
  return normalized;
}

/**
 * Common timezone aliases for user convenience
 */
export const TIMEZONE_ALIASES = {
  'Arabia': 'Asia/Baghdad',
  'Arabia Standard Time': 'Asia/Baghdad',
  'AST': 'Asia/Baghdad',
  'Baghdad': 'Asia/Baghdad',
  'Iraq': 'Asia/Baghdad',
  'EST': 'America/New_York',
  'PST': 'America/Los_Angeles',
  'CST': 'America/Chicago',
  'MST': 'America/Denver',
  'GMT': 'Europe/London',
  'UTC': 'UTC',
};

/**
 * Resolve a timezone string to an IANA timezone
 * @param {string} timezone 
 * @returns {string}
 */
export function resolveTimezone(timezone) {
  if (!timezone) return 'UTC';
  
  // Check aliases first
  const alias = TIMEZONE_ALIASES[timezone];
  if (alias) return alias;
  
  // Validate it's a real IANA timezone
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return timezone;
  } catch (e) {
    console.warn(`[timezone] Invalid timezone "${timezone}", falling back to UTC`);
    return 'UTC';
  }
}

export default {
  isDateOnly,
  isISODateTime,
  parseDateForStorage,
  toDateString,
  toTimeString,
  toLocalISOString,
  getTimezoneOffset,
  isBeforeToday,
  normalizeEventDates,
  TIMEZONE_ALIASES,
  resolveTimezone,
};
