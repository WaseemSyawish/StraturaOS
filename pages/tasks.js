import Head from 'next/head';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  AlarmClock,
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarDays,
  Calendar,
  CalendarIcon,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardList,
  Clock,
  Clock3,
  FileText,
  Flag,
  Loader2,
  GripVertical,
  LayoutGrid,
  Layers,
  Lightbulb,
  List,
  MapPin,
  Moon,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  Sun,
  Tag,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
  ListTodo,
  Maximize2,
  ArrowRight,
  Pencil,
  Copy,
  MoreHorizontal,
  Repeat,
  MessageSquare,
  ArrowUpDown,
} from 'lucide-react';
import CustomModal from '@/components/ui/custom-modal';
import { useModal } from '@/providers/modal-context';
import { fetchWithCache, invalidateCache } from '../lib/cache';
import AddEventModal from '@/components/schedule/_modals/add-event-modal';
import { initializeNotifications, scheduleNotification, requestNotificationPermission } from '../lib/notifications';
import HygraphSidebar from '@/components/HygraphSidebar';
import { useToast } from '@/providers/toast-provider';
import { parseQuickCapture, formatCapturePreview, getCapturePlaceholder } from '../lib/parse-quick-capture';
import { useI18n } from '../lib/i18n';

/* -----------------------------------------
   DESIGN SYSTEM - Ultra-minimal, flat, clean
   ----------------------------------------- */
/* Design System - Visual tokens for scanning hierarchy, semantics, motion */
const typo = {
  h1: 'text-[22px] font-extrabold leading-tight tracking-[-0.02em]',
  h2: 'text-base font-bold leading-snug tracking-[-0.01em]',
  h3: 'text-[13px] font-semibold leading-snug',
  body: 'text-[13px] font-medium leading-relaxed',
  caption: 'text-[11px] font-medium leading-tight',
  micro: 'text-[10px] font-semibold leading-none tracking-wide uppercase',
};
const palette = {
  brand: '#7c3aed', brandLight: '#ede9fe', brandDark: '#4c1d95',
  surface: { page: 'bg-[#fafafa] dark:bg-[#09090b]', card: 'bg-white dark:bg-[#111113]', cardHover: 'hover:bg-gray-50/80 dark:hover:bg-white/[0.02]', muted: 'bg-gray-50 dark:bg-[#18181b]' },
  border: { default: 'border-gray-200/70 dark:border-white/[0.06]', subtle: 'border-gray-100 dark:border-white/[0.04]', hover: 'border-gray-300 dark:border-white/10' },
  text: { primary: 'text-gray-900 dark:text-gray-50', secondary: 'text-gray-500 dark:text-gray-400', tertiary: 'text-gray-400 dark:text-gray-500', inverse: 'text-white dark:text-gray-900' },
  status: {
    overdue: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-600 dark:text-red-400', dot: '#ef4444' },
    today: { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-700 dark:text-purple-300', dot: '#7c3aed' },
    tomorrow: { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-600 dark:text-blue-400', dot: '#3b82f6' },
    thisWeek: { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-300', dot: '#f59e0b' },
    later: { bg: 'bg-gray-50 dark:bg-gray-900/40', text: 'text-gray-500 dark:text-gray-400', dot: '#94a3b8' },
    done: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400', dot: '#10b981' },
  },
  tag: ['#7c3aed','#2563eb','#0891b2','#059669','#d97706','#dc2626','#db2777','#4f46e5'],
};
const motion = {
  fast: 'duration-100 ease-out',
  normal: 'duration-200 ease-out',
  smooth: 'duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
  slide: 'duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
};
const shadow = {
  card: 'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]',
  cardHover: 'shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]',
  elevated: 'shadow-[0_8px_24px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)]',
  float: 'shadow-[0_16px_48px_rgba(0,0,0,0.12)]',
};
const ds = {
  pageBg: `min-h-screen ${palette.surface.page}`,
  card: `rounded-xl border ${palette.border.default} ${palette.surface.card} ${shadow.card}`,
  sectionCard: `rounded-xl border ${palette.border.default} ${palette.surface.card}`,
};

/* Smart grouping sections for the list view */
const smartSections = [
  { id: 'today', label: 'Today', dotColor: 'bg-purple-500', labelColor: 'text-gray-900 dark:text-white', expanded: true },
  { id: 'tomorrow', label: 'Tomorrow', dotColor: 'bg-blue-500', labelColor: 'text-gray-900 dark:text-white', expanded: true },
  { id: 'later', label: 'Later & No Date', dotColor: 'bg-gray-400', labelColor: 'text-gray-500 dark:text-gray-400', expanded: false },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤️' };
  return { text: 'Good evening', emoji: '🌙' };
};

const accentPurple = '#8b5cf6';
const statFontStyle = { letterSpacing: '-0.01em' };
const insightWidgetOrder = ['timeline', 'time'];
const fallbackTasks = [
  {
    id: 'local-1',
    title: 'Assignment 1 - Final Draft',
    description: 'Submit via Canvas before midnight',
    dueDate: '2025-11-19T23:59:00',
    course: 'CSE304 - HCI',
    courseColor: '#3b82f6',
    type: 'assignment',
    priority: 'urgent-important',
    important: true,
    status: 'doing',
  },
  {
    id: 'local-2',
    title: 'HCI Lecture - Personas',
    dueDate: '2025-11-19T10:30:00',
    course: 'CSE304 - HCI',
    courseColor: '#3b82f6',
    type: 'class',
    status: 'todo',
    priority: 'not-urgent-important',
  },
  {
    id: 'local-3',
    title: 'Security Quiz Review Session',
    dueDate: '2025-11-19T15:00:00',
    course: 'SE403 - Security',
    courseColor: '#10b981',
    type: 'study',
    status: 'todo',
    priority: 'urgent-not-important',
  },
  {
    id: 'local-4',
    title: 'Group Presentation Slides',
    dueDate: '2025-11-21T09:00:00',
    course: 'CE304 - Networks',
    courseColor: '#f59e0b',
    type: 'group',
    status: 'doing',
    priority: 'urgent-important',
  },
  {
    id: 'local-5',
    title: 'Midterm Study Sprint',
    dueDate: '2025-11-20T09:00:00',
    course: 'SE403 - Security',
    courseColor: '#10b981',
    type: 'study',
    important: true,
    status: 'doing',
    priority: 'urgent-important',
  },
  {
    id: 'local-6',
    title: 'SE403 Midterm',
    dueDate: '2025-11-24T09:00:00',
    course: 'SE403 - Security',
    courseColor: '#10b981',
    type: 'exam',
    status: 'todo',
    priority: 'urgent-important',
  },
  {
    id: 'local-7',
    title: 'Weekly Planning + Inbox Zero',
    course: 'Personal',
    courseColor: '#1f2937',
    type: 'personal',
    status: 'todo',
    priority: 'not-urgent-not-important',
  },
  {
    id: 'local-8',
    title: 'Reading Notes - Interaction Design',
    dueDate: '2025-11-18T18:00:00',
    course: 'CSE304 - HCI',
    courseColor: '#3b82f6',
    type: 'study',
    completed: true,
    completedAt: '2025-11-18T21:00:00',
    status: 'done',
    priority: 'not-urgent-important',
  },
];

const TASK_FALLBACK_MESSAGE = 'Unable to load tasks from the server. Showing placeholder tasks until the API responds.';

const quickActions = [
  {
    id: 'my-day',
    label: 'My Day',
    isActive: (task) => Boolean(task?.addedToMyDay || task?.myDay),
    getLabel: (task) => (task?.addedToMyDay || task?.myDay ? 'Remove My Day' : 'My Day'),
  },
  {
    id: 'tomorrow',
    label: 'Tomorrow',
    isActive: (task) => Boolean(task?.meta?.snoozedFrom),
    getLabel: (task) => (task?.meta?.snoozedFrom ? 'Undo delay' : 'Tomorrow'),
  },
  { id: 'week', label: 'This Week' },
  { id: 'next-week', label: 'Next Week' },
];

// Simplified list view layout (Today / Next Up / Later)
const listSections = [
  {
    id: 'today',
    label: 'TODAY',
    icon: '📋',
    expanded: true,
    description: 'My Day - scheduled or manually added',
    filters: ['due_today', 'my_day', 'overdue'],
  },
  {
    id: 'next_up',
    label: 'NEXT UP',
    icon: '📅',
    expanded: false,
    description: 'Next 7 days',
    filters: ['due_next_6_days'],
  },
  {
    id: 'later',
    label: 'LATER',
    icon: '💭',
    expanded: false,
    description: 'No due date · Captured ideas',
    filters: ['no_due_date'],
  },
];

const rightRailReminder = {
  title: 'UX Sprint Huddle',
  subtitle: 'Deliver micro-animations + QA plan',
  time: '02:00 PM - 03:00 PM',
  location: 'Innovation Hub 4F',
  action: 'Join huddle',
};

const boardColumns = [
  { id: 'todo', label: 'To Do', Icon: ClipboardList, colorClass: 'text-slate-700', description: 'Not started', prominent: true },
  { id: 'doing', label: 'Doing', Icon: Target, colorClass: 'text-purple-600', description: 'In progress', prominent: true },
  { id: 'later', label: 'Later', Icon: Clock3, colorClass: 'text-amber-500', description: 'Will come back', prominent: true },
  { id: 'done', label: 'Done', Icon: CheckCircle2, colorClass: 'text-emerald-600', description: 'Completed', prominent: false },
];

const viewTabs = [
  { id: 'list', label: 'List', icon: List },
  { id: 'week', label: 'Week', icon: CalendarDays },
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'lectures', label: 'Lectures', icon: BookOpen },
];

// Keep timetable session types in the Lectures view and out of task-planning views.
const LECTURE_TYPES = new Set(['class', 'lecture', 'lab']);

const PRIORITY_DEFAULT = 'not-urgent-not-important';
const priorityMeta = {
  'urgent-important': { label: 'Urgent & Important', color: '#ef4444', weight: 0, icon: Flag, desc: 'Do it now' },
  'urgent-not-important': { label: 'Urgent · Low Impact', color: '#f97316', weight: 1, icon: Flag, desc: 'Delegate or quick-do' },
  'not-urgent-important': { label: 'Important, not urgent', color: '#0ea5e9', weight: 2, icon: Flag, desc: 'Schedule it' },
  'not-urgent-not-important': { label: 'Low effort', color: '#94a3b8', weight: 3, icon: Flag, desc: 'If time allows' },
};

const getPriorityMeta = (key) => priorityMeta[key] || priorityMeta[PRIORITY_DEFAULT];

const normalizePriority = (value) => {
  if (!value) return PRIORITY_DEFAULT;
  const normalized = String(value).toLowerCase();
  if (priorityMeta[normalized]) return normalized;
  if (normalized.includes('high')) return 'urgent-important';
  if (normalized.includes('medium')) return 'urgent-not-important';
  if (normalized.includes('low')) return 'not-urgent-important';
  if (normalized.includes('urgent') && normalized.includes('important')) return 'urgent-important';
  if (normalized.includes('urgent')) return 'urgent-not-important';
  if (normalized.includes('important')) return 'not-urgent-important';
  return PRIORITY_DEFAULT;
};

const normalizeStatus = (value, completed = false) => {
  if (completed) return 'done';
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'doing' || normalized === 'in-progress' || normalized === 'review') return 'doing';
  if (normalized === 'later' || normalized === 'undecided' || normalized === 'backlog') return 'later';
  if (normalized === 'done' || normalized === 'completed') return 'done';
  return 'todo';
};

const DAY_MS = 86_400_000;
const getStartOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

// Returns start of week for given date. weekStartsOn: 0=Sunday,1=Monday (default: 1)
const getStartOfWeek = (date, weekStartsOn = 1) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const toDateSafe = (value) => {
  if (!value && value !== 0) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const padTime = (value) => String(value).padStart(2, '0');

const toDatetimeLocalValue = (value) => {
  const date = toDateSafe(value);
  if (!date) return '';
  const tzAdjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return tzAdjusted.toISOString().slice(0, 16);
};

const toYMD = (value) => {
  const date = toDateSafe(value);
  if (!date) return null;
  return `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(date.getDate())}`;
};

const toYMDLocal = (value) => {
  const date = toDateSafe(value);
  if (!date) return '';
  return `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(date.getDate())}`;
};

const parseTimeToken = (value) => {
  if (!value) return ['00', '00'];
  const normalized = String(value).trim().toLowerCase();
  const match = normalized.match(/(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?/);
  if (!match) return ['00', '00'];
  let hours = Number(match[1]);
  let minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3];
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  return [padTime(Math.min(Math.max(hours, 0), 23)), padTime(Math.min(Math.max(minutes, 0), 59))];
};

const hasDueTime = (task) => {
  if (!task) return false;
  // Check top-level hasTime property first (from API normalization)
  if (task.hasTime === true) return true;
  if (task.hasTime === false) return false;
  // Explicit dueTime field takes precedence
  if (task.dueTime) return true;
  // Check if meta has explicit time flag
  if (task.meta?.hasTime === false) return false;
  if (task.meta?.hasTime === true) return true;
  // Check if there's an explicit time field
  if (task.time) return true;
  const due = toDateSafe(task.dueDate);
  if (!due) return false;
  // Consider 00:00:00 as "no time set" unless explicitly marked
  const hasNonZeroTime = Boolean(due.getHours() || due.getMinutes() || due.getSeconds());
  return hasNonZeroTime;
};

const getNextDayOfWeek = (date, targetDay) => {
  if (!(date instanceof Date)) date = toDateSafe(date) || new Date();
  const result = new Date(date);
  const diff = (targetDay + 7 - result.getDay()) % 7 || 7;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const formatShortDate = (value) => {
  const date = toDateSafe(value);
  if (!date) return '-';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatTimeRange = (start, end) => {
  const startDate = toDateSafe(start);
  const endDate = toDateSafe(end);
  if (!startDate) return '-';
  const startLabel = startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (!endDate) return startLabel;
  const endLabel = endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${startLabel} - ${endLabel}`;
};

const decodeEscapedUnicode = (value) => {
  if (typeof value !== 'string') return value;
  let result = value;
  // Handle double-escaped sequences: \\uXXXX → character
  result = result.replace(/\\\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  // Handle single-escaped sequences: \uXXXX → character
  result = result.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  // Handle HTML numeric entities: &#xHH; or &#DDD;
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  result = result.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  return result;
};

const determineBorderColor = (dueDate) => {
  const due = toDateSafe(dueDate);
  if (!due) return '#E2E8F0';
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  if (diff < 0) return '#F43F5E';
  if (diff < DAY_MS) return '#A855F7';
  if (diff < DAY_MS * 3) return '#3B82F6';
  return '#CBD5F5';
};

const formatRelativeDue = (value) => {
  const due = toDateSafe(value);
  if (!due) return 'No due date';
  const today = getStartOfDay(new Date());
  const dueDay = getStartOfDay(due);
  const diffDays = Math.round((dueDay - today) / DAY_MS);
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays === -1) return 'Due yesterday';
  if (diffDays > 1 && diffDays <= 7) return `Due in ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays > 7) return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `Overdue since ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
};

const ReminderPicker = ({ value, onChange, onDelete, onApply, onClose, onTimeChange, initialHasTime = null }) => {
  // Parse date in local timezone to avoid UTC conversion shifting the day
  const parseLocalDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d;
  };
  
  const initialDate = parseLocalDate(value);
  // Extract date as local YYYY-MM-DD without timezone conversion
  const getLocalDateStr = (d) => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Only show time if it was explicitly set (not midnight default)
  const getInitialTime = () => {
    if (!initialDate) return '';
    // If initialHasTime is explicitly false, don't show time
    if (initialHasTime === false) return '';
    const hours = initialDate.getHours();
    const minutes = initialDate.getMinutes();
    // If time is 00:00 or 12:00 (noon placeholder), treat as no time set
    if ((hours === 0 && minutes === 0) || (hours === 12 && minutes === 0)) return '';
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };
  
  const [date, setDate] = useState(getLocalDateStr(initialDate));
  const [time, setTime] = useState(getInitialTime());
  const [viewMonth, setViewMonth] = useState(initialDate || new Date());

  // Helper to apply with explicit values (bypasses async state issues)
  const applyWithValues = (dateVal, timeVal) => {
    onChange?.(dateVal);
    onTimeChange?.(timeVal);
    onApply?.({ date: dateVal, time: timeVal });
  };

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay(); // 0=Sunday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = date ? new Date(date + 'T12:00:00') : null; // Use noon to avoid timezone shifts

  const applyShortcut = (daysOffset, defaultTime = '') => {
    if (daysOffset === null) {
      // "Someday" - clear the date and time immediately
      setDate('');
      setTime('');
      applyWithValues(null, null);
      return;
    }
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    const dateStr = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    
    // For "Later today", use current time + 3 hours, or default time
    let timeStr;
    if (daysOffset === 0) {
      const now = new Date();
      now.setHours(now.getHours() + 3);
      timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    } else {
      timeStr = defaultTime;
    }
    
    // Update date/time - user must click Set to apply
    setDate(dateStr);
    setTime(timeStr);
    const dateTime = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone shifts
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    onChange?.(dateTime.toISOString());
    onTimeChange?.(timeStr || null);
  };

  const handleSet = () => {
    if (!date) {
      // If no date selected, treat as "Someday" (clear date)
      applyWithValues(null, null);
      return;
    }
    const dateTime = new Date(date + 'T12:00:00'); // Use noon to avoid timezone shifts
    if (time) {
      const [hours, minutes] = time.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    applyWithValues(dateTime.toISOString(), time || null);
  };

  const handleDateClick = (day) => {
    // Create date in local timezone to avoid off-by-1 errors
    const year = viewMonth.getFullYear();
    const month = String(viewMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const newDate = `${year}-${month}-${dayStr}`;
    setDate(newDate);
    
    // Update parent immediately so display reflects selection
    const dateTime = new Date(newDate + 'T12:00:00'); // Use noon to avoid timezone shifts
    if (time) {
      const [hours, minutes] = time.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    onChange?.(dateTime.toISOString());
  };

  const prevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  return (
    <div className="w-[420px] rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl">
      <div className="p-4 border-b border-slate-100">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Date</label>
            <input
              type="text"
              value={date ? new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : ''}
              readOnly
              className="w-full rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100"
              placeholder="Select date"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Time <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
            <div className="flex gap-2">
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  const newTime = e.target.value;
                  setTime(newTime);
                  // Update parent immediately when time changes
                  if (date && newTime) {
                    const [hours, minutes] = newTime.split(':');
                    const dateTime = new Date(date + 'T12:00:00'); // Use noon to avoid timezone shifts
                    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    onChange?.(dateTime.toISOString());
                    onTimeChange?.(newTime);
                  }
                }}
                className="flex-1 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100"
                placeholder="No time"
              />
              {time && (
                <button
                  type="button"
                  onClick={() => {
                    setTime('');
                    onTimeChange?.(null);
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Clear time"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">{viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
          <div className="flex gap-1">
            <button type="button" onClick={prevMonth} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <ChevronDown size={16} className="rotate-90 text-slate-600" />
            </button>
            <button type="button" onClick={nextMonth} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <ChevronDown size={16} className="-rotate-90 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 mb-3">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const cellDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
            cellDate.setHours(0, 0, 0, 0);
            const isToday = cellDate.getTime() === today.getTime();
            const isSelected = selectedDate && cellDate.getTime() === selectedDate.getTime();

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDateClick(day)}
                className={`aspect-square rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-blue-500 text-white scale-105 ring-2 ring-blue-200'
                    : isToday
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-700'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <button type="button" onClick={() => applyShortcut(0)} className="rounded-md bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            Later today
          </button>
          <button type="button" onClick={() => applyShortcut(1, '09:00')} className="rounded-md bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            Tomorrow
          </button>
          <button type="button" onClick={() => applyShortcut(7, '09:00')} className="rounded-md bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            Next week
          </button>
          <button type="button" onClick={() => applyShortcut(null)} className="rounded-md bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            Someday
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-800">
        <button type="button" onClick={() => { setDate(''); setTime(''); onChange?.(null); onTimeChange?.(null); onApply?.({ date: null, time: null }); }} className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
          Clear all
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors px-4">
            Cancel
          </button>
          <button type="button" onClick={handleSet} className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            Set
          </button>
        </div>
      </div>
    </div>
  );
};

const TaskDetailPanel = ({ 
  task, 
  mode = 'detail', // 'detail' or 'create'
  onToggleComplete, 
  onQuickAction, 
  onStatusChange, 
  onUpdateFields, 
  onTagsChange, 
  onDeleteTask, 
  modules = [],
  onCreate,
  onClose,
  initialStatus,
  initialDueDate,
  setOpen,
  setClose,
  toast
}) => {
  const isCreateMode = mode === 'create';
  
  const [localTitle, setLocalTitle] = useState(task?.title || '');
  const [localDescription, setLocalDescription] = useState(task?.description || '');
  const [dueStartInput, setDueStartInput] = useState('');
  const [dueEndInput, setDueEndInput] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [modalPage, setModalPage] = useState('main'); // 'main' or 'reminder'
  const [tempDueDate, setTempDueDate] = useState(null);
  const [tempDueTime, setTempDueTime] = useState(null);
  const [localDueDate, setLocalDueDate] = useState(task?.dueDate || '');
  const [localStatus, setLocalStatus] = useState(initialStatus || task?.status || 'todo');
  const [localPriority, setLocalPriority] = useState(task?.priority || PRIORITY_DEFAULT);
  const [localEventType, setLocalEventType] = useState(task?.type || 'task');
  const [localCourse, setLocalCourse] = useState(task?.course || null);
  const [localCourseColor, setLocalCourseColor] = useState(task?.courseColor || null);
  const [localTags, setLocalTags] = useState([]);
  const [localSubtasks, setLocalSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [includeMyDay, setIncludeMyDay] = useState(false);
  const [openDetailMenu, setOpenDetailMenu] = useState(null);
  const [dueDraftDate, setDueDraftDate] = useState('');
  const [dueDraftTime, setDueDraftTime] = useState('');
  const [duePickerMonth, setDuePickerMonth] = useState(() => {
    const dateVal = task?.dueDate;
    if (dateVal) {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });
  const detailPanelRef = useRef(null);
  const dueBtnRef = useRef(null);
  const [dueBtnRect, setDueBtnRect] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isCreateMode) {
      if (initialDueDate) {
        setDueStartInput(initialDueDate);
        setDueEndInput(initialDueDate);
      }
      return;
    }
    
    setLocalTitle(task?.title || '');
    setLocalDescription(task?.description || '');
    setLocalTags(Array.isArray(task?.tags) ? task.tags : []);
    setLocalSubtasks(Array.isArray(task?.subtasks) ? task.subtasks : []);
    setLocalDueDate(task?.dueDate || '');
    if (task?.dueDate) {
      const date = new Date(task.dueDate);
      const dateStr = date.toISOString().split('T')[0];
      setDueStartInput(dateStr);
      setDueEndInput(dateStr);
    } else {
      setDueStartInput('');
      setDueEndInput('');
    }
    setTagDraft('');
    setLocalStatus(task?.status || 'todo');
    setLocalPriority(task?.priority || PRIORITY_DEFAULT);
  }, [task?.id, task?.dueDate, task?.status, task?.priority, task?.title, task?.description, task?.tags, isCreateMode, initialDueDate]);

  useEffect(() => {
    if (!openDetailMenu) return;
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!detailPanelRef.current?.contains(target)) {
        setOpenDetailMenu(null);
        return;
      }
      if (!target.closest('[data-detail-menu]') && !target.closest('[data-detail-trigger]')) {
        setOpenDetailMenu(null);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpenDetailMenu(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openDetailMenu]);

  const statusOptions = [
    { value: 'todo', label: 'To Do', icon: Circle, color: '#e01a1aff', desc: 'Not started yet' },
    { value: 'doing', label: 'In Progress', icon: Loader2, color: '#8b5cf6', desc: 'Currently working on' },
    { value: 'later', label: 'Later', icon: Clock, color: '#f59e0b', desc: 'Deferred for later' },
    { value: 'done', label: 'Done', icon: CheckCircle2, color: '#10b981', desc: 'Completed' },
  ];
  
  const currentStatus = statusOptions.find(s => s.value === localStatus) || statusOptions[0];

  useEffect(() => {
    const sourceValue = isCreateMode ? dueStartInput : localDueDate;
    if (!sourceValue) {
      setDueDraftDate('');
      setDueDraftTime('');
      return;
    }
    const parsed = new Date(sourceValue);
    if (Number.isNaN(parsed.getTime())) {
      setDueDraftDate('');
      setDueDraftTime('');
      return;
    }
    setDueDraftDate(toYMDLocal(parsed));
    const hasExplicitTime = !isCreateMode && (task?.hasTime === true || task?.meta?.hasTime === true);
    const hasNonDefaultTime = parsed.getHours() !== 0 || parsed.getMinutes() !== 0;
    if (hasExplicitTime || hasNonDefaultTime) {
      const hh = String(parsed.getHours()).padStart(2, '0');
      const mm = String(parsed.getMinutes()).padStart(2, '0');
      setDueDraftTime(`${hh}:${mm}`);
    } else {
      setDueDraftTime('');
    }
  }, [dueStartInput, isCreateMode, localDueDate, task?.hasTime, task?.meta?.hasTime]);

  if (!isCreateMode && !task) {
    return <p className="text-sm text-slate-500">Task data unavailable.</p>;
  }

  // Always use localTags for immediate UI feedback, synced from task.tags in useEffect
  const tags = localTags;
  const priorityInfo = getPriorityMeta(localPriority);

  const applyDueSelection = (dateToken, timeToken = '') => {
    if (!dateToken) {
      if (isCreateMode) {
        setDueStartInput('');
        setDueEndInput('');
      } else {
        setLocalDueDate('');
        onUpdateFields?.(task.id, { dueDate: null, meta: { ...(task?.meta || {}), hasTime: false } });
      }
      setDueDraftDate('');
      setDueDraftTime('');
      setOpenDetailMenu(null);
      return;
    }

    const candidate = new Date(`${dateToken}T${timeToken || '00:00'}:00`);
    if (Number.isNaN(candidate.getTime())) return;
    const isoValue = candidate.toISOString();

    if (isCreateMode) {
      setDueStartInput(dateToken);
      setDueEndInput(dateToken);
    } else {
      setLocalDueDate(isoValue);
      onUpdateFields?.(task.id, { dueDate: isoValue, meta: { ...(task?.meta || {}), hasTime: Boolean(timeToken) } });
    }
    setOpenDetailMenu(null);
  };

  const applyDueShortcut = (shortcut) => {
    const base = getStartOfDay(new Date());
    if (shortcut === 'clear') {
      applyDueSelection(null);
      return;
    }

    if (shortcut === 'today') {
      applyDueSelection(toYMDLocal(base), dueDraftTime);
      return;
    }

    if (shortcut === 'tomorrow') {
      const target = addDays(base, 1);
      applyDueSelection(toYMDLocal(target), dueDraftTime);
      return;
    }

    if (shortcut === 'weekend') {
      const day = base.getDay();
      const offset = (6 - day + 7) % 7;
      const target = addDays(base, offset);
      applyDueSelection(toYMDLocal(target), dueDraftTime);
      return;
    }

    if (shortcut === 'next-week') {
      const target = addDays(base, 7);
      applyDueSelection(toYMDLocal(target), dueDraftTime);
    }
  };
  
  const courseModuleTags = modules.map(m => m.name || m.title || m.code).filter(Boolean);

  const handleAddTag = () => {
    const trimmed = tagDraft.trim();
    if (!trimmed) return;
    
    // Update local state immediately for UI feedback
    setLocalTags(prev => {
      const newTags = Array.from(new Set([...prev, trimmed]));
      
      // Also update backend if in edit mode
      if (!isCreateMode) {
        onTagsChange?.(task.id, newTags);
      }
      
      return newTags;
    });
    
    setTagDraft('');
  };

  const handleRemoveTag = (tag) => {
    // Update local state immediately for UI feedback
    setLocalTags(prev => {
      const newTags = prev.filter((value) => value !== tag);
      
      // Also update backend if in edit mode
      if (!isCreateMode) {
        onTagsChange?.(task.id, newTags);
      }
      
      return newTags;
    });
  };

  // Subtask handlers
  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    
    const newSubtask = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    
    setLocalSubtasks(prev => {
      const newSubtasks = [...prev, newSubtask];
      if (!isCreateMode) {
        onUpdateFields?.(task.id, { subtasks: newSubtasks });
      }
      return newSubtasks;
    });
    
    setNewSubtaskTitle('');
  };

  const handleUpdateSubtaskTitle = (subtaskId, newTitle) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    
    setLocalSubtasks(prev => {
      const newSubtasks = prev.map(st => 
        st.id === subtaskId ? { ...st, title: trimmed } : st
      );
      if (!isCreateMode) {
        onUpdateFields?.(task.id, { subtasks: newSubtasks });
      }
      return newSubtasks;
    });
  };

  const handleReorderSubtasks = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    setLocalSubtasks(prev => {
      const newSubtasks = [...prev];
      const [removed] = newSubtasks.splice(fromIndex, 1);
      newSubtasks.splice(toIndex, 0, removed);
      if (!isCreateMode) {
        onUpdateFields?.(task.id, { subtasks: newSubtasks });
      }
      return newSubtasks;
    });
  };

  const handleToggleSubtask = (subtaskId) => {
    setLocalSubtasks(prev => {
      const newSubtasks = prev.map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );
      if (!isCreateMode) {
        onUpdateFields?.(task.id, { subtasks: newSubtasks });
      }
      return newSubtasks;
    });
  };

  const handleDeleteSubtask = (subtaskId) => {
    setLocalSubtasks(prev => {
      const newSubtasks = prev.filter(st => st.id !== subtaskId);
      if (!isCreateMode) {
        onUpdateFields?.(task.id, { subtasks: newSubtasks });
      }
      return newSubtasks;
    });
  };

  const handleDueStartChange = (newDate) => {
    setDueStartInput(newDate);
    if (!isCreateMode) {
      if (newDate) {
        const dateObj = new Date(newDate + 'T00:00:00');
        onUpdateFields?.(task.id, { dueDate: dateObj.toISOString(), meta: { ...(task?.meta || {}), hasTime: false } });
      } else {
        onUpdateFields?.(task.id, { dueDate: null, meta: { ...(task?.meta || {}), hasTime: false } });
      }
    }
  };

  const handleDueEndChange = (newDate) => {
    setDueEndInput(newDate);
    if (!isCreateMode && newDate) {
      const dateObj = new Date(newDate + 'T00:00:00');
      onUpdateFields?.(task.id, { dueDate: dateObj.toISOString(), meta: { ...(task?.meta || {}), hasTime: false } });
    }
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    if (busy || !isCreateMode) return;
    if (!localTitle.trim()) {
      if (toast) {
        toast.showToast('Title is required', 'error');
      } else {
        setError('Title is required');
      }
      return;
    }
    setBusy(true);
    const dueDate = dueStartInput ? new Date(`${dueStartInput}T${dueDraftTime || '00:00'}:00`) : null;
    const meta = {
      myDay: includeMyDay,
      course: localCourse || null,
      courseColor: localCourseColor || null,
      priority: localPriority,
      tags: localTags,
      subtasks: localSubtasks,
      status: localStatus,
      type: localEventType,
      hasTime: Boolean(dueDraftTime),
    };
    const result = await onCreate({
      title: localTitle,
      dueDate: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate.toISOString() : null,
      meta,
    });
    setBusy(false);
    if (result?.success) {
      setError(null);
      if (toast) {
        toast.showToast('Task created', 'success');
      }
      onClose?.();
    } else {
      if (toast) {
        toast.showToast(result?.error || 'Unable to create task', 'error');
      } else {
        setError(result?.error || 'Unable to create task');
      }
    }
  };

  const createdDate = task?.meta?.createdAt || task?.createdAt;

  return (
    <form ref={detailPanelRef} className="flex flex-col" onSubmit={handleSubmit}>
      {modalPage === 'reminder' ? (
        <div className="px-6 py-6">
          <button
            type="button"
            onClick={() => setModalPage('main')}
            className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronDown size={16} className="rotate-90" />
            Back
          </button>
          <ReminderPicker
            value={tempDueDate}
            initialHasTime={isCreateMode ? null : (task?.hasTime ?? task?.meta?.hasTime ?? null)}
            onChange={(dueDate) => {
              setTempDueDate(dueDate);
            }}
            onTimeChange={(time) => {
              setTempDueTime(time);
            }}
            onDelete={() => {
              setTempDueDate(null);
              setTempDueTime(null);
            }}
            onApply={(params) => {
              const finalDate = params?.date !== undefined ? params.date : tempDueDate;
              const finalTime = params?.time !== undefined ? params.time : tempDueTime;
              
              if (isCreateMode) {
                setDueStartInput(finalDate || '');
              } else {
                setLocalDueDate(finalDate || '');
                const updates = { dueDate: finalDate };
                if (finalTime !== undefined) {
                  updates.time = finalTime;
                  updates.dueTime = finalTime;
                }
                onUpdateFields?.(task.id, updates);
              }
              setModalPage('main');
            }}
            onClose={() => {
              setTempDueDate(isCreateMode ? (dueStartInput || null) : (task?.dueDate || null));
              setTempDueTime(null);
              setModalPage('main');
            }}
          />
        </div>
      ) : (
      /* ===== Two-column layout (Todoist-inspired) ===== */
      <div className="flex flex-col md:flex-row">
        {/* LEFT COLUMN — Title, Description, Subtasks */}
        <div className="flex-1 min-w-0 px-6 pt-5 pb-4 md:border-r md:border-gray-100 md:dark:border-white/[0.06]">
          {/* Title */}
          <div className="flex items-start gap-3">
            {!isCreateMode && (
              <button
                type="button"
                onClick={() => onToggleComplete?.(task.id)}
                className={`flex-shrink-0 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 mt-1 transition-all duration-200 ${
                  task.completed
                    ? 'border-gray-800 dark:border-white bg-gray-800 dark:bg-white scale-95'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                }`}
              >
                {task.completed && <Check size={11} strokeWidth={3} className="text-white dark:text-gray-900" />}
              </button>
            )}
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={(e) => {
                if (isCreateMode) return;
                const newTitle = e.target.value.trim();
                if (newTitle && newTitle !== task.title) {
                  onUpdateFields?.(task.id, { title: newTitle });
                }
              }}
              className={`w-full border-none bg-transparent text-xl font-bold outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 tracking-[-0.01em] ${
                task?.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'
              }`}
              placeholder="Task title"
              autoFocus={isCreateMode}
            />
          </div>

          {/* Description */}
          <textarea
            value={localDescription}
            onChange={(e) => setLocalDescription(e.target.value)}
            onBlur={(e) => {
              if (isCreateMode) return;
              if (localDescription !== (task.description || '')) {
                onUpdateFields?.(task.id, { description: localDescription });
              }
            }}
            placeholder="Add description..."
            rows={3}
            className="mt-3 w-full resize-none border-none bg-transparent text-[13px] leading-relaxed text-gray-600 dark:text-gray-400 outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
          />

          {/* Subtasks Section */}
          <div className="mt-5 border-t border-gray-100 dark:border-white/[0.04] pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-gray-400 dark:text-gray-500" />
                <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Sub-tasks</p>
                {localSubtasks.length > 0 && (
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    {localSubtasks.filter(st => st.completed).length}/{localSubtasks.length}
                  </span>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            {localSubtasks.length > 0 && (
              <div className="h-1 w-full rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden mb-3">
                <div 
                  className="h-full rounded-full bg-purple-500 transition-all duration-300"
                  style={{ 
                    width: `${(localSubtasks.filter(st => st.completed).length / localSubtasks.length) * 100}%` 
                  }}
                />
              </div>
            )}
            
            <div>
              {/* Subtask List */}
              {localSubtasks.length > 0 && (
                <div className="space-y-1 mb-3">
                  {localSubtasks.map((subtask, index) => (
                    <div 
                      key={subtask.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('subtaskIndex', index.toString());
                        e.currentTarget.classList.add('opacity-50');
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.classList.remove('opacity-50');
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('bg-purple-50', 'dark:bg-purple-900/20');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-purple-50', 'dark:bg-purple-900/20');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('bg-purple-50', 'dark:bg-purple-900/20');
                        const fromIndex = parseInt(e.dataTransfer.getData('subtaskIndex'), 10);
                        handleReorderSubtasks(fromIndex, index);
                      }}
                      className="group flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical size={11} className="flex-shrink-0 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(subtask.id)}
                        className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                          subtask.completed 
                            ? 'bg-purple-600 border-purple-600' 
                            : 'border-slate-300 dark:border-slate-500 hover:border-purple-400'
                        }`}
                      >
                        {subtask.completed && <Check size={10} className="text-white" strokeWidth={3} />}
                      </button>
                      <input
                        type="text"
                        defaultValue={subtask.title}
                        onBlur={(e) => {
                          const newTitle = e.target.value.trim();
                          if (newTitle && newTitle !== subtask.title) {
                            handleUpdateSubtaskTitle(subtask.id, newTitle);
                          } else if (!newTitle) {
                            e.target.value = subtask.title;
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          } else if (e.key === 'Escape') {
                            e.currentTarget.value = subtask.title;
                            e.currentTarget.blur();
                          }
                        }}
                        className={`flex-1 text-[13px] bg-transparent border-0 outline-none focus:bg-gray-50 dark:focus:bg-white/[0.04] focus:px-2 focus:py-0.5 focus:-mx-2 focus:-my-0.5 focus:rounded transition-all ${
                          subtask.completed 
                            ? 'text-gray-400 dark:text-gray-500 line-through' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add Subtask Input */}
              <div className="flex items-center gap-2">
                <div className="w-3 flex-shrink-0" />
                <div className="flex-shrink-0 w-4 h-4 rounded border-2 border-dashed border-gray-200 dark:border-gray-600" />
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add a sub-task..."
                  className="flex-1 text-[13px] bg-transparent border-0 outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                {newSubtaskTitle.trim() && (
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="flex h-5 w-5 items-center justify-center rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && <p className="mt-3 text-xs font-semibold text-red-500">{error}</p>}

          {/* Metadata */}
          {!isCreateMode && createdDate && (
            <p className="mt-4 text-[11px] text-gray-400 dark:text-gray-500">
              Created {new Date(createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* RIGHT COLUMN — Properties */}
        <div className="w-full md:w-[300px] flex-shrink-0 px-5 pt-5 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Details</p>
          <div className="space-y-1">
            {/* Status */}
            <div className="py-1.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 whitespace-nowrap">
                  <currentStatus.icon size={13} style={{ color: currentStatus.color }} /> Status
                </span>
                <div className="relative">
                  <button
                    type="button"
                    data-detail-trigger
                    onClick={() => setOpenDetailMenu((prev) => (prev === 'status' ? null : 'status'))}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-all hover:shadow-sm"
                    style={{ color: currentStatus.color, backgroundColor: `${currentStatus.color}0a` }}
                  >
                    <currentStatus.icon size={14} className={localStatus === 'doing' ? 'animate-spin' : ''} />
                    {currentStatus.label}
                    <ChevronDown size={11} className="opacity-50" />
                  </button>
                  {openDetailMenu === 'status' && (
                    <div data-detail-menu className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1d] shadow-2xl">
                      <div className="p-1.5">
                        {statusOptions.map((opt) => {
                          const isActive = localStatus === opt.value;
                          const StatusIcon = opt.icon;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setLocalStatus(opt.value);
                                if (!isCreateMode) {
                                  onStatusChange?.(task.id, opt.value);
                                  onUpdateFields?.(task.id, { status: opt.value });
                                }
                                setOpenDetailMenu(null);
                              }}
                              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 ${
                                isActive ? '' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                              }`}
                              style={isActive ? { backgroundColor: `${opt.color}12`, boxShadow: `inset 0 0 0 1px ${opt.color}25` } : {}}
                            >
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${isActive ? '' : 'bg-gray-100/80 dark:bg-white/[0.06]'}`}
                                style={isActive ? { backgroundColor: `${opt.color}18` } : {}}
                              >
                                <StatusIcon size={15} style={{ color: opt.color }} className={opt.value === 'doing' ? 'animate-spin' : ''} />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className={`text-[13px] font-semibold leading-tight ${isActive ? '' : 'text-gray-800 dark:text-gray-200'}`} style={isActive ? { color: opt.color } : {}}>
                                  {opt.label}
                                </p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">{opt.desc}</p>
                              </div>
                              {isActive && <Check size={15} style={{ color: opt.color }} className="flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Type */}
            {(() => {
              const typeOptions = [
                { value: 'task', label: 'Task', icon: ListTodo, color: '#6366f1' },
                { value: 'class', label: 'Class', icon: BookOpen, color: '#8b5cf6' },
                { value: 'lab', label: 'Lab', icon: Lightbulb, color: '#06b6d4' },
                { value: 'tutorial', label: 'Tutorial', icon: MessageSquare, color: '#14b8a6' },
                { value: 'exam', label: 'Exam', icon: AlertTriangle, color: '#ef4444' },
                { value: 'quiz', label: 'Quiz', icon: ClipboardList, color: '#f97316' },
                { value: 'assignment', label: 'Assignment', icon: FileText, color: '#3b82f6' },
                { value: 'project', label: 'Project', icon: Target, color: '#8b5cf6' },
                { value: 'deadline', label: 'Deadline', icon: AlarmClock, color: '#ef4444' },
                { value: 'meeting', label: 'Meeting', icon: Users, color: '#06b6d4' },
                { value: 'study-session', label: 'Study Session', icon: Clock3, color: '#f59e0b' },
                { value: 'personal', label: 'Personal', icon: Sparkles, color: '#ec4899' },
                { value: 'other', label: 'Other', icon: MoreHorizontal, color: '#64748b' },
              ];
              const currentType = typeOptions.find(t => t.value === localEventType) || typeOptions[0];
              const CurrentTypeIcon = currentType.icon;
              return (
                <div className="py-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 whitespace-nowrap">
                      <CurrentTypeIcon size={13} style={{ color: currentType.color }} /> Type
                    </span>
                    <div className="relative">
                      <button
                        type="button"
                        data-detail-trigger
                        onClick={() => setOpenDetailMenu((prev) => (prev === 'eventtype' ? null : 'eventtype'))}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-all hover:shadow-sm"
                        style={{ color: currentType.color, backgroundColor: `${currentType.color}0a` }}
                      >
                        <CurrentTypeIcon size={14} />
                        {currentType.label}
                        <ChevronDown size={11} className="opacity-50" />
                      </button>
                      {openDetailMenu === 'eventtype' && (
                        <div data-detail-menu className="absolute right-0 top-full z-50 mt-2 w-56 max-h-[320px] overflow-y-auto overflow-x-hidden rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1d] shadow-2xl">
                          <div className="p-1.5">
                            {typeOptions.map((type) => {
                              const isActive = localEventType === type.value;
                              const TypeIcon = type.icon;
                              return (
                                <button
                                  key={type.value}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setLocalEventType(type.value);
                                    if (!isCreateMode) {
                                      onUpdateFields?.(task.id, { type: type.value });
                                    }
                                    setOpenDetailMenu(null);
                                  }}
                                  className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 transition-all duration-150 ${
                                    isActive ? '' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                                  }`}
                                  style={isActive ? { backgroundColor: `${type.color}12`, boxShadow: `inset 0 0 0 1px ${type.color}25` } : {}}
                                >
                                  <div
                                    className={`flex h-6 w-6 items-center justify-center rounded-md transition-all ${isActive ? '' : 'bg-gray-100/80 dark:bg-white/[0.06]'}`}
                                    style={isActive ? { backgroundColor: `${type.color}18` } : {}}
                                  >
                                    <TypeIcon size={13} style={{ color: type.color }} />
                                  </div>
                                  <span className={`text-[13px] font-medium flex-1 text-left ${isActive ? '' : 'text-gray-800 dark:text-gray-200'}`} style={isActive ? { color: type.color } : {}}>
                                    {type.label}
                                  </span>
                                  {isActive && <Check size={14} style={{ color: type.color }} className="flex-shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Priority */}
            <div className="py-1.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 whitespace-nowrap">
                  <Flag size={13} style={{ color: priorityInfo.color }} /> Priority
                </span>
                <div className="relative">
                  <button
                    type="button"
                    data-detail-trigger
                    onClick={() => setOpenDetailMenu((prev) => (prev === 'priority' ? null : 'priority'))}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-all hover:shadow-sm"
                    style={{ color: priorityInfo.color, backgroundColor: `${priorityInfo.color}0a` }}
                  >
                    <Flag size={14} fill={priorityInfo.color} />
                    {priorityInfo.label}
                    <ChevronDown size={11} className="opacity-50" />
                  </button>
                  {openDetailMenu === 'priority' && (
                    <div data-detail-menu className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1d] shadow-2xl">
                      <div className="p-1.5">
                        {Object.entries(priorityMeta).map(([key, meta]) => {
                          const isActive = localPriority === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setLocalPriority(key);
                                if (!isCreateMode) {
                                  onUpdateFields?.(task.id, { priority: key });
                                }
                                setOpenDetailMenu(null);
                              }}
                              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 ${
                                isActive ? '' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                              }`}
                              style={isActive ? { backgroundColor: `${meta.color}12`, boxShadow: `inset 0 0 0 1px ${meta.color}25` } : {}}
                            >
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${isActive ? '' : 'bg-gray-100/80 dark:bg-white/[0.06]'}`}
                                style={isActive ? { backgroundColor: `${meta.color}18` } : {}}
                              >
                                <Flag size={15} fill={isActive ? meta.color : 'none'} style={{ color: meta.color }} />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className={`text-[13px] font-semibold leading-tight ${isActive ? '' : 'text-gray-800 dark:text-gray-200'}`} style={isActive ? { color: meta.color } : {}}>
                                  {meta.label}
                                </p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">{meta.desc}</p>
                              </div>
                              {isActive && <Check size={15} style={{ color: meta.color }} className="flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Due Date — Todoist-style */}
            {(() => {
              const dateVal = isCreateMode ? dueStartInput : localDueDate;
              const parsedDate = dateVal ? new Date(dateVal) : null;
              const hasDate = parsedDate && !isNaN(parsedDate.getTime());
              const todayStart = getStartOfDay(new Date());
              const isOverdue = hasDate && parsedDate < new Date() && !task?.completed;
              const isToday = hasDate && getStartOfDay(parsedDate).getTime() === todayStart.getTime();
              const isTomorrow = hasDate && getStartOfDay(parsedDate).getTime() === addDays(todayStart, 1).getTime();

              const dueTriggerColor = !hasDate ? 'text-gray-400 dark:text-gray-500'
                : isOverdue ? 'text-red-600 dark:text-red-400'
                : isToday ? 'text-emerald-600 dark:text-emerald-400'
                : isTomorrow ? 'text-orange-600 dark:text-orange-400'
                : 'text-gray-900 dark:text-white';
              const dueTriggerBg = !hasDate ? {}
                : isOverdue ? { backgroundColor: '#ef444410' }
                : isToday ? { backgroundColor: '#10b98110' }
                : isTomorrow ? { backgroundColor: '#f9731610' }
                : { backgroundColor: '#6366f110' };

              const dueDisplayText = (() => {
                if (!hasDate) return 'No date';
                if (isToday) return 'Today';
                if (isTomorrow) return 'Tomorrow';
                return parsedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              })();

              const tmrw = addDays(todayStart, 1);
              const weekendDay = (() => { const d = todayStart.getDay(); const off = (6 - d + 7) % 7 || 7; return addDays(todayStart, off); })();
              const nextWeekDay = addDays(todayStart, 7);
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

              const dueShortcuts = [
                { key: 'today', label: 'Today', icon: CalendarIcon, accent: '#10b981', info: dayNames[todayStart.getDay()], action: () => applyDueShortcut('today') },
                { key: 'tomorrow', label: 'Tomorrow', icon: Sun, accent: '#f97316', info: dayNames[tmrw.getDay()], action: () => applyDueShortcut('tomorrow') },
                { key: 'weekend', label: 'This Weekend', icon: Moon, accent: '#3b82f6', info: weekendDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), action: () => applyDueShortcut('weekend') },
                { key: 'next-week', label: 'Next Week', icon: ArrowRight, accent: '#8b5cf6', info: nextWeekDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), action: () => applyDueShortcut('next-week') },
              ];

              const calMonth = duePickerMonth;
              const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
              const firstDow = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();
              const prevMonthDays = new Date(calMonth.getFullYear(), calMonth.getMonth(), 0).getDate();
              const leadingBlanks = (firstDow + 6) % 7;

              return (
                <div className="py-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 whitespace-nowrap">
                      <CalendarIcon size={13} className="text-gray-400 dark:text-gray-500" /> Due date
                    </span>
                    <div className="relative">
                      <button
                        type="button"
                        data-detail-trigger
                        ref={dueBtnRef}
                        onClick={() => {
                          const rect = dueBtnRef.current?.getBoundingClientRect();
                          if (rect) {
                            const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
                            const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
                            const modalEl = dueBtnRef.current?.closest('[role="dialog"]');
                            const modalRect = modalEl?.getBoundingClientRect();
                            const spaceRight = modalRect ? vw - modalRect.right : vw - rect.right;
                            const spaceLeft = modalRect ? modalRect.left : rect.left;
                            // Determine placement: prefer right of modal, then left, then inline fallback
                            let placement = 'right';
                            if (spaceRight < 310 && spaceLeft >= 310) placement = 'left';
                            else if (spaceRight < 310) placement = 'inline';
                            setDueBtnRect({
                              top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right,
                              modalRight: modalRect?.right || rect.right,
                              modalLeft: modalRect?.left || rect.left,
                              modalTop: modalRect?.top || 40,
                              modalBottom: modalRect?.bottom || vh - 40,
                              placement,
                              vh,
                            });
                          } else {
                            setDueBtnRect(null);
                          }
                          setOpenDetailMenu((prev) => (prev === 'due' ? null : 'due'));
                        }}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-all hover:shadow-sm ${dueTriggerColor}`}
                        style={dueTriggerBg}
                      >
                        <CalendarIcon size={14} />
                        {dueDisplayText}
                        {hasDate && dueDraftTime && (
                          <span className="text-[11px] opacity-60">{dueDraftTime}</span>
                        )}
                        <ChevronDown size={11} className="opacity-50" />
                      </button>

                      {openDetailMenu === 'due' && dueBtnRect && (
                        <div data-detail-menu style={{
                          position: 'fixed',
                          ...(dueBtnRect.placement === 'right'
                            ? { left: dueBtnRect.modalRight + 12, top: Math.max(8, Math.min(dueBtnRect.top - 200, (dueBtnRect.vh || 800) - 580)) }
                            : dueBtnRect.placement === 'left'
                            ? { right: typeof window !== 'undefined' ? window.innerWidth - dueBtnRect.modalLeft + 12 : 20, top: Math.max(8, Math.min(dueBtnRect.top - 200, (dueBtnRect.vh || 800) - 580)) }
                            : { top: Math.min(dueBtnRect.bottom + 8, (dueBtnRect.vh || 800) - 580), right: typeof window !== 'undefined' ? window.innerWidth - dueBtnRect.right : 20 }),
                          zIndex: 999999, width: 270, maxHeight: 'calc(100vh - 16px)', overflowY: 'auto'
                        }} className="overflow-hidden rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1d] shadow-2xl">
                          {/* Natural language input */}
                          <div className="px-3 pt-3 pb-2">
                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] px-3 py-2">
                              <Search size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                              <input
                                type="text"
                                placeholder="Type a date..."
                                className="w-full bg-transparent border-0 outline-none text-[13px] text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const result = parseNaturalLanguageDate(e.target.value);
                                    if (result) {
                                      applyDueSelection(toYMDLocal(result), dueDraftTime);
                                      e.target.value = '';
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>

                          {/* Smart shortcuts */}
                          <div className="border-t border-gray-100 dark:border-white/[0.05]">
                            {dueShortcuts.map((s) => {
                              const ShortcutIcon = s.icon;
                              return (
                                <button
                                  key={s.key}
                                  type="button"
                                  onMouseDown={(e) => { e.preventDefault(); s.action(); }}
                                  className="flex w-full items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                                >
                                  <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: `${s.accent}15` }}>
                                    <ShortcutIcon size={14} style={{ color: s.accent }} />
                                  </div>
                                  <span className="flex-1 text-left text-[13px] font-medium text-gray-800 dark:text-gray-200">{s.label}</span>
                                  <span className="text-[12px] font-medium text-gray-400 dark:text-gray-500">{s.info}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Mini Calendar */}
                          <div className="border-t border-gray-100 dark:border-white/[0.05] p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                                {calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </span>
                              <div className="flex gap-0.5">
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); setDuePickerMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1)); }}
                                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors">
                                  <ChevronDown size={14} className="rotate-90 text-gray-500" />
                                </button>
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); setDuePickerMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1)); }}
                                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors">
                                  <ChevronDown size={14} className="-rotate-90 text-gray-500" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-7 text-center mb-1">
                              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                <div key={i} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 py-1">{d}</div>
                              ))}
                            </div>

                            <div className="grid grid-cols-7 gap-px">
                              {Array.from({ length: leadingBlanks }).map((_, i) => (
                                <div key={`prev-${i}`} className="aspect-square flex items-center justify-center text-[11px] text-gray-300 dark:text-gray-600">
                                  {prevMonthDays - leadingBlanks + 1 + i}
                                </div>
                              ))}
                              {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const cellDate = new Date(calMonth.getFullYear(), calMonth.getMonth(), day);
                                cellDate.setHours(0, 0, 0, 0);
                                const isCellToday = cellDate.getTime() === todayStart.getTime();
                                const isCellSelected = dueDraftDate === toYMDLocal(cellDate);
                                const isPast = cellDate < todayStart;

                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      const newDate = toYMDLocal(cellDate);
                                      setDueDraftDate(newDate);
                                      applyDueSelection(newDate, dueDraftTime);
                                    }}
                                    className={`aspect-square flex items-center justify-center rounded-md text-[11px] font-semibold transition-all ${
                                      isCellSelected
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : isCellToday
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-300/50 dark:ring-emerald-600/30'
                                        : isPast
                                        ? 'text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                                    }`}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Time row */}
                          <div className="border-t border-gray-100 dark:border-white/[0.05] px-3 py-2.5 flex items-center gap-2.5">
                            <Clock size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">Time</span>
                            <input
                              type="time"
                              value={dueDraftTime}
                              onChange={(e) => setDueDraftTime(e.target.value)}
                              className="ml-auto rounded-md border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-2 py-1 text-[12px] font-medium text-gray-700 dark:text-gray-300 outline-none focus:border-purple-400 w-24"
                            />
                            {dueDraftTime && (
                              <button type="button" onMouseDown={(e) => { e.preventDefault(); setDueDraftTime(''); }} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                <X size={12} />
                              </button>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="border-t border-gray-100 dark:border-white/[0.05] flex items-center justify-between px-3 py-2.5 bg-gray-50/50 dark:bg-white/[0.02]">
                            <button type="button" onMouseDown={(e) => { e.preventDefault(); applyDueShortcut('clear'); }}
                              className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
                              <X size={12} /> No date
                            </button>
                            <button type="button" onMouseDown={(e) => { e.preventDefault(); applyDueSelection(dueDraftDate, dueDraftTime); }}
                              className="rounded-lg bg-purple-600 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm">
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Module/Course */}
            {modules.length > 0 && (
              <div className="flex items-center justify-between py-2 text-[13px]">
                <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 whitespace-nowrap">
                  <Layers size={13} className="text-gray-400 dark:text-gray-500" /> Module
                </span>
                <div className="relative">
                  <button
                    type="button"
                    data-detail-trigger
                    onClick={() => setOpenDetailMenu((prev) => (prev === 'module' ? null : 'module'))}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-all hover:shadow-sm"
                    style={{
                      color: localCourseColor || '#64748b',
                      backgroundColor: localCourseColor ? `${localCourseColor}18` : 'rgba(100,116,139,0.08)',
                    }}
                  >
                    <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: localCourseColor || '#94a3b8' }} />
                    <span className="truncate max-w-[130px]">{localCourse || 'None'}</span>
                    <ChevronDown size={11} className="opacity-50" />
                  </button>
                  <div data-detail-menu className={`absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1d] shadow-xl ${openDetailMenu === 'module' ? '' : 'hidden'}`}>
                    <div className="max-h-52 overflow-y-auto py-1">
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setLocalCourse(null);
                          setLocalCourseColor(null);
                          if (!isCreateMode) {
                            onUpdateFields?.(task.id, { course: null, courseColor: null });
                          }
                          setOpenDetailMenu(null);
                        }}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04] ${!localCourse ? 'bg-gray-50/80 dark:bg-white/[0.03]' : ''}`}
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gray-100 dark:bg-white/[0.06] shrink-0">
                          <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                        </div>
                        <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 flex-1 text-left">No module</p>
                        {!localCourse && <Check size={12} className="text-purple-600 dark:text-purple-400 shrink-0" />}
                      </button>
                      {modules.map((mod) => {
                        const moduleName = mod.name || mod.title || mod.code;
                        const moduleColor = mod.color || accentPurple;
                        const isSelected = localCourse === moduleName;
                        return (
                          <button
                            key={mod.id || moduleName}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setLocalCourse(moduleName);
                              setLocalCourseColor(moduleColor);
                              if (!isCreateMode) {
                                onUpdateFields?.(task.id, { course: moduleName, courseColor: moduleColor });
                              }
                              setOpenDetailMenu(null);
                            }}
                            className={`flex w-full items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04] ${isSelected ? 'bg-gray-50/80 dark:bg-white/[0.03]' : ''}`}
                          >
                            <div className="flex h-5 w-5 items-center justify-center rounded-md shrink-0" style={{ backgroundColor: `${moduleColor}20` }}>
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: moduleColor }} />
                            </div>
                            <p className="text-[12px] font-semibold flex-1 text-left truncate" style={{ color: moduleColor }}>{moduleName}</p>
                            {isSelected && <Check size={12} className="shrink-0" style={{ color: moduleColor }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="py-2 text-[13px]">
              <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 mb-2">
                <Tag size={13} className="text-gray-400 dark:text-gray-500" /> Labels
              </span>
              <div className="flex flex-wrap gap-1.5 ml-5">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:text-gray-300">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                      <X size={9} />
                    </button>
                  </span>
                ))}
                {courseModuleTags.filter(ct => !localTags.includes(ct)).slice(0, 2).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setLocalTags(prev => {
                        const newTags = Array.from(new Set([...prev, suggestion]));
                        if (!isCreateMode) {
                          onTagsChange?.(task.id, newTags);
                        }
                        return newTags;
                      });
                    }}
                    className="inline-flex items-center rounded-md border border-dashed border-gray-200 dark:border-white/[0.08] px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-white/[0.12] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
                <div className="flex items-center gap-1 w-full mt-1">
                  <input
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder={tags.length === 0 ? 'Add label...' : ''}
                    className="min-w-[60px] flex-1 bg-transparent border-0 px-1 py-0.5 text-[11px] text-gray-700 dark:text-gray-300 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                  {tagDraft.trim() && (
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
      )}

      {isCreateMode && (
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-white/[0.06] px-6 py-4 sticky bottom-0 bg-white dark:bg-slate-900 z-10">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-purple-600 hover:bg-purple-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 shadow-sm"
          >
            {busy ? 'Adding...' : 'Add task'}
          </button>
        </div>
      )}

    </form>
  );
};
const getEventStartDate = (event) => {
  if (!event) return null;
  if (event.startDate) {
    const start = new Date(event.startDate);
    if (!Number.isNaN(start.getTime())) return start;
  }
  const dateToken = (() => {
    if (!event.date) return null;
    if (typeof event.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(event.date)) {
      return event.date.slice(0, 10);
    }
    return toYMD(event.date);
  })();
  if (dateToken) {
    const [hours, minutes] = parseTimeToken(event.time || event.startTime || event.start_time);
    const iso = `${dateToken}T${hours}:${minutes}:00`;
    const start = new Date(iso);
    if (!Number.isNaN(start.getTime())) return start;
  }
  const fallback = toDateSafe(event.start_time || event.startTime);
  if (fallback) return fallback;
  return null;
};

const getEventEndDate = (event, fallbackStart) => {
  if (!event) return null;
  const endDirect = toDateSafe(event.endDate || event.end_date || event.endTime || event.end_time);
  if (endDirect) return endDirect;
  const duration = Number(event.durationMinutes || event.duration || (event.meta && event.meta.durationMinutes));
  if (!Number.isNaN(duration) && duration > 0 && fallbackStart instanceof Date) {
    return new Date(fallbackStart.getTime() + duration * 60000);
  }
  if (event.time && String(event.time).includes('-') && fallbackStart instanceof Date) {
    const [, rawEnd] = String(event.time).split('-');
    if (rawEnd) {
      const [hours, minutes] = parseTimeToken(rawEnd.trim());
      const end = new Date(fallbackStart);
      end.setHours(Number(hours), Number(minutes), 0, 0);
      return end;
    }
  }
  return fallbackStart instanceof Date ? new Date(fallbackStart.getTime() + 60 * 60000) : null;
};

const isLectureLike = (event) => {
  const type = String(event?.type || event?.meta?.type || '').toLowerCase();
  if (LECTURE_TYPES.has(type)) return true;
  if (!type && Array.isArray(event?.meta?.tags)) {
    return event.meta.tags.some((tag) => LECTURE_TYPES.has(String(tag).toLowerCase()));
  }
  return false;
};

const isLectureTask = (task) => {
  if (!task) return false;
  const type = String(task.type || '').toLowerCase();
  if (LECTURE_TYPES.has(type)) return true;
  if (Array.isArray(task.tags)) {
    return task.tags.some((tag) => LECTURE_TYPES.has(String(tag).toLowerCase()));
  }
  if (task.meta && Array.isArray(task.meta.tags)) {
    return task.meta.tags.some((tag) => LECTURE_TYPES.has(String(tag).toLowerCase()));
  }
  return false;
};

const attendanceStatusForDate = (attendanceEntry, targetDate) => {
  if (!attendanceEntry || !Array.isArray(attendanceEntry.sessions) || !(targetDate instanceof Date)) return null;
  const iso = toYMDLocal(targetDate);
  const match = attendanceEntry.sessions.find((session) => session.date === iso);
  return match?.status || null;
};

const computeAttendanceStats = (sessions = []) => {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return { rate: 0, label: 'No attendance logged', present: 0, total: 0 };
  }
  const effective = sessions.filter((session) => session.status && session.status.toUpperCase() !== 'HOLIDAY');
  if (!effective.length) return { rate: 0, label: 'No attendance logged', present: 0, total: 0 };
  const positiveStatuses = new Set(['PRESENT', 'LATE', 'EXCUSED']);
  const present = effective.filter((session) => positiveStatuses.has(String(session.status).toUpperCase())).length;
  const total = effective.length;
  const lastSession = effective[effective.length - 1];
  const label = lastSession
    ? `${String(lastSession.status).toUpperCase()} on ${formatShortDate(lastSession.date)}`
    : 'Awaiting logs';
  return {
    rate: Math.round((present / total) * 100),
    label,
    present,
    total,
  };
};

const formatDuration = (ms) => {
  if (!Number.isFinite(ms) || ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${padTime(hours)}:${padTime(minutes)}:${padTime(seconds)}`;
};

const normalizeEventRecord = (event = {}) => {
  const courseId = event.courseId || event.course_id || event.courses?.id || event.meta?.courseId || null;
  const courseName = event.course || event.courseName || event.courses?.name || event.title || 'Lecture';
  return {
    id: String(event.id ?? `event-${Math.random().toString(36).slice(2)}`),
    title: event.title || event.name || courseName || 'Session',
    type: event.type || event.meta?.type || 'class',
    courseId,
    courseName,
    courseCode: event.courseCode || event.course_code || event.courses?.code || null,
    courseColor: event.courseColor || event.course_color || event.courses?.color || '#6366f1',
    location: event.location || event.meta?.location || event.room || 'See timetable',
    date: event.date || null,
    time: event.time || event.start_time || event.startTime || null,
    startDate: event.startDate || event.start_time || event.startTime || null,
    endDate: event.endDate || event.end_time || event.endTime || null,
    durationMinutes: event.durationMinutes || event.duration || event.meta?.durationMinutes || null,
    archived: Boolean(event.archived),
    completed: Boolean(event.completed),
    meta: { ...(event.meta || {}) },
  };
};

const buildLectureGroups = (events = [], modules = [], attendance = {}) => {
  if (!Array.isArray(events) || !events.length) return [];
  const today = getStartOfDay(new Date());
  const moduleMap = new Map();
  modules.forEach((module) => {
    const key = module?.id || module?.course_id || module?.code;
    if (key) moduleMap.set(String(key), module);
  });
  const grouped = new Map();

  events.forEach((event) => {
    if (!isLectureLike(event)) return;
    const start = getEventStartDate(event);
    if (!start) return;
    const end = getEventEndDate(event, start);
    const courseId = String(event.course_id || event.courseId || event.meta?.courseId || event.courses?.id || '');
    const module = courseId ? moduleMap.get(courseId) : null;
    const courseName = decodeEscapedUnicode(module?.name || event.course || event.courseName || event.title || 'Lecture');
    const courseCode = module?.code || event.courseCode || event.courses?.code || null;
    const color = module?.colorHex || module?.color || event.courseColor || event.courses?.color || '#6366f1';
    const location = decodeEscapedUnicode(event.location || event.meta?.location || event.room || 'See timetable');
    const attendanceEntry = courseId ? attendance[courseId] : undefined;
    const attendanceStatus = attendanceStatusForDate(attendanceEntry, start);
    const key = courseId || courseName;
    if (!grouped.has(key)) {
      grouped.set(key, {
        courseId,
        courseName,
        courseCode,
        color,
        attendanceEntry,
        sessions: [],
      });
    }
    grouped.get(key).sessions.push({
      id: `${event.id}-${start.toISOString()}`,
      title: decodeEscapedUnicode(event.title || courseName),
      start,
      end,
      location,
      attendanceStatus,
    });
  });

  const results = [];
  grouped.forEach((value) => {
    value.sessions.sort((a, b) => a.start - b.start);
    // Filter to only include future sessions (today or later)
    const futureSessions = value.sessions.filter((session) => session.start >= today);
    const stats = computeAttendanceStats(value.attendanceEntry?.sessions || []);
    const nextSession = futureSessions[0] || null;
    
    // Only add groups that have future sessions
    if (futureSessions.length > 0) {
      results.push({
        ...value,
        sessions: futureSessions,
        attendanceRate: stats.rate,
        attendanceLabel: stats.label,
        nextSession,
      });
    }
  });

  return results.sort((a, b) => {
    if (!a.nextSession && !b.nextSession) return 0;
    if (!a.nextSession) return 1;
    if (!b.nextSession) return -1;
    return a.nextSession.start - b.nextSession.start;
  });
};

const parseNaturalLanguageDate = (input) => {
  if (!input) return null;
  const text = input.toLowerCase();
  const now = new Date();
  const tokens = [
    { match: 'today', date: now, label: 'Today' },
    { match: 'tomorrow', date: addDays(now, 1), label: 'Tomorrow' },
    { match: 'next week', date: addDays(now, 7), label: 'Next week' },
    { match: 'next month', date: addDays(now, 30), label: 'Next month' },
    { match: 'this weekend', date: getNextDayOfWeek(now, 6), label: 'This weekend' },
  ];

  for (const token of tokens) {
    if (text.includes(token.match)) {
      return { date: token.date, label: token.label, matched: token.match };
    }
  }

  const weekdayMatch = text.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (weekdayMatch) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const index = dayNames.indexOf(weekdayMatch[1]);
    if (index >= 0) {
      return { date: getNextDayOfWeek(now, index), label: `Next ${weekdayMatch[1]}`, matched: weekdayMatch[0] };
    }
  }

  const inMatch = text.match(/in\s+(\d+)\s+(day|days|week|weeks)/);
  if (inMatch) {
    const value = Number(inMatch[1]);
    if (!Number.isNaN(value)) {
      const unit = inMatch[2].startsWith('week') ? 7 : 1;
      return { date: addDays(now, value * unit), label: `In ${value} ${unit === 7 ? 'weeks' : 'days'}`, matched: inMatch[0] };
    }
  }

  const explicitMatch = text.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s(\d{1,2})/);
  if (explicitMatch) {
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = monthNames.indexOf(explicitMatch[1].slice(0, 3));
    const day = Number(explicitMatch[2]);
    if (monthIndex >= 0 && day > 0) {
      const candidate = new Date(now.getFullYear(), monthIndex, day);
      if (candidate < now) candidate.setFullYear(candidate.getFullYear() + 1);
      return { date: candidate, label: candidate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), matched: explicitMatch[0] };
    }
  }

  return null;
};

const normalizeTask = (task) => {
  const dueDate = task.dueDate || task.date || null;
  const dueTime = task.dueTime || task.time || task.due_time || null;
  const completed = Boolean(task.completed);
  const priority = normalizePriority(task.priority);
  const addedToMyDay = task.addedToMyDay ?? task.myDay ?? false;
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : Array.isArray(task.meta?.subtasks) ? task.meta.subtasks : [];
  return {
    id: String(task.id ?? `local-${Math.random().toString(36).slice(2)}`),
    title: decodeEscapedUnicode(task.title) || 'Untitled Task',
    description: decodeEscapedUnicode(task.description) || '',
    dueDate,
    dueTime,
    courseId: task.courseId || task.course_id || task.courses?.id || null,
    courseCode: task.courseCode || task.course_code || task.courses?.code || null,
    course: decodeEscapedUnicode(task.course || task.courseName || task.courses?.name || null),
    courseColor: task.courseColor || task.course_color || task.courses?.color || null,
    type: task.type || 'task',
    priority,
    completed,
    completedAt: task.completedAt || null,
    important: task.important ?? priority === 'urgent-important',
    addedToMyDay,
    myDay: addedToMyDay,
    status: normalizeStatus(task.status, completed),
    tags: Array.isArray(task.tags) ? task.tags : Array.isArray(task.meta?.tags) ? task.meta.tags : [],
    subtasks,
    reminder: task.reminder || task.reminderAt || task.nextReminder || null,
    borderColor: determineBorderColor(dueDate),
    meta: { ...(task.meta || {}) },
  };
};

const mergeTaskUpdates = (task, updates = {}) => {
  if (!task) return task;
  const next = { ...task, ...updates };
  if (updates.meta) {
    next.meta = { ...(task.meta || {}), ...updates.meta };
  }
  if (Array.isArray(updates.tags)) {
    next.tags = [...updates.tags];
  }
  if ('addedToMyDay' in updates && !('myDay' in updates)) {
    next.myDay = updates.addedToMyDay;
  }
  if ('completed' in updates && !('completedAt' in updates)) {
    next.completedAt = updates.completed ? new Date().toISOString() : null;
  }
  return next;
};

const eventRecordToTask = (event) => {
  if (!event) return null;
  const meta = { ...(event.meta || {}) };
  return normalizeTask({
    id: event.id || event.eventId || `event-${Math.random().toString(36).slice(2)}`,
    title: decodeEscapedUnicode(event.title || event.courseName || 'Schedule block'),
    description: decodeEscapedUnicode(event.description || meta.description || ''),
    dueDate: event.date || event.startDate || meta.dueDate || null,
    dueTime: event.time || meta.time || null,
    courseId: event.course_id || event.courseId || meta.courseId || null,
    course: decodeEscapedUnicode(event.course || event.courseName || meta.course || null),
    courseCode: event.courseCode || event.courses?.code || meta.courseCode || null,
    courseColor: event.courseColor || event.courses?.color || meta.courseColor || null,
    type: event.type || meta.type || 'task',
    tags: Array.isArray(event.tags) ? event.tags : Array.isArray(meta.tags) ? meta.tags : [],
    reminder: event.reminder || meta.reminder || null,
    meta,
  });
};

const buildListBuckets = (tasks = []) => {
  const now = new Date();
  const start = getStartOfDay(now);
  const end = addDays(start, 1);
  const nextUpEnd = addDays(start, 7);
  const buckets = { today: [], next_up: [], later: [] };

  tasks.forEach((task) => {
    if (!task || task.completed) return;
    const due = toDateSafe(task.dueDate);
    const addedToMyDay = task.addedToMyDay ?? task.myDay ?? false;

    if (due && due < start) {
      buckets.today.push(task);
      return;
    }

    if ((due && due >= start && due < end) || addedToMyDay) {
      buckets.today.push(task);
      return;
    }

    if (due && due >= end && due < nextUpEnd) {
      buckets.next_up.push(task);
      return;
    }

    buckets.later.push(task);
  });

  const compareToday = (a, b) => {
    const dueA = toDateSafe(a.dueDate);
    const dueB = toDateSafe(b.dueDate);
    const nowTs = now.getTime();
    const overdueA = dueA ? dueA.getTime() < nowTs : false;
    const overdueB = dueB ? dueB.getTime() < nowTs : false;
    if (overdueA !== overdueB) return overdueA ? -1 : 1;
    const hasTimeA = hasDueTime(a);
    const hasTimeB = hasDueTime(b);
    if (hasTimeA !== hasTimeB) return hasTimeA ? -1 : 1;
    const weightDelta = getPriorityMeta(a.priority).weight - getPriorityMeta(b.priority).weight;
    if (weightDelta !== 0) return weightDelta;
    if (dueA && dueB) return dueA - dueB;
    if (dueA) return -1;
    if (dueB) return 1;
    return a.title.localeCompare(b.title);
  };

  buckets.today.sort(compareToday);
  buckets.next_up.sort(sortByDueDate);
  buckets.later.sort((a, b) => {
    const dueA = Boolean(a.dueDate);
    const dueB = Boolean(b.dueDate);
    if (dueA && dueB) return sortByDueDate(a, b);
    if (dueA !== dueB) return dueA ? 1 : -1;
    const weightDelta = getPriorityMeta(a.priority).weight - getPriorityMeta(b.priority).weight;
    if (weightDelta !== 0) return weightDelta;
    return a.title.localeCompare(b.title);
  });

  return buckets;
};

const computeMetrics = (tasks) => {
  const now = new Date();
  const start = getStartOfDay(now);
  const end = addDays(start, 1);
  const nextUpEnd = addDays(start, 7);
  return tasks.reduce(
    (acc, task) => {
      if (!task) return acc;
      if (task.completed) {
        acc.completed += 1;
        return acc;
      }
      const due = toDateSafe(task.dueDate);
      const addedToMyDay = task.addedToMyDay ?? task.myDay ?? false;
      if (due && due < now) acc.overdue += 1;
      if ((due && due < end) || (due && due < start) || addedToMyDay) acc.today += 1;
      else if (due && due < nextUpEnd) acc.upcoming += 1;
      else acc.unscheduled += 1;
      if ((task.important || task.priority === 'urgent-important' || task.priority === 'urgent-not-important') && !task.completed) {
        acc.important += 1;
      }
      return acc;
    },
    { overdue: 0, today: 0, upcoming: 0, completed: 0, important: 0, unscheduled: 0 }
  );
};

const buildSuggestions = (metrics, buckets) => {
  const suggestions = [];
  if (metrics.overdue > 0) suggestions.push(`You have ${metrics.overdue} overdue task${metrics.overdue === 1 ? '' : 's'} - clear them first.`);
  if (!buckets.today.length && buckets.later.length) suggestions.push('Today is clear - pull a backlog idea into focus.');
  if (buckets.next_up.length > 4) suggestions.push('Next 6 days are stacked - spread deadlines across the week.');
  if (!buckets.today.length && !buckets.next_up.length) {
    suggestions.push('Capture tasks quickly - title is the only required field.');
    suggestions.push('Use natural language: "Read chapter 5 tomorrow 7pm".');
  }
  return suggestions.slice(0, 3);
};

/* Smart grouping: Today (incl. overdue) -> Tomorrow -> This Week -> Later */
const buildSmartBuckets = (tasks = [], sortBy = 'due', sortDirection = 'asc') => {
  const now = new Date();
  const todayStart = getStartOfDay(now);
  const todayEnd = addDays(todayStart, 1);
  const tomorrowEnd = addDays(todayStart, 2);
  const weekEnd = addDays(todayStart, 7);
  const buckets = { today: [], tomorrow: [], later: [] };
  tasks.forEach(task => {
    if (!task || task.completed) return;
    const due = toDateSafe(task.dueDate);
    const myDay = task.addedToMyDay || task.myDay;
    // Overdue tasks go into Today bucket (they show red "Late" badge on the card)
    if (due && due < todayStart) { buckets.today.push(task); }
    else if ((due && due >= todayStart && due < todayEnd) || myDay) { buckets.today.push(task); }
    else if (due && due >= todayEnd && due < tomorrowEnd) { buckets.tomorrow.push(task); }
    else if (due && due >= tomorrowEnd && due < weekEnd) { buckets.later.push(task); }
    else { buckets.later.push(task); }
  });
  const directionMultiplier = sortDirection === 'desc' ? -1 : 1;
  const sortComparator = (() => {
    if (sortBy === 'priority') {
      return (a, b) => {
        const weightDelta = getPriorityMeta(a.priority).weight - getPriorityMeta(b.priority).weight;
        if (weightDelta !== 0) return weightDelta * directionMultiplier;
        return sortByDueDate(a, b) * directionMultiplier;
      };
    }
    if (sortBy === 'recent') {
      return (a, b) => (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)) * directionMultiplier;
    }
    return (a, b) => sortByDueDate(a, b) * directionMultiplier;
  })();
  // Sort today: overdue first, then by due date
  buckets.today.sort((a, b) => {
    const dueA = toDateSafe(a.dueDate);
    const dueB = toDateSafe(b.dueDate);
    const overdueA = dueA && dueA < todayStart;
    const overdueB = dueB && dueB < todayStart;
    if (overdueA !== overdueB) return overdueA ? -1 : 1;
    return sortComparator(a, b);
  });
  buckets.tomorrow.sort(sortComparator);
  buckets.later.sort(sortComparator);
  return buckets;
};

const buildTimelineEntries = (tasks = []) => {
  const today = getStartOfDay(new Date());
  const tomorrow = addDays(today, 1);
  return tasks
    .filter((task) => task && task.dueDate && !task.completed)
    .map((task) => ({ task, due: toDateSafe(task.dueDate) }))
    .filter(({ due }) => due instanceof Date && !Number.isNaN(due.getTime()) && due >= today && due < tomorrow)
    .sort((a, b) => a.due - b.due)
    .map(({ task, due }) => ({
      id: task.id,
      title: task.title || 'Task',
      time: due,
      course: task.course || 'Task board',
      courseColor: task.courseColor || '#94a3b8',
      borderColor: task.borderColor || task.meta?.borderColor || undefined,
      location: task.location || task.meta?.location || 'Task board',
    }))
    .slice(0, 6);
};

const buildScheduleTimeline = (events = []) => {
  const today = getStartOfDay(new Date());
  const tomorrow = addDays(today, 1);
  return events
    .map((event) => {
      const start = getEventStartDate(event);
      if (!(start instanceof Date) || start < today || start >= tomorrow) return null;
      const end = getEventEndDate(event, start) || new Date(start.getTime() + 60 * 60000);
      return {
        id: `event-${event.id}-${start.toISOString()}`,
        title: event.title || event.courseName || 'Schedule block',
        time: start,
        end,
        course: event.course || event.courseName || event.meta?.courseName || 'Schedule',
        courseColor: event.courseColor || event.courses?.color || '#a855f7',
        location: event.location || event.meta?.location || event.room || 'See timetable',
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.time - b.time)
    .slice(0, 6);
};

const mergeTimelineEntries = (taskEntries = [], scheduleEntries = []) => {
  const combined = [...taskEntries, ...scheduleEntries]
    .filter((entry) => entry && entry.time instanceof Date && !Number.isNaN(entry.time.getTime()))
    .sort((a, b) => a.time - b.time);
  const seen = new Set();
  const result = [];
  combined.forEach((entry) => {
    const key = entry.id || `${entry.title}-${entry.time.toISOString()}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(entry);
  });
  return result.slice(0, 8);
};

const computeFocusStats = (events = []) => {
  if (!Array.isArray(events) || !events.length) {
    return {
      todayDurationLabel: '00:00:00',
      weekDurationLabel: '00:00:00',
      todaySessions: 0,
      weekSessions: 0,
    };
  }
  const todayStart = getStartOfDay(new Date());
  const todayEnd = addDays(todayStart, 1);
  const weekStart = addDays(todayStart, -7);
  let todayDuration = 0;
  let weekDuration = 0;
  let todaySessions = 0;
  let weekSessions = 0;
  events.forEach((event) => {
    const start = getEventStartDate(event);
    if (!(start instanceof Date)) return;
    const end = getEventEndDate(event, start) || new Date(start.getTime() + 60 * 60000);
    const duration = Math.max(0, end.getTime() - start.getTime());
    if (start >= weekStart && start < todayEnd) {
      weekDuration += duration;
      weekSessions += 1;
    }
    if (start >= todayStart && start < todayEnd) {
      todayDuration += duration;
      todaySessions += 1;
    }
  });
  return {
    todayDurationLabel: formatDuration(todayDuration),
    weekDurationLabel: formatDuration(weekDuration),
    todaySessions,
    weekSessions,
  };
};

const getSectionDefinition = (id) => listSections.find((section) => section.id === id) || { id, label: id.toUpperCase() };

const sectionConfig = {
  today: {
    ...getSectionDefinition('today'),
    accent: 'bg-purple-100/40 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    iconColor: 'text-purple-600 dark:text-purple-400',
    iconComponent: Sun,
  },
  next_up: {
    ...getSectionDefinition('next_up'),
    accent: 'bg-blue-100/40 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-300',
     iconColor: 'text-blue-600 dark:text-blue-400',
    iconComponent: CalendarDays,
  },
  later: {
    ...getSectionDefinition('later'),
    accent: 'bg-slate-100/60 dark:bg-slate-700/60',
    text: 'text-slate-600 dark:text-slate-300',
    iconColor: 'text-slate-600 dark:text-slate-400',
    iconComponent: Moon,
  },
};

const highlightNaturalLanguage = (value, match) => {
  if (!value) return null;
  if (!match) return <span>{value}</span>;
  const lower = value.toLowerCase();
  const index = lower.indexOf(match.toLowerCase());
  if (index === -1) return <span>{value}</span>;
  const before = value.slice(0, index);
  const highlighted = value.slice(index, index + match.length);
  const after = value.slice(index + match.length);
  return (
    <span className="text-sm text-slate-600">
      {before}
      <span className="relative text-slate-900">
        {highlighted}
        <span className="absolute inset-x-0 bottom-0 block h-[2px] rounded-full bg-gradient-to-r from-purple-400 to-pink-400" />
      </span>
      {after}
    </span>
  );
};

const formatMonthDay = (value) => {
  const date = toDateSafe(value);
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isSameDay = (a, b) => {
  const dateA = toDateSafe(a);
  const dateB = toDateSafe(b);
  if (!dateA || !dateB) return false;
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
};

const formatWeekRangeLabel = (start, end) => {
  const rangeStart = getStartOfDay(toDateSafe(start) || new Date());
  const rangeEndExclusive = toDateSafe(end) || addDays(rangeStart, 7);
  const rangeEnd = addDays(rangeEndExclusive, -1);
  if (!rangeEnd || Number.isNaN(rangeEnd.getTime())) return formatMonthDay(rangeStart);
  const sameMonth = rangeStart.getMonth() === rangeEnd.getMonth();
  const startLabel = rangeStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const endLabel = rangeEnd.toLocaleDateString('en-US', {
    month: sameMonth ? undefined : 'short',
    day: 'numeric',
  });
  return `${startLabel} - ${endLabel}`;
};

const sortByDueDate = (a = {}, b = {}) => {
  const dueA = toDateSafe(a.dueDate);
  const dueB = toDateSafe(b.dueDate);
  if (dueA && dueB) {
    const delta = dueA - dueB;
    if (delta !== 0) return delta;
    const timeDelta = Number(hasDueTime(a)) - Number(hasDueTime(b));
    if (timeDelta !== 0) return -timeDelta;
    const weightDelta = getPriorityMeta(a.priority).weight - getPriorityMeta(b.priority).weight;
    if (weightDelta !== 0) return weightDelta;
  } else if (dueA || dueB) {
    return dueA ? -1 : 1;
  }
  const fallback = getPriorityMeta(a.priority).weight - getPriorityMeta(b.priority).weight;
  if (fallback !== 0) return fallback;
  return (a.title || '').localeCompare(b.title || '');
};


const ReminderWidget = ({ tasks = [], className = '' }) => {
  // Filter tasks that have reminders set and are upcoming
  const tasksWithReminders = tasks
    .filter(task => task.reminder && !task.completed)
    .sort((a, b) => new Date(a.reminder) - new Date(b.reminder))
    .slice(0, 3);

  if (tasksWithReminders.length === 0) {
    return (
      <section className={`rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-slate-800 px-4 py-4 shadow-sm ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Bell size={18} className="text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Upcoming Reminders</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">No reminders set - add one to get notified before deadlines.</p>
      </section>
    );
  }

  return (
    <section className={`rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-slate-800 px-4 py-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Bell size={18} className="text-purple-600 dark:text-purple-400" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Upcoming Reminders</h3>
      </div>
      
      <div className="space-y-3">
        {tasksWithReminders.map(task => {
          const reminderDate = new Date(task.reminder);
          const now = new Date();
          const hoursUntil = Math.round((reminderDate - now) / (1000 * 60 * 60));
          const isPast = reminderDate < now;
          
          return (
            <div 
              key={task.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer"
            >
              <div className="shrink-0 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${isPast ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-400">
                  <Clock3 size={12} />
                  <span>
                    {isPast ? 'Overdue' : 
                     hoursUntil < 1 ? 'Within 1 hour' :
                     hoursUntil < 24 ? `In ${hoursUntil} hours` :
                     reminderDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                {task.course && (
                  <span
                    className="inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ color: task.courseColor, backgroundColor: `${task.courseColor}15` }}
                  >
                    {task.course}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const TimeTrackerWidget = ({ stats = {}, className = '' }) => {
  const router = typeof window !== 'undefined' ? require('next/router').default : null;
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessionType, setSessionType] = useState('focus'); // 'focus' or 'break'
  const [sessionId, setSessionId] = useState(null);
  const [todayStats, setTodayStats] = useState({ total_duration: 0, total_sessions: 0 });
  const [focusSettings, setFocusSettings] = useState({ focus_duration: 1500, short_break_duration: 300 });
  const timerRef = useRef(null);

  // Load stats and settings on mount
  useEffect(() => {
    fetchStats();
    fetchFocusSettings();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/sessions/stats');
      const data = await response.json();
      if (data.success) {
        setTodayStats(data.stats.today);
      }
    } catch (error) {
      console.error('Failed to fetch session stats:', error);
    }
  };

  const fetchFocusSettings = async () => {
    try {
      const response = await fetch('/api/focus/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setFocusSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Failed to fetch focus settings:', error);
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartStop = async () => {
    if (!isRunning) {
      // Redirect to /focus page for full experience
      router?.push('/focus');
    } else {
      // Stop session
      setIsRunning(false);
      if (sessionId) {
        try {
          await fetch('/api/sessions/stop', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              elapsed_seconds: elapsed,
              completed: true,
            }),
          });
          setSessionId(null);
          fetchStats(); // Refresh stats after stopping
        } catch (error) {
          console.error('Failed to stop session:', error);
        }
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsed(0);
    setSessionId(null);
  };

  return (
    <section
      className={`rounded-2xl border border-gray-200 dark:border-gray-900/10 
        bg-gradient-to-br from-purple-50 via-white to-purple-100 
        dark:from-slate-900 dark:via-purple-900 dark:to-purple-900 
        text-slate-900 dark:text-white 
        px-4 py-4 shadow-sm 
        ${className}`}
      style={statFontStyle}
    >
      <div className="flex items-start justify-between">
        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-white/50">Today</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{formatTime(todayStats.total_duration || 0)}</p>
          <p className="text-xs text-slate-500 dark:text-white/50">{todayStats.total_sessions || 0} sessions</p>
        </div>
      </div>
      
      {/* Timer Display */}
      <div className="mt-3 flex items-center justify-center">
        <span className="text-5xl font-bold tabular-nums bg-gradient-to-r from-purple-600 to-purple-800 dark:from-white dark:to-purple-200 bg-clip-text text-transparent">{formatTime(elapsed)}</span>
      </div>

      {/* Session Type Toggle */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => !isRunning && setSessionType('focus')}
          disabled={isRunning}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            sessionType === 'focus' 
              ? 'bg-purple-600 text-white' 
              : 'bg-purple-100 dark:bg-white/10 text-purple-600 dark:text-white/60 hover:bg-purple-200 dark:hover:bg-white/20'
          } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Focus ({Math.floor((focusSettings.focus_duration || 1500) / 60)}min)
        </button>
        <button
          onClick={() => !isRunning && setSessionType('break')}
          disabled={isRunning}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            sessionType === 'break' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-emerald-100 dark:bg-white/10 text-emerald-600 dark:text-white/60 hover:bg-emerald-200 dark:hover:bg-white/20'
          } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Break ({Math.floor((focusSettings.short_break_duration || 300) / 60)}min)
        </button>
      </div>

      {/* Control Buttons */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleStartStop}
          className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 py-2.5 text-sm font-semibold text-white transition-all shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40"
        >
          Open Focus Timer
        </button>
      </div>

      <button
        onClick={() => router?.push('/sessions')}
        className="mt-3 w-full rounded-lg border border-purple-200 dark:border-white/20 py-1.5 text-xs font-semibold text-purple-600 dark:text-white/80 hover:bg-purple-50 dark:hover:bg-white/10 transition-all"
      >
        View Session History {"\u2192"}
      </button>
    </section>
  );
};

/* -----------------------------------------
   UI COMPONENTS - Ultra-minimal task rows
   ----------------------------------------- */

/* Task Context Menu — 3-dot dropdown with quick actions */
const TaskContextMenu = ({ task, onOpenDetail, onToggleComplete, onQuickAction, onDeleteTask, onDuplicate, position, onClose }) => {
  const menuRef = useRef(null);
  const [subMenu, setSubMenu] = useState(null); // 'date' | 'priority' | null
  const [ctxCalMonth, setCtxCalMonth] = useState(() => new Date());
  const [ctxDraftDate, setCtxDraftDate] = useState(null); // ISO string of selected date
  const [ctxDraftTime, setCtxDraftTime] = useState(''); // HH:mm or ''

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEsc); };
  }, [onClose]);

  const dateShortcuts = [
    { label: 'Today', value: () => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString(); }, color: '#10b981' },
    { label: 'Tomorrow', value: () => { const d = new Date(Date.now() + 86400000); d.setHours(0,0,0,0); return d.toISOString(); }, color: '#f59e0b' },
    { label: 'Weekend', value: () => { const d = new Date(); d.setDate(d.getDate() + (6 - d.getDay())); d.setHours(0,0,0,0); return d.toISOString(); }, color: '#3b82f6' },
    { label: 'Next week', value: () => { const d = new Date(); d.setDate(d.getDate() + (8 - d.getDay())); d.setHours(0,0,0,0); return d.toISOString(); }, color: '#8b5cf6' },
    { label: 'No date', value: () => null, color: '#94a3b8' },
  ];

  const priorityOptions = [
    { key: 'p1', label: 'Priority 1', color: '#ef4444' },
    { key: 'p2', label: 'Priority 2', color: '#f59e0b' },
    { key: 'p3', label: 'Priority 3', color: '#3b82f6' },
    { key: 'p4', label: 'Priority 4', color: '#94a3b8' },
  ];

  // Compute menu height dynamically to avoid clipping
  const menuHeight = subMenu === 'date' ? 480 : subMenu === 'priority' ? 240 : 340;
  const menuWidth = subMenu === 'date' ? 280 : 208;
  const menuStyle = {
    position: 'fixed',
    top: Math.min(position.y, window.innerHeight - menuHeight - 12),
    left: Math.min(position.x, window.innerWidth - menuWidth - 12),
    zIndex: 9999,
  };

  // Mini calendar helpers for context menu
  const ctxToday = new Date(); ctxToday.setHours(0, 0, 0, 0);
  const ctxDaysInMonth = new Date(ctxCalMonth.getFullYear(), ctxCalMonth.getMonth() + 1, 0).getDate();
  const ctxFirstDow = new Date(ctxCalMonth.getFullYear(), ctxCalMonth.getMonth(), 1).getDay();
  const ctxLeading = (ctxFirstDow + 6) % 7;
  const ctxTaskDue = task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : null;

  return ReactDOM.createPortal(
    <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        ref={menuRef}
        style={menuStyle}
        className={`${subMenu === 'date' ? 'w-[280px]' : 'w-52'} overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1d] shadow-xl animate-in fade-in zoom-in-95 duration-150`}
      >
        {subMenu === 'date' ? (
          <div className="py-1">
            <button type="button" onClick={() => setSubMenu(null)} className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]">
              <ChevronRight size={14} className="rotate-180" /> Back
            </button>
            {/* Horizontal quick-date chips */}
            <div className="px-3 py-2 flex flex-wrap gap-1.5">
              {dateShortcuts.map((shortcut) => (
                <button key={shortcut.label} type="button" onClick={() => {
                  const rawDate = shortcut.value();
                  if (!rawDate) { onQuickAction?.(task.id, 'set-date', null); onClose(); return; }
                  if (ctxDraftTime) { const d = new Date(rawDate); const [hh, mm] = ctxDraftTime.split(':').map(Number); d.setHours(hh, mm, 0, 0); onQuickAction?.(task.id, 'set-date', d.toISOString()); } else { onQuickAction?.(task.id, 'set-date', rawDate); }
                  onClose();
                }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all hover:shadow-sm"
                  style={{ backgroundColor: `${shortcut.color}12`, color: shortcut.color, border: `1px solid ${shortcut.color}25` }}>
                  {shortcut.label}
                </button>
              ))}
            </div>
            {/* Mini Calendar */}
            <div className="border-t border-gray-100 dark:border-white/[0.05] px-3 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-bold text-gray-700 dark:text-gray-200">
                  {ctxCalMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-0.5">
                  <button type="button" onClick={() => setCtxCalMonth(new Date(ctxCalMonth.getFullYear(), ctxCalMonth.getMonth() - 1, 1))}
                    className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-white/[0.06]">
                    <ChevronDown size={12} className="rotate-90 text-gray-400" />
                  </button>
                  <button type="button" onClick={() => setCtxCalMonth(new Date(ctxCalMonth.getFullYear(), ctxCalMonth.getMonth() + 1, 1))}
                    className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-white/[0.06]">
                    <ChevronDown size={12} className="-rotate-90 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 text-center mb-0.5">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div key={i} className="text-[9px] font-bold text-gray-400 dark:text-gray-500 py-0.5">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px">
                {Array.from({ length: ctxLeading }).map((_, i) => (
                  <div key={`b-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: ctxDaysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const cellDate = new Date(ctxCalMonth.getFullYear(), ctxCalMonth.getMonth(), day);
                  cellDate.setHours(0, 0, 0, 0);
                  const isToday = cellDate.getTime() === ctxToday.getTime();
                  const cellYMD = cellDate.toISOString().slice(0, 10);
                  const isSelected = ctxTaskDue === cellYMD;
                  const isPast = cellDate < ctxToday;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const iso = cellDate.toISOString();
                        setCtxDraftDate(iso);
                      }}
                      className={`aspect-square flex items-center justify-center rounded text-[10px] font-semibold transition-all ${
                        (ctxDraftDate && new Date(ctxDraftDate).toISOString().slice(0,10) === cellYMD)
                          ? 'bg-purple-600 text-white'
                          : isSelected
                          ? 'ring-2 ring-purple-400 text-purple-600 dark:text-purple-400'
                          : isToday
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-300/50 dark:ring-emerald-600/30'
                          : isPast
                          ? 'text-gray-300 dark:text-gray-600'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Time picker row */}
            <div className="border-t border-gray-100 dark:border-white/[0.05] px-3 py-2 flex items-center gap-2">
              <Clock size={13} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Time</span>
              <input type="time" value={ctxDraftTime} onChange={e => setCtxDraftTime(e.target.value)}
                className="ml-auto rounded-md border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-gray-700 dark:text-gray-300 outline-none focus:border-purple-400 w-[88px]" />
              {ctxDraftTime && <button type="button" onClick={() => setCtxDraftTime('')} className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"><X size={11} /></button>}
            </div>
            {/* Save / Clear footer */}
            <div className="border-t border-gray-100 dark:border-white/[0.05] flex items-center justify-between px-3 py-2 bg-gray-50/50 dark:bg-white/[0.02]">
              <button type="button" onClick={() => { onQuickAction?.(task.id, 'set-date', null); onClose(); }}
                className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"><X size={11} /> No date</button>
              <button type="button" onClick={() => {
                const dateVal = ctxDraftDate || (task.dueDate ? new Date(task.dueDate).toISOString() : null);
                if (dateVal) {
                  const d = new Date(dateVal);
                  if (ctxDraftTime) { const [hh, mm] = ctxDraftTime.split(':').map(Number); d.setHours(hh, mm, 0, 0); }
                  else { d.setHours(0, 0, 0, 0); }
                  onQuickAction?.(task.id, 'set-date', d.toISOString());
                }
                onClose();
              }} className="rounded-lg bg-purple-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm">Save</button>
            </div>
          </div>
        ) : subMenu === 'priority' ? (
          <div className="py-1">
            <button type="button" onClick={() => setSubMenu(null)} className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]">
              <ChevronRight size={14} className="rotate-180" /> Back
            </button>
            <div className="h-px bg-gray-100 dark:bg-white/[0.06] mx-2" />
            {priorityOptions.map((opt) => (
              <button key={opt.key} type="button" onClick={() => { onQuickAction?.(task.id, 'set-priority', opt.key); onClose(); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                style={{ color: opt.color }}>
                <Flag size={14} fill={task.priority === opt.key ? opt.color : 'none'} /> {opt.label}
                {task.priority === opt.key && <Check size={14} className="ml-auto" />}
              </button>
            ))}
          </div>
        ) : (
          <div className="py-1">
            {/* Edit */}
            <button type="button" onClick={() => { onOpenDetail?.(task); onClose(); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]">
              <Pencil size={14} className="text-gray-400" /> Edit
            </button>
            <div className="h-px bg-gray-100 dark:bg-white/[0.06] mx-2" />
            {/* Date sub-menu */}
            <button type="button" onClick={() => setSubMenu('date')}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]">
              <CalendarIcon size={14} className="text-gray-400" /> Due date
              <ChevronRight size={12} className="ml-auto text-gray-400" />
            </button>
            {/* Priority sub-menu */}
            <button type="button" onClick={() => setSubMenu('priority')}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]">
              <Flag size={14} className="text-gray-400" /> Priority
              <ChevronRight size={12} className="ml-auto text-gray-400" />
            </button>
            <div className="h-px bg-gray-100 dark:bg-white/[0.06] mx-2" />
            {/* My Day */}
            <button type="button" onClick={() => { onQuickAction?.(task.id, 'my-day'); onClose(); }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium hover:bg-gray-50 dark:hover:bg-white/[0.04] ${
                task.addedToMyDay || task.myDay ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'
              }`}>
              <Sun size={14} className={task.addedToMyDay || task.myDay ? 'text-amber-500' : 'text-gray-400'} />
              {task.addedToMyDay || task.myDay ? 'Remove from My Day' : 'Add to My Day'}
            </button>
            {/* Mark complete */}
            <button type="button" onClick={() => { onToggleComplete?.(task.id); onClose(); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]">
              <CheckCircle2 size={14} className="text-gray-400" /> {task.completed ? 'Mark incomplete' : 'Mark complete'}
            </button>
            <div className="h-px bg-gray-100 dark:bg-white/[0.06] mx-2" />
            {/* Duplicate */}
            <button type="button" onClick={() => { onDuplicate?.(task); onClose(); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]">
              <Copy size={14} className="text-gray-400" /> Duplicate
            </button>
            {/* Delete */}
            <button type="button" onClick={() => { onDeleteTask?.(task.id); onClose(); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

const TaskCard = ({ task, onToggleComplete, onQuickAction, onOpenDetail, onDeleteTask, onDuplicate, isSelected, onSelect, selectionMode }) => {
  const dueDate = toDateSafe(task.dueDate);
  const relative = dueDate ? formatRelativeDue(dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && !task.completed;
  const pMeta = getPriorityMeta(task.priority);
  const courseColor = task.courseColor || '#94a3b8';
  const tags = Array.isArray(task.tags) ? task.tags : [];
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const doneCount = subtasks.filter(s => s.completed).length;
  const [hovered, setHovered] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y } or null
  const ctxActionFiredRef = useRef(false);

  const handleCardClick = (e) => {
    // If a context menu action just fired, skip opening the detail panel.
    // This prevents the React portal event bubbling from re-triggering.
    if (ctxActionFiredRef.current) {
      ctxActionFiredRef.current = false;
      return;
    }
    // If context menu is open, close it instead of opening detail.
    if (ctxMenu) {
      setCtxMenu(null);
      return;
    }
    onOpenDetail?.(task);
  };

  const wrapCtxAction = (fn) => {
    ctxActionFiredRef.current = true;
    fn();
    // Reset after a tick so the flag doesn't persist
    setTimeout(() => { ctxActionFiredRef.current = false; }, 100);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenDetail?.(task); } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative rounded-[10px] border transition-all duration-200 ease-out cursor-pointer ${
        isSelected
          ? 'border-purple-400/60 dark:border-purple-500/40 bg-purple-50/50 dark:bg-purple-950/20 shadow-[0_0_0_1px_rgba(124,58,237,0.15)]'
          : task.completed
          ? 'border-gray-100 dark:border-white/[0.03] bg-gray-50/50 dark:bg-white/[0.01] opacity-60'
          : `border-gray-200/60 dark:border-white/[0.06] bg-white dark:bg-[#111113] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] hover:border-gray-300/70 dark:hover:border-white/[0.1] hover:-translate-y-[1px]`
      }`}
    >
      {/* Priority accent line */}
      {pMeta.color !== '#94a3b8' && (
        <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full" style={{ backgroundColor: pMeta.color }} />
      )}

      <div className="flex items-start gap-3 px-3.5 py-3 pl-4">
        {/* Selection checkbox — visible on hover or when selection mode active */}
        <div className={`flex-shrink-0 mt-0.5 transition-all duration-150 ${selectionMode || hovered ? 'w-5 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect?.(task.id); }}
            className={`flex h-5 w-5 items-center justify-center rounded-[5px] border-2 transition-all ${
              isSelected
                ? 'border-purple-500 bg-purple-500 text-white'
                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
            }`}
            aria-label="Select task"
          >
            {isSelected && <Check size={11} strokeWidth={3} />}
          </button>
        </div>

        {/* Completion toggle — 40px hit target */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleComplete?.(task.id); }}
          className={`group/check flex-shrink-0 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 mt-[1px] transition-all duration-200 ${
            task.completed
              ? 'border-gray-800 dark:border-white bg-gray-800 dark:bg-white scale-95'
              : 'border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
          }`}
          style={{ minWidth: 22, minHeight: 22 }}
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.completed && <Check size={11} strokeWidth={3} className="text-white dark:text-gray-900" />}
        </button>

        {/* Content — scanning hierarchy: title dominant, meta secondary */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Title row */}
          <div className="flex items-start gap-2">
            <span className={`text-[14px] font-semibold leading-snug line-clamp-2 transition-colors ${
              task.completed
                ? 'line-through text-gray-400 dark:text-gray-500'
                : 'text-gray-900 dark:text-gray-50'
            }`}>
              {task.title}
            </span>
          </div>

          {/* Metadata row — secondary visual weight */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Course dot + name */}
            {task.course && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: courseColor }} />
                <span className="truncate max-w-[120px]">{task.course}</span>
              </span>
            )}
            {/* Tags — max 2, pill style */}
            {tags.slice(0, 2).map((tag, i) => (
              <span key={tag} className="inline-flex items-center px-1.5 py-[1px] rounded-[4px] text-[10px] font-semibold leading-tight" style={{ backgroundColor: `${palette.tag[i % palette.tag.length]}12`, color: palette.tag[i % palette.tag.length] }}>
                {tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">+{tags.length - 2}</span>
            )}
            {/* Subtask progress */}
            {subtasks.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                <Layers size={10} />
                {doneCount}/{subtasks.length}
              </span>
            )}
          </div>
        </div>

        {/* Right side — date badge + 3-dot context trigger on hover */}
        <div className="flex-shrink-0 flex items-center gap-1.5 mt-0.5">
          {/* Static meta — always visible */}
          <div className="flex items-center gap-2">
            {(task.addedToMyDay || task.myDay) && (
              <Sun size={13} className="text-amber-400 flex-shrink-0" />
            )}
            {relative && !task.completed && (
              <span className={`text-[11px] font-medium whitespace-nowrap ${
                isOverdue ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {isOverdue ? relative : dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {!task.completed && hasDueTime(task) && dueDate && (
              <span className="text-[10px] font-semibold whitespace-nowrap text-purple-500 dark:text-purple-400">
                {dueDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
            {isOverdue && (
              <span className="flex-shrink-0 px-1.5 py-[2px] rounded-[4px] bg-red-50 dark:bg-red-950/40 text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                Late
              </span>
            )}
          </div>

          {/* 3-dot context menu trigger — appears on hover */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setCtxMenu({ x: rect.right - 208, y: rect.bottom + 4 });
            }}
            className={`p-1 rounded-md transition-all duration-150 ${
              hovered && !task.completed
                ? 'opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                : 'opacity-0 pointer-events-none'
            }`}
            aria-label="Task options"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {ctxMenu && (
        <TaskContextMenu
          task={task}
          position={ctxMenu}
          onOpenDetail={(t) => wrapCtxAction(() => onOpenDetail?.(t))}
          onToggleComplete={(id) => wrapCtxAction(() => onToggleComplete?.(id))}
          onQuickAction={(id, action, val) => wrapCtxAction(() => onQuickAction?.(id, action, val))}
          onDeleteTask={(id) => wrapCtxAction(() => onDeleteTask?.(id))}
          onDuplicate={(t) => wrapCtxAction(() => onDuplicate?.(t))}
          onClose={() => { ctxActionFiredRef.current = true; setCtxMenu(null); setTimeout(() => { ctxActionFiredRef.current = false; }, 100); }}
        />
      )}
    </div>
  );
};


const TaskGroup = ({
  sectionId,
  label,
  dotColor,
  labelColor,
  tasks = [],
  isOpen,
  onToggle,
  onToggleComplete,
  onQuickAction,
  onOpenDetail,
  onDeleteTask,
  onDuplicate,
  onInlineAdd,
  selectedTaskIds = new Set(),
  onSelect,
  selectionMode,
  onDrop,
}) => {
  const [inlineValue, setInlineValue] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const count = tasks.length;

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onDrop) onDrop(taskId, sectionId);
  };

  const statusInfo = palette.status[sectionId === 'this_week' ? 'thisWeek' : sectionId] || palette.status.later;

  return (
    <div
      className={`transition-colors duration-200 ${dragOver ? 'bg-purple-50/30 dark:bg-purple-950/10' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Section header — clean, scannable */}
      <button
        type="button"
        onClick={() => onToggle?.(sectionId)}
        className="group/header w-full flex items-center gap-2.5 py-3 px-1 text-left transition-colors"
      >
        <ChevronRight
          size={14}
          className={`flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        />
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor || statusInfo.dot }} />
        <span className={`text-[13px] font-bold ${labelColor || statusInfo.text}`}>
          {label}
        </span>
        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${statusInfo.bg} ${statusInfo.text}`}>
          {count}
        </span>

      </button>

      {/* Task cards — with spacing between cards */}
      {isOpen && (
        <div className="flex flex-col gap-1.5 pb-2 pl-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onQuickAction={onQuickAction}
              onOpenDetail={onOpenDetail}
              onDeleteTask={onDeleteTask}
              onDuplicate={onDuplicate}
              isSelected={selectedTaskIds.has(task.id)}
              onSelect={onSelect}
              selectionMode={selectionMode}
            />
          ))}

          {/* Inline quick-add */}
          <div className="flex items-center gap-2 px-3.5 py-2 mt-0.5 rounded-lg hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors">
            <Plus size={14} className="flex-shrink-0 text-gray-300 dark:text-gray-600" />
            <input
              type="text"
              value={inlineValue}
              onChange={(e) => setInlineValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inlineValue.trim()) {
                  e.preventDefault();
                  onInlineAdd?.(inlineValue, sectionId);
                  setInlineValue('');
                }
                if (e.key === 'Escape') {
                  setInlineValue('');
                  e.currentTarget.blur();
                }
              }}
              placeholder="Add task..."
              className="flex-1 bg-transparent border-none outline-none text-[13px] font-medium text-gray-700 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600"
            />
            {inlineValue.trim() && (() => {
              const parsed = parseQuickCapture(inlineValue, {});
              const hints = [];
              if (parsed.priority && parsed.priority !== 'not-urgent-not-important') hints.push(getPriorityMeta(parsed.priority).label);
              if (parsed.course) hints.push(parsed.course);
              if (parsed.tags?.length) hints.push(parsed.tags.map(t => '#' + t).join(' '));
              if (!hints.length) return null;
              return (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">
                  {hints.join(' · ')}
                </span>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

const ListWorkspace = ({
  smartBuckets,
  openGroups,
  toggleGroup,
  handleToggleComplete,
  handleQuickAction,
  openTaskDetail,
  handleDeleteTask,
  handleDuplicate,
  handleInlineAdd,
  selectedTaskIds,
  onSelect,
  selectionMode,
  onSectionDrop,
}) => {
  return (
    <div className="flex flex-col gap-0.5">
      {smartSections.map((section) => {
        const tasks = smartBuckets[section.id] || [];
        return (
          <TaskGroup
            key={section.id}
            sectionId={section.id}
            label={section.label}
            dotColor={section.dotColor}
            labelColor={section.labelColor}
            tasks={tasks}
            isOpen={openGroups[section.id]}
            onToggle={toggleGroup}
            onToggleComplete={handleToggleComplete}
            onQuickAction={handleQuickAction}
            onOpenDetail={openTaskDetail}
            onDeleteTask={handleDeleteTask}
            onDuplicate={handleDuplicate}
            onInlineAdd={handleInlineAdd}
            selectedTaskIds={selectedTaskIds}
            onSelect={onSelect}
            selectionMode={selectionMode}
            onDrop={onSectionDrop}
          />
        );
      })}
    </div>
  );
};

/* Bulk action bar - shown when tasks are selected */
const BulkActionBar = ({ count, onComplete, onDelete, onClear }) => {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-gray-900 dark:bg-gray-800 text-white shadow-2xl shadow-black/20">
      <span className="text-sm font-semibold">{count} selected</span>
      <div className="w-px h-5 bg-gray-600" />
      <button onClick={onComplete} className="flex items-center gap-1.5 text-sm font-medium hover:text-purple-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/10">
        <Check size={14} />
        Complete
      </button>
      <button onClick={onDelete} className="flex items-center gap-1.5 text-sm font-medium hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/10">
        <Trash2 size={14} />
        Delete
      </button>
      <button onClick={onClear} className="ml-1 p-1.5 rounded-lg hover:bg-white/10 transition-colors" aria-label="Clear selection">
        <X size={14} />
      </button>
    </div>
  );
};

const TimelineCard = ({ entries, className = '' }) => {
  if (entries.length === 0) {
    return (
      <section className={`rounded-2xl border border-gray-100 dark:border-slate-700 bg-gradient-to-br from-white via-white to-purple-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-purple-900/20 px-4 py-4 shadow-sm ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Day timeline</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Visual timeline from first to last task</p>
          </div>
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
            <CalendarDays size={18} className="text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No timed tasks today - use the board to plan a slot.</p>
      </section>
    );
  }

  // Calculate timeline bounds
  const firstTime = entries[0].time;
  const lastEntry = entries[entries.length - 1];
  const lastTime = lastEntry.end || new Date(lastEntry.time.getTime() + 60 * 60000); // +1hr default
  const totalMinutes = (lastTime - firstTime) / 60000;
  
  return (
    <section className={`rounded-[28px] border border-gray-100 dark:border-slate-700 bg-gradient-to-br from-white via-white to-purple-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-purple-900/20 px-6 py-6 shadow-[0_15px_45px_rgba(15,23,42,0.05)] dark:shadow-[0_15px_45px_rgba(0,0,0,0.2)] ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Day timeline</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {firstTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} {"\u2192"} {lastTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
        <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
          <CalendarDays size={18} className="text-purple-600 dark:text-purple-400" />
        </div>
      </div>
      
      <div className="mt-4 space-y-3 relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[70px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 via-purple-400 to-purple-300 dark:from-purple-700 dark:via-purple-600 dark:to-purple-700 opacity-60" />
        
        {entries.map((entry, index) => {
          const startTime = entry.time;
          const endTime = entry.end || new Date(startTime.getTime() + 60 * 60000);
          const durationMin = (endTime - startTime) / 60000;
          const offsetMin = (startTime - firstTime) / 60000;
          
          return (
            <div key={entry.id} className="flex items-start gap-3 relative group">
              {/* Time marker */}
              <div className="flex items-center gap-2 shrink-0 z-10">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-14 text-right">
                  {startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
                <div className="w-3 h-3 rounded-full bg-purple-500 ring-4 ring-white dark:ring-slate-800 shadow-lg shadow-purple-500/30 group-hover:scale-125 transition-transform" />
              </div>
              
              {/* Task bar */}
              <div className="flex-1 relative">
                <div 
                  className="rounded-xl border-l-4 bg-gradient-to-r from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 px-4 py-3 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                  style={{ borderLeftColor: entry.courseColor || '#8b5cf6' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{entry.title}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span
                          className="rounded-full px-2 py-0.5 font-medium"
                          style={{ color: entry.courseColor, backgroundColor: `${entry.courseColor}15` }}
                        >
                          {entry.course}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">*</span>
                        <Clock3 size={12} className="inline" />
                        <span>{Math.round(durationMin)} min</span>
                      </div>
                    </div>
                    <div className="text-right text-xs font-medium text-slate-400 dark:text-slate-500">
                      {endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const ViewSwitcher = ({ mode, onChange }) => (
  <div className="flex items-center gap-0.5 border-b border-gray-200 dark:border-gray-800">
    {viewTabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
          mode === tab.id
            ? 'border-purple-600 dark:border-purple-400 text-gray-900 dark:text-white'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        <tab.icon size={15} />
        {tab.label}
      </button>
    ))}
  </div>
);

const BoardColumnToggle = ({ hideLaterColumn, onToggleHideLater }) => (
  <button
    type="button"
    onClick={onToggleHideLater}
    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
      hideLaterColumn
        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    }`}
  >
    {hideLaterColumn ? 'Show Done' : 'Show Later'}
  </button>
);

const TaskBoard = ({
  columns,
  columnTasks,
  draggingTaskId,
  dragOverColumn,
  onDragStart,
  onDragEnd,
  onDrop,
  onColumnDragOver,
  onQuickAdd,
  onOpenDetail,
  hideLaterColumn,
  onToggleHideLater,
}) => {
  const [doneExpanded, setDoneExpanded] = useState(false);
  const prominentColumns = columns.filter(c => c.prominent !== false);
  const doneColumn = columns.find(c => c.id === 'done');
  const doneTasks = columnTasks['done'] || [];
  const doneIsProminent = prominentColumns.some(c => c.id === 'done');

  /* Clean column theme - icon in colored bg + text label (matching overview) */
  const colTheme = {
    todo:  { iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
    doing: { iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500' },
    later: { iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
    done:  { iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  };

  const renderBoardCard = (task, column) => {
    const tColor = task.courseColor || '#7c3aed';
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const dueLabel = dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
    const isOverdue = dueDate && dueDate < new Date() && !task.completed;

    const priorityMeta = {
      urgent: { color: '#ef4444', label: 'Urgent' },
      high:   { color: '#f97316', label: 'High' },
      medium: { color: '#f59e0b', label: 'Medium' },
      low:    { color: '#22c55e', label: 'Low' },
    }[task.priority?.toLowerCase()];

    const typeMeta = {
      exam:       { color: '#ef4444', label: 'Exam' },
      quiz:       { color: '#f97316', label: 'Quiz' },
      assignment: { color: '#3b82f6', label: 'Assignment' },
      project:    { color: '#8b5cf6', label: 'Project' },
      study:      { color: '#22c55e', label: 'Study' },
      lab:        { color: '#06b6d4', label: 'Lab' },
    }[task.type?.toLowerCase()];

    const taskTags = Array.isArray(task.tags) ? task.tags.slice(0, 2) : [];

    return (
      <div
        key={task.id}
        draggable
        onDragStart={() => onDragStart(task.id)}
        onDragEnd={onDragEnd}
        onClick={() => onOpenDetail(task)}
        className="group relative cursor-grab active:cursor-grabbing rounded-xl bg-white dark:bg-[#12121a] border border-gray-200/60 dark:border-white/5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
      >
        {/* Course color accent strip */}
        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full" style={{ background: tColor }} />
        <div className="px-3.5 py-3 pl-4">
          {/* Type + Priority badges row */}
          {(typeMeta || priorityMeta) && (
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {typeMeta && (
                <span className="inline-flex items-center text-[10px] font-bold rounded-md px-1.5 py-0.5" style={{ backgroundColor: `${typeMeta.color}18`, color: typeMeta.color }}>
                  {typeMeta.label}
                </span>
              )}
              {priorityMeta && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-md px-1.5 py-0.5" style={{ backgroundColor: `${priorityMeta.color}18`, color: priorityMeta.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: priorityMeta.color }} />
                  {priorityMeta.label}
                </span>
              )}
            </div>
          )}
          <div className="flex items-start gap-2">
            <GripVertical size={12} className="mt-0.5 shrink-0 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className={`flex-1 text-[13px] font-semibold leading-snug line-clamp-2 ${
              task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'
            }`}>
              {task.title}
            </p>
          </div>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {task.course && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium rounded-md px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 truncate max-w-[110px]">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tColor }} />
                {task.course}
              </span>
            )}
            {dueLabel && (
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-md px-1.5 py-0.5 ${
                isOverdue
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'
              }`}>
                <Calendar size={9} />
                {dueLabel}
              </span>
            )}
            {hasDueTime(task) && dueDate && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold rounded-md px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                <Clock size={9} />
                {dueDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
            {taskTags.map((tag) => (
              <span key={tag} className="inline-flex items-center text-[10px] font-medium rounded-md px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-1 gap-4 ${
        prominentColumns.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
      }`}>
        {prominentColumns.map((column) => {
          const tasks = columnTasks[column.id] || [];
          const isActiveDrop = dragOverColumn === column.id && draggingTaskId;
          const theme = colTheme[column.id] || colTheme.todo;

          return (
            <div
              key={column.id}
              onDragOver={(e) => { e.preventDefault(); if (draggingTaskId) onColumnDragOver(column.id); }}
              onDragEnter={(e) => { e.preventDefault(); if (draggingTaskId) onColumnDragOver(column.id); }}
              onDrop={(e) => { e.preventDefault(); onDrop(column.id); }}
              className={`flex flex-col ${ds.sectionCard} overflow-hidden transition-all ${
                isActiveDrop ? 'ring-2 ring-purple-400/50 dark:ring-purple-500/30' : ''
              }`}
            >
              {/* Clean column header - icon in colored bg + label (like OverviewSectionCard) */}
              <div className="px-4 py-3 flex items-center gap-2.5 border-b border-gray-100 dark:border-white/5">
                <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                <span className="flex-1 text-sm font-bold text-gray-900 dark:text-white">
                  {column.label}
                </span>
                <span className={`text-[11px] font-bold rounded-md px-2 py-0.5 ${theme.iconBg} ${theme.iconColor}`}>
                  {tasks.length}
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-2 px-3 py-3 overflow-y-auto" style={{ maxHeight: '440px' }}>
                {tasks.length === 0 ? (
                  <div className={`flex-1 flex items-center justify-center rounded-xl border border-dashed min-h-[80px] transition-colors ${
                    isActiveDrop
                      ? 'border-purple-300 dark:border-purple-600 text-purple-400'
                      : 'border-gray-200 dark:border-white/10 text-gray-300 dark:text-gray-600'
                  }`}>
                    <p className="text-xs font-medium">
                      {draggingTaskId ? 'Drop here' : 'Empty'}
                    </p>
                  </div>
                ) : (
                  tasks.map((task) => renderBoardCard(task, column))
                )}

                <button
                  type="button"
                  onClick={() => onQuickAdd && onQuickAdd(column.id)}
                  className="flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-auto"
                >
                  <Plus size={12} />Add task
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {doneColumn && !doneIsProminent && (
        <div
          onDragOver={(e) => { e.preventDefault(); if (draggingTaskId) onColumnDragOver('done'); }}
          onDragEnter={(e) => { e.preventDefault(); if (draggingTaskId) onColumnDragOver('done'); }}
          onDrop={(e) => { e.preventDefault(); onDrop('done'); }}
          className={`${ds.sectionCard} overflow-hidden transition-colors ${
            dragOverColumn === 'done' && draggingTaskId ? 'ring-2 ring-emerald-400/50' : ''
          }`}
        >
          <button
            type="button"
            onClick={() => setDoneExpanded(!doneExpanded)}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-left border-b border-gray-100 dark:border-white/5"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="flex-1 text-sm font-bold text-gray-900 dark:text-white">
              Completed
            </span>
            <span className="text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md px-2 py-0.5">
              {doneTasks.length}
            </span>
            <ChevronDown
              size={14}
              className={`shrink-0 text-gray-400 transition-transform duration-200 ${doneExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {doneExpanded && (
            <div className="px-3 pb-3 pt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {doneTasks.length === 0 ? (
                <p className="col-span-full text-xs text-gray-400 text-center py-3">
                  {draggingTaskId ? 'Drop here to complete' : 'No completed tasks'}
                </p>
              ) : (
                doneTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => onDragStart(task.id)}
                    onDragEnd={onDragEnd}
                    onClick={() => onOpenDetail(task)}
                    className="cursor-grab rounded-xl bg-gray-50 dark:bg-[#0a0a0f] px-3 py-2.5 transition hover:shadow-sm hover:-translate-y-px border border-gray-200/60 dark:border-white/5"
                  >
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 line-through line-clamp-2">{task.title}</p>
                    {task.course && (
                      <p className="text-[10px] mt-1 text-gray-400">{task.course}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {!doneExpanded && doneTasks.length > 0 && (
            <p className="px-4 pb-3 pt-2 text-xs text-gray-400 dark:text-gray-500">
              {draggingTaskId ? 'Drop here to complete' : `${doneTasks.length} task${doneTasks.length === 1 ? '' : 's'} completed`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};


const WeekPlanner = ({
  rangeLabel,
  weekDays,
  upcoming,
  later,
  onOpenDetail,
  onToggleComplete,
  onQuickAdd,
}) => {
  const typeColor = (type) => ({
    exam: '#ef4444', quiz: '#f97316', assignment: '#3b82f6',
    project: '#8b5cf6', study: '#22c55e',
  })[type?.toLowerCase()] || '#64748b';

  const renderWeekTaskCard = (task) => {
    const tColor = task.courseColor || typeColor(task.type);
    const dueTime = task.dueDate
      ? (() => {
          const d = new Date(task.dueDate);
          const t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          return t === '12:00 AM' ? null : t;
        })()
      : null;

    return (
      <div
        key={task.id}
        onClick={() => onOpenDetail?.(task)}
        className={`group relative cursor-pointer rounded-xl border transition-all duration-200 hover:shadow-sm ${
          task.completed
            ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 opacity-60'
            : 'bg-white dark:bg-[#0a0a0f] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
        }`}
      >
        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full" style={{ background: tColor }} />
        <div className="px-3 py-2.5 pl-3.5 flex items-start gap-2.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleComplete?.(task.id); }}
            className={`mt-0.5 flex-shrink-0 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 transition-all ${
              task.completed
                ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-500'
            }`}
          >
            {task.completed && <Check size={9} strokeWidth={3} />}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-[13px] font-semibold leading-snug line-clamp-2 ${
              task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
            }`}>
              {task.title}
            </p>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              {dueTime && (
                <span className="flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-gray-400 shrink-0">
                  <Clock size={9} />{dueTime}
                </span>
              )}
              {task.course && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700/50 text-[10px] font-medium text-gray-600 dark:text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: tColor }} />
                  {task.course}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const totalWeekTasks = weekDays.reduce((n, d) => n + d.tasks.length, 0);
  const totalCompleted = weekDays.reduce((n, d) => n + d.tasks.filter(t => t.completed).length, 0);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{rangeLabel}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {totalCompleted} of {totalWeekTasks} completed
          </p>
        </div>
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">
          {upcoming.length} upcoming
        </span>
      </div>

      {/* Week strip (matches overview This Week component) */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {weekDays.map((day, dayIdx) => {
          const completedCount = day.tasks.filter(t => t.completed).length;
          const totalCount = day.tasks.length;

          return (
            <div
              key={day.key}
              className={`min-w-[200px] flex-1 rounded-xl flex flex-col overflow-hidden ${
                day.isToday
                  ? 'border-2 border-purple-600 dark:border-purple-400 bg-white dark:bg-[#111113]'
                  : `border ${palette.border.default} ${palette.surface.card}`
              }`}
            >
              {/* Day header */}
              <div className={`px-4 py-3 ${
                day.isToday
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-b border-purple-100 dark:border-purple-800/50'
                  : 'bg-gray-50 dark:bg-[#18181b] border-b border-gray-100 dark:border-white/5'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        day.isToday ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {day.weekday}
                      </span>
                      <span className={`text-lg font-extrabold leading-none ${
                        day.isToday ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'
                      }`}>
                        {day.monthDay.split(' ')[1] || day.monthDay}
                      </span>
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${day.isToday ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-300'}`}>
                        {totalCount === 0 ? 'No tasks' : `${totalCount} task${totalCount !== 1 ? 's' : ''}`}
                      </p>
                      {totalCount > 0 && (
                        <p className={`text-[10px] ${day.isToday ? 'text-purple-500 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {completedCount}/{totalCount} done
                        </p>
                      )}
                    </div>
                  </div>
                  {day.isToday && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white bg-purple-600 dark:bg-purple-500 px-2 py-0.5 rounded-md">
                      Today
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto" style={{ maxHeight: '340px' }}>
                {day.tasks.length > 0 ? (
                  day.tasks.map((task) => renderWeekTaskCard(task))
                ) : (
                  <button
                    type="button"
                    onClick={() => onQuickAdd && onQuickAdd()}
                    className="flex-1 flex flex-col items-center justify-center gap-1 text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 transition-colors min-h-[70px]"
                  >
                    <Plus size={14} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium">Add</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const LecturesTab = ({ groups = [], syncing = false }) => {
  const [expandedModules, setExpandedModules] = useState({});

  if (!groups.length) {
    return (
      <section className={`${ds.card} px-6 py-14 text-center`}>
        <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
          {syncing ? 'Syncing timetable sessions\u2026' : 'No sessions found'}
        </p>
        {!syncing && (
          <p className="text-[12px] text-gray-400 dark:text-gray-500">Connect your timetable or refresh to pull sessions.</p>
        )}
      </section>
    );
  }

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === now.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getDayLabel = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === now.toDateString()) return 'today';
    if (d.toDateString() === tomorrow.toDateString()) return 'tomorrow';
    return null;
  };

  const totalSessions = groups.reduce((acc, g) => acc + g.sessions.length, 0);
  const todayCount = groups.reduce((acc, g) => acc + g.sessions.filter(s => getDayLabel(s.start) === 'today').length, 0);

  return (
    <section className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/[0.06]">
            <BookOpen size={14} className="text-gray-500 dark:text-gray-400" />
            <span className="text-[13px] font-bold text-gray-700 dark:text-gray-200">{groups.length}</span>
            <span className="text-[12px] text-gray-500 dark:text-gray-400">module{groups.length === 1 ? '' : 's'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/[0.06]">
            <CalendarDays size={14} className="text-gray-500 dark:text-gray-400" />
            <span className="text-[13px] font-bold text-gray-700 dark:text-gray-200">{totalSessions}</span>
            <span className="text-[12px] text-gray-500 dark:text-gray-400">session{totalSessions === 1 ? '' : 's'}</span>
          </div>
          {todayCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-400">{todayCount} today</span>
            </div>
          )}
        </div>
        {syncing && (
          <div className="flex items-center gap-2 text-[12px] text-gray-400 animate-sync-pulse">
            <Loader2 size={13} className="animate-spin" /> Syncing
          </div>
        )}
      </div>

      {/* Module Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const moduleKey = group.courseId || group.courseName;
          const isExpanded = expandedModules[moduleKey];
          const maxShown = isExpanded ? group.sessions.length : 4;
          const upcomingSessions = group.sessions.slice(0, maxShown);
          const nextSession = group.nextSession || upcomingSessions[0] || null;
          const hasToday = group.sessions.some(s => getDayLabel(s.start) === 'today');
          const color = group.color || '#6366f1';

          return (
            <div
              key={moduleKey}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                hasToday
                  ? 'border-emerald-200/80 dark:border-emerald-800/40 bg-white dark:bg-[#111113] shadow-sm shadow-emerald-100/50 dark:shadow-emerald-900/10'
                  : 'border-gray-200/70 dark:border-white/[0.06] bg-white dark:bg-[#111113]'
              }`}
            >
              {/* Color accent bar */}
              <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

              {/* Module Header */}
              <div className="px-4 py-3 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  <BookOpen className="w-[18px] h-[18px] text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100 truncate">
                    {decodeEscapedUnicode(group.courseName)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {nextSession ? (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                        Next: {formatDate(nextSession.start)} {'\u00b7'} {formatTime(nextSession.start)}
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">No upcoming session</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    {group.sessions.length}
                  </span>
                </div>
              </div>

              {/* Sessions */}
              <div className="border-t border-gray-100 dark:border-white/[0.04]">
                {upcomingSessions.map((session, idx) => {
                  const dayTag = getDayLabel(session.start);
                  return (
                    <div
                      key={session.id || idx}
                      className={`px-4 py-2.5 flex items-center gap-3 transition-colors ${
                        dayTag === 'today'
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/10'
                          : 'hover:bg-gray-50/80 dark:hover:bg-white/[0.02]'
                      } ${idx > 0 ? 'border-t border-gray-50 dark:border-white/[0.03]' : ''}`}
                    >
                      <div className="flex flex-col items-center w-9 shrink-0">
                        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">
                          {new Date(session.start).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className={`text-[15px] font-bold ${
                          dayTag === 'today' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-200'
                        }`}>
                          {new Date(session.start).getDate()}
                        </span>
                      </div>
                      <div className="w-px h-8 rounded-full" style={{ backgroundColor: `${color}40` }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">
                          {decodeEscapedUnicode(session.title || 'Session')}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock3 size={10} className="text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {formatTime(session.start)} {'\u2013'} {formatTime(session.end)}
                          </span>
                          {session.location && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">{'\u00b7'}</span>
                              <MapPin size={10} className="text-slate-400 dark:text-slate-500 shrink-0" />
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{decodeEscapedUnicode(session.location)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {dayTag && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          dayTag === 'today'
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30'
                            : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        }`}>
                          {dayTag === 'today' ? 'Today' : 'Tomorrow'}
                        </span>
                      )}
                    </div>
                  );
                })}
                {group.sessions.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setExpandedModules(prev => ({ ...prev, [moduleKey]: !prev[moduleKey] }))}
                    className="w-full px-4 py-2 text-center hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-t border-gray-50 dark:border-white/[0.03]"
                  >
                    <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                      {isExpanded ? 'Show less' : `+${group.sessions.length - 4} more sessions`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const InsightsPanel = ({ insightSummary, widgetFactory, order }) => {
  if (!insightSummary) return null;
  const widgets = order
    .map((widgetId, index) => {
      const renderWidget = widgetFactory[widgetId];
      if (!renderWidget) return null;
      const isLastOddWidget = order.length === 3 && index === 2;
      return (
        <div key={widgetId} className={isLastOddWidget ? 'lg:col-span-2' : ''}>
          {renderWidget()}
        </div>
      );
    })
    .filter(Boolean);
  return (
    <section className={ds.sectionCard}>
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-white/5">
        <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Lightbulb size={14} className="text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Quick Insights</h3>
      </div>
      
      <div className="p-4">
        {/* Compact stat row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Next Due */}
          <div className="rounded-xl bg-gray-50 dark:bg-[#0a0a0f] border border-gray-200/60 dark:border-white/5 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <CalendarDays size={12} className="text-purple-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">Next Due</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{insightSummary.nextTask?.title || 'No deadlines'}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{insightSummary.nextTask?.timeLabel || '-'}</p>
          </div>
          
          {/* Overdue */}
          <div className="rounded-xl bg-gray-50 dark:bg-[#0a0a0f] border border-gray-200/60 dark:border-white/5 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertTriangle size={12} className="text-red-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">Overdue</span>
            </div>
            <p className={`text-xl font-bold ${insightSummary.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{insightSummary.overdue}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{insightSummary.overdue ? 'Needs attention' : 'All clear'}</p>
          </div>
          
          {/* Pending */}
          <div className="rounded-xl bg-gray-50 dark:bg-[#0a0a0f] border border-gray-200/60 dark:border-white/5 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ClipboardList size={12} className="text-amber-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">Pending</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{insightSummary.pendingTasks}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{insightSummary.pendingTasks ? 'Not started' : 'All clear'}</p>
        </div>
      </div>
      
      {widgets.length ? (
        <details className="group text-sm" open>
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-3 select-none">
            <ChevronRight size={14} className="transition duration-200 group-open:rotate-90" />
            More Insights
          </summary>
          <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:items-start lg:gap-3">
            {widgets}
          </div>
        </details>
      ) : null}
      </div>
    </section>
  );
};
export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const tasksRef = useRef([]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  const hideTimersRef = useRef({});
  const [recentlyCompleted, setRecentlyCompleted] = useState([]); // { id, title, ts }
  const HIDE_GRACE_MS = 8 * 1000;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [composerValue, setComposerValue] = useState('');
  const [composerError, setComposerError] = useState(null);
  const [openGroups, setOpenGroups] = useState(() =>
    smartSections.reduce((acc, section) => {
      acc[section.id] = Boolean(section.expanded);
      return acc;
    }, {})
  );
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [hideLaterColumn, setHideLaterColumn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tasks-board-hide-later') === 'true';
    }
    return false;
  });
  const composerInputRef = useRef(null);
  const { setOpen, setClose } = useModal();
  const toast = useToast();
  const actionableTasks = useMemo(() => tasks.filter((task) => !isLectureTask(task) && !task.completed), [tasks]);
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('due'); // 'due' | 'priority' | 'recent'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Filtered tasks - applies search + type filter
  const filteredTasks = useMemo(() => {
    let result = actionableTasks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.course?.toLowerCase().includes(q) ||
        t.type?.toLowerCase().includes(q)
      );
    }
    if (activeFilter !== 'all') {
      result = result.filter(t =>
        t.type === activeFilter ||
        (activeFilter === 'study' && (t.type === 'study-session' || t.type === 'study'))
      );
    }
    // Sort
    const directionMultiplier = sortDirection === 'desc' ? -1 : 1;
    if (sortBy === 'priority') {
      result = [...result].sort((a, b) => {
        const weightDelta = getPriorityMeta(a.priority).weight - getPriorityMeta(b.priority).weight;
        if (weightDelta !== 0) return weightDelta * directionMultiplier;
        return sortByDueDate(a, b) * directionMultiplier;
      });
    } else if (sortBy === 'recent') {
      result = [...result].sort((a, b) => (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)) * directionMultiplier);
    } else {
      result = [...result].sort((a, b) => sortByDueDate(a, b) * directionMultiplier);
    }
    return result;
  }, [actionableTasks, searchQuery, activeFilter, sortBy, sortDirection]);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const [modules, setModules] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const attendanceFetchedRef = useRef(new Set());
  const hasLoadedTasksRef = useRef(false);
  const pendingPersistsRef = useRef(0);
  const lastPersistTimeRef = useRef(0);
  const [dataError, setDataError] = useState(null);
  const [usingSampleTasks, setUsingSampleTasks] = useState(false);

  useEffect(() => {
    if (!composerError) return;
    if (composerValue.trim().length) {
      setComposerError(null);
    }
  }, [composerError, composerValue]);

  const fallbackNormalizedTasks = useMemo(() => fallbackTasks.map(normalizeTask), []);

  const loadUnifiedData = useCallback(async () => {
    // Skip background reloads while persists are in-flight or recently completed
    const firstLoad = !hasLoadedTasksRef.current;
    if (!firstLoad && (pendingPersistsRef.current > 0 || Date.now() - lastPersistTimeRef.current < 3000)) {
      return;
    }
    try {
      if (firstLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setDataError(null);
      const [taskPayload, eventsPayload, coursesPayload, semesterPayload] = await Promise.all([
        fetch('/api/tasks?view=planner', { credentials: 'same-origin' })
          .then((res) => {
            if (!res.ok) {
              console.warn(`Tasks API returned ${res.status}: ${res.statusText}`);
              return null; // Treat as no data instead of error
            }
            return res.json();
          })
          .catch((err) => {
            console.warn('Tasks API not available, using fallback data:', err.message);
            return null; // Gracefully handle API unavailability
          }),
        fetchWithCache('/api/events?includeArchived=true', { credentials: 'same-origin' }, 120000).catch((err) => {
          console.error('Failed to load events', err);
          return null;
        }),
        fetchWithCache('/api/courses', { credentials: 'same-origin' }, 120000).catch((err) => {
          console.error('Failed to load courses', err);
          return null;
        }),
        fetchWithCache('/api/semester-settings', { credentials: 'same-origin' }, 120000).catch((err) => {
          console.error('Failed to load semester settings', err);
          return null;
        }),
      ]);

      const rawTasks = Array.isArray(taskPayload?.tasks)
        ? taskPayload.tasks
        : Array.isArray(taskPayload?.events)
        ? taskPayload.events
        : Array.isArray(taskPayload)
        ? taskPayload
        : [];
      console.log('[tasks page] rawTasks from API:', rawTasks.length, rawTasks.map(t => ({ id: t?.id, title: t?.title })));
      const normalizedTasks = rawTasks.map(normalizeTask);

      const eventList = Array.isArray(eventsPayload?.events)
        ? eventsPayload.events
        : Array.isArray(eventsPayload?.data)
        ? eventsPayload.data
        : Array.isArray(eventsPayload)
        ? eventsPayload
        : [];
      const normalizedEvents = eventList.map(normalizeEventRecord);
      const supplementalTasks = normalizedEvents
        .filter((event) => !event.archived && !event.completed && !isLectureLike(event))
        .map((event) => eventRecordToTask(event))
        .filter(Boolean);
      const mergedTasks = (() => {
        if (!supplementalTasks.length) return normalizedTasks;
        const seen = new Set();
        const combined = [];
        normalizedTasks.forEach((task) => {
          if (!task || seen.has(task.id)) return;
          seen.add(task.id);
          combined.push(task);
        });
        supplementalTasks.forEach((task) => {
          if (!task || seen.has(task.id)) return;
          seen.add(task.id);
          combined.push(task);
        });
        return combined;
      })();

      if (mergedTasks.length) {
        hasLoadedTasksRef.current = true;
        setUsingSampleTasks(false);
        setTasks(mergedTasks);
        // Initialize notifications for tasks with reminders
        if (firstLoad) {
          initializeNotifications(mergedTasks);
        }
      } else if (taskPayload !== null) {
        // API returned successfully but with 0 tasks - this is legitimate empty state
        hasLoadedTasksRef.current = true;
        setUsingSampleTasks(false);
        setTasks([]);
      } else if (!hasLoadedTasksRef.current) {
        // API failed - show fallback sample tasks
        setTasks(fallbackNormalizedTasks);
        setUsingSampleTasks(true);
        hasLoadedTasksRef.current = true;
        setDataError(TASK_FALLBACK_MESSAGE);
      }

      const upcomingEvents = normalizedEvents.filter((event) => !event?.archived && !event?.completed);
      const archivedEvents = normalizedEvents.filter((event) => event?.archived || event?.completed);
      setScheduleEvents(upcomingEvents);
      setHistoryEvents(archivedEvents);

      const coursesList = Array.isArray(coursesPayload?.courses)
        ? coursesPayload.courses
        : Array.isArray(coursesPayload?.data)
        ? coursesPayload.data
        : Array.isArray(coursesPayload)
        ? coursesPayload
        : [];
      setModules(coursesList);

      const semesterList = Array.isArray(semesterPayload?.settings)
        ? semesterPayload.settings
        : Array.isArray(semesterPayload?.semesters)
        ? semesterPayload.semesters
        : [];
      setActiveSemester(semesterList.find((semester) => semester?.is_active) || semesterList[0] || null);
    } catch (error) {
      console.error('Failed to load unified task data', error);
      setDataError(error.message || 'Failed to load planner data');
      if (!hasLoadedTasksRef.current) {
        setTasks(fallbackNormalizedTasks);
        setUsingSampleTasks(true);
        hasLoadedTasksRef.current = true;
      }
    } finally {
      if (firstLoad) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, [fallbackNormalizedTasks]);

  useEffect(() => {
    loadUnifiedData();
  }, [loadUnifiedData]);

  useEffect(() => {
    let intervalId;
    if (typeof document !== 'undefined') {
      const handleVisibility = () => {
        if (!document.hidden) {
          loadUnifiedData();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      intervalId = window.setInterval(() => {
        loadUnifiedData();
      }, 60000);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        if (intervalId) window.clearInterval(intervalId);
      };
    }
    return undefined;
  }, [loadUnifiedData]);

  useEffect(() => {
    if (!scheduleEvents.length) return;
    const lectureCourseIds = Array.from(
      new Set(
        scheduleEvents
          .filter((event) => isLectureLike(event))
          .map((event) => event.course_id || event.courseId || event.meta?.courseId || event.courses?.id || null)
          .filter(Boolean)
          .map((id) => String(id))
      )
    );
    const pending = lectureCourseIds.filter((id) => !attendanceFetchedRef.current.has(id));
    if (!pending.length) return;
    let cancelled = false;
    (async () => {
      const responses = await Promise.allSettled(
        pending.map((courseId) =>
          fetch(`/api/attendance?courseId=${encodeURIComponent(courseId)}`, { credentials: 'same-origin' })
            .then((res) => {
              if (!res.ok) throw new Error(`Attendance fetch failed for ${courseId}`);
              return res.json();
            })
            .catch((err) => {
              console.error('Failed to fetch attendance', courseId, err);
              return null;
            })
        )
      );
      if (cancelled) return;
      setAttendanceMap((prev) => {
        const next = { ...prev };
        responses.forEach((result, index) => {
          const courseId = pending[index];
          if (result.status === 'fulfilled' && result.value?.sessions) {
            attendanceFetchedRef.current.add(courseId);
            next[courseId] = result.value;
          }
        });
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [scheduleEvents]);

  const updateTaskFromApi = useCallback((taskPayload) => {
    if (!taskPayload) return;
    const normalized = normalizeTask(taskPayload);
    setTasks((prev) => {
      const exists = prev.some((task) => task.id === normalized.id);
      if (exists) {
        return prev.map((task) => (task.id === normalized.id ? normalized : task));
      }
      return [normalized, ...prev];
    });
  }, []);

  const optimisticTaskUpdate = useCallback((taskId, updates) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? mergeTaskUpdates(task, updates) : task)));
  }, []);

  const persistTaskUpdate = useCallback(
    async (taskId, updates) => {
      pendingPersistsRef.current += 1;
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
          credentials: 'same-origin',
        });
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Task update failed:', res.status, errorText);
          return;
        }
        // Don't update from API response - trust the optimistic update
        // The server confirms the change, no need to overwrite the UI
      } catch (error) {
        console.error('Failed to persist task change', error);
        // Only reload on error to revert the optimistic update
        try {
          loadUnifiedData();
        } catch (reloadError) {
          console.error('Failed to reload data', reloadError);
        }
      } finally {
        pendingPersistsRef.current -= 1;
        lastPersistTimeRef.current = Date.now();
      }
    },
    [loadUnifiedData]
  );

  const detectedDate = useMemo(() => parseNaturalLanguageDate(composerValue), [composerValue]);

  const buckets = useMemo(() => buildListBuckets(filteredTasks), [filteredTasks]);
  const smartBuckets = useMemo(() => buildSmartBuckets(filteredTasks, sortBy, sortDirection), [filteredTasks, sortBy, sortDirection]);
  const metrics = useMemo(() => computeMetrics(actionableTasks), [actionableTasks]);
  const suggestions = useMemo(() => buildSuggestions(metrics, buckets), [metrics, buckets]);
  const highlight = useMemo(() => highlightNaturalLanguage(composerValue, detectedDate?.matched), [composerValue, detectedDate]);
  const sectionTasks = useMemo(
    () => ({
      today: buckets.today,
      next_up: buckets.next_up,
      later: buckets.later,
    }),
    [buckets]
  );
  const smartMessage = useMemo(() => {
    if (suggestions.length) return suggestions[0];
    if (!sectionTasks.today.length && metrics.overdue === 0) return 'Drop something into TODAY to keep momentum.';
    if (sectionTasks.today.length > 5) return 'Trim TODAY to your top three wins for sharper focus.';
    return 'Keep the flow going. Pick one task and dive in for 25 minutes.';
  }, [metrics.overdue, sectionTasks.today.length, suggestions]);

  const nextDueTask = useMemo(() => {
    return actionableTasks
      .filter((task) => task.dueDate && !task.completed)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  }, [actionableTasks]);

  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t && t.completed).sort(sortByDueDate);
  }, [tasks]);

  const taskTimelineEntries = useMemo(() => buildTimelineEntries(actionableTasks), [actionableTasks]);
  const scheduleTimelineEntries = useMemo(() => buildScheduleTimeline(scheduleEvents), [scheduleEvents]);
  const timelineEntries = useMemo(
    () => mergeTimelineEntries(taskTimelineEntries, scheduleTimelineEntries),
    [scheduleTimelineEntries, taskTimelineEntries]
  );
  const lectureGroups = useMemo(() => buildLectureGroups(scheduleEvents, modules, attendanceMap), [scheduleEvents, modules, attendanceMap]);
  const reminderData = useMemo(() => {
    const nextGroup = lectureGroups.find((group) => group.nextSession);
    if (!nextGroup || !nextGroup.nextSession) return rightRailReminder;
    const nextSession = nextGroup.nextSession;
    return {
      title: nextSession.title,
      subtitle: nextGroup.courseCode ? `${nextGroup.courseCode} · ${nextGroup.courseName}` : nextGroup.courseName,
      time: `${formatShortDate(nextSession.start)} · ${formatTimeRange(nextSession.start, nextSession.end)}`,
      location: nextSession.location || 'See timetable',
      action: nextSession.attendanceStatus ? `Logged ${nextSession.attendanceStatus}` : 'Log attendance',
      course: nextGroup.courseCode || nextGroup.courseName,
      attendanceStatus: nextSession.attendanceStatus || null,
    };
  }, [lectureGroups]);
  const trackerStats = useMemo(() => computeFocusStats(historyEvents), [historyEvents]);
  const completedThisWeek = useMemo(() => {
    if (!historyEvents.length) return 0;
    const now = new Date();
    const weekAgo = addDays(now, -7);
    return historyEvents.filter((event) => {
      const completedAt = event.completed_at || event.updated_at || event.completedAt || event.date || event.startDate;
      if (!completedAt) return false;
      const timestamp = new Date(completedAt);
      if (Number.isNaN(timestamp.getTime())) return false;
      return timestamp >= weekAgo;
    }).length;
  }, [historyEvents]);
  const averageAttendance = useMemo(() => {
    if (!lectureGroups.length) return null;
    const total = lectureGroups.reduce((sum, group) => sum + (group.attendanceRate || 0), 0);
    return Math.round(total / lectureGroups.length);
  }, [lectureGroups]);
  const headerStats = useMemo(() => {
    const totalActive = actionableTasks.length || 0;
    const nextLectureGroup = lectureGroups.find((group) => group.nextSession);
    const nextLecture = nextLectureGroup?.nextSession || null;
    const nextLectureLabel = nextLecture
      ? `${formatShortDate(nextLecture.start)} · ${nextLecture.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : 'No session scheduled';
    const attendanceProgress = nextLectureGroup?.attendanceRate ?? averageAttendance ?? 0;
    const dayPlanCount = sectionTasks.today.length;
    return [
      {
        id: 'overdue',
        label: 'Overdue Tasks',
        value: metrics.overdue,
        icon: AlarmClock,
        color: 'text-rose-600',
        subtext: totalActive ? `${totalActive} active` : 'Inbox zero',
        meta: metrics.overdue ? 'Tackle these first' : 'You are clear',
        progress: totalActive ? (metrics.overdue / totalActive) * 100 : 0,
      },
      {
        id: 'focus-today',
        label: 'Today Focus',
        value: metrics.today,
        icon: Sun,
        color: 'text-purple-600',
        subtext: metrics.today ? 'Scheduled today' : 'Plan a slot',
        meta: `${dayPlanCount} task${dayPlanCount === 1 ? '' : 's'} in My Day`,
        progress: totalActive ? (metrics.today / totalActive) * 100 : metrics.today ? 100 : 0,
      },
      {
        id: 'next-lecture',
        label: 'Next Session',
        value: nextLecture ? nextLecture.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '-',
        icon: BookOpen,
        color: 'text-purple-600',
        subtext: nextLectureLabel,
        meta: lectureGroups.length ? `${lectureGroups.length} tracked modules` : 'No modules synced',
        progress: attendanceProgress,
      },
      {
        id: 'completed-week',
        label: 'Completed (7d)',
        value: completedThisWeek,
        icon: Check,
        color: 'text-slate-900',
        subtext: 'History sync',
        meta: historyEvents.length ? `${historyEvents.length} total archived` : 'No history yet',
        progress: totalActive ? Math.min(100, (completedThisWeek / Math.max(1, totalActive)) * 100) : 0,
      },
    ];
  }, [actionableTasks.length, averageAttendance, completedThisWeek, historyEvents.length, lectureGroups, metrics.overdue, metrics.today, sectionTasks]);

  const columnTasks = useMemo(() => {
    return boardColumns.reduce((acc, column) => {
      acc[column.id] = filteredTasks.filter((task) => {
        const status = normalizeStatus(task.status, task.completed);
        if (column.id === 'done') return status === 'done' || task.completed;
        if (task.completed) return false;
        return status === column.id;
      });
      return acc;
    }, {});
  }, [filteredTasks]);

  const weekAnchorDate = useMemo(() => getStartOfDay(new Date()), []);
  const currentWeekEnd = useMemo(() => addDays(weekAnchorDate, 7), [weekAnchorDate]);
  const upcomingRangeEnd = useMemo(() => addDays(currentWeekEnd, 7), [currentWeekEnd]);

  const weekTasksByDate = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      const due = toDateSafe(task.dueDate);
      if (!due) return acc;
      const key = toYMDLocal(due);
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {});
  }, [filteredTasks]);

  const weekDays = useMemo(() => {
    const today = getStartOfDay(new Date());
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekAnchorDate, index);
      const key = toYMDLocal(date) || `${index}`;
      const tasksForDay = weekTasksByDate[key] ? [...weekTasksByDate[key]].sort(sortByDueDate) : [];
      return {
        key,
        date,
        weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
        monthDay: formatMonthDay(date),
        isToday: isSameDay(date, today),
        tasks: tasksForDay,
      };
    });
  }, [weekAnchorDate, weekTasksByDate]);

  const weekUpcomingTasks = useMemo(() => {
    return filteredTasks
      .filter((task) => {
        const due = toDateSafe(task.dueDate);
        if (!due) return false;
        return due >= currentWeekEnd && due < upcomingRangeEnd;
      })
      .sort(sortByDueDate);
  }, [filteredTasks, currentWeekEnd, upcomingRangeEnd]);

  const weekLaterTasks = useMemo(() => {
    return filteredTasks
      .filter((task) => {
        const due = toDateSafe(task.dueDate);
        if (!due) return true;
        return due >= upcomingRangeEnd;
      })
      .sort(sortByDueDate);
  }, [filteredTasks, upcomingRangeEnd]);

  const weekRangeLabel = useMemo(() => formatWeekRangeLabel(weekAnchorDate, currentWeekEnd), [currentWeekEnd, weekAnchorDate]);

  const insightSummary = useMemo(() => {
    const planCount = sectionTasks.today.length;
    const pendingCount = actionableTasks.filter(t => t.status === 'todo' && !t.completed).length;
    const nextTaskSummary = nextDueTask
      ? {
          title: nextDueTask.title,
          timeLabel: new Date(nextDueTask.dueDate).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }),
        }
      : null;
    const statusLine = metrics.overdue
      ? `${metrics.overdue} overdue · next due ${nextTaskSummary ? nextTaskSummary.timeLabel : 'TBD'}`
      : nextTaskSummary
      ? `Next due ${nextTaskSummary.timeLabel}`
      : 'No deadlines today';
    return {
      message: smartMessage,
      statusLine,
      nextTask: nextTaskSummary,
      overdue: metrics.overdue,
      pendingTasks: pendingCount,
    };
  }, [actionableTasks, metrics.overdue, nextDueTask, sectionTasks.today.length, smartMessage]);

  const widgetFactory = useMemo(
    () => ({
      timeline: () => <TimelineCard entries={timelineEntries} />,
      reminder: () => <ReminderWidget tasks={actionableTasks} />,
      time: () => <TimeTrackerWidget stats={trackerStats} />,
    }),
    [actionableTasks, timelineEntries, trackerStats]
  );

  const toggleGroup = useCallback((groupId) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  const toggleTaskSelection = useCallback((taskId) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const bulkComplete = useCallback(async () => {
    const ids = Array.from(selectedTaskIds);
    ids.forEach(id => {
      optimisticTaskUpdate(id, { completed: true });
      persistTaskUpdate(id, { completed: true });
    });
    setSelectedTaskIds(new Set());
  }, [selectedTaskIds, optimisticTaskUpdate, persistTaskUpdate]);

  const handleSectionDrop = useCallback((taskId, sectionId) => {
    if (!taskId) return;
    const dueDateMap = {
      today: new Date().toISOString(),
      tomorrow: new Date(Date.now() + 86400000).toISOString(),
      this_week: new Date(Date.now() + 3 * 86400000).toISOString(),
      later: new Date(Date.now() + 14 * 86400000).toISOString(),
    };
    const updates = {};
    if (dueDateMap[sectionId] !== undefined) {
      updates.dueDate = dueDateMap[sectionId];
    }
    if (sectionId === 'today') {
      updates.addedToMyDay = true;
      updates.myDay = true;
    }
    if (Object.keys(updates).length) {
      optimisticTaskUpdate(taskId, updates);
      persistTaskUpdate(taskId, updates);
    }
  }, [optimisticTaskUpdate, persistTaskUpdate]);

  const handleToggleComplete = useCallback(
    (taskId) => {
      const current = tasksRef.current.find((task) => task.id === taskId);
      const nextCompleted = current ? !current.completed : true;
      optimisticTaskUpdate(taskId, { completed: nextCompleted });
      persistTaskUpdate(taskId, { completed: nextCompleted });
      // If marking completed, show recently completed with undo
      if (nextCompleted) {
        const title = current?.title || 'Task';
        setRecentlyCompleted(prev => {
          if (prev.some(p => String(p.id) === String(taskId))) return prev;
          return [{ id: String(taskId), title, ts: Date.now() }, ...prev];
        });
        try {
          if (hideTimersRef && hideTimersRef.current) {
            if (hideTimersRef.current[String(taskId)]) clearTimeout(hideTimersRef.current[String(taskId)]);
            hideTimersRef.current[String(taskId)] = setTimeout(() => {
              // Remove the recently-completed pill after the grace period.
              setRecentlyCompleted(prev => prev.filter(p => String(p.id) !== String(taskId)));
              // Do not toggle any hiddenCompleted state here - completed visibility is determined by the task's `completed` flag.
            }, HIDE_GRACE_MS);
          }
        } catch (e) {}
      } else {
        // If unchecking, ensure any pending recentlyCompleted entries are cleared
        try { if (hideTimersRef && hideTimersRef.current && hideTimersRef.current[String(taskId)]) { clearTimeout(hideTimersRef.current[String(taskId)]); delete hideTimersRef.current[String(taskId)]; } } catch (e) {}
        setRecentlyCompleted(prev => prev.filter(p => String(p.id) !== String(taskId)));
      }
    },
    [optimisticTaskUpdate, persistTaskUpdate]
  );

  const undoRecentlyCompleted = useCallback((taskId) => {
    try { if (hideTimersRef && hideTimersRef.current && hideTimersRef.current[String(taskId)]) { clearTimeout(hideTimersRef.current[String(taskId)]); delete hideTimersRef.current[String(taskId)]; } } catch (e) {}
    // Optimistically uncomplete and persist
    optimisticTaskUpdate(taskId, { completed: false });
    persistTaskUpdate(taskId, { completed: false });
    setRecentlyCompleted(prev => prev.filter(p => String(p.id) !== String(taskId)));
  }, [optimisticTaskUpdate, persistTaskUpdate]);

  const handleQuickAction = useCallback(
    (taskId, actionId, value) => {
      const task = tasksRef.current.find((item) => item.id === taskId);
      if (!task) return;
      const now = new Date();
      let updates = {};
      if (actionId === 'my-day') {
        const nextValue = !(task.addedToMyDay || task.myDay);
        updates = { addedToMyDay: nextValue, myDay: nextValue };
      } else if (actionId === 'tomorrow') {
        const previous = task.meta?.snoozedFrom;
        if (previous) {
          updates = { dueDate: previous, meta: { ...task.meta, snoozedFrom: null } };
        } else {
          const base = toDateSafe(task.dueDate) || now;
          const newDue = addDays(base, 1).toISOString();
          updates = { dueDate: newDue, meta: { ...task.meta, snoozedFrom: task.dueDate || null } };
        }
      } else if (actionId === 'week') {
        updates = { dueDate: addDays(now, 3).toISOString() };
      } else if (actionId === 'next-week') {
        updates = { dueDate: addDays(now, 7).toISOString() };
      } else if (actionId === 'set-date') {
        if (value) {
          const d = new Date(value);
          const hasTime = Boolean(d.getHours() || d.getMinutes());
          const timeStr = hasTime ? `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` : null;
          updates = { dueDate: value, time: timeStr, dueTime: timeStr, meta: { ...(task.meta || {}), hasTime } };
        } else {
          updates = { dueDate: null, time: null, dueTime: null, meta: { ...(task.meta || {}), hasTime: false } };
        }
      } else if (actionId === 'set-priority') {
        updates = { priority: value || PRIORITY_DEFAULT };
      }
      if (!Object.keys(updates).length) return;
      optimisticTaskUpdate(taskId, updates);
      persistTaskUpdate(taskId, updates);
    },
    [optimisticTaskUpdate, persistTaskUpdate]
  );

  const handleFieldUpdate = useCallback(
    (taskId, updates) => {
      if (!updates || !Object.keys(updates).length) return;
      optimisticTaskUpdate(taskId, updates);
      persistTaskUpdate(taskId, updates);
      
      // If reminder is being set, schedule a notification
      if (updates.reminder) {
        const task = tasksRef.current.find(t => t.id === taskId);
        if (task) {
          scheduleNotification({ ...task, reminder: updates.reminder });
        }
      }
    },
    [optimisticTaskUpdate, persistTaskUpdate]
  );

  const handleTagsChange = useCallback(
    (taskId, nextTags) => {
      const tags = (nextTags || []).map((tag) => tag.trim()).filter(Boolean);
      handleFieldUpdate(taskId, { tags, meta: { tags } });
    },
    [handleFieldUpdate]
  );

  const createTask = useCallback(
    async ({ title, dueDate = null, meta = {} }) => {
      const trimmed = title?.trim();
      if (!trimmed) {
        return { success: false, error: 'Title is required' };
      }
      const optimisticId = `local-${Date.now()}`;
      const optimisticTask = normalizeTask({
        id: optimisticId,
        title: trimmed,
        dueDate,
        course: meta.course || null,
        courseColor: meta.courseColor || null,
        type: meta.type || 'task',
        myDay: meta.myDay ?? false,
        addedToMyDay: meta.myDay ?? false,
        status: meta.status || 'todo',
        priority: meta.priority || PRIORITY_DEFAULT,
        tags: meta.tags || [],
      });
      setTasks((prev) => [optimisticTask, ...prev]);

      let errorMessage = null;
      let payload = null;
      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            title: trimmed,
            dueDate,
            myDay: meta.myDay ?? false,
            addedToMyDay: meta.myDay ?? false,
            status: meta.status || 'todo',
            priority: meta.priority || PRIORITY_DEFAULT,
            course: meta.course || null,
            courseColor: meta.courseColor || null,
            type: meta.type || 'task',
            tags: meta.tags || [],
            subtasks: meta.subtasks || [],
          }),
        });
        if (res.ok) {
          payload = await res.json();
        } else {
          let detail = null;
          try {
            detail = await res.json();
          } catch (parseError) {
            detail = null;
          }
          errorMessage = detail?.error || `Unable to create task (status ${res.status})`;
        }
      } catch (error) {
        errorMessage = error?.message || 'Failed to create task';
      }

      setTasks((prev) => prev.filter((task) => task.id !== optimisticId));
      if (errorMessage) {
        loadUnifiedData();
        return { success: false, error: errorMessage };
      }

      // Invalidate cache so fresh data is fetched
      invalidateCache('/api/events?includeArchived=true' + JSON.stringify({ credentials: 'same-origin' }));

      if (payload?.task) {
        updateTaskFromApi(payload.task);
      } else {
        loadUnifiedData();
      }
      return { success: true, task: payload?.task || null };
    },
    [loadUnifiedData, updateTaskFromApi]
  );

  const handleDeleteTask = useCallback(
    async (taskId) => {
      if (!taskId) return { success: false, error: 'No task ID provided' };
      
      // Optimistic update
      setTasks((prev) => prev.filter((task) => task.id !== taskId));

      let errorMessage = null;
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE',
          credentials: 'same-origin',
        });
        if (!res.ok) {
          let detail = null;
          try {
            detail = await res.json();
          } catch (parseError) {
            detail = null;
          }
          errorMessage = detail?.error || `Unable to delete task (status ${res.status})`;
        }
      } catch (error) {
        errorMessage = error?.message || 'Failed to delete task';
      }

      if (errorMessage) {
        loadUnifiedData();
        return { success: false, error: errorMessage };
      }

      // Invalidate cache so fresh data is fetched
      invalidateCache('/api/events?includeArchived=true' + JSON.stringify({ credentials: 'same-origin' }));

      return { success: true };
    },
    [loadUnifiedData]
  );

  const bulkDelete = useCallback(async () => {
    const ids = Array.from(selectedTaskIds);
    for (const id of ids) {
      await handleDeleteTask(id);
    }
    setSelectedTaskIds(new Set());
  }, [selectedTaskIds, handleDeleteTask]);

  const handleDuplicate = useCallback(async (task) => {
    if (!task) return;
    const result = await createTask({
      title: `${task.title} (copy)`,
      dueDate: task.dueDate || null,
      meta: {
        myDay: task.addedToMyDay || task.myDay || false,
        course: task.course || null,
        courseColor: task.courseColor || null,
        priority: task.priority || PRIORITY_DEFAULT,
        tags: Array.isArray(task.tags) ? [...task.tags] : [],
        subtasks: Array.isArray(task.subtasks) ? task.subtasks.map(st => ({ ...st, id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, completed: false })) : [],
        status: task.status || 'todo',
        type: task.type || 'task',
      },
    });
    if (result?.success) {
      toast.showToast('Task duplicated', 'success');
    }
  }, [createTask, toast]);

  const availableModules = useMemo(() => {
    if (!Array.isArray(modules) || !modules.length) return [];
    if (!activeSemester) return modules;

    const activeId = String(activeSemester.id || '').trim();
    const activeName = String(activeSemester.name || '').trim().toLowerCase();
    const filtered = modules.filter((mod) => {
      const moduleSemester = String(mod?.semester || '').trim();
      if (!moduleSemester) return false;
      if (activeId && moduleSemester === activeId) return true;
      return activeName && moduleSemester.toLowerCase() === activeName;
    });

    return filtered;
  }, [activeSemester, modules]);

  const handleInlineAdd = useCallback(async (title, sectionId) => {
    if (!title.trim()) return;
    const dueDateMap = {
      overdue: new Date().toISOString(),
      today: new Date().toISOString(),
      tomorrow: new Date(Date.now() + 86400000).toISOString(),
      this_week: new Date(Date.now() + 3 * 86400000).toISOString(),
      later: null,
    };
    // Use quick-capture parser for inline adds
    const captured = parseQuickCapture(title, { courses: availableModules });
    const finalDueDate = captured.dueDate ? new Date(captured.dueDate).toISOString() : (dueDateMap[sectionId] || null);
    const result = await createTask({
      title: captured.title || title.trim(),
      dueDate: finalDueDate,
      meta: {
        myDay: sectionId === 'today',
        priority: captured.priority || PRIORITY_DEFAULT,
        tags: captured.tags || [],
        course: captured.course || null,
        type: captured.type || 'task',
      },
    });
    if (result?.success) {
      toast.showToast('Task added', 'success');
    } else {
      toast.showToast(result?.error || 'Failed to add task', 'error');
    }
  }, [availableModules, createTask, toast]);

  const handleComposerSubmit = useCallback(async () => {
    if (!composerValue.trim()) {
      toast.showToast('Type a task before adding', 'error');
      return;
    }
    // Enhanced quick-capture parsing
    const captured = parseQuickCapture(composerValue, { courses: availableModules });
    const dueDate = captured.dueDate ? new Date(captured.dueDate).toISOString() : null;
    const result = await createTask({
      title: captured.title || composerValue.trim(),
      dueDate,
      meta: {
        priority: captured.priority || PRIORITY_DEFAULT,
        tags: captured.tags || [],
        course: captured.course || null,
        type: captured.type || 'task',
      },
    });
    if (!result?.success) {
      toast.showToast(result?.error || 'Unable to create task', 'error');
      return;
    }
    toast.showToast('Task created', 'success');
    setComposerValue('');
  }, [availableModules, composerValue, createTask, toast]);

  const handleStatusChange = useCallback(
    (taskId, status) => {
      if (!status) return;
      const completed = status === 'done';
      const updates = {
        status,
        completed,
        completedAt: completed ? new Date().toISOString() : null,
      };
      optimisticTaskUpdate(taskId, updates);
      persistTaskUpdate(taskId, updates);
    },
    [optimisticTaskUpdate, persistTaskUpdate]
  );

  const handleDragStart = useCallback((taskId) => setDraggingTaskId(taskId), []);
  const handleDragEnd = useCallback(() => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  }, []);
  const handleColumnDragOver = useCallback((columnId) => setDragOverColumn(columnId), []);
  const handleBoardDrop = useCallback(
    (columnId) => {
      if (!draggingTaskId) return;
      handleStatusChange(draggingTaskId, columnId);
      // Reset drag state after a brief delay to ensure state updates are processed
      setTimeout(() => {
        setDraggingTaskId(null);
        setDragOverColumn(null);
      }, 0);
    },
    [draggingTaskId, handleStatusChange]
  );

  const toggleHideLaterColumn = useCallback(() => {
    setHideLaterColumn(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('tasks-board-hide-later', String(next));
      }
      return next;
    });
  }, []);

  // Filter board columns based on hideLaterColumn setting
  // When hiding Later, show Done as a prominent column instead
  const visibleBoardColumns = useMemo(() => {
    if (hideLaterColumn) {
      // Swap Later for Done - make Done prominent
      return boardColumns
        .filter(col => col.id !== 'later')
        .map(col => col.id === 'done' ? { ...col, prominent: true } : col);
    }
    return boardColumns;
  }, [hideLaterColumn]);

  const handleQuickAddToColumn = useCallback(
    (columnId) => {
      setOpen(
        <CustomModal title="" showMinimalHeader={true} size="3xl" noPadding={true}>
          <TaskDetailPanel
            mode="create"
            initialStatus={columnId}
            modules={availableModules}
            setOpen={setOpen}
            setClose={setClose}
            toast={toast}
            onCreate={async (data) => {
              const result = await createTask(data);
              if (result?.success) {
                setClose();
              }
              return result;
            }}
            onClose={() => setClose()}
          />
        </CustomModal>
      );
    },
    [availableModules, createTask, setClose, setOpen, toast]
  );

  const handleQuickAddToSection = useCallback(
    (sectionId) => {
      // Map section IDs to due dates
      const dueDateMap = {
        today: new Date().toISOString().split('T')[0],
        tomorrow: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        'next-up': null,
        later: null,
      };

      setOpen(
        <CustomModal title="" showMinimalHeader={true} size="3xl" noPadding={true}>
          <TaskDetailPanel
            mode="create"
            initialDueDate={dueDateMap[sectionId]}
            modules={availableModules}
            setOpen={setOpen}
            setClose={setClose}
            toast={toast}
            onCreate={async (data) => {
              const result = await createTask(data);
              if (result?.success) {
                setClose();
              }
              return result;
            }}
            onClose={() => setClose()}
          />
        </CustomModal>
      );
    },
    [availableModules, createTask, setClose, setOpen, toast]
  );

  const openComposerModal = useCallback(() => {
    setOpen(
      <CustomModal title="" showMinimalHeader={true} size="3xl" noPadding={true}>
        <TaskDetailPanel
          mode="create"
          modules={availableModules}
          setOpen={setOpen}
          setClose={setClose}
          toast={toast}
          onCreate={async (data) => {
            const result = await createTask(data);
            if (result?.success) {
              setClose();
            }
            return result;
          }}
          onClose={() => setClose()}
        />
      </CustomModal>
    );
  }, [availableModules, createTask, setClose, setOpen, toast]);

  const openTaskDetail = useCallback(
    (task) => {
      if (!task) return;
      
      // Create a wrapper component to manage modal state
      const TaskDetailModal = () => {
        const [isStarred, setIsStarred] = React.useState(Boolean(task.addedToMyDay || task.myDay));
        const [hasReminder, setHasReminder] = React.useState(Boolean(task.dueDate || task.reminder));
        const [showMenu, setShowMenu] = React.useState(false);
        const menuRef = React.useRef(null);

        React.useEffect(() => {
          if (!showMenu) return;
          const handleClickOutside = (event) => {
            if (!menuRef.current?.contains(event.target)) {
              setShowMenu(false);
            }
          };
          document.addEventListener('mousedown', handleClickOutside);
          return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [showMenu]);
        
        const handleStarClick = () => {
          const newValue = !isStarred;
          setIsStarred(newValue);
          handleFieldUpdate(task.id, { addedToMyDay: newValue, myDay: newValue });
        };
        
        const handleClockClick = () => {
          // Switch to reminder page in TaskDetailPanel
          // For now, just show a simple reminder toggle
          const panel = document.querySelector('[data-reminder-trigger]');
          if (panel) panel.click();
        };
        
        return (
          <CustomModal
            title=""
            showMinimalHeader={true}
            size="3xl"
            noPadding={true}
            isStarred={isStarred}
            hasReminder={hasReminder}
            onStarClick={handleStarClick}
            onClockClick={handleClockClick}
            headerActions={
              <div className="relative" ref={menuRef}>
                <button
                  aria-label="More options"
                  onClick={() => setShowMenu((prev) => !prev)}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <MoreVertical size={18} />
                </button>
                <div className={`absolute right-0 top-full mt-1 w-48 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-50 ${showMenu ? '' : 'hidden'}`}>
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await handleDeleteTask(task.id);
                      if (result?.success) {
                        setClose();
                      }
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                  >
                    <Trash2 size={16} />
                    Delete task
                  </button>
                </div>
              </div>
            }
          >
            <TaskDetailPanel
              task={task}
              onToggleComplete={handleToggleComplete}
              onQuickAction={handleQuickAction}
              onStatusChange={handleStatusChange}
              onUpdateFields={(taskId, updates) => {
                handleFieldUpdate(taskId, updates);
                // Update local state if myDay changes
                if ('myDay' in updates || 'addedToMyDay' in updates) {
                  setIsStarred(updates.myDay || updates.addedToMyDay);
                }
                // Update reminder state if dueDate changes
                if ('dueDate' in updates) {
                  setHasReminder(Boolean(updates.dueDate));
                }
              }}
              onTagsChange={handleTagsChange}
              onDeleteTask={handleDeleteTask}
              modules={availableModules}
              setOpen={setOpen}
              setClose={setClose}
              toast={toast}
            />
          </CustomModal>
        );
      };
      
      setOpen(<TaskDetailModal />);
    },
    [availableModules, handleDeleteTask, handleFieldUpdate, handleQuickAction, handleStatusChange, handleTagsChange, handleToggleComplete, setClose, setOpen, toast]
  );

  return (
    <HygraphSidebar pageName="Tasks">
      <>
      <Head>
        <title>Tasks | StraturaOS</title>
        <style>{`
          @keyframes chipIn {
            from { opacity: 0; transform: scale(0.85); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(12px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.2); }
            50% { box-shadow: 0 0 0 6px rgba(124, 58, 237, 0); }
          }
          @keyframes snackbarIn {
            from { opacity: 0; transform: translateY(8px) scale(0.96); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes syncPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          .animate-chip-in { animation: chipIn 120ms ease-out; }
          .animate-fade-in-up { animation: fadeInUp 200ms ease-out; }
          .animate-slide-in-right { animation: slideInRight 220ms cubic-bezier(0.32,0.72,0,1); }
          .animate-pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
          .animate-snackbar-in { animation: snackbarIn 300ms cubic-bezier(0.22,1,0.36,1); }
          .animate-sync-pulse { animation: syncPulse 1.5s ease-in-out infinite; }
          .task-card-enter { animation: fadeInUp 200ms ease-out; }

        /* RTL overrides */
        [dir="rtl"] .animate-slide-in-right { animation-name: slideInLeft; }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        [dir="rtl"] { font-family: 'IBM Plex Sans Arabic', 'Segoe UI', system-ui, sans-serif; }
        [dir="rtl"] p, [dir="rtl"] span, [dir="rtl"] label, [dir="rtl"] li {
          line-height: 1.7;
        }
        [dir="rtl"] h1, [dir="rtl"] h2, [dir="rtl"] h3 {
          letter-spacing: 0;
        }
        `}</style>
      </Head>
      <div className={`${ds.pageBg} px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-gray-900 dark:text-white`}>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 pb-20">

          {/* Minimal header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {actionableTasks.length === 0
                  ? 'All clear'
                  : `${actionableTasks.length} active${metrics.overdue > 0 ? ` \u00b7 ${metrics.overdue} overdue` : ''}`}
              </p>
            </div>
            <button
              onClick={openComposerModal}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-white px-4 py-2.5 text-[13px] font-semibold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 hover:shadow-md active:scale-[0.97]"
            >
              <Plus size={15} strokeWidth={2.5} />
              Add Task
            </button>
          </div>

          {/* Search + Filter + Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50/80 dark:bg-[#18181b] border border-gray-200/70 dark:border-white/[0.06] text-[13px] font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 dark:focus:ring-purple-400/15 dark:focus:border-purple-700 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'All', icon: Layers },
                { id: 'assignment', label: 'Assignments', icon: FileText },
                { id: 'exam', label: 'Exams', icon: AlertTriangle },
                { id: 'project', label: 'Projects', icon: Target },
                { id: 'study', label: 'Study', icon: BookOpen },
              ].map((f) => {
                const count = f.id === 'all'
                  ? actionableTasks.length
                  : actionableTasks.filter(t => t.type === f.id || (f.id === 'study' && (t.type === 'study-session' || t.type === 'study'))).length;
                if (f.id !== 'all' && count === 0) return null;
                const FilterIcon = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 ${
                      activeFilter === f.id
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    <FilterIcon size={13} />
                    {f.label}
                    {count > 0 && (
                      <span className={`text-[10px] font-bold rounded-full px-1.5 min-w-[18px] text-center ${
                        activeFilter === f.id
                          ? 'bg-white/20 dark:bg-gray-900/20'
                          : 'bg-gray-200/80 dark:bg-white/10'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Sort control — segmented pill */}
            <div className="shrink-0 inline-flex items-center rounded-lg border border-gray-200/70 dark:border-white/[0.06] bg-gray-50/80 dark:bg-[#18181b] p-0.5 gap-0.5">
              {[
                { id: 'due', label: 'Due', icon: CalendarIcon },
                { id: 'priority', label: 'Priority', icon: Flag },
                { id: 'recent', label: 'Recent', icon: Clock },
              ].map((s) => {
                const SortIcon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (sortBy === s.id) {
                        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                      } else {
                        setSortBy(s.id);
                        setSortDirection(s.id === 'recent' ? 'desc' : 'asc');
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-150 ${
                      sortBy === s.id
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    <SortIcon size={11} />
                    {s.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-800 transition-all"
                title={sortDirection === 'asc' ? 'Ascending order' : 'Descending order'}
                aria-label={sortDirection === 'asc' ? 'Ascending order' : 'Descending order'}
              >
                <ArrowUpDown size={11} />
                {sortDirection === 'asc' ? 'Asc' : 'Desc'}
              </button>
            </div>
          </div>

          {(searchQuery || activeFilter !== 'all') && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{filteredTasks.length} of {actionableTasks.length}</span>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                className="text-gray-900 dark:text-white font-medium hover:underline"
              >
                Clear
              </button>
            </div>
          )}

          {/* Inline Composer — Todoist-style clean input */}
          <div className="relative">
            <div className={`rounded-xl border transition-all duration-200 ${
              composerValue ? 'border-purple-300 dark:border-purple-700 shadow-[0_0_0_3px_rgba(124,58,237,0.08)] bg-white dark:bg-[#111113]' : 'border-gray-200/70 dark:border-white/[0.06] bg-gray-50/80 dark:bg-[#18181b] hover:border-gray-300 dark:hover:border-white/10'
            }`}>
              <div className="flex items-center gap-2 px-3.5 py-2.5">
                <Plus size={16} strokeWidth={2.5} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
                <input
                  ref={composerInputRef}
                  type="text"
                  value={composerValue}
                  onChange={(e) => setComposerValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComposerSubmit(); } }}
                  placeholder="Add a task..."
                  className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-[14px] font-medium text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500"
                />
                {!composerValue.trim() && (
                  <button
                    type="button"
                    onClick={openComposerModal}
                    className="flex-shrink-0 p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Full editor"
                  >
                    <Maximize2 size={14} />
                  </button>
                )}
              </div>
              {/* Action row — visible when typing */}
              {composerValue.trim() && (
                <div className="flex items-center justify-between px-3.5 pb-2.5">
                  <div className="flex items-center gap-1">
                    {/* Parsed chips */}
                    {(() => {
                      const parsed = parseQuickCapture(composerValue, { courses: availableModules });
                      const chips = [];
                      if (parsed.dueDate) {
                        const d = new Date(parsed.dueDate);
                        chips.push(<span key="d" className="inline-flex items-center h-[22px] px-2 rounded-[5px] text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400"><Calendar size={10} className="mr-1" />{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>);
                      }
                      if (parsed.priority && parsed.priority !== 'not-urgent-not-important') {
                        const pm = getPriorityMeta(parsed.priority);
                        chips.push(<span key="p" className="inline-flex items-center h-[22px] px-2 rounded-[5px] text-[11px] font-semibold" style={{ backgroundColor: `${pm.color}18`, color: pm.color }}><Flag size={10} className="mr-1" />{pm.label}</span>);
                      }
                      if (parsed.course) {
                        chips.push(<span key="c" className="inline-flex items-center h-[22px] px-2 rounded-[5px] text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"><BookOpen size={10} className="mr-1" />{parsed.course}</span>);
                      }
                      (parsed.tags || []).forEach((tag, i) => {
                        chips.push(<span key={`t${i}`} className="inline-flex items-center h-[22px] px-2 rounded-[5px] text-[11px] font-semibold" style={{ backgroundColor: `${palette.tag[i % palette.tag.length]}15`, color: palette.tag[i % palette.tag.length] }}>#{tag}</span>);
                      });
                      return chips;
                    })()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setComposerValue('')}
                      className="text-[13px] font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleComposerSubmit}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-600 text-white text-[12px] font-semibold hover:bg-purple-700 transition-colors"
                    >
                      Add task
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {notificationPermission === 'default' && (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 py-3">
              <div className="flex items-center gap-3">
                <Bell size={16} className="text-gray-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Enable task reminders</p>
              </div>
              <button
                onClick={async () => {
                  const granted = await requestNotificationPermission();
                  setNotificationPermission(granted ? 'granted' : 'denied');
                  if (granted) initializeNotifications(tasks);
                }}
                className="rounded-lg bg-gray-900 dark:bg-white px-3 py-1.5 text-xs font-medium text-white dark:text-gray-900 transition-colors"
              >
                Enable
              </button>
            </div>
          )}

          {/* View switcher */}
          <div className="flex flex-col gap-3">
            {loading && (
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                <span>Loading&hellip;</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <ViewSwitcher mode={viewMode} onChange={setViewMode} />
              {viewMode === 'board' && (
                <BoardColumnToggle hideLaterColumn={hideLaterColumn} onToggleHideLater={toggleHideLaterColumn} />
              )}
            </div>
            {dataError && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-300">
                {dataError}{usingSampleTasks ? ' Using sample data.' : ''}
              </div>
            )}

            {/* Empty states */}
            {!loading && tasks.length === 0 && !usingSampleTasks && !dataError && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <ClipboardList className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No tasks yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-5">
                  Create your first task to get started.
                </p>
                <button
                  onClick={openComposerModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-lg transition-colors text-sm"
                >
                  <Plus size={16} />
                  Create task
                </button>
              </div>
            )}
            {!loading && viewMode !== 'lectures' && tasks.length > 0 && actionableTasks.length === 0 && !usingSampleTasks && !dataError && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0f] px-6 py-12 text-center">
                <BookOpen className="h-6 w-6 text-gray-400 mb-3" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">All tasks complete</h3>
                <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
                  Your remaining items are timetable sessions. Open Lectures to manage them.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <button type="button" onClick={() => setViewMode('lectures')} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-gray-900 transition-colors">
                    <BookOpen size={14} />Lectures
                  </button>
                  <button type="button" onClick={openComposerModal} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Plus size={14} />Add task
                  </button>
                </div>
              </div>
            )}

            {/* List view - smart buckets */}
            {viewMode === 'list' && (actionableTasks.length > 0 || usingSampleTasks) && (
              <ListWorkspace
                smartBuckets={smartBuckets}
                openGroups={openGroups}
                toggleGroup={toggleGroup}
                handleToggleComplete={handleToggleComplete}
                handleQuickAction={handleQuickAction}
                openTaskDetail={openTaskDetail}
                handleDeleteTask={handleDeleteTask}
                handleDuplicate={handleDuplicate}
                handleInlineAdd={handleInlineAdd}
                selectedTaskIds={selectedTaskIds}
                onSelect={toggleTaskSelection}
                selectionMode={selectedTaskIds.size > 0}
                onSectionDrop={handleSectionDrop}
              />
            )}

            {/* Week view */}
            {viewMode === 'week' && (actionableTasks.length > 0 || usingSampleTasks) && (
              <WeekPlanner
                rangeLabel={weekRangeLabel}
                weekDays={weekDays}
                upcoming={weekUpcomingTasks}
                later={weekLaterTasks}
                onOpenDetail={openTaskDetail}
                onToggleComplete={handleToggleComplete}
                onQuickAdd={openComposerModal}
              />
            )}

            {/* Board view */}
            {viewMode === 'board' && (actionableTasks.length > 0 || usingSampleTasks) && (
              <TaskBoard
                columns={visibleBoardColumns}
                columnTasks={columnTasks}
                draggingTaskId={draggingTaskId}
                dragOverColumn={dragOverColumn}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleBoardDrop}
                onColumnDragOver={handleColumnDragOver}
                onQuickAdd={handleQuickAddToColumn}
                onOpenDetail={openTaskDetail}
                hideLaterColumn={hideLaterColumn}
                onToggleHideLater={toggleHideLaterColumn}
              />
            )}

            {/* Lectures view */}
            {viewMode === 'lectures' && <LecturesTab groups={lectureGroups} syncing={loading} />}

            <RecentlyCompletedPills items={recentlyCompleted} onUndo={undoRecentlyCompleted} />
          </div>

          {/* Bulk action bar */}
          {selectedTaskIds.size > 0 && (
            <BulkActionBar
              count={selectedTaskIds.size}
              onComplete={bulkComplete}
              onDelete={bulkDelete}
              onClear={() => setSelectedTaskIds(new Set())}
            />
          )}
        </div>

        {/* Minimal FAB */}
        <button
          onClick={openComposerModal}
          aria-label="Add new task"
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg hover:scale-105 active:scale-95 transition-all sm:hidden"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>
    </>
    </HygraphSidebar>
  );
}

// Small UI for recently completed undo (render at end so it appears above content)
function RecentlyCompletedPills({ items, onUndo }) {
  if (!items || !items.length) return null;
  return (
    <div className="fixed bottom-20 right-6 z-50 flex flex-col gap-2 items-end">
      {items.slice(0, 6).map(item => (
        <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white dark:bg-[#12121a] border border-gray-200/60 dark:border-white/5 shadow-lg">
          <div className="text-sm text-gray-700 dark:text-gray-200 max-w-[220px] truncate">{item.title}</div>
          <button onClick={() => onUndo(item.id)} className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">Undo</button>
        </div>
      ))}
    </div>
  );
}
