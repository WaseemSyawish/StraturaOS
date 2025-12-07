import Head from 'next/head';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
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
} from 'lucide-react';
import CustomModal from '@/components/ui/custom-modal';
import { useModal } from '@/providers/modal-context';
import { fetchWithCache } from '../lib/cache';
import AddEventModal from '@/components/schedule/_modals/add-event-modal';
import { initializeNotifications, scheduleNotification, requestNotificationPermission } from '../lib/notifications';
import HygraphSidebar from '@/components/HygraphSidebar';
import { useToast } from '@/providers/toast-provider';

/* ─────────────────────────────────────────────────────────────
   DESIGN SYSTEM CONSTANTS — Matches landing/auth pages
   ───────────────────────────────────────────────────────────── */
const ds = {
  pageBg: 'min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-[#0a0a0f] dark:via-[#0a0a0f] dark:to-[#12121a]',
  headerBand: 'relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 dark:from-purple-900 dark:via-purple-800 dark:to-indigo-900 rounded-2xl mb-4',
  card: 'bg-white/80 dark:bg-[#12121a] rounded-2xl shadow-lg dark:shadow-2xl dark:shadow-purple-500/5 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm',
  headingXl: 'text-2xl sm:text-3xl font-extrabold text-white tracking-tight',
};

const accentPurple = '#8b5cf6';
const themePalette = {
  background: 'linear-gradient(to bottom, #f8fafc, #ffffff, #f1f5f9)',
  surface: '#FFFFFF',
  primary: '#4338CA',
  primaryAlt: '#2563EB',
  slate: '#0F172A',
  accent: '#0EA5E9',
  muted: '#94A3B8',
};
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
  time: '02:00 PM — 03:00 PM',
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

const LECTURE_TYPES = new Set(['lecture', 'class', 'lab', 'tutorial', 'seminar', 'workshop']);

const PRIORITY_DEFAULT = 'not-urgent-not-important';
const priorityMeta = {
  'urgent-important': { label: 'Urgent & Important', color: '#ef4444', weight: 0 },
  'urgent-not-important': { label: 'Urgent · Low Impact', color: '#f97316', weight: 1 },
  'not-urgent-important': { label: 'Important, not urgent', color: '#0ea5e9', weight: 2 },
  'not-urgent-not-important': { label: 'Low effort', color: '#94a3b8', weight: 3 },
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
  return date.toISOString().slice(0, 10);
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
  if (task.dueTime) return true;
  const due = toDateSafe(task.dueDate);
  if (!due) return false;
  return Boolean(due.getHours() || due.getMinutes() || due.getSeconds());
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
  if (!date) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatTimeRange = (start, end) => {
  const startDate = toDateSafe(start);
  const endDate = toDateSafe(end);
  if (!startDate) return '—';
  const startLabel = startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (!endDate) return startLabel;
  const endLabel = endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${startLabel} – ${endLabel}`;
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

const ReminderPicker = ({ value, onChange, onDelete, onApply, onClose, onTimeChange }) => {
  const [date, setDate] = useState(value ? new Date(value).toISOString().split('T')[0] : '');
  const [time, setTime] = useState(value ? new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '');
  const [viewMonth, setViewMonth] = useState(new Date());

  // Helper to apply with explicit values (bypasses async state issues)
  const applyWithValues = (dateVal, timeVal) => {
    onChange?.(dateVal);
    onTimeChange?.(timeVal);
    onApply?.(dateVal, timeVal);
  };

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay(); // 0=Sunday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = date ? new Date(date + 'T00:00:00') : null;

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
    const dateStr = target.toISOString().split('T')[0];
    
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
    const dateTime = new Date(dateStr + 'T00:00:00');
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
    const dateTime = new Date(date + 'T00:00:00');
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
    const dateTime = new Date(newDate + 'T00:00:00');
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
                    const dateTime = new Date(date + 'T00:00:00');
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
  const [includeMyDay, setIncludeMyDay] = useState(true);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
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

  // Helper to close all dropdowns except the one being opened
  const closeAllDropdowns = (exceptId = null) => {
    const dropdownTypes = ['status', 'eventtype', 'priority', 'module'];
    const taskId = task?.id || 'new';
    dropdownTypes.forEach(type => {
      const id = `${type}-dropdown-${taskId}`;
      if (id !== exceptId) {
        document.getElementById(id)?.classList.add('hidden');
      }
    });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const taskId = task?.id || 'new';
      const dropdownTypes = ['status', 'eventtype', 'priority', 'module'];
      
      dropdownTypes.forEach(type => {
        const dropdown = document.getElementById(`${type}-dropdown-${taskId}`);
        if (dropdown && !dropdown.classList.contains('hidden')) {
          const button = dropdown.previousElementSibling;
          if (!dropdown.contains(event.target) && !button?.contains(event.target)) {
            dropdown.classList.add('hidden');
          }
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [task?.id]);

  if (!isCreateMode && !task) {
    return <p className="text-sm text-slate-500">Task data unavailable.</p>;
  }

  // Always use localTags for immediate UI feedback, synced from task.tags in useEffect
  const tags = localTags;
  const priorityInfo = getPriorityMeta(localPriority);
  
  const statusOptions = [
    { value: 'todo', label: 'To Do', color: '#e01a1aff' },
    { value: 'doing', label: 'In Progress', color: '#8b5cf6' },
    { value: 'later', label: 'Later', color: '#f59e0b' },
    { value: 'done', label: 'Done', color: '#10b981' },
  ];
  
  const currentStatus = statusOptions.find(s => s.value === localStatus) || statusOptions[0];
  
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
        const dateObj = new Date(newDate + 'T23:59:00');
        onUpdateFields?.(task.id, { dueDate: dateObj.toISOString() });
      } else {
        onUpdateFields?.(task.id, { dueDate: null });
      }
    }
  };

  const handleDueEndChange = (newDate) => {
    setDueEndInput(newDate);
    if (!isCreateMode && newDate) {
      const dateObj = new Date(newDate + 'T23:59:00');
      onUpdateFields?.(task.id, { dueDate: dateObj.toISOString() });
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
    const dueDate = dueStartInput ? new Date(dueStartInput) : null;
    const meta = {
      myDay: includeMyDay,
      course: localCourse || null,
      courseColor: localCourseColor || null,
      priority: localPriority,
      tags: localTags,
      subtasks: localSubtasks,
      status: localStatus,
      type: localEventType,
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
    <form className="flex flex-col" onSubmit={handleSubmit}>
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
              // Use direct values from params if provided (for shortcuts/clear), else fall back to state
              const finalDate = params?.date !== undefined ? params.date : tempDueDate;
              const finalTime = params?.time !== undefined ? params.time : tempDueTime;
              
              if (isCreateMode) {
                setDueStartInput(finalDate || '');
              } else {
                setLocalDueDate(finalDate || '');
                // Send both dueDate and time to properly handle clearing time
                const updates = { dueDate: finalDate };
                if (finalTime !== undefined) {
                  updates.time = finalTime;
                  updates.dueTime = finalTime; // Also clear dueTime for optimistic update
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
      <div className="space-y-5 px-6 py-6">
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
          className="w-full border-none bg-transparent text-2xl font-bold text-slate-900 outline-none placeholder:text-slate-400"
          placeholder="Task title"
          autoFocus={isCreateMode}
        />

        <div className="space-y-3.5">
          <div className="flex items-center gap-3 text-[13px]">
            <div className="flex items-center gap-2.5">
              <Circle size={15} className="text-slate-400" />
              <span className="min-w-[95px] text-slate-500">Status</span>
            </div>
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  const dropdownId = `status-dropdown-${task?.id || 'new'}`;
                  const dropdown = document.getElementById(dropdownId);
                  if (dropdown?.classList.contains('hidden')) {
                    closeAllDropdowns(dropdownId);
                    dropdown.classList.remove('hidden');
                  } else {
                    dropdown?.classList.add('hidden');
                  }
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                style={{ backgroundColor: `${currentStatus.color}15`, color: currentStatus.color }}
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: currentStatus.color }}></span>
                {currentStatus.label}
                <ChevronDown size={14} className="ml-auto opacity-60" />
              </button>
              <div id={`status-dropdown-${task?.id || 'new'}`} className="absolute left-0 top-full z-50 mt-1 hidden w-48 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                {statusOptions.map((opt) => (
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
                      document.getElementById(`status-dropdown-${task?.id || 'new'}`)?.classList.add('hidden');
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                    style={{ backgroundColor: localStatus === opt.value ? `${opt.color}08` : 'transparent' }}
                  >
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: opt.color }}></span>
                    <span style={{ color: opt.color }}>{opt.label}</span>
                    {localStatus === opt.value && <Check size={16} className="ml-auto" style={{ color: opt.color }} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[13px]">
            <BookOpen size={15} className="text-slate-400" />
            <span className="min-w-[110px] text-slate-500">Event Type</span>
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => {
                  const dropdownId = `eventtype-dropdown-${task?.id || 'new'}`;
                  const dropdown = document.getElementById(dropdownId);
                  if (dropdown?.classList.contains('hidden')) {
                    closeAllDropdowns(dropdownId);
                    dropdown.classList.remove('hidden');
                  } else {
                    dropdown?.classList.add('hidden');
                  }
                }}
                className="w-full h-9 px-3 rounded-lg border text-left text-xs font-medium bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent flex items-center justify-between gap-2 transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  {localEventType === 'class' && <BookOpen className="w-4 h-4" />}
                  {localEventType === 'lab' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 2h12M9 2v6l-4 8a4 4 0 003.6 6h6.8a4 4 0 003.6-6l-4-8V2" />
                    </svg>
                  )}
                  {localEventType === 'tutorial' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )}
                  {localEventType === 'exam' && <AlertTriangle className="w-4 h-4" />}
                  {localEventType === 'quiz' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  )}
                  {localEventType === 'assignment' && <FileText className="w-4 h-4" />}
                  {localEventType === 'project' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  )}
                  {localEventType === 'deadline' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {localEventType === 'meeting' && <Users className="w-4 h-4" />}
                  {localEventType === 'study-session' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )}
                  {localEventType === 'personal' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  {localEventType === 'task' && <Target className="w-4 h-4" />}
                  {localEventType === 'other' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  )}
                  <span className="capitalize">{localEventType}</span>
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-200 transition-transform duration-200" />
              </button>
              <div id={`eventtype-dropdown-${task?.id || 'new'}`} className="absolute left-0 top-full z-50 mt-1 hidden w-full max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                {[
                  { value: 'class', label: 'Class', icon: BookOpen },
                  { value: 'lab', label: 'Lab', icon: () => (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 2h12M9 2v6l-4 8a4 4 0 003.6 6h6.8a4 4 0 003.6-6l-4-8V2" />
                    </svg>
                  ) },
                  { value: 'tutorial', label: 'Tutorial', icon: () => (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  ) },
                  { value: 'exam', label: 'Exam', icon: AlertTriangle },
                  { value: 'quiz', label: 'Quiz', icon: () => (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  ) },
                  { value: 'assignment', label: 'Assignment', icon: FileText },
                  { value: 'project', label: 'Project', icon: () => (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  ) },
                  { value: 'deadline', label: 'Deadline', icon: () => (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) },
                  { value: 'meeting', label: 'Meeting', icon: Users },
                  { value: 'study-session', label: 'Study Session', icon: () => (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  ) },
                  { value: 'personal', label: 'Personal', icon: () => (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ) },
                  { value: 'task', label: 'Task', icon: Target },
                  { value: 'other', label: 'Other', icon: () => (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  ) }
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setLocalEventType(type.value);
                      if (!isCreateMode) {
                        onUpdateFields?.(task.id, { type: type.value });
                      }
                      document.getElementById(`eventtype-dropdown-${task?.id || 'new'}`)?.classList.add('hidden');
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    {typeof type.icon === 'function' ? <type.icon /> : <type.icon size={16} />}
                    {type.label}
                    {localEventType === type.value && <Check size={16} className="ml-auto text-purple-600" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[13px]">
            <div className="flex items-center gap-2.5">
              <Flag size={15} className="text-slate-400" />
              <span className="min-w-[95px] text-slate-500">Priority</span>
            </div>
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  const dropdownId = `priority-dropdown-${task?.id || 'new'}`;
                  const dropdown = document.getElementById(dropdownId);
                  if (dropdown?.classList.contains('hidden')) {
                    closeAllDropdowns(dropdownId);
                    dropdown.classList.remove('hidden');
                  } else {
                    dropdown?.classList.add('hidden');
                  }
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                style={{ backgroundColor: `${priorityInfo.color}15`, color: priorityInfo.color }}
              >
                {priorityInfo.icon && <priorityInfo.icon size={14} />}
                {priorityInfo.label}
                <ChevronDown size={14} className="ml-auto opacity-60" />
              </button>
              <div id={`priority-dropdown-${task?.id || 'new'}`} className="absolute left-0 top-full z-50 mt-1 hidden w-56 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                {Object.entries(priorityMeta).map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setLocalPriority(key);
                      if (!isCreateMode) {
                        onUpdateFields?.(task.id, { priority: key });
                      }
                      document.getElementById(`priority-dropdown-${task?.id || 'new'}`)?.classList.add('hidden');
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                    style={{ backgroundColor: localPriority === key ? `${meta.color}08` : 'transparent', color: meta.color }}
                  >
                    {meta.icon && <meta.icon size={14} />}
                    {meta.label}
                    {localPriority === key && <Check size={16} className="ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Module/Course selector */}
          {modules.length > 0 && (
            <div className="flex items-center gap-3 text-[13px]">
              <div className="flex items-center gap-2.5">
                <Layers size={15} className="text-slate-400" />
                <span className="min-w-[95px] text-slate-500">Module</span>
              </div>
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => {
                    const dropdownId = `module-dropdown-${task?.id || 'new'}`;
                    const dropdown = document.getElementById(dropdownId);
                    if (dropdown?.classList.contains('hidden')) {
                      closeAllDropdowns(dropdownId);
                      dropdown.classList.remove('hidden');
                    } else {
                      dropdown?.classList.add('hidden');
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ 
                    backgroundColor: localCourseColor ? `${localCourseColor}15` : 'rgba(148, 163, 184, 0.1)', 
                    color: localCourseColor || '#64748b' 
                  }}
                >
                  <span 
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: localCourseColor || '#94a3b8' }}
                  />
                  {localCourse || 'Select module'}
                  <ChevronDown size={14} className="ml-auto opacity-60" />
                </button>
                <div id={`module-dropdown-${task?.id || 'new'}`} className="absolute left-0 top-full z-50 mt-1 hidden w-64 max-h-60 overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                  {/* Clear selection option */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setLocalCourse(null);
                      setLocalCourseColor(null);
                      if (!isCreateMode) {
                        onUpdateFields?.(task.id, { course: null, courseColor: null });
                      }
                      document.getElementById(`module-dropdown-${task?.id || 'new'}`)?.classList.add('hidden');
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                  >
                    <span className="inline-block h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    No module
                    {!localCourse && <Check size={16} className="ml-auto text-purple-600" />}
                  </button>
                  {modules.map((mod) => {
                    const moduleName = mod.name || mod.title || mod.code;
                    const moduleColor = mod.color || accentPurple;
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
                          document.getElementById(`module-dropdown-${task?.id || 'new'}`)?.classList.add('hidden');
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                        style={{ 
                          backgroundColor: localCourse === moduleName ? `${moduleColor}08` : 'transparent',
                          color: moduleColor 
                        }}
                      >
                        <span 
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: moduleColor }}
                        />
                        <span className="truncate">{moduleName}</span>
                        {localCourse === moduleName && <Check size={16} className="ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-[13px]">
            <CalendarIcon size={15} className="text-slate-400" />
            <span className="min-w-[110px] text-slate-500">Due & Reminder</span>
            <button
              type="button"
              data-reminder-trigger
              onClick={() => {
                const currentDate = isCreateMode ? dueStartInput : localDueDate;
                setTempDueDate(currentDate || null);
                setModalPage('reminder');
              }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {(isCreateMode ? dueStartInput : localDueDate) ? new Date(isCreateMode ? dueStartInput : localDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Set due date & reminder'}
            </button>
          </div>

          {/* Old date pickers and reminder section removed - now unified above */}

          <div className="flex items-start gap-3 text-[13px]">
            <Tag size={15} className="mt-0.5 text-slate-400" />
            <span className="min-w-[110px] text-slate-500">Tags</span>
            <div className="flex flex-1 flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    <X size={11} />
                  </button>
                </span>
              ))}
              {courseModuleTags.filter(ct => !localTags.includes(ct)).slice(0, 3).map((suggestion) => (
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
                  className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  + {suggestion}
                </button>
              ))}
              <div className="flex flex-1 items-center gap-1">
                <input
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder={tags.length === 0 ? 'Type tag name and press +' : 'Add another tag'}
                  className="min-w-[80px] flex-1 rounded-md border-0 bg-slate-50 dark:bg-slate-700 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-slate-200 dark:focus:ring-slate-600"
                />
                {tagDraft.trim() && (
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subtasks Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={15} className="text-slate-400" />
              <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Subtasks</p>
              {localSubtasks.length > 0 && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {localSubtasks.filter(st => st.completed).length}/{localSubtasks.length} done
                </span>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          {localSubtasks.length > 0 && (
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
              <div 
                className="h-full rounded-full bg-purple-600 transition-all duration-300"
                style={{ 
                  width: `${(localSubtasks.filter(st => st.completed).length / localSubtasks.length) * 100}%` 
                }}
              />
            </div>
          )}
          
          <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3">
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
                    className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white dark:hover:bg-slate-600/50 transition-colors cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical size={12} className="flex-shrink-0 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                      className={`flex-1 text-[13px] bg-transparent border-0 outline-none focus:bg-white dark:focus:bg-slate-700 focus:px-2 focus:py-0.5 focus:-mx-2 focus:-my-0.5 focus:rounded transition-all ${
                        subtask.completed 
                          ? 'text-slate-400 dark:text-slate-500 line-through' 
                          : 'text-slate-700 dark:text-slate-300'
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
              <div className="w-3 flex-shrink-0" /> {/* Spacer for alignment with drag handle */}
              <div className="flex-shrink-0 w-4 h-4 rounded border-2 border-dashed border-slate-300 dark:border-slate-500" />
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
                placeholder="Add a subtask..."
                className="flex-1 text-[13px] bg-transparent border-0 outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
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

        {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}
      </div>
      )}

      {isCreateMode && (
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-purple-600 hover:bg-purple-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 shadow-sm"
          >
            {busy ? 'Adding…' : 'Add task'}
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
  const iso = targetDate.toISOString().slice(0, 10);
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
    const courseName = module?.name || event.course || event.courseName || event.title || 'Lecture';
    const courseCode = module?.code || event.courseCode || event.courses?.code || null;
    const color = module?.colorHex || module?.color || event.courseColor || event.courses?.color || '#6366f1';
    const location = event.location || event.meta?.location || event.room || 'See timetable';
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
      title: event.title || courseName,
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
    title: task.title || 'Untitled Task',
    description: task.description || '',
    dueDate,
    dueTime,
    courseId: task.courseId || task.course_id || task.courses?.id || null,
    courseCode: task.courseCode || task.course_code || task.courses?.code || null,
    course: task.course || task.courseName || task.courses?.name || null,
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
    title: event.title || event.courseName || 'Schedule block',
    description: event.description || meta.description || '',
    dueDate: event.date || event.startDate || meta.dueDate || null,
    dueTime: event.time || meta.time || null,
    courseId: event.course_id || event.courseId || meta.courseId || null,
    course: event.course || event.courseName || meta.course || null,
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
  if (metrics.overdue > 0) suggestions.push(`You have ${metrics.overdue} overdue task${metrics.overdue === 1 ? '' : 's'} — clear them first.`);
  if (!buckets.today.length && buckets.later.length) suggestions.push('Today is clear — pull a backlog idea into focus.');
  if (buckets.next_up.length > 4) suggestions.push('Next 6 days are stacked — spread deadlines across the week.');
  if (!buckets.today.length && !buckets.next_up.length) {
    suggestions.push('Capture tasks quickly — title is the only required field.');
    suggestions.push('Use natural language: “Read chapter 5 tomorrow 7pm”.');
  }
  return suggestions.slice(0, 3);
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
  return `${startLabel} – ${endLabel}`;
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

const FloatingHeader = ({ onAdd = () => {}, onQuickFocus = () => {}, onFilterChange, stats = [] }) => {
  const seededStats = stats.length
    ? stats
    : [{ id: 'overdue', label: 'Overdue', value: 0, icon: AlarmClock, color: 'text-rose-600', subtext: 'Syncing…', meta: 'Awaiting data' }];
  const statMap = seededStats.reduce((acc, stat) => ({ ...acc, [stat.id]: stat }), {});
  
  // Get stats for display - these match the IDs from headerStats
  const overdueCount = statMap['overdue']?.value || 0;
  const todayCount = statMap['focus-today']?.value || 0;
  const completedWeek = statMap['completed-week']?.value || 0;
  
  return (
    <header className="mb-6 sm:mb-8" style={statFontStyle}>
      {/* Dashboard Container Box */}
      <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6 md:p-8">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">Tasks</h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Plan, prioritize, and accomplish your tasks with ease.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onAdd}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Task</span>
            </button>
          </div>
        </div>
        
        {/* Stats Cards Row - Compact Design */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Today's Focus Card */}
          <button
            onClick={() => onFilterChange?.('today')}
            className="bg-white dark:bg-slate-800/80 rounded-lg p-3 sm:p-4 border border-slate-200/80 dark:border-slate-700/80 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md transition-all duration-200 cursor-pointer text-left w-full group backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-105 transition-transform">
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-none">{todayCount}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Today</p>
              </div>
            </div>
          </button>
          
          {/* Completed Card */}
          <button
            onClick={() => onFilterChange?.('completed')}
            className="bg-white dark:bg-slate-800/80 rounded-lg p-3 sm:p-4 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-200 cursor-pointer text-left w-full group backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg group-hover:scale-105 transition-transform">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-none">{completedWeek}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">This week</p>
              </div>
            </div>
          </button>
          
          {/* Overdue Card */}
          <button
            onClick={() => onFilterChange?.('overdue')}
            className="bg-white dark:bg-slate-800/80 rounded-lg p-3 sm:p-4 border border-slate-200/80 dark:border-slate-700/80 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-md transition-all duration-200 cursor-pointer text-left w-full group backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg group-hover:scale-105 transition-transform">
                <AlarmClock className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className={`text-xl sm:text-2xl font-bold leading-none ${overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{overdueCount}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Overdue</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
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
        <p className="text-sm text-slate-500 dark:text-slate-400">No reminders set — add one to get notified before deadlines.</p>
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
        View Session History →
      </button>
    </section>
  );
};

const AddTaskBar = ({ value, onChange, onSubmit, detectedDate, highlight, inputRef, errorMessage }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="flex h-12 flex-1 items-center rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/50 px-4 focus-within:border-purple-400 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all">
        <Plus size={18} className="text-slate-400" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Add task… e.g. “CS lab due next Monday 9A”"
          className="ml-3 flex-1 bg-transparent text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <button className="rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 p-2 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" aria-label="Insert template">
          <Sparkles size={16} />
        </button>
      </div>
      <button
        onClick={onSubmit}
        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
      >
        <Plus size={14} />
        Add Task
      </button>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-2 md:gap-3 text-xs text-slate-500">
      {detectedDate ? (
        <span className="flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-purple-700 font-medium">
          <CalendarIcon size={12} />
          {detectedDate.label}
        </span>
      ) : null}
      {value ? (
        <div className="flex flex-1 text-sm text-slate-500">
          {highlight || <span>Only the title is required — try “Plan sprint tomorrow at 4pm”.</span>}
        </div>
      ) : (
        <span>Only the title is required — try “Plan sprint tomorrow at 4pm”.</span>
      )}
    </div>
    {errorMessage ? <p className="mt-2 text-xs font-semibold text-rose-500">{errorMessage}</p> : null}
  </div>
);

const TaskCard = ({ task, onToggleComplete, onQuickAction, onOpenDetail }) => {
  const priorityInfo = getPriorityMeta(task.priority);
  const dueDate = toDateSafe(task.dueDate);
  const dueLabel = dueDate ? dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : null;
  const dueTimeLabel = task.dueTime || (dueDate && hasDueTime(task) ? dueDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null);
  const relative = dueDate ? formatRelativeDue(task.dueDate) : null;
  
  // Priority styling
  const getPriorityBadge = () => {
    if (!task.priority || task.priority === 'none') return null;
    const priorities = {
      'urgent-important': { label: 'Urgent', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
      'not-urgent-important': { label: 'Important', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
      'urgent-not-important': { label: 'Soon', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
      'not-urgent-not-important': { label: 'Later', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-500 dark:text-slate-400' },
    };
    const p = priorities[task.priority] || priorities['not-urgent-not-important'];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${p.bg} ${p.text}`}>
        <Flag size={10} />
        {p.label}
      </span>
    );
  };
  
  return (
    <div
      onClick={() => onOpenDetail && onOpenDetail(task)}
      className={`group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-3 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-purple-200 dark:hover:border-purple-700 ${
        task.completed ? 'opacity-50' : ''
      }`}
    >
      {/* Left color indicator */}
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full" style={{ background: priorityInfo.color }} />
      
      <div className="flex items-start gap-3 pl-2">
        {/* Checkbox */}
        <button
          aria-label="Toggle completion"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task.id);
          }}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
            task.completed 
              ? 'border-purple-500 bg-purple-500 text-white' 
              : 'border-slate-300 dark:border-slate-600 hover:border-purple-400'
          }`}
        >
          {task.completed && <Check size={12} strokeWidth={3} />}
        </button>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <p className={`text-sm font-medium ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
            {task.title}
          </p>
          
          {/* Meta row - Priority, Module, Type */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Priority badge */}
            {getPriorityBadge()}
            
            {/* Course/Module pill */}
            {task.course && (
              <span 
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                style={{ 
                  backgroundColor: `${task.courseColor || '#8b5cf6'}15`,
                  color: task.courseColor || '#8b5cf6'
                }}
              >
                <BookOpen size={10} />
                {task.course}
              </span>
            )}
            
            {/* My Day badge */}
            {task.addedToMyDay && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-[10px] font-semibold text-purple-600 dark:text-purple-300">
                <Sun size={10} />
                My Day
              </span>
            )}
          </div>
          
          {/* Due date row */}
          {dueDate && (
            <div className="mt-2 flex items-center gap-3 text-xs">
              {/* Relative due */}
              {relative && (
                <span className={`font-semibold ${
                  relative.includes('Overdue') ? 'text-red-500' : 
                  relative === 'Today' ? 'text-amber-500' :
                  relative === 'Tomorrow' ? 'text-blue-500' : 
                  'text-slate-500 dark:text-slate-400'
                }`}>
                  {relative}
                </span>
              )}
              {/* Separator */}
              {relative && <span className="text-slate-300 dark:text-slate-600">·</span>}
              {/* Actual date */}
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar size={12} />
                {dueLabel}{dueTimeLabel && ` at ${dueTimeLabel}`}
              </span>
            </div>
          )}
        </div>
        
        {/* Chevron */}
        <ChevronRight className="mt-0.5 shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-purple-400 transition-colors" size={16} />
      </div>
    </div>
  );
};

const TaskGroup = ({ sectionId, tasks, isOpen, onToggle, onToggleComplete, onQuickAction, onOpenDetail, onQuickAdd }) => {
  const config = sectionConfig[sectionId] || getSectionDefinition(sectionId);
  const IconComponent = config.iconComponent || config.icon;
  const countLabel = tasks.length === 0 ? 'Nothing scheduled' : `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
  const shouldGroupByDay = sectionId === 'next_up';
  const groupedByDay = shouldGroupByDay
    ? (() => {
        const groups = new Map();
        tasks.forEach((task) => {
          const due = toDateSafe(task.dueDate);
          const key = due ? toYMD(due) : 'no-date';
          if (!groups.has(key)) {
            groups.set(key, {
              key,
              label: due
                ? due.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                : 'No date set',
              order: due ? due.getTime() : Number.MAX_SAFE_INTEGER,
              tasks: [],
            });
          }
          groups.get(key).tasks.push(task);
        });
        return Array.from(groups.values()).sort((a, b) => a.order - b.order);
      })()
    : [];

  return (
    <section className="rounded-[20px] border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-4 shadow-[0_4px_15px_rgba(15,23,42,0.04)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.1)]">
      <button onClick={() => onToggle(sectionId)} className="flex w-full items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${config.accent || 'bg-slate-100 dark:bg-slate-700'}`}>
            {IconComponent ? (
              typeof IconComponent === 'string' ? (
                <span className="text-lg" aria-hidden>
                  {IconComponent}
                </span>
              ) : (
                <IconComponent size={18} className={config.iconColor || config.text || 'text-slate-600 dark:text-slate-400'} />
              )
            ) : null}
          </span>
          <div>
            <p className={`text-sm font-semibold text-slate-900 dark:text-slate-100 ${config.text || ''}`}>{config.label || sectionId}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {config.description || countLabel}
            </p>
          </div>
        </div>
        <div className="text-right">
          <ChevronRight className={`ml-auto text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-90 text-slate-600 dark:text-slate-300' : ''}`} />
        </div>
      </button>
      <div className={`transition-[max-height] duration-300 ease-out ${isOpen ? 'mt-4 max-h-[1200px]' : 'max-h-0 overflow-hidden'}`}>
        <div className="mt-2 space-y-3">
          {tasks.length === 0 ? (
            <p className="rounded-[16px] border border-dashed border-slate-200 dark:border-slate-600 px-4 py-3 text-sm text-slate-400 dark:text-slate-500">Nothing here — capture ideas anytime.</p>
          ) : shouldGroupByDay ? (
            groupedByDay.map((group) => (
              <div key={group.key} className="space-y-2">
                <div className="space-y-3">
                  {group.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={onToggleComplete}
                      onQuickAction={onQuickAction}
                      onOpenDetail={onOpenDetail}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onQuickAction={onQuickAction}
                onOpenDetail={onOpenDetail}
              />
            ))
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onQuickAdd && onQuickAdd(sectionId)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-600 px-3 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
      >
        <Plus size={16} />
        Add task
      </button>
    </section>
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
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No timed tasks today — use the board to plan a slot.</p>
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
            {firstTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} → {lastTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
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
                        <span className="text-slate-300 dark:text-slate-600">•</span>
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
  <div className="inline-flex flex-wrap gap-2 rounded-xl md:rounded-2xl border border-purple-100 dark:border-purple-700 bg-white dark:bg-slate-800 px-3 md:px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow">
    {viewTabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex items-center gap-2 rounded-lg md:rounded-xl px-3 md:px-4 py-2 text-xs md:text-sm font-semibold transition-all ${
          mode === tab.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105' : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
        }`}
      >
        <tab.icon size={16} className="hidden sm:inline" />
        <tab.icon size={14} className="sm:hidden" />
        {tab.label}
      </button>
    ))}
  </div>
);

const BoardColumnToggle = ({ hideLaterColumn, onToggleHideLater }) => (
  <button
    type="button"
    onClick={onToggleHideLater}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all duration-200 text-xs ${
      hideLaterColumn
        ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
        : 'border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30'
    }`}
  >
    <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${
      hideLaterColumn ? 'bg-emerald-500' : 'bg-purple-500'
    }`}>
      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transform transition-transform duration-200 ${
        hideLaterColumn ? 'translate-x-4' : 'translate-x-0.5'
      }`} />
    </div>
    <span className={`font-semibold ${
      hideLaterColumn ? 'text-emerald-700 dark:text-emerald-300' : 'text-purple-700 dark:text-purple-300'
    }`}>
      {hideLaterColumn ? 'Done' : 'Later'}
    </span>
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
  // Check if Done is shown as a prominent column (when Later is hidden)
  const doneIsProminent = prominentColumns.some(c => c.id === 'done');
  
  return (
    <div className="space-y-4">
      {/* Main columns grid */}
      <div className={`grid gap-3 md:gap-4 rounded-xl md:rounded-2xl border border-purple-100 dark:border-purple-700 bg-white dark:bg-slate-800 px-3 md:px-4 py-3 md:py-4 shadow-sm hover:shadow-md transition-shadow grid-cols-1 ${prominentColumns.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {prominentColumns.map((column) => {
          const tasks = columnTasks[column.id] || [];
          const isActiveDrop = dragOverColumn === column.id && draggingTaskId;
          const ColumnIcon = column.Icon;
          return (
            <div
              key={column.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggingTaskId) onColumnDragOver(column.id);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                if (draggingTaskId) onColumnDragOver(column.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(column.id);
              }}
              className={`rounded-xl md:rounded-2xl border px-3 md:px-4 py-3 md:py-4 transition-all shadow-sm ${
                isActiveDrop ? 'border-purple-300 dark:border-purple-600 bg-purple-50/60 dark:bg-purple-900/20 shadow-purple-200/50 scale-[1.02]' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md'
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className={`flex items-center gap-2 text-sm font-semibold ${column.colorClass || 'text-slate-700 dark:text-slate-300'}`}>
                    {ColumnIcon ? <ColumnIcon size={16} /> : null}
                    {column.label}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{column.description}</p>
                </div>
                <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">{tasks.length}</span>
              </div>
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <p className="rounded-[20px] border border-dashed border-slate-200 dark:border-slate-600 px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500" aria-live="polite">
                    {draggingTaskId ? 'Release to move task here' : 'No cards yet · click below to add'}
                  </p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => onDragStart(task.id)}
                      onDragEnd={onDragEnd}
                      onClick={() => onOpenDetail(task)}
                      className="cursor-grab rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                        <p className="flex-1 font-medium text-slate-900 dark:text-slate-100 text-xs leading-snug line-clamp-2">{task.title}</p>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="rounded-full px-1.5 py-0.5" style={{ color: task.courseColor, backgroundColor: `${task.courseColor}15` }}>
                          {task.course}
                        </span>
                        {task.dueDate && (
                          <span className="text-slate-400 dark:text-slate-500">{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        )}
                      </div>
                      {/* Tags display */}
                      {Array.isArray(task.tags) && task.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {task.tags.slice(0, 3).map((tag) => (
                            <span 
                              key={tag} 
                              className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 dark:text-slate-400"
                            >
                              {tag}
                            </span>
                          ))}
                          {task.tags.length > 3 && (
                            <span className="text-[9px] text-slate-400 dark:text-slate-500">+{task.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => onQuickAdd && onQuickAdd(column.id)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-600 px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              >
                <Plus size={12} />
                Add task
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Done column - collapsed/compact by default, hidden when Done is a prominent column */}
      {doneColumn && !doneIsProminent && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (draggingTaskId) onColumnDragOver('done');
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            if (draggingTaskId) onColumnDragOver('done');
          }}
          onDrop={(e) => {
            e.preventDefault();
            onDrop('done');
          }}
          className={`rounded-xl border px-4 py-3 transition-all ${
            dragOverColumn === 'done' && draggingTaskId 
              ? 'border-emerald-300 dark:border-emerald-600 bg-emerald-50/60 dark:bg-emerald-900/20' 
              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
          }`}
        >
          <button
            type="button"
            onClick={() => setDoneExpanded(!doneExpanded)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Completed Tasks
              </span>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {doneTasks.length}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{doneExpanded ? 'Collapse' : 'Expand'}</span>
              <ChevronDown size={14} className={`transition-transform ${doneExpanded ? 'rotate-180' : ''}`} />
            </div>
          </button>
          
          {doneExpanded && doneTasks.length > 0 && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {doneTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => onDragStart(task.id)}
                  onDragEnd={onDragEnd}
                  onClick={() => onOpenDetail(task)}
                  className="cursor-grab rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-slate-800 px-3 py-2 transition hover:shadow-sm"
                >
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-through line-clamp-1">{task.title}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{task.course}</p>
                </div>
              ))}
            </div>
          )}
          
          {!doneExpanded && doneTasks.length > 0 && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {draggingTaskId ? 'Drop here to mark as complete' : `${doneTasks.length} task${doneTasks.length === 1 ? '' : 's'} completed • Click to expand`}
            </p>
          )}
          
          {doneTasks.length === 0 && (
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              {draggingTaskId ? 'Drop here to mark as complete' : 'No completed tasks yet'}
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
  const renderTaskRow = (task) => {
    const dueLabel = task.dueDate
      ? new Date(task.dueDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : '';
    const typeColor = {
      exam: '#ef4444',
      quiz: '#f97316', 
      assignment: '#3b82f6',
      project: '#8b5cf6',
      study: '#22c55e',
    }[task.type?.toLowerCase()] || '#64748b';
    
    return (
      <div
        key={task.id}
        role="button"
        tabIndex={0}
        className={`group relative flex items-start gap-2.5 rounded-lg border bg-white dark:bg-slate-800 p-2.5 transition-all cursor-pointer ${
          task.completed 
            ? 'border-slate-100 dark:border-slate-700 opacity-60' 
            : 'border-slate-150 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-sm'
        }`}
        onClick={() => onOpenDetail?.(task)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenDetail?.(task);
          }
        }}
      >
        {/* Left color indicator */}
        <div 
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
          style={{ backgroundColor: task.courseColor || typeColor }}
        />
        
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleComplete?.(task.id);
          }}
          className={`ml-1 mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-all ${
            task.completed
              ? 'border-purple-500 bg-purple-500 text-white'
              : 'border-slate-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500'
          }`}
        >
          {task.completed && <Check size={10} strokeWidth={3} />}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-medium leading-tight ${
            task.completed 
              ? 'text-slate-400 dark:text-slate-500 line-through' 
              : 'text-slate-800 dark:text-slate-100'
          }`}>
            {task.title}
          </p>
          
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {dueLabel && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                <Clock size={10} />
                {dueLabel}
              </span>
            )}
            {task.course && (
              <span
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ 
                  color: task.courseColor || '#6366f1', 
                  backgroundColor: `${task.courseColor || '#6366f1'}12` 
                }}
              >
                {task.course}
              </span>
            )}
            {task.type && (
              <span 
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium capitalize"
                style={{ color: typeColor, backgroundColor: `${typeColor}12` }}
              >
                {task.type}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBucket = (title, tasks, emptyLabel) => (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <span className="text-xs text-slate-500 dark:text-slate-400">{tasks.length} items</span>
      </div>
      {tasks.length ? (
        <div className="space-y-2">{tasks.map((task) => renderTaskRow(task))}</div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">{emptyLabel}</p>
      )}
    </div>
  );

  return (
    <section className="rounded-2xl border border-purple-100 dark:border-purple-700 bg-white dark:bg-slate-800 px-4 py-5 shadow-sm hover:shadow-md transition-shadow" style={statFontStyle}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{rangeLabel}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-purple-100 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/30 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
            Updates daily
          </span>
          <button
            type="button"
            onClick={() => onQuickAdd && onQuickAdd()}
            className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-sm font-semibold text-white transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add task
          </button>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {weekDays.map((day) => (
          <div
            key={day.key}
            className={`min-w-[220px] flex-1 rounded-2xl border px-4 py-4 shadow-sm transition-all ${
              day.isToday ? 'border-purple-200 dark:border-purple-600 bg-purple-50/60 dark:bg-purple-900/20' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{day.weekday}, {day.monthDay}</p>
              </div>
              {day.isToday ? (
                <span className="rounded-full bg-purple-600/10 dark:bg-purple-900/30 px-3 py-1 text-[10px] font-semibold tracking-wide text-purple-700 dark:text-purple-300">Today</span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {day.tasks.length ? `${day.tasks.length} planned` : 'No tasks scheduled'}
            </p>
            <div className="mt-3 space-y-2">
              {day.tasks.length ? (
                day.tasks.map((task) => renderTaskRow(task))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-600 px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  Free block — add something inspiring
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};


const LecturesTab = ({ groups = [], syncing = false }) => {
  if (!groups.length) {
    return (
      <section className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400 shadow-sm">
        {syncing ? 'Syncing lecture data…' : 'No lectures detected yet. Connect your timetable or refresh to pull sessions.'}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{groups.length} module{groups.length === 1 ? '' : 's'}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Auto-synced from timetable</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => {
          const nextSession = group.nextSession;
          const upcomingSessions = group.sessions.slice(0, 3);
          return (
            <div key={group.courseId || group.courseName} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
              {/* Module Header with Color Badge */}
              <div className="mb-4 flex items-center gap-2">
                <div 
                  className="rounded-lg px-2.5 py-1 text-xs font-bold"
                  style={{ 
                    backgroundColor: `${group.color || '#a855f7'}15`,
                    color: group.color || '#a855f7'
                  }}
                >
                  {group.courseCode || 'N/A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{group.courseName}</p>
                </div>
              </div>

              {/* Next Session */}
              {nextSession ? (
                <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 px-3 py-3">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">Next Session</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">{nextSession.title}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Clock3 size={12} className="text-slate-400 dark:text-slate-500" />
                    <span>{formatShortDate(nextSession.start)} · {formatTimeRange(nextSession.start, nextSession.end)}</span>
                  </div>
                </div>
              ) : (
                <div className="mb-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-600 px-3 py-4 text-center">
                  <p className="text-xs text-slate-400 dark:text-slate-500">No upcoming sessions</p>
                </div>
              )}

              {/* Schedule List - All in boxes */}
              {upcomingSessions.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">Schedule</p>
                  <div className="space-y-2">
                    {upcomingSessions.map((session, idx) => (
                      <div key={session.id || idx} className="rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate">{session.title}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{formatShortDate(session.start)}</p>
                          </div>
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 ml-2 whitespace-nowrap">{formatTimeRange(session.start, session.end)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
      // If there are 3 widgets and this is the last one, span full width
      const isLastOddWidget = order.length === 3 && index === 2;
      return (
        <div key={widgetId} className={isLastOddWidget ? 'lg:col-span-2' : ''}>
          {renderWidget()}
        </div>
      );
    })
    .filter(Boolean);
  return (
    <section className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 backdrop-blur-sm p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
          <Lightbulb size={14} className="text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quick Insights</h3>
      </div>
      
      {/* Compact stat row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Next Due */}
        <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-800 p-3 border border-purple-100 dark:border-purple-800/50 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
          <div className="flex items-center gap-1.5 mb-1.5">
            <CalendarDays size={12} className="text-purple-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">Next Due</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{insightSummary.nextTask?.title || 'No deadlines'}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{insightSummary.nextTask?.timeLabel || '—'}</p>
        </div>
        
        {/* Overdue */}
        <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-800 p-3 border border-rose-100 dark:border-rose-800/50 hover:border-rose-300 dark:hover:border-rose-600 transition-colors">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle size={12} className="text-rose-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">Overdue</span>
          </div>
          <p className={`text-xl font-bold ${insightSummary.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{insightSummary.overdue}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{insightSummary.overdue ? 'Needs attention' : 'All clear'}</p>
        </div>
        
        {/* Pending */}
        <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-800 p-3 border border-amber-100 dark:border-amber-800/50 hover:border-amber-300 dark:hover:border-amber-600 transition-colors">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ClipboardList size={12} className="text-amber-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">Pending</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{insightSummary.pendingTasks}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{insightSummary.pendingTasks ? 'Not started' : 'All clear'}</p>
        </div>
      </div>
      
      {widgets.length ? (
        <details className="group text-sm" open>
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-3 select-none">
            <ChevronRight size={14} className="transition duration-200 group-open:rotate-90" />
            More Insights
          </summary>
          <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:items-start lg:gap-3">
            {widgets}
          </div>
        </details>
      ) : null}
    </section>
  );
};
export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const hideTimersRef = useRef({});
  const [recentlyCompleted, setRecentlyCompleted] = useState([]); // { id, title, ts }
  const HIDE_GRACE_MS = 8 * 1000;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [composerValue, setComposerValue] = useState('');
  const [composerError, setComposerError] = useState(null);
  const [openGroups, setOpenGroups] = useState(() =>
    listSections.reduce((acc, section) => {
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

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const [modules, setModules] = useState([]);
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const attendanceFetchedRef = useRef(new Set());
  const hasLoadedTasksRef = useRef(false);
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
    const firstLoad = !hasLoadedTasksRef.current;
    try {
      if (firstLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setDataError(null);
      const [taskPayload, eventsPayload, coursesPayload] = await Promise.all([
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
      ]);

      const rawTasks = Array.isArray(taskPayload?.tasks)
        ? taskPayload.tasks
        : Array.isArray(taskPayload?.events)
        ? taskPayload.events
        : Array.isArray(taskPayload)
        ? taskPayload
        : [];
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
          // Silently fail - optimistic update already applied
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
      }
    },
    [loadUnifiedData]
  );

  const detectedDate = useMemo(() => parseNaturalLanguageDate(composerValue), [composerValue]);

  const buckets = useMemo(() => buildListBuckets(actionableTasks), [actionableTasks]);
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
      : 'No lecture scheduled';
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
        label: 'Next Lecture',
        value: nextLecture ? nextLecture.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—',
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
      acc[column.id] = actionableTasks.filter((task) => {
        const status = normalizeStatus(task.status, task.completed);
        if (column.id === 'done') return status === 'done' || task.completed;
        if (task.completed) return false;
        return status === column.id;
      });
      return acc;
    }, {});
  }, [actionableTasks]);

  const weekAnchorDate = useMemo(() => getStartOfDay(new Date()), []);
  const currentWeekEnd = useMemo(() => addDays(weekAnchorDate, 7), [weekAnchorDate]);
  const upcomingRangeEnd = useMemo(() => addDays(currentWeekEnd, 7), [currentWeekEnd]);

  const weekTasksByDate = useMemo(() => {
    return actionableTasks.reduce((acc, task) => {
      const due = toDateSafe(task.dueDate);
      if (!due) return acc;
      const key = toYMDLocal(due);
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {});
  }, [actionableTasks]);

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
    return actionableTasks
      .filter((task) => {
        const due = toDateSafe(task.dueDate);
        if (!due) return false;
        return due >= currentWeekEnd && due < upcomingRangeEnd;
      })
      .sort(sortByDueDate);
  }, [actionableTasks, currentWeekEnd, upcomingRangeEnd]);

  const weekLaterTasks = useMemo(() => {
    return actionableTasks
      .filter((task) => {
        const due = toDateSafe(task.dueDate);
        if (!due) return true;
        return due >= upcomingRangeEnd;
      })
      .sort(sortByDueDate);
  }, [actionableTasks, upcomingRangeEnd]);

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

  const handleToggleComplete = useCallback(
    (taskId) => {
      const current = tasks.find((task) => task.id === taskId);
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
              // Do not toggle any hiddenCompleted state here — completed visibility is determined by the task's `completed` flag.
            }, HIDE_GRACE_MS);
          }
        } catch (e) {}
      } else {
        // If unchecking, ensure any pending recentlyCompleted entries are cleared
        try { if (hideTimersRef && hideTimersRef.current && hideTimersRef.current[String(taskId)]) { clearTimeout(hideTimersRef.current[String(taskId)]); delete hideTimersRef.current[String(taskId)]; } } catch (e) {}
        setRecentlyCompleted(prev => prev.filter(p => String(p.id) !== String(taskId)));
      }
    },
    [optimisticTaskUpdate, persistTaskUpdate, tasks]
  );

  const undoRecentlyCompleted = useCallback((taskId) => {
    try { if (hideTimersRef && hideTimersRef.current && hideTimersRef.current[String(taskId)]) { clearTimeout(hideTimersRef.current[String(taskId)]); delete hideTimersRef.current[String(taskId)]; } } catch (e) {}
    // Optimistically uncomplete and persist
    optimisticTaskUpdate(taskId, { completed: false });
    persistTaskUpdate(taskId, { completed: false });
    setRecentlyCompleted(prev => prev.filter(p => String(p.id) !== String(taskId)));
  }, [optimisticTaskUpdate, persistTaskUpdate]);

  const handleQuickAction = useCallback(
    (taskId, actionId) => {
      const task = tasks.find((item) => item.id === taskId);
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
      }
      if (!Object.keys(updates).length) return;
      optimisticTaskUpdate(taskId, updates);
      persistTaskUpdate(taskId, updates);
    },
    [optimisticTaskUpdate, persistTaskUpdate, tasks]
  );

  const handleFieldUpdate = useCallback(
    (taskId, updates) => {
      if (!updates || !Object.keys(updates).length) return;
      optimisticTaskUpdate(taskId, updates);
      persistTaskUpdate(taskId, updates);
      
      // If reminder is being set, schedule a notification
      if (updates.reminder) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          scheduleNotification({ ...task, reminder: updates.reminder });
        }
      }
    },
    [optimisticTaskUpdate, persistTaskUpdate, tasks]
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
        myDay: meta.myDay ?? true,
        addedToMyDay: meta.myDay ?? true,
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
            myDay: meta.myDay ?? true,
            addedToMyDay: meta.myDay ?? true,
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

      return { success: true };
    },
    [loadUnifiedData]
  );

  const handleComposerSubmit = useCallback(async () => {
    if (!composerValue.trim()) {
      toast.showToast('Type a task before adding', 'error');
      return;
    }
    const parsed = detectedDate;
    const cleanedTitle = parsed?.matched
      ? composerValue.replace(parsed.matched, '').replace(/\s+/g, ' ').trim() || composerValue.trim()
      : composerValue.trim();
    const dueDate = parsed?.date ? parsed.date.toISOString() : null;
    const result = await createTask({ title: cleanedTitle, dueDate });
    if (!result?.success) {
      toast.showToast(result?.error || 'Unable to create task', 'error');
      return;
    }
    toast.showToast('Task created', 'success');
    setComposerValue('');
  }, [composerValue, createTask, detectedDate, toast]);

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
        <CustomModal title="Add Task">
          <TaskDetailPanel
            mode="create"
            initialStatus={columnId}
            modules={modules}
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
    [createTask, modules, setClose, setOpen, toast]
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
        <CustomModal title="Add Task">
          <TaskDetailPanel
            mode="create"
            initialDueDate={dueDateMap[sectionId]}
            modules={modules}
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
    [createTask, modules, setClose, setOpen, toast]
  );

  const openComposerModal = useCallback(() => {
    setOpen(
      <CustomModal title="Add Task">
        <TaskDetailPanel
          mode="create"
          modules={modules}
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
  }, [createTask, modules, setClose, setOpen, toast]);

  const openTaskDetail = useCallback(
    (task) => {
      if (!task) return;
      
      // Create a wrapper component to manage modal state
      const TaskDetailModal = () => {
        const [isStarred, setIsStarred] = React.useState(Boolean(task.important));
        const [hasReminder, setHasReminder] = React.useState(Boolean(task.dueDate || task.reminder));
        
        const handleStarClick = () => {
          const newValue = !isStarred;
          setIsStarred(newValue);
          handleFieldUpdate(task.id, { important: newValue });
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
            isStarred={isStarred}
            hasReminder={hasReminder}
            onStarClick={handleStarClick}
            onClockClick={handleClockClick}
            headerActions={
              <div className="relative group">
                <button
                  aria-label="More options"
                  className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <MoreVertical size={18} />
                </button>
                <div className="absolute right-0 top-full mt-1 hidden w-48 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg group-focus-within:block z-50">
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await handleDeleteTask(task.id);
                      if (result?.success) {
                        setClose();
                      }
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
                // Update local state if important changes
                if ('important' in updates) {
                  setIsStarred(updates.important);
                }
                // Update reminder state if dueDate changes
                if ('dueDate' in updates) {
                  setHasReminder(Boolean(updates.dueDate));
                }
              }}
              onTagsChange={handleTagsChange}
              onDeleteTask={handleDeleteTask}
              modules={modules}
              setOpen={setOpen}
              setClose={setClose}
              toast={toast}
            />
          </CustomModal>
        );
      };
      
      setOpen(<TaskDetailModal />);
    },
    [handleDeleteTask, handleFieldUpdate, handleQuickAction, handleStatusChange, handleTagsChange, handleToggleComplete, modules, setClose, setOpen, toast]
  );

  return (
    <HygraphSidebar pageName="Tasks">
      <>
      <Head>
        <title>Tasks | StraturaOS</title>
      </Head>
      <div className={`${ds.pageBg} px-2 sm:px-4 py-4 sm:py-6 text-slate-900 dark:text-white`}>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2 pb-16">
          {/* ─────────── Hero Header Band ─────────── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-700 dark:via-purple-800 dark:to-purple-900 p-6 sm:p-8 mb-2 shadow-xl shadow-purple-500/10 dark:shadow-purple-900/30">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/2" />
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                  <ListTodo className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Tasks</h1>
                  <p className="text-purple-100 dark:text-purple-200 text-sm mt-1">Manage your assignments & to-dos</p>
                </div>
              </div>
              <button 
                onClick={openComposerModal}
                className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 border border-white/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Stats row - below hero, matching overview style */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="group relative bg-white dark:bg-[#12121a] rounded-2xl p-5 border border-gray-200/60 dark:border-white/5 hover:border-purple-300 dark:hover:border-purple-800/50 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 transition-transform duration-200 group-hover:scale-105">
                  <AlarmClock className="w-5 h-5 text-rose-600 dark:text-rose-400" strokeWidth={2} />
                </div>
                <div className="text-right flex-1 min-w-0">
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{metrics.overdue}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Overdue</p>
              </div>
            </div>
            <div className="group relative bg-white dark:bg-[#12121a] rounded-2xl p-5 border border-gray-200/60 dark:border-white/5 hover:border-purple-300 dark:hover:border-purple-800/50 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 transition-transform duration-200 group-hover:scale-105">
                  <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                </div>
                <div className="text-right flex-1 min-w-0">
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{metrics.today}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Today</p>
              </div>
            </div>
            <div className="group relative bg-white dark:bg-[#12121a] rounded-2xl p-5 border border-gray-200/60 dark:border-white/5 hover:border-purple-300 dark:hover:border-purple-800/50 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 transition-transform duration-200 group-hover:scale-105">
                  <ListTodo className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                </div>
                <div className="text-right flex-1 min-w-0">
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{actionableTasks.length}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Active</p>
              </div>
            </div>
            <div className="group relative bg-white dark:bg-[#12121a] rounded-2xl p-5 border border-gray-200/60 dark:border-white/5 hover:border-purple-300 dark:hover:border-purple-800/50 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 transition-transform duration-200 group-hover:scale-105">
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                </div>
                <div className="text-right flex-1 min-w-0">
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{completedThisWeek}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Done (7d)</p>
              </div>
            </div>
          </div>

          {notificationPermission === 'default' && (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/20 px-5 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Enable task reminders</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300/80">Get browser notifications for your upcoming tasks</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const granted = await requestNotificationPermission();
                  setNotificationPermission(granted ? 'granted' : 'denied');
                  if (granted) {
                    initializeNotifications(tasks);
                  }
                }}
                className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm"
              >
                Enable
              </button>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#12121a] px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 shadow-sm backdrop-blur-sm">
                <Loader2 size={16} className="animate-spin text-purple-500" />
                <span>Fetching planner data…</span>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <ViewSwitcher mode={viewMode} onChange={setViewMode} />
              {viewMode === 'board' && (
                <BoardColumnToggle hideLaterColumn={hideLaterColumn} onToggleHideLater={toggleHideLaterColumn} />
              )}
            </div>
            {dataError ? (
              <div className="rounded-[28px] border border-amber-100 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-5 py-3 text-sm text-amber-700 dark:text-amber-300 shadow-sm">
                {dataError}
                {usingSampleTasks ? ' Using placeholder tasks until the API responds.' : ''}
              </div>
            ) : null}
            {/* Empty state when no tasks */}
            {!loading && tasks.length === 0 && !usingSampleTasks && !dataError ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                  <ClipboardList className="w-10 h-10 text-purple-500 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No tasks yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm mb-6">
                  Start by creating your first task. You can add assignments, exams, projects, or any other academic work to track.
                </p>
                <button
                  onClick={openComposerModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors shadow-sm"
                >
                  <Plus size={18} />
                  Create your first task
                </button>
              </div>
            ) : null}
            {viewMode === 'list' && (tasks.length > 0 || usingSampleTasks) ? (
              <div className="grid gap-3 grid-cols-1 items-start md:grid-cols-2 xl:grid-cols-3">
                {listSections.map((section) => (
                  <TaskGroup
                    key={section.id}
                    sectionId={section.id}
                    tasks={sectionTasks[section.id] || []}
                    isOpen={Boolean(openGroups[section.id])}
                    onToggle={toggleGroup}
                    onToggleComplete={handleToggleComplete}
                    onQuickAction={handleQuickAction}
                    onOpenDetail={openTaskDetail}
                    onQuickAdd={handleQuickAddToSection}
                  />
                ))}
              </div>
            ) : null}
            {viewMode === 'week' && (tasks.length > 0 || usingSampleTasks) ? (
              <WeekPlanner
                rangeLabel={weekRangeLabel}
                weekDays={weekDays}
                upcoming={weekUpcomingTasks}
                later={weekLaterTasks}
                onOpenDetail={openTaskDetail}
                onToggleComplete={handleToggleComplete}
                onQuickAdd={openComposerModal}
              />
            ) : null}
            {viewMode === 'board' && (tasks.length > 0 || usingSampleTasks) ? (
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
            ) : null}
            {viewMode === 'lectures' ? <LecturesTab groups={lectureGroups} syncing={loading} /> : null}
            
            <InsightsPanel insightSummary={insightSummary} widgetFactory={widgetFactory} order={insightWidgetOrder} />
            <RecentlyCompletedPills items={recentlyCompleted} onUndo={undoRecentlyCompleted} />
          </div>
        </div>
        
        {/* Floating Action Button */}
        <button
          onClick={openComposerModal}
          aria-label="Add new task"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 hover:shadow-xl active:scale-95 transition-all duration-200 sm:h-16 sm:w-16"
        >
          <Plus size={28} className="sm:hidden" />
          <Plus size={32} className="hidden sm:block" />
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
        <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg">
          <div className="text-sm text-slate-700 dark:text-slate-200 max-w-[220px] truncate">{item.title}</div>
          <button onClick={() => onUndo(item.id)} className="text-sm font-semibold text-blue-600 dark:text-blue-400">Undo</button>
        </div>
      ))}
    </div>
  );
}

