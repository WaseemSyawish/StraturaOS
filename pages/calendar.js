import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { Calendar, Plus, ChevronLeft, ChevronRight, Trash2, Edit3, Clock, MapPin } from 'lucide-react';
import AddEventModal from '@/components/schedule/_modals/add-event-modal';
import CustomModal from '@/components/ui/custom-modal';
import { useModal } from '@/providers/modal-context';
import { toYMDLocal } from '@/lib/dateHelpers';
import HygraphSidebar from '@/components/HygraphSidebar';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Layout constants (extracted here so other parts of this file can use them)
const HEADER_HEIGHT = '4rem'; // matches h-16
const HEADER_HEIGHT_TAILWIND = 'h-16';
const ASIDE_WIDTH_CLASS = 'w-96';
// slightly less wide than before; tweak: slightly narrower
const CONTAINER_MAX_WIDTH_CLASS = 'max-w-[1450px]';
// grid rows will be determined dynamically (5 or 6) based on month length
const DAYS_GRID_AUTO_ROWS = '1fr';

const toYMD = (d) => toYMDLocal(d);

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toYMD(new Date()));

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();
    const days = [];

    for (let i = 0; i < startWeekday; i++) {
      const d = new Date(year, month, i - startWeekday + 1);
      days.push({ date: d, isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    const lastWeekday = lastDay.getDay();
    const trailingDays = lastWeekday === 6 ? 0 : (6 - lastWeekday);
    for (let i = 1; i <= trailingDays; i++) {
      const next = new Date(year, month + 1, i);
      days.push({ date: next, isCurrentMonth: false });
    }

    // Ensure we always have 5 rows (35 cells) so the calendar height is consistent
    // across months. If days length is less than 35, pad with additional next-month days.
    if (days.length < 35) {
      // Start padding from the day after the last trailing day we already added.
      let nextDay = (trailingDays || 0) + 1;
      while (days.length < 35) {
        const next = new Date(year, month + 1, nextDay);
        days.push({ date: next, isCurrentMonth: false });
        nextDay += 1;
      }
    }

    // If the month would normally occupy 6 rows (more than 35 cells), keep them.
    // We no longer trim; the grid will expand to 6 rows when needed.

    return days;
  };

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  // choose 6 rows when month requires more than 35 cells, otherwise 5 rows
  const gridRowsCount = days.length > 35 ? 6 : 5;
  const gridStyle = { gridTemplateRows: `repeat(${gridRowsCount}, 1fr)` };

  const getEventsForDate = (date) => {
    const ymd = toYMD(date);
    return events.filter(ev => toYMD(ev.date) === ymd).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  };

  const isHoliday = (date) => {
    const ymd = toYMD(date);
    if (Array.isArray(holidays) && holidays.length) return holidays.find(h => String(h.date) === ymd) || null;
    return null;
  };

  const isToday = (date) => toYMD(date) === toYMD(new Date());

  const navigateMonth = (dir) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1));

  const handleDateClick = (date) => {
    const ymd = toYMD(date);
    setSelectedDate(ymd);
  };

  // Fetch events from server and normalize
  const loadEvents = useCallback(async (forceRefresh = false) => {
    try {
      // Try client cache first to avoid waiting for server on quick navigations
      let list = null;
      if (!forceRefresh) {
        try {
          const cacheMod = await import('@/lib/clientCache');
          const getCached = cacheMod.getCached;
          list = getCached('/api/events');
        } catch (e) { /* ignore cache errors */ }
      }
      if (!Array.isArray(list)) {
        const res = await fetch('/api/events', { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) return;
        const payload = await res.json().catch(() => null);
        list = Array.isArray(payload?.events) ? payload.events : (Array.isArray(payload) ? payload : []);
        try { 
          const cacheMod2 = await import('@/lib/clientCache'); 
          cacheMod2.setCached('/api/events', list, 60 * 1000); 
        } catch (e) {}
      }
      // compute final instant for an event (tries several fallbacks)
      const computeFinalInstant = (ev) => {
        try {
          const rawEnd = ev.endDate || ev.end_date || (ev.raw && (ev.raw.endDate || ev.raw.end_date));
          if (rawEnd) {
            const s = String(rawEnd);
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
              const [y, m, d] = s.split('-').map(Number);
              return new Date(y, (m || 1) - 1, d, 23, 59, 59, 999);
            }
            const d = new Date(String(rawEnd));
            if (!isNaN(d.getTime())) return d;
          }

          const endTime = ev.endTime || (typeof ev.time === 'string' && ev.time.includes('-') ? (ev.time.split('-')[1] || '').trim() : null);
          const dateStr = ev.date || (ev.startDate ? String(ev.startDate).slice(0, 10) : null);
          if (endTime && dateStr) {
            const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
            const [hh, mm] = String(endTime).split(':').map(Number);
            return new Date(y, (m || 1) - 1, d, Number.isFinite(hh) ? hh : 23, Number.isFinite(mm) ? mm : 59, 59, 999);
          }

          if (ev.startDate && (typeof ev.durationMinutes !== 'undefined' || typeof ev.duration !== 'undefined')) {
            const s = new Date(String(ev.startDate));
            if (!isNaN(s.getTime())) {
              const dur = Number(ev.durationMinutes ?? ev.duration ?? 0);
              if (!Number.isNaN(dur) && dur > 0) return new Date(s.getTime() + Math.round(dur) * 60000);
              return s;
            }
          }

          if (dateStr) {
            const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
            return new Date(y, (m || 1) - 1, d, 23, 59, 59, 999);
          }

          if (endTime) {
            const now = new Date();
            const [hh, mm] = String(endTime).split(':').map(Number);
            return new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number.isFinite(hh) ? hh : 23, Number.isFinite(mm) ? mm : 59, 59, 999);
          }

          return null;
        } catch (err) { return null; }
      };

      const nowTs = Date.now();

      const normalized = list
        .map(e => {
          // determine if deadline/assignment is expired and mark it
          const final = computeFinalInstant(e);
          const isExpired = final ? (final.getTime() <= nowTs) : false;
          return { e, isExpired };
        })
  // hide expired or completed deadlines/assignments from calendar view
  .filter(x => !(x.e && (x.e.type === 'deadline' || x.e.type === 'assignment') && (x.isExpired || !!x.e.completed)))
        .map(x => x.e)
        .map(e => {
        // Prefer the server-provided `date` (YYYY-MM-DD) when available. If not,
        // derive from startDate (ISO) using the local-preserving helper to avoid
        // timezone-induced shifts.
        let dateStr = '';
        try {
          if (e && typeof e.date === 'string' && e.date.length >= 10) dateStr = e.date.slice(0,10);
          else if (e && e.startDate) dateStr = toYMD(e.startDate);
          else if (e && e.date) dateStr = String(e.date).slice(0,10);
        } catch (err) { dateStr = e && e.date ? String(e.date).slice(0,10) : ''; }
        return {
          id: String(e.id),
          title: e.title || 'Untitled',
          date: dateStr,
          startTime: e.time || e.startTime || '',
          endTime: e.endTime || '',
          type: e.type || 'event',
          location: e.location || '',
          description: e.description || '',
          courseName: e.courses?.name || '',
          courseCode: e.courses?.code || '',
          color: e.courses?.color || (e.type === 'class' || e.type === 'lecture') ? '#8B5CF6' : (e.type === 'deadline' ? '#EF4444' : (e.color || '#3B82F6'))
        };
      });
      setEvents(normalized);
    } catch (err) {
      console.warn('Could not load events from server', err);
    }
  }, []);

  useEffect(() => { loadEvents(); }, []);

  // use the project's modal provider so we can open the existing AddEventModal
  const modalCtx = useModal();
  const { setOpen, isOpen } = modalCtx;

  // When AddEventModal or any add-event edit modal closes, refresh events
  const prevModalOpenRef = useRef(false);
  useEffect(() => {
    // Check if any modal is currently open
    const anyOpen = Object.keys(isOpen || {}).some(k => isOpen[k]);
    const wasOpen = prevModalOpenRef.current;
    
    // If a modal was open and is now closed, force refresh events
    if (wasOpen && !anyOpen) {
      console.log('[Calendar] Modal closed, reloading events...');
      loadEvents(true); // Force refresh, bypass cache
    }
    prevModalOpenRef.current = anyOpen;
  }, [isOpen, loadEvents]);

  const openModal = (mode, ev = null) => {
    // For 'create' open the AddEventModal and pass the selected date as default
    if (mode === 'create') {
      setOpen(
        <CustomModal title="Add Event">
          <AddEventModal />
        </CustomModal>,
        async () => ({ default: { date: selectedDate || toYMD(new Date()) } })
      );
      return;
    }

    // For edit/delete open the AddEventModal with the event as data. AddEventModal
    // contains delete controls when editing an existing event.
    if ((mode === 'edit' || mode === 'delete') && ev) {
      setOpen(
        <CustomModal title={ev.title || 'Edit Event'}>
          <AddEventModal />
        </CustomModal>,
        async () => ({ default: ev })
      );
      return;
    }
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return 'Select a date';
    const [y, m, d] = selectedDate.split('-');
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };


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
        const normalized = list.map(h => ({ date: toYMD(h.date || h.localDate || h.localName || h), name: h.localName || h.name || String(h) }));
        setHolidays(normalized);
      } catch (e) {
        console.warn('Failed to load holidays', e);
        setHolidays([]);
      }
    })();
    return () => { cancelled = true; };
  }, [currentDate]);

  return (
    <HygraphSidebar>
      <>
      <Head>
        <title>Calendar — University Planner</title>
      </Head>
      <div className="calendar-page min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className={`${CONTAINER_MAX_WIDTH_CLASS} mx-auto p-2 sm:p-4`}>
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
          <div className="flex-1 flex flex-col h-full w-full">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden flex flex-col h-full dark:bg-slate-900/80 dark:border-slate-800">
              <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-white via-blue-50/20 to-white dark:border-slate-800 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button onClick={() => navigateMonth(-1)} className="hover:bg-purple-100 hover:text-purple-700 transition-colors rounded-lg h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center dark:hover:bg-purple-500/20 dark:hover:text-purple-400 dark:text-slate-300">
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <div className="text-xl sm:text-3xl font-black text-slate-800 dark:text-slate-100" style={{ letterSpacing: '-0.02em' }}>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </div>
                  <button onClick={() => navigateMonth(1)} className="hover:bg-purple-100 hover:text-purple-700 transition-colors rounded-lg h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center dark:hover:bg-purple-500/20 dark:hover:text-purple-400 dark:text-slate-300">
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openModal('create')}
                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/30 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Event</span>
                  </button>
                  <button 
                    onClick={() => { 
                      const t = new Date(); 
                      setCurrentDate(t); 
                      setSelectedDate(toYMD(t)); 
                    }} 
                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/30 flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Today</span>
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-6 flex-1 flex flex-col min-h-0">
                <div className="grid grid-cols-7 gap-1 sm:gap-4 mb-2 sm:mb-4 flex-shrink-0">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                    <div key={d} className="text-center text-[10px] sm:text-sm font-semibold uppercase tracking-wider text-slate-600 py-1 sm:py-2 dark:text-slate-400">
                      <span className="hidden sm:inline">{d}</span>
                      <span className="sm:hidden">{d.charAt(0)}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-3 flex-1 min-h-0" style={{ gridAutoRows: '1fr', ...gridStyle }}>
                  {days.map((day, idx) => {
                    const dayEvents = getEventsForDate(day.date);
                    const holiday = isHoliday(day.date);
                    const today = isToday(day.date);
                    const isSelected = selectedDate && toYMD(day.date) === selectedDate;

                    return (
                      <div
                        key={idx}
                        onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                        className={`p-1 sm:p-2 border sm:border-2 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-150 flex flex-col min-h-0 overflow-hidden ${
                          day.isCurrentMonth
                            ? (isSelected
                              ? 'bg-white border-purple-400 shadow-md shadow-purple-100/50 dark:bg-slate-800 dark:border-purple-500 dark:shadow-purple-500/20'
                              : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-md hover:shadow-purple-100/50 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-purple-500 dark:hover:bg-slate-800')
                            : 'bg-slate-50/50 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5 sm:mb-2 flex-shrink-0">
                          <div className={`text-xs sm:text-base font-bold ${
                            !day.isCurrentMonth ? 'text-slate-400 dark:text-slate-600' :
                            today ? 'text-white bg-gradient-to-br from-purple-600 to-purple-700 w-5 h-5 sm:w-7 sm:h-7 rounded sm:rounded-lg flex items-center justify-center shadow-md text-[10px] sm:text-sm' :
                            'text-slate-800 dark:text-slate-200'
                          }`}>
                            {day.date.getDate()}
                          </div>
                          {holiday && (
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-500 rounded-full flex-shrink-0" title={holiday} />
                          )}
                        </div>

                        <div className="hidden sm:flex flex-wrap gap-1.5 overflow-hidden max-h-[2.5rem]">
                          {dayEvents.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className="w-2 h-2 rounded-full border border-white shadow-sm dark:border-slate-700 flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                              title={item.title}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs font-semibold text-purple-600 bg-purple-50 px-1.5 rounded-full dark:text-purple-400 dark:bg-purple-500/20">
                              +{dayEvents.length - 3}
                            </div>
                          )}
                        </div>
                        {/* Mobile: show event count dot */}
                        {dayEvents.length > 0 && (
                          <div className="sm:hidden flex justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden lg:sticky lg:top-24 dark:bg-slate-900/80 dark:border-slate-800" style={{ maxHeight: 'calc(100vh - 7rem)' }}>
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-4 sm:p-6 text-white flex-shrink-0">
                <div className="text-xs sm:text-sm font-medium opacity-90 mb-1">Selected Day</div>
                <div className="text-xl sm:text-2xl font-extrabold">{formatSelectedDate()}</div>
                <div className="text-xs sm:text-sm opacity-80 mt-2">
                  {(() => {
                    const evs = getEventsForDate(selectedDate || '');
                    return evs.length ? `${evs.length} event${evs.length > 1 ? 's' : ''}` : 'No events scheduled';
                  })()}
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto calendar-scrollbar-hide" style={{ maxHeight: 'calc(100vh - 20rem)' }}>
                {selectedDate ? (
                  (() => {
                    const evs = getEventsForDate(selectedDate);
                    const hol = isHoliday(selectedDate);
                    
                    if (evs.length === 0 && !hol) {
                      return (
                        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No events scheduled</p>
                          <p className="text-xs mt-1 text-slate-500 dark:text-slate-500">Click New Event to add one</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                          {hol && (
                            <div className="p-4 rounded-xl bg-amber-50 border-l-4 border-amber-500 dark:bg-amber-500/10 dark:text-amber-400">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                <div className="text-sm font-semibold text-amber-900 dark:text-amber-400">{hol.name}</div>
                              </div>
                            </div>
                          )}
                        
                          {evs.map(ev => (
                            <div 
                              key={ev.id} 
                              className="group p-4 rounded-xl border-2 hover:shadow-lg transition-all duration-200 dark:hover:shadow-slate-900/50"
                              style={{ 
                                borderColor: ev.color,
                                backgroundColor: `${ev.color}${typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '15' : '08'}`
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-bold text-slate-900 mb-2 dark:text-slate-100">{ev.title}</div>
                                
                                  {ev.startTime && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1 dark:text-slate-400">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span className="font-medium">{ev.startTime}</span>
                                      {ev.endTime && <span>- {ev.endTime}</span>}
                                    </div>
                                  )}
                                
                                  {ev.location && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                      <MapPin className="w-3.5 h-3.5" />
                                      <span>{ev.location}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => openModal('edit', ev)} className="h-8 w-8 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors dark:hover:bg-blue-500/20 dark:text-blue-400">
                                    <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </button>
                                  <button onClick={() => openModal('delete', ev)} className="h-8 w-8 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors dark:hover:bg-red-500/20 dark:text-red-400">
                                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Select a date</p>
                    <p className="text-xs mt-1 text-slate-500 dark:text-slate-500">Click any day on the calendar</p>
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