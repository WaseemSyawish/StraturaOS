import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { Calendar, Plus, ChevronLeft, ChevronRight, Trash2, Edit3, Clock, MapPin, LayoutGrid, List } from 'lucide-react';
import TaskDetailPanel from '@/components/tasks/TaskDetailPanel';
import CustomModal from '@/components/ui/custom-modal';
import { useModal } from '@/providers/modal-context';
import { toYMDLocal } from '@/lib/dateHelpers';
import HygraphSidebar from '@/components/HygraphSidebar';

/* ─── Design System Constants ─── */
const ds = {
  pageBg: 'min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-[#0a0a0f] dark:via-[#0a0a0f] dark:to-[#12121a]',
  card: 'bg-white/80 dark:bg-[#12121a] rounded-2xl shadow-lg dark:shadow-2xl dark:shadow-purple-500/5 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm',
};

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CONTAINER_MAX_WIDTH_CLASS = 'max-w-[1450px]';
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM – 10 PM

const toYMD = (d) => toYMDLocal(d);

const eventTypeColors = {
  class:      { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-300 dark:border-purple-600', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  lecture:    { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-300 dark:border-purple-600', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  deadline:   { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-300 dark:border-red-600', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  exam:       { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-600', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  assignment: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-600', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  event:      { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-300 dark:border-emerald-600', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
};
const fallbackTypeColor = { bg: 'bg-slate-50 dark:bg-slate-800/40', border: 'border-slate-300 dark:border-slate-600', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' };
const getTypeStyle = (type) => eventTypeColors[type?.toLowerCase()] || fallbackTypeColor;

/* ─── Helpers ─── */
const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

const parseTime = (timeStr) => {
  if (!timeStr) return null;
  const clean = String(timeStr).split('-')[0].trim();
  const [h, m] = clean.split(':').map(Number);
  if (Number.isFinite(h)) return { hours: h, minutes: Number.isFinite(m) ? m : 0 };
  return null;
};

const formatTime12 = (h, m = 0) => {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};

const formatTimeStr = (timeStr) => {
  const t = parseTime(timeStr);
  if (!t) return timeStr || '';
  return formatTime12(t.hours, t.minutes);
};

/* ─── VIEW TABS ─── */
const VIEW_OPTIONS = [
  { id: 'month', label: 'Month', icon: LayoutGrid },
  { id: 'agenda', label: 'Agenda', icon: List },
];

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────── */
export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toYMD(new Date()));
  const [view, setView] = useState('month');
  const [loading, setLoading] = useState(true);

  /* ─── Month grid calculation ─── */
  const getDaysInMonth = useCallback((date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();
    const days = [];

    for (let i = 0; i < startWeekday; i++) {
      days.push({ date: new Date(year, month, i - startWeekday + 1), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const trailingDays = (6 - lastDay.getDay()) || 0;
    for (let i = 1; i <= trailingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    while (days.length < 35) {
      days.push({ date: new Date(year, month + 1, days.length - daysInMonth - startWeekday + 1), isCurrentMonth: false });
    }
    return days;
  }, []);

  const monthDays = useMemo(() => getDaysInMonth(currentDate), [currentDate, getDaysInMonth]);
  const gridRowsCount = monthDays.length > 35 ? 6 : 5;

  /* ─── Event helpers ─── */
  const getEventsForDate = useCallback((date) => {
    const ymd = toYMD(date);
    return events.filter(ev => toYMD(ev.date) === ymd).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [events]);

  const isHoliday = useCallback((date) => {
    const ymd = toYMD(date);
    if (Array.isArray(holidays) && holidays.length) return holidays.find(h => String(h.date) === ymd) || null;
    return null;
  }, [holidays]);

  const isToday = (date) => toYMD(date) === toYMD(new Date());

  /* ─── Navigation ─── */
  const navigate = (dir) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1));
  };

  const goToToday = () => {
    const t = new Date();
    setCurrentDate(t);
    setSelectedDate(toYMD(t));
  };

  const handleDateClick = (date) => setSelectedDate(toYMD(date));

  /* ─── Load events ─── */
  const loadEvents = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      let list = null;
      if (!forceRefresh) {
        try {
          const cacheMod = await import('@/lib/clientCache');
          list = cacheMod.getCached('/api/events');
        } catch (e) { /* ignore */ }
      }
      if (!Array.isArray(list)) {
        const res = await fetch('/api/events', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
        if (!res.ok) return;
        const payload = await res.json().catch(() => null);
        list = Array.isArray(payload?.events) ? payload.events : (Array.isArray(payload) ? payload : []);
        try { const c = await import('@/lib/clientCache'); c.setCached('/api/events', list, 60000); } catch (e) {}
      }
      const nowTs = Date.now();
      const normalized = list
        .filter(e => !((e.type === 'deadline' || e.type === 'assignment') && (e.completed || (e.endDate && new Date(e.endDate).getTime() <= nowTs))))
        .map(e => {
          let dateStr = '';
          try {
            if (e.startDate) dateStr = toYMD(e.startDate);
            else if (typeof e.date === 'string' && e.date.length >= 10) dateStr = e.date.slice(0, 10);
            else if (e.date) dateStr = String(e.date).slice(0, 10);
          } catch (err) { dateStr = e.date ? String(e.date).slice(0, 10) : ''; }
          
          let startTime = e.time || e.startTime || '';
          let endTime = e.endTime || '';
          if (typeof startTime === 'string' && startTime.includes('-') && !endTime) {
            const [s, en] = startTime.split('-').map(p => p.trim());
            startTime = s;
            endTime = en || '';
          }
          
          // hasTime: true only if a time was explicitly set by the user.
          // meta.hasTime === false means the user left the time blank.
          // Timetable class events (no meta) always have real times so we check startTime.
          const hasTime = Boolean(startTime) &&
            startTime !== '00:00' &&
            startTime !== '00:00:00' &&
            (e.meta == null ? true : e.meta.hasTime !== false);

          return {
            id: String(e.id),
            title: e.title || 'Untitled',
            date: dateStr,
            startTime,
            endTime,
            hasTime,
            type: e.type || 'event',
            location: e.location || '',
            description: e.description || '',
            courseName: e.courses?.name || '',
            courseCode: e.courses?.code || '',
            color: e.courses?.color || ((e.type === 'class' || e.type === 'lecture') ? '#8B5CF6' : (e.type === 'deadline' ? '#EF4444' : (e.color || '#3B82F6')))
          };
        });
      setEvents(normalized);
    } catch (err) {
      console.warn('Could not load events', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  /* ─── Modal integration ─── */
  const { setOpen, setClose, isOpen } = useModal();
  const prevModalOpenRef = useRef(false);
  useEffect(() => {
    const anyOpen = Object.keys(isOpen || {}).some(k => isOpen[k]);
    if (prevModalOpenRef.current && !anyOpen) loadEvents(true);
    prevModalOpenRef.current = anyOpen;
  }, [isOpen, loadEvents]);

  /* ─── Task CRUD helpers ─── */
  const createTask = useCallback(async (data) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success || json.task || json.id) return { success: true, task: json.task || json };
      return { success: false, error: json.error || 'Failed to create task' };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const handleDeleteTask = useCallback(async (taskId) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      loadEvents(true);
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  }, [loadEvents]);

  const handleFieldUpdate = useCallback(async (taskId, updates) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      loadEvents(true);
    } catch (err) {}
  }, [loadEvents]);

  const openModal = useCallback((mode, ev = null) => {
    if (mode === 'create') {
      setOpen(
        <CustomModal title="" showMinimalHeader={true} size="3xl" noPadding={true}>
          <TaskDetailPanel
            mode="create"
            initialDueDate={selectedDate || toYMD(new Date())}
            setOpen={setOpen}
            setClose={setClose}
            onCreate={async (data) => {
              const result = await createTask(data);
              if (result?.success) {
                setClose();
                loadEvents(true);
              }
              return result;
            }}
            onClose={() => setClose()}
          />
        </CustomModal>
      );
    } else if ((mode === 'edit' || mode === 'delete') && ev) {
      // Map calendar event to task-like object for TaskDetailPanel
      const taskLike = {
        id: ev.id,
        title: ev.title || '',
        description: ev.description || '',
        dueDate: ev.date ? `${ev.date}T${ev.startTime || '00:00'}:00` : null,
        hasTime: ev.hasTime,
        type: ev.type || 'task',
        course: ev.courseName || null,
        courseColor: ev.color || null,
        status: 'todo',
        priority: 'not-urgent-not-important',
        tags: [],
        subtasks: [],
        meta: { hasTime: ev.hasTime },
      };
      const TaskDetailModal = () => {
        const [isStarred, setIsStarred] = React.useState(false);
        const [hasReminder, setHasReminder] = React.useState(Boolean(ev.hasTime || ev.startTime));
        const [showMenu, setShowMenu] = React.useState(false);
        const menuRef = React.useRef(null);
        React.useEffect(() => {
          if (!showMenu) return;
          const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
          };
          document.addEventListener('mousedown', handleClickOutside);
          return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [showMenu]);
        return (
          <CustomModal
            title=""
            showMinimalHeader={true}
            size="3xl"
            noPadding={true}
            isStarred={isStarred}
            hasReminder={hasReminder}
            headerActions={
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowMenu(p => !p)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-white/[0.06] transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1d] shadow-xl z-50">
                    <button
                      type="button"
                      onClick={() => { handleDeleteTask(ev.id); setClose(); }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            }
          >
            <TaskDetailPanel
              task={taskLike}
              onUpdateFields={(taskId, updates) => {
                handleFieldUpdate(taskId, updates);
                if (updates.dueDate !== undefined) setHasReminder(Boolean(updates.dueDate));
              }}
              onDeleteTask={(taskId) => { handleDeleteTask(taskId); setClose(); }}
              onToggleComplete={() => {}}
              onQuickAction={() => {}}
              onStatusChange={() => {}}
              onTagsChange={() => {}}
              setOpen={setOpen}
              setClose={setClose}
            />
          </CustomModal>
        );
      };
      setOpen(<TaskDetailModal />);
    }
  }, [selectedDate, createTask, handleDeleteTask, handleFieldUpdate, loadEvents, setClose, setOpen]);

  /* ─── Load holidays ─── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const y = currentDate.getFullYear();
        const res = await fetch(`/api/holidays?year=${encodeURIComponent(y)}&country=IQ`);
        if (!res.ok) return setHolidays([]);
        const payload = await res.json().catch(() => null);
        const list = Array.isArray(payload?.holidays) ? payload.holidays : (Array.isArray(payload) ? payload : []);
        if (cancelled) return;
        setHolidays(list.map(h => ({ date: toYMD(h.date || h.localDate || ''), name: h.localName || h.name || String(h) })));
      } catch (e) { setHolidays([]); }
    })();
    return () => { cancelled = true; };
  }, [currentDate]);

  /* ─── Header label ─── */
  const headerLabel = useMemo(() => {
    if (view === 'month') return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, [view, currentDate]);

  const formatSelectedDate = () => {
    if (!selectedDate) return 'Select a date';
    const [y, m, d] = selectedDate.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  /* ─── Agenda: upcoming 14 days ─── */
  const agendaItems = useMemo(() => {
    const items = [];
    for (let i = 0; i < 14; i++) {
      const d = addDays(currentDate, i);
      const ymd = toYMD(d);
      const dayEvents = events.filter(ev => toYMD(ev.date) === ymd).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
      const hol = isHoliday(d);
      if (dayEvents.length || hol) items.push({ date: d, ymd, events: dayEvents, holiday: hol });
    }
    return items;
  }, [currentDate, events, isHoliday]);

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  return (
    <HygraphSidebar>
      <>
        <Head><title>Calendar — StraturaOS</title></Head>
        <div className={`calendar-page ${ds.pageBg} flex flex-col`} style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <main className={`${CONTAINER_MAX_WIDTH_CLASS} mx-auto p-2 sm:p-4 flex-1 flex flex-col`}>
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch flex-1 min-h-0">

              {/* ── Main calendar panel ── */}
              <div className="flex-1 flex flex-col min-h-0 w-full">
                <div className={`${ds.card} overflow-hidden flex flex-col flex-1 min-h-0`}>

                  {/* ── Header bar ── */}
                  <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-r from-white via-slate-50/50 to-white dark:from-[#12121a] dark:via-[#16161f] dark:to-[#12121a]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button onClick={() => navigate(-1)} className="hover:bg-purple-100 hover:text-purple-700 transition-colors rounded-xl h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center dark:hover:bg-purple-500/20 dark:hover:text-purple-400 dark:text-slate-300">
                          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <div className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
                          {headerLabel}
                        </div>
                        <button onClick={() => navigate(1)} className="hover:bg-purple-100 hover:text-purple-700 transition-colors rounded-xl h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center dark:hover:bg-purple-500/20 dark:hover:text-purple-400 dark:text-slate-300">
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openModal('create')} className="px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-sm hover:shadow-md hover:shadow-purple-500/20 flex items-center gap-1.5">
                          <Plus className="w-4 h-4" /><span className="hidden sm:inline">New Event</span>
                        </button>
                        <button onClick={goToToday} className="px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />Today
                        </button>
                      </div>
                    </div>
                    {/* View switcher */}
                    <div className="flex items-center gap-1 mt-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 w-fit">
                      {VIEW_OPTIONS.map(opt => {
                        const Icon = opt.icon;
                        const active = view === opt.id;
                        return (
                          <button key={opt.id} onClick={() => setView(opt.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                            <Icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Calendar body ── */}
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {loading ? (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">Loading events...</span>
                        </div>
                      </div>
                    ) : view === 'month' ? (
                      /* ══════ MONTH VIEW ══════ */
                      <div className="p-3 sm:p-6 flex-1 flex flex-col min-h-0">
                        <div className="grid grid-cols-7 gap-1 sm:gap-4 mb-2 sm:mb-3 flex-shrink-0">
                          {WEEKDAY_LABELS.map(d => (
                            <div key={d} className="text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-1">
                              <span className="hidden sm:inline">{d}</span>
                              <span className="sm:hidden">{d.charAt(0)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1 min-h-0 auto-rows-fr" style={{ gridTemplateRows: `repeat(${gridRowsCount}, 1fr)` }}>
                          {monthDays.map((day, idx) => {
                            const dayEvents = getEventsForDate(day.date);
                            const holiday = isHoliday(day.date);
                            const today = isToday(day.date);
                            const isSel = selectedDate && toYMD(day.date) === selectedDate;

                            return (
                              <div key={idx} onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                                className={`p-1 sm:p-2 border rounded-xl cursor-pointer transition-all duration-150 flex flex-col min-h-0 overflow-hidden ${
                                  day.isCurrentMonth
                                    ? isSel
                                      ? 'bg-white border-purple-400 shadow-md shadow-purple-100/40 dark:bg-[#16161f] dark:border-purple-500/60'
                                      : 'bg-white border-slate-200/50 hover:border-purple-300 hover:shadow-sm dark:bg-[#12121a] dark:border-slate-800/50 dark:hover:border-purple-500/40'
                                    : 'bg-slate-50/40 border-slate-100/50 dark:bg-[#0a0a0f]/40 dark:border-slate-800/30 opacity-50'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-0.5 flex-shrink-0">
                                  <div className={`text-xs sm:text-sm font-bold ${!day.isCurrentMonth ? 'text-slate-400 dark:text-slate-600' : today ? 'text-white bg-purple-600 w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-[10px] sm:text-xs shadow-sm' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {day.date.getDate()}
                                  </div>
                                  {holiday && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" title={holiday.name || ''} />}
                                </div>
                                <div className="hidden sm:flex flex-col gap-0.5 overflow-hidden flex-1">
                                  {dayEvents.slice(0, 2).map(item => {
                                    const ts = getTypeStyle(item.type);
                                    return (
                                      <div key={item.id} className={`flex items-center gap-1 px-1 py-0.5 rounded text-[9px] font-semibold truncate ${ts.bg} ${ts.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ts.dot}`} />
                                        <span className="truncate">{item.title}</span>
                                      </div>
                                    );
                                  })}
                                  {dayEvents.length > 2 && (
                                    <span className="text-[9px] font-bold text-purple-500 dark:text-purple-400 pl-1">+{dayEvents.length - 2} more</span>
                                  )}
                                </div>
                                {dayEvents.length > 0 && <div className="sm:hidden flex justify-center"><div className="w-1.5 h-1.5 rounded-full bg-purple-500" /></div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* ══════ AGENDA VIEW ══════ */
                      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-3">
                        {agendaItems.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                            <Calendar className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
                            <p className="text-sm font-medium">No upcoming events</p>
                            <p className="text-xs mt-1">The next 14 days are clear</p>
                          </div>
                        ) : agendaItems.map(item => (
                          <div key={item.ymd} className="space-y-2">
                            <div className="flex items-center gap-2 sticky top-0 bg-white/90 dark:bg-[#12121a]/90 backdrop-blur-sm py-1 z-[1]">
                              <div className={`text-xs font-bold px-2 py-1 rounded-lg ${isToday(item.date) ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                {isToday(item.date) ? 'Today' : item.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </div>
                              {item.holiday && <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">{item.holiday.name}</span>}
                            </div>
                            {item.events.map(ev => {
                              const ts = getTypeStyle(ev.type);
                              return (
                                <div key={ev.id} onClick={() => openModal('edit', ev)}
                                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all hover:shadow-md ${ts.bg} ${ts.border}`}>
                                  <div className={`w-1 self-stretch rounded-full ${ts.dot}`} />
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-bold truncate ${ts.text}`}>{ev.title}</div>
                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                      {ev.hasTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTimeStr(ev.startTime)}{ev.endTime ? ` – ${formatTimeStr(ev.endTime)}` : ''}</span>}
                                      {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>}
                                    </div>
                                  </div>
                                  {ev.courseName && <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 hidden sm:block">{ev.courseName}</span>}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Sidebar ── */}
              <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:max-h-[calc(100vh-6rem)]">
                <div className={`${ds.card} overflow-hidden lg:sticky lg:top-24 flex flex-col max-h-[400px] lg:max-h-full`}>
                  <div className="bg-purple-600 dark:bg-purple-800 p-4 sm:p-6 text-white flex-shrink-0">
                    <div className="text-xs font-semibold opacity-80 mb-1 uppercase tracking-wider">Selected Day</div>
                    <div className="text-lg sm:text-xl font-extrabold">{formatSelectedDate()}</div>
                    <div className="text-xs opacity-75 mt-1.5">
                      {(() => {
                        const evs = getEventsForDate(selectedDate || '');
                        return evs.length ? `${evs.length} event${evs.length > 1 ? 's' : ''}` : 'No events scheduled';
                      })()}
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-2.5">
                    {selectedDate ? (() => {
                      const evs = getEventsForDate(selectedDate);
                      const hol = isHoliday(selectedDate);
                      if (!evs.length && !hol) return (
                        <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                          <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No events</p>
                          <p className="text-xs mt-1">Click &quot;New Event&quot; to add one</p>
                        </div>
                      );
                      return (
                        <>
                          {hol && (
                            <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-900/15 border border-amber-200/60 dark:border-amber-800/30">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
                                <div className="text-xs font-bold text-amber-800 dark:text-amber-400">{hol.name}</div>
                              </div>
                            </div>
                          )}
                          {evs.map(ev => {
                            const ts = getTypeStyle(ev.type);
                            return (
                              <div key={ev.id} className={`group p-3 rounded-xl border transition-all hover:shadow-md ${ts.bg} ${ts.border}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-bold mb-1.5 ${ts.text}`}>{ev.title}</div>
                                    {ev.hasTime && (
                                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-0.5">
                                        <Clock className="w-3 h-3 flex-shrink-0" />
                                        <span className="font-medium">{formatTimeStr(ev.startTime)}</span>
                                        {ev.endTime && <span>– {formatTimeStr(ev.endTime)}</span>}
                                      </div>
                                    )}
                                    {ev.location && (
                                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                        <MapPin className="w-3 h-3 flex-shrink-0" /><span>{ev.location}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    <button onClick={(e) => { e.stopPropagation(); openModal('edit', ev); }} className="h-7 w-7 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg flex items-center justify-center transition-colors">
                                      <Edit3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); openModal('delete', ev); }} className="h-7 w-7 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg flex items-center justify-center transition-colors">
                                      <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      );
                    })() : (
                      <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                        <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm font-medium">Select a date</p>
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </main>
        </div>
      </>
    </HygraphSidebar>
  );
}
