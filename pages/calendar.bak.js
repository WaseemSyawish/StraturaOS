import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight, Trash2, Edit3, Clock, MapPin } from 'lucide-react';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function toYMD(d) {
  if (!d) return '';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try {
    const date = d instanceof Date ? d : new Date(d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch (e) {
    return '';
  }
}

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

    return days;
  };

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

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

  const handleDeleteEvent = (id) => {
    setEvents(prev => prev.filter(ev => ev.id !== id));
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
        const res = await fetch('/api/events');
        if (!res.ok) return;
        const payload = await res.json().catch(() => null);
        const list = Array.isArray(payload?.events) ? payload.events : (Array.isArray(payload) ? payload : []);
        if (cancelled) return;
        const normalized = list.map(e => ({
          id: String(e.id),
          title: e.title || 'Untitled',
          date: (e.date && typeof e.date === 'string') ? (e.date.length >= 10 ? e.date.slice(0, 10) : e.date) : (e.date ? e.date : ''),
          startTime: e.time || e.startTime || '',
          endTime: e.endTime || '',
          type: e.type || 'event',
          location: e.location || '',
          description: e.description || '',
          color: (e.type === 'class' || e.type === 'lecture') ? '#8B5CF6' : (e.type === 'deadline' ? '#EF4444' : (e.color || '#3B82F6'))
        }));
        setEvents(normalized);
      } catch (err) {
        console.warn('Could not load events from server', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <header className="border-b border-purple-100/50 bg-gradient-to-b from-white to-purple-50/30 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5 text-purple-600" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-semibold text-slate-800">Calendar</h1>
          </div>

          <button className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl font-medium text-sm transition-all duration-200 flex items-center gap-2 shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/30">
            <Plus className="w-4 h-4" strokeWidth={3} />
            <span>New Event</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200/60 flex items-center justify-between bg-gradient-to-r from-white via-blue-50/20 to-white">
                <div className="flex items-center gap-3">
                  <button onClick={() => navigateMonth(-1)} className="hover:bg-purple-100 hover:text-purple-700 transition-colors rounded-lg h-10 w-10 flex items-center justify-center">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-purple-600 to-purple-700">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </div>
                  <button onClick={() => navigateMonth(1)} className="hover:bg-purple-100 hover:text-purple-700 transition-colors rounded-lg h-10 w-10 flex items-center justify-center">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <button 
                  onClick={() => { 
                    const t = new Date(); 
                    setCurrentDate(t); 
                    setSelectedDate(toYMD(t)); 
                  }} 
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/30 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Today</span>
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-7 gap-4 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-sm font-semibold uppercase tracking-wider text-slate-600 py-2">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-3">
                  {days.map((day, idx) => {
                    const dayEvents = getEventsForDate(day.date);
                    const holiday = isHoliday(day.date);
                    const today = isToday(day.date);
                    const isSelected = selectedDate && toYMD(day.date) === selectedDate;

                    return (
                      <div
                        key={idx}
                        onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                        className={`min-h-[120px] p-3 border-2 rounded-xl cursor-pointer transition-all duration-150 ${
                          day.isCurrentMonth
                            ? (isSelected
                              ? 'bg-white border-purple-400 shadow-md shadow-purple-100/50'
                              : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-md hover:shadow-purple-100/50')
                            : 'bg-slate-50/50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`text-base font-bold ${
                            !day.isCurrentMonth ? 'text-slate-400' :
                            today ? 'text-white bg-gradient-to-br from-purple-600 to-purple-700 w-7 h-7 rounded-lg flex items-center justify-center shadow-md text-sm' :
                            'text-slate-800'
                          }`}>
                            {day.date.getDate()}
                          </div>
                        </div>

                        {holiday && (
                          <div className="mb-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full" />
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5">
                          {dayEvents.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className="w-2 h-2 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: item.color }}
                              title={item.title}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs font-semibold text-purple-600 bg-purple-50 px-1.5 rounded-full">
                              +{dayEvents.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <aside className="w-96 flex-shrink-0">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden sticky top-24">
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 text-white">
                <div className="text-sm font-medium opacity-90 mb-1">Selected Day</div>
                <div className="text-xl font-bold">{formatSelectedDate()}</div>
                <div className="text-sm opacity-80 mt-2">
                  {(() => {
                    const evs = getEventsForDate(selectedDate || '');
                    return evs.length ? `${evs.length} event${evs.length > 1 ? 's' : ''}` : 'No events scheduled';
                  })()}
                </div>
              </div>

              <div className="p-6 max-h-[600px] overflow-y-auto">
                {selectedDate ? (
                  (() => {
                    const evs = getEventsForDate(selectedDate);
                    const hol = isHoliday(selectedDate);

                    if (evs.length === 0 && !hol) {
                      return (
                        <div className="text-center py-12 text-slate-400">
                          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <p className="text-sm font-medium text-slate-600">No events scheduled</p>
                          <p className="text-xs mt-1 text-slate-500">Click New Event to add one</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {hol && (
                          <div className="p-4 rounded-xl bg-amber-50 border-l-4 border-amber-500">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full" />
                              <div className="text-sm font-semibold text-amber-900">{hol.name}</div>
                            </div>
                          </div>
                        )}

                        {evs.map(ev => (
                          <div 
                            key={ev.id} 
                            className="group p-4 rounded-xl border-l-4 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md"
                            style={{ borderLeftColor: ev.color }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-900 mb-2">{ev.title}</div>

                                {ev.startTime && (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="font-medium">{ev.startTime}</span>
                                    {ev.endTime && <span>- {ev.endTime}</span>}
                                  </div>
                                )}

                                {ev.location && (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{ev.location}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="h-8 w-8 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
                                  <Edit3 className="w-4 h-4 text-blue-600" />
                                </button>
                                <button onClick={() => handleDeleteEvent(ev.id)} className="h-8 w-8 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors">
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">Select a date</p>
                    <p className="text-xs mt-1 text-slate-500">Click any day on the calendar</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
