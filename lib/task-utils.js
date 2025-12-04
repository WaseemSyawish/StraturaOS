/**
 * Task-related utilities
 * Extracted from tasks.js to reduce file size and improve maintainability
 */

export const PRIORITY_DEFAULT = 'medium';
export const STATUS_DEFAULT = 'todo';

export const priorityMeta = {
  high: { label: 'High', color: '#ef4444', icon: 'AlertTriangle' },
  medium: { label: 'Medium', color: '#f59e0b', icon: 'Flag' },
  low: { label: 'Low', color: '#6b7280', icon: 'Circle' },
  // Legacy priority names for backwards compatibility
  'urgent-important': { label: 'High', color: '#ef4444', icon: 'AlertTriangle' },
  'urgent-not-important': { label: 'Medium', color: '#f59e0b', icon: 'Flag' },
  'not-urgent-important': { label: 'Medium', color: '#f59e0b', icon: 'Flag' },
  'not-urgent-not-important': { label: 'Low', color: '#6b7280', icon: 'Circle' },
};

export const getPriorityMeta = (key) => priorityMeta[key] || priorityMeta[PRIORITY_DEFAULT];

/**
 * Normalize priority values to standard format
 */
export const normalizePriority = (value) => {
  if (!value) return PRIORITY_DEFAULT;
  const v = String(value).toLowerCase().trim();
  // Map legacy urgency-importance matrix to simple priority
  if (v === 'urgent-important') return 'high';
  if (v === 'urgent-not-important' || v === 'not-urgent-important') return 'medium';
  if (v === 'not-urgent-not-important') return 'low';
  if (['high', 'medium', 'low'].includes(v)) return v;
  return PRIORITY_DEFAULT;
};

/**
 * Normalize status values
 */
export const normalizeStatus = (value, completed = false) => {
  if (completed) return 'done';
  if (!value) return STATUS_DEFAULT;
  const v = String(value).toLowerCase().trim();
  if (['todo', 'doing', 'in-progress', 'done', 'cancelled'].includes(v)) {
    return v === 'doing' ? 'in-progress' : v;
  }
  return STATUS_DEFAULT;
};

/**
 * Get start of day for a date
 */
export const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Add days to a date
 */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Get start of week for a date
 */
export const getStartOfWeek = (date, weekStartsOn = 1) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Safely parse a date value
 */
export const toDateSafe = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Pad time values with leading zeros
 */
export const padTime = (value) => String(value).padStart(2, '0');

/**
 * Convert to datetime-local input value
 */
export const toDatetimeLocalValue = (value) => {
  const d = toDateSafe(value);
  if (!d) return '';
  return `${d.getFullYear()}-${padTime(d.getMonth() + 1)}-${padTime(d.getDate())}T${padTime(d.getHours())}:${padTime(d.getMinutes())}`;
};

/**
 * Convert to YYYY-MM-DD format
 */
export const toYMD = (value) => {
  const d = toDateSafe(value);
  if (!d) return '';
  return `${d.getFullYear()}-${padTime(d.getMonth() + 1)}-${padTime(d.getDate())}`;
};

/**
 * Convert to local YYYY-MM-DD format
 */
export const toYMDLocal = (value) => {
  const d = toDateSafe(value);
  if (!d) return '';
  return d.toLocaleDateString('en-CA');
};

/**
 * Parse time token from string
 */
export const parseTimeToken = (value) => {
  if (!value) return null;
  const match = String(value).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const [, h, m] = match;
  const hour = parseInt(h, 10);
  const minute = parseInt(m, 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
};

/**
 * Check if task has a due time
 */
export const hasDueTime = (task) => {
  if (!task?.dueDate) return false;
  const d = toDateSafe(task.dueDate);
  if (!d) return false;
  return d.getHours() !== 0 || d.getMinutes() !== 0;
};

/**
 * Get next occurrence of a day of week
 */
export const getNextDayOfWeek = (date, targetDay) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (targetDay + 7 - day) % 7 || 7;
  result.setDate(result.getDate() + diff);
  return result;
};

/**
 * Format date in short format
 */
export const formatShortDate = (value) => {
  const d = toDateSafe(value);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Format time range
 */
export const formatTimeRange = (start, end) => {
  const format = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const startDate = toDateSafe(start);
  const endDate = toDateSafe(end);
  if (!startDate) return '';
  if (!endDate) return format(startDate);
  return `${format(startDate)} - ${format(endDate)}`;
};

/**
 * Determine border color based on due date
 */
export const determineBorderColor = (dueDate) => {
  if (!dueDate) return 'border-slate-200 dark:border-slate-700';
  const now = new Date();
  const due = toDateSafe(dueDate);
  if (!due) return 'border-slate-200 dark:border-slate-700';
  
  const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 0) return 'border-red-500'; // Overdue
  if (diffHours < 24) return 'border-orange-400'; // Due today/within 24h
  if (diffHours < 72) return 'border-yellow-400'; // Due within 3 days
  return 'border-slate-200 dark:border-slate-700';
};

/**
 * Group tasks by section (Today, Tomorrow, This Week, etc.)
 */
export const groupTasksBySection = (tasks) => {
  const now = new Date();
  const today = getStartOfDay(now);
  const tomorrow = addDays(today, 1);
  const dayAfterTomorrow = addDays(today, 2);
  const weekEnd = addDays(today, 7);
  
  const sections = {
    overdue: { id: 'overdue', label: 'Overdue', tasks: [], color: '#ef4444' },
    today: { id: 'today', label: 'Today', tasks: [], color: '#8b5cf6' },
    tomorrow: { id: 'tomorrow', label: 'Tomorrow', tasks: [], color: '#3b82f6' },
    thisWeek: { id: 'thisWeek', label: 'This Week', tasks: [], color: '#10b981' },
    later: { id: 'later', label: 'Later', tasks: [], color: '#6b7280' },
    noDueDate: { id: 'noDueDate', label: 'No Due Date', tasks: [], color: '#94a3b8' },
  };
  
  for (const task of tasks) {
    if (!task.dueDate) {
      sections.noDueDate.tasks.push(task);
      continue;
    }
    
    const dueDate = toDateSafe(task.dueDate);
    if (!dueDate) {
      sections.noDueDate.tasks.push(task);
      continue;
    }
    
    const dueStart = getStartOfDay(dueDate);
    
    if (dueStart < today) {
      sections.overdue.tasks.push(task);
    } else if (dueStart.getTime() === today.getTime()) {
      sections.today.tasks.push(task);
    } else if (dueStart.getTime() === tomorrow.getTime()) {
      sections.tomorrow.tasks.push(task);
    } else if (dueStart < weekEnd) {
      sections.thisWeek.tasks.push(task);
    } else {
      sections.later.tasks.push(task);
    }
  }
  
  // Sort each section by due date
  Object.values(sections).forEach(section => {
    section.tasks.sort((a, b) => {
      const aDate = toDateSafe(a.dueDate);
      const bDate = toDateSafe(b.dueDate);
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return aDate.getTime() - bDate.getTime();
    });
  });
  
  return sections;
};

/**
 * Parse natural language date input
 */
export const parseNaturalDate = (text) => {
  if (!text) return null;
  
  const lower = text.toLowerCase().trim();
  const now = new Date();
  const today = getStartOfDay(now);
  
  // Common patterns
  if (lower === 'today' || lower === 'tod') {
    return today;
  }
  if (lower === 'tomorrow' || lower === 'tom') {
    return addDays(today, 1);
  }
  if (lower === 'next week') {
    return addDays(today, 7);
  }
  
  // Day names
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = days.findIndex(d => lower.startsWith(d.slice(0, 3)));
  if (dayIndex !== -1) {
    return getNextDayOfWeek(now, dayIndex);
  }
  
  // Try to parse as date
  const parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  return null;
};

export default {
  PRIORITY_DEFAULT,
  STATUS_DEFAULT,
  priorityMeta,
  getPriorityMeta,
  normalizePriority,
  normalizeStatus,
  getStartOfDay,
  addDays,
  getStartOfWeek,
  toDateSafe,
  padTime,
  toDatetimeLocalValue,
  toYMD,
  toYMDLocal,
  parseTimeToken,
  hasDueTime,
  getNextDayOfWeek,
  formatShortDate,
  formatTimeRange,
  determineBorderColor,
  groupTasksBySection,
  parseNaturalDate,
};
