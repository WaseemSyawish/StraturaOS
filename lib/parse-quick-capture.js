/**
 * Enhanced Quick-Capture Parser
 * ─────────────────────────────
 * Parses natural-language task input with shortcut tokens:
 *   #tag       → adds to tags[]
 *   !priority  → sets priority (urgent, high, medium, low, p1-p4)
 *   @course    → links to course/project
 *   /type      → sets event type (exam, assignment, lab, etc.)
 *   ^list      → assigns to a task list
 *
 * Also extracts inline date expressions:
 *   "today", "tomorrow", "next monday", "jan 15", "in 3 days"
 *
 * Usage:
 *   import { parseQuickCapture } from '../lib/parse-quick-capture';
 *   const result = parseQuickCapture('Submit HCI paper tomorrow !high #urgent @CSE304');
 *   // → { title: 'Submit HCI paper', dueDate: Date, priority: 'urgent-important', tags: ['urgent'], course: 'CSE304', ... }
 */

const DAY_MS = 86_400_000;

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
};

const getNextDayOfWeek = (date, targetDay) => {
  const result = new Date(date);
  const diff = (targetDay + 7 - result.getDay()) % 7 || 7;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

// ── Priority shortcuts ────────────────────────────────────
const PRIORITY_ALIASES = {
  // Named
  urgent: 'urgent-important',
  high: 'urgent-important',
  critical: 'urgent-important',
  asap: 'urgent-important',
  important: 'not-urgent-important',
  medium: 'urgent-not-important',
  med: 'urgent-not-important',
  moderate: 'urgent-not-important',
  normal: 'urgent-not-important',
  low: 'not-urgent-not-important',
  none: 'not-urgent-not-important',
  minor: 'not-urgent-not-important',
  later: 'not-urgent-not-important',
  // P-notation
  p1: 'urgent-important',
  p2: 'urgent-not-important',
  p3: 'not-urgent-important',
  p4: 'not-urgent-not-important',
};

// ── Event type shortcuts ──────────────────────────────────
const TYPE_ALIASES = {
  exam: 'exam',
  quiz: 'quiz',
  assignment: 'assignment',
  hw: 'assignment',
  homework: 'assignment',
  project: 'project',
  lab: 'lab',
  class: 'class',
  lecture: 'class',
  meeting: 'meeting',
  study: 'study-session',
  personal: 'personal',
  deadline: 'deadline',
  task: 'task',
};

// ── Date expressions ──────────────────────────────────────
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEKDAY_SHORT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * Parse due-date expressions from the cleaned text.
 * Returns { date: Date | null, matched: string | null }
 */
function extractDateExpression(text) {
  if (!text) return { date: null, matched: null };
  const lower = text.toLowerCase();
  const now = new Date();

  // "today"
  if (/\btoday\b/.test(lower)) {
    return { date: addDays(now, 0), matched: lower.match(/\btoday\b/)[0] };
  }
  // "tonight"
  if (/\btonight\b/.test(lower)) {
    const d = new Date(now);
    d.setHours(21, 0, 0, 0);
    return { date: d, matched: lower.match(/\btonight\b/)[0] };
  }
  // "tomorrow"
  if (/\btomorrow\b/.test(lower)) {
    return { date: addDays(now, 1), matched: lower.match(/\btomorrow\b/)[0] };
  }
  // "day after tomorrow"
  if (/\bday after tomorrow\b/.test(lower)) {
    return { date: addDays(now, 2), matched: lower.match(/\bday after tomorrow\b/)[0] };
  }
  // "this weekend"
  if (/\bthis weekend\b/.test(lower)) {
    return { date: getNextDayOfWeek(now, 6), matched: lower.match(/\bthis weekend\b/)[0] };
  }
  // "next week"
  if (/\bnext week\b/.test(lower)) {
    return { date: getNextDayOfWeek(now, 1), matched: lower.match(/\bnext week\b/)[0] };
  }
  // "next month"
  if (/\bnext month\b/.test(lower)) {
    return { date: addDays(now, 30), matched: lower.match(/\bnext month\b/)[0] };
  }
  // "end of week"
  if (/\bend of week\b/.test(lower)) {
    return { date: getNextDayOfWeek(now, 5), matched: lower.match(/\bend of week\b/)[0] };
  }
  // "next <weekday>"
  const nextDayMatch = lower.match(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/);
  if (nextDayMatch) {
    const dayName = nextDayMatch[1];
    let idx = WEEKDAYS.indexOf(dayName);
    if (idx === -1) idx = WEEKDAY_SHORT.indexOf(dayName);
    if (idx >= 0) return { date: getNextDayOfWeek(now, idx), matched: nextDayMatch[0] };
  }
  // "on <weekday>"
  const onDayMatch = lower.match(/\bon\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/);
  if (onDayMatch) {
    const dayName = onDayMatch[1];
    let idx = WEEKDAYS.indexOf(dayName);
    if (idx === -1) idx = WEEKDAY_SHORT.indexOf(dayName);
    if (idx >= 0) return { date: getNextDayOfWeek(now, idx), matched: onDayMatch[0] };
  }
  // "in N day(s)/week(s)/month(s)"
  const inMatch = lower.match(/\bin\s+(\d+)\s+(days?|weeks?|months?)\b/);
  if (inMatch) {
    const value = Number(inMatch[1]);
    const unit = inMatch[2].startsWith('week') ? 7 : inMatch[2].startsWith('month') ? 30 : 1;
    return { date: addDays(now, value * unit), matched: inMatch[0] };
  }
  // "jan 15" / "january 15" / "15 jan" / "15 january"
  const monthFirst = lower.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})\b/);
  if (monthFirst) {
    const mi = MONTH_NAMES.indexOf(monthFirst[1].slice(0, 3));
    const day = Number(monthFirst[2]);
    if (mi >= 0 && day > 0 && day <= 31) {
      const candidate = new Date(now.getFullYear(), mi, day);
      if (candidate < now) candidate.setFullYear(candidate.getFullYear() + 1);
      return { date: candidate, matched: monthFirst[0] };
    }
  }
  const dayFirst = lower.match(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/);
  if (dayFirst) {
    const mi = MONTH_NAMES.indexOf(dayFirst[2].slice(0, 3));
    const day = Number(dayFirst[1]);
    if (mi >= 0 && day > 0 && day <= 31) {
      const candidate = new Date(now.getFullYear(), mi, day);
      if (candidate < now) candidate.setFullYear(candidate.getFullYear() + 1);
      return { date: candidate, matched: dayFirst[0] };
    }
  }
  // Time expressions: "at 3pm", "at 15:00", "by 5:30pm"
  const timeMatch = lower.match(/\b(?:at|by)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (timeMatch) {
    let hours = Number(timeMatch[1]);
    const minutes = timeMatch[2] ? Number(timeMatch[2]) : 0;
    const meridiem = timeMatch[3];
    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;
    const d = new Date(now);
    d.setHours(hours, minutes, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 1);
    return { date: d, matched: timeMatch[0] };
  }

  return { date: null, matched: null };
}

/**
 * Main parser — extracts structured data from raw quick-capture text.
 *
 * @param {string} input  — Raw text from the quick-capture bar
 * @param {Object} [opts] — Optional context
 * @param {Array}  [opts.courses]  — List of courses for @mention matching
 * @param {Array}  [opts.lists]    — List of task lists for ^mention matching
 * @returns {{ title, dueDate, priority, tags, course, courseId, type, listName, raw }}
 */
export function parseQuickCapture(input, opts = {}) {
  if (!input || typeof input !== 'string') {
    return { title: '', dueDate: null, priority: null, tags: [], course: null, courseId: null, type: null, listName: null, raw: input || '' };
  }

  const courses = opts.courses || [];
  const lists = opts.lists || [];
  let remaining = input;
  const tags = [];
  let priority = null;
  let course = null;
  let courseId = null;
  let type = null;
  let listName = null;

  // ── Extract #tags ─────────────────────────────────────────
  remaining = remaining.replace(/#(\w[\w-]*)/g, (_, tag) => {
    tags.push(tag.toLowerCase());
    return '';
  });

  // ── Extract !priority ─────────────────────────────────────
  remaining = remaining.replace(/!(\w+)/g, (full, token) => {
    const key = token.toLowerCase();
    if (PRIORITY_ALIASES[key]) {
      priority = PRIORITY_ALIASES[key];
      return '';
    }
    return full; // keep if not a valid priority
  });

  // ── Extract /type ─────────────────────────────────────────
  remaining = remaining.replace(/\/(\w+)/g, (full, token) => {
    const key = token.toLowerCase();
    if (TYPE_ALIASES[key]) {
      type = TYPE_ALIASES[key];
      return '';
    }
    return full;
  });

  // ── Extract @course ───────────────────────────────────────
  remaining = remaining.replace(/@([\w-]+(?:\s[\w-]+)?)/g, (full, token) => {
    const normalized = token.toLowerCase().trim();
    // Try exact match first
    const exact = courses.find(
      (c) =>
        (c.name || '').toLowerCase() === normalized ||
        (c.code || '').toLowerCase() === normalized
    );
    if (exact) {
      course = exact.name || exact.code;
      courseId = exact.id;
      return '';
    }
    // Fuzzy: partial match
    const partial = courses.find(
      (c) =>
        (c.name || '').toLowerCase().includes(normalized) ||
        (c.code || '').toLowerCase().includes(normalized)
    );
    if (partial) {
      course = partial.name || partial.code;
      courseId = partial.id;
      return '';
    }
    // No match — treat as course name anyway
    course = token.trim();
    return '';
  });

  // ── Extract ^list ─────────────────────────────────────────
  remaining = remaining.replace(/\^([\w-]+(?:\s[\w-]+)?)/g, (full, token) => {
    const normalized = token.toLowerCase().trim();
    const match = lists.find((l) => (l.name || '').toLowerCase() === normalized);
    listName = match ? match.name : token.trim();
    return '';
  });

  // ── Extract date expression from remaining text ───────────
  const dateResult = extractDateExpression(remaining);
  if (dateResult.matched) {
    remaining = remaining.replace(new RegExp(escapeRegex(dateResult.matched), 'i'), '');
  }

  // ── Clean up title ────────────────────────────────────────
  const title = remaining.replace(/\s+/g, ' ').trim();

  return {
    title,
    dueDate: dateResult.date || null,
    priority,
    tags,
    course,
    courseId,
    type,
    listName,
    raw: input,
  };
}

/**
 * Format a parsed result back into display tokens for the UI ghost preview.
 */
export function formatCapturePreview(parsed) {
  const parts = [];
  if (parsed.title) parts.push(parsed.title);
  if (parsed.dueDate) {
    const d = parsed.dueDate;
    parts.push(`📅 ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
  }
  if (parsed.priority) parts.push(`⚡ ${parsed.priority}`);
  if (parsed.tags.length) parts.push(parsed.tags.map((t) => `#${t}`).join(' '));
  if (parsed.course) parts.push(`@${parsed.course}`);
  if (parsed.type) parts.push(`/${parsed.type}`);
  return parts.join(' · ');
}

/**
 * Get placeholder hint text for the quick-capture bar.
 */
export function getCapturePlaceholder() {
  const hints = [
    'Add a task\u2026 try "Submit paper tomorrow !high #urgent @CSE304"',
    'Quick add: "Study for quiz next monday !p1 #exam"',
    'Try: "Group meeting at 3pm /meeting @Networks"',
    'Type: "Read chapter 5 in 2 days #reading !medium"',
    'E.g. "Finish slides this weekend !urgent #presentation"',
    'Try: "Review notes by friday !important !p2"',
    'E.g. "Fix bug !critical #dev @ProjectX"',
    'Try: "Organize files !low #cleanup tomorrow"',
  ];
  return hints[Math.floor(Math.random() * hints.length)];
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default parseQuickCapture;
