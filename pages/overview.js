import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, TrendingUp, Clock, CheckCircle, Check, AlertCircle, GraduationCap, Users, Plus, Home, Settings, LogOut } from 'lucide-react';

function CalendarHeader({ userName }) {
  return (
    <header className="border-b border-purple-100/50 bg-gradient-to-b from-white to-purple-50/30 sticky top-0 z-40 backdrop-blur-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/80">
      <div className="max-w-[1450px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center shadow-sm dark:from-purple-500/20 dark:to-purple-600/20">
            <Home className="w-5 h-5 text-purple-600 dark:text-purple-400" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Overview</h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = '/settings'}
            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button 
            onClick={async () => {
              try {
                try { await fetch('/api/auth/local-signout', { method: 'POST' }); } catch (e) { /* ignore */ }
                window.location.href = '/signin';
              } catch (e) {
                window.location.href = '/signout';
              }
            }}
            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function StatCard({ icon, label, value, loading }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
        {loading ? (
          <span className="inline-block w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></span>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

function Skeleton({ width = 'w-24', height = 'h-6' }) {
  return <div className={`rounded bg-slate-200 dark:bg-slate-700 ${width} ${height} animate-pulse`} />;
}

export default function UniversityOverview() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userName, setUserName] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [todayClasses, setTodayClasses] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingDeadlines, setIsLoadingDeadlines] = useState(true);

  const [courses, setCourses] = useState([]);
  const [quickStats, setQuickStats] = useState({ gpa: null, credits: null, attendanceRate: null });
  const [isLoadingQuickStats, setIsLoadingQuickStats] = useState(true);

  const [nextClassAlert, setNextClassAlert] = useState(null);
  const [completedDeadlines, setCompletedDeadlines] = useState(new Set());
  const [showCompletedDeadlines, setShowCompletedDeadlines] = useState(false);
  const [completedList, setCompletedList] = useState([]);
  const [hiddenCompleted, setHiddenCompleted] = useState(new Set());
  const hideTimersRef = React.useRef({});

  // Cleanup any pending timers when this component unmounts
  React.useEffect(() => {
    return () => {
      try { Object.values(hideTimersRef.current || {}).forEach(t => { try { clearTimeout(t); } catch(e){} }); } catch (e) {}
      hideTimersRef.current = {};
    };
  }, []);

  const [weekClassesCount, setWeekClassesCount] = useState(0);
  const [assignmentsDueCount, setAssignmentsDueCount] = useState(0);
  const [studyHoursLogged, setStudyHoursLogged] = useState(0);
  const [nextClasses, setNextClasses] = useState([]);

  const [refreshCounter, setRefreshCounter] = useState(0);

  function refreshData() {
    setRefreshCounter((c) => c + 1);
  }

  async function toggleCompletedOnServer(id, nextValue) {
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !!nextValue }) });
      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || `PATCH failed ${res.status}`);
      }
      const json = await res.json().catch(() => null);
      return json && json.event ? json.event : null;
    } catch (e) {
      console.warn('Failed to persist completed state', e);
      return null;
    }
  }

  async function toggleCompleted(id, nextValue) {
    const sid = String(id);
    // If marking completed: show check immediately, then hide the item after a brief animation, then persist
    if (nextValue) {
      // show checked state immediately
      setCompletedDeadlines(prev => { const n = new Set(prev); n.add(sid); return n; });

      // schedule hide animation then persist
      if (hideTimersRef.current[sid]) clearTimeout(hideTimersRef.current[sid]);
      hideTimersRef.current[sid] = setTimeout(async () => {
        // hide from upcoming list
        setHiddenCompleted(prev => { const n = new Set(prev); n.add(sid); return n; });

        const result = await toggleCompletedOnServer(id, true);
        if (!result) {
          // revert both completed and hidden states
          setCompletedDeadlines(prev => { const n = new Set(prev); n.delete(sid); return n; });
          setHiddenCompleted(prev => { const n = new Set(prev); n.delete(sid); return n; });
        } else {
          if (showCompletedDeadlines) await loadCompletedList();
        }

        delete hideTimersRef.current[sid];
      }, 260);

      return true;
    }

    // If unchecking: cancel any hide timer, unhide immediately and persist
    if (hideTimersRef.current[sid]) {
      clearTimeout(hideTimersRef.current[sid]);
      delete hideTimersRef.current[sid];
    }
    // unhide immediately (so it can reappear in upcoming list)
    setHiddenCompleted(prev => { const n = new Set(prev); n.delete(sid); return n; });
    // optimistic remove from completed set
    setCompletedDeadlines(prev => { const n = new Set(prev); n.delete(sid); return n; });

    const result = await toggleCompletedOnServer(id, false);
    if (!result) {
      // revert optimistic change
      setCompletedDeadlines(prev => { const n = new Set(prev); n.add(sid); return n; });
      setHiddenCompleted(prev => { const n = new Set(prev); n.add(sid); return n; });
      return false;
    }

    if (showCompletedDeadlines) await loadCompletedList();
    return true;
  }

  async function loadCompletedList() {
    try {
      const payload = await safeFetchJson('/api/events');
      const list = Array.isArray(payload?.events) ? payload.events : [];
      const items = list.filter(ev => ev && (ev.type === 'deadline' || ev.type === 'assignment') && ev.completed).map((e, i) => {
        const due = e.date ? (parseDatePreserveLocal(e.date) || buildLocalDateFromParts(String(e.date).slice(0, 10)) || new Date(String(e.date))) : null;
        return {
          id: e.id || `ev-${i}`,
          title: `${e.course ? e.course + ' - ' : ''}${e.title || e.name}`,
          dueDate: due ? due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '',
          daysLeft: due ? Math.max(0, Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0
        };
      });
      setCompletedList(items);
    } catch (e) {
      console.warn('Failed to load completed list', e);
      setCompletedList([]);
    }
  }

  async function safeFetchJson(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  function parseDatePreserveLocal(v) {
    try {
      if (!v) return null;
      if (v instanceof Date) return v;
      const s = String(v);
      if (s.length >= 10) {
        const [y, m, d] = s.slice(0, 10).split('-').map(Number);
        return new Date(y, m - 1, d);
      }
      return new Date(s);
    } catch (e) {
      return null;
    }
  }

  function buildLocalDateFromParts(ymd, time) {
    try {
      const [y, m, d] = String(ymd).split('-').map(Number);
      if (time) {
        const [h, min] = String(time).split(':').map(Number);
        return new Date(y, m - 1, d, h, min);
      }
      return new Date(y, m - 1, d);
    } catch (e) {
      return null;
    }
  }

  function toYMDLocal(date) {
    try {
      const d = date instanceof Date ? date : new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch (e) {
      return null;
    }
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsLoadingUser(true);
            // Helper to compute final instant for an event (tries multiple fallbacks)
            const computeFinalInstant = (ev) => {
              try {
                // Prefer explicit endDate (ISO)
                const rawEnd = ev.endDate || ev.end_date || (ev.raw && (ev.raw.endDate || ev.raw.end_date));
                if (rawEnd) {
                  // If date-only (YYYY-MM-DD) treat as that date at 00:00 -> interpret as end of day
                  const s = String(rawEnd);
                  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
                    const [y, m, d] = s.split('-').map(Number);
                    // end of that day
                    return new Date(y, (m || 1) - 1, d, 23, 59, 59, 999);
                  }
                  const d = new Date(String(rawEnd));
                  if (!isNaN(d.getTime())) return d;
                }

                // If there's an endTime and a date, build local date from parts
                const endTime = ev.endTime || (typeof ev.time === 'string' && ev.time.includes('-') ? (ev.time.split('-')[1] || '').trim() : null);
                const dateStr = ev.date || (ev.startDate ? String(ev.startDate).slice(0, 10) : null);
                if (endTime && dateStr) {
                  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
                  const [hh, mm] = String(endTime).split(':').map(Number);
                  return new Date(y, (m || 1) - 1, d, Number.isFinite(hh) ? hh : 23, Number.isFinite(mm) ? mm : 59, 59, 999);
                }

                // If startDate and duration exist
                if (ev.startDate && (typeof ev.durationMinutes !== 'undefined' || typeof ev.duration !== 'undefined')) {
                  const s = new Date(String(ev.startDate));
                  if (!isNaN(s.getTime())) {
                    const dur = Number(ev.durationMinutes ?? ev.duration ?? 0);
                    if (!Number.isNaN(dur) && dur > 0) return new Date(s.getTime() + Math.round(dur) * 60000);
                    return s;
                  }
                }

                // If only date present, treat as end of that day
                if (dateStr) {
                  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
                  return new Date(y, (m || 1) - 1, d, 23, 59, 59, 999);
                }

                // Fallback: try to use endTime alone on today's date
                if (endTime) {
                  const now = new Date();
                  const [hh, mm] = String(endTime).split(':').map(Number);
                  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number.isFinite(hh) ? hh : 23, Number.isFinite(mm) ? mm : 59, 59, 999);
                }

                return null;
              } catch (err) { return null; }
            };

        try {
          async function fetchMe() {
            let res = await safeFetchJson('/api/auth/me');
            if (!res && typeof window !== 'undefined') {

              const host = window.location.hostname;
              if (host === 'localhost' || host === '127.0.0.1' || host === '') {
                res = await safeFetchJson('/api/auth/me?userId=smoke_user');
              }
            }
            return res;
          }

          const me = await fetchMe();
          if (mounted && me) {
            const payloadUser = (me.user && typeof me.user === 'object') ? me.user : me;
            const resolvedName = payloadUser?.name || payloadUser?.firstName || payloadUser?.username || '';
            if (resolvedName) setUserName(resolvedName);
          }
        } finally { setIsLoadingUser(false); }

        const coursesBody = await safeFetchJson('/api/courses');
        if (mounted && coursesBody && Array.isArray(coursesBody.courses)) setCourses(coursesBody.courses);
        const resolvedCourses = Array.isArray(coursesBody?.courses) ? coursesBody.courses : (Array.isArray(courses) ? courses : []);


        setIsLoadingClasses(true);

        try {
          async function tryFetchTimetable(path) {
            let res = await safeFetchJson(path);
            if (!res && typeof window !== 'undefined') {
              const host = window.location.hostname;
              if (host === 'localhost' || host === '127.0.0.1' || host === '') {
                res = await safeFetchJson(path + (path.includes('?') ? '&' : '?') + 'userId=smoke_user');
              }
            }
            return res;
          }

          const raw = await tryFetchTimetable('/api/timetable');
          let classesSrc = [];

          if (!raw) classesSrc = [];
          else if (Array.isArray(raw)) {
            if (raw.length && raw[0] && Array.isArray(raw[0].payload)) {
              classesSrc = raw.flatMap(tpl => (Array.isArray(tpl.payload) ? tpl.payload.map(p => ({ ...p, _templateId: tpl.id })) : []));
            } else classesSrc = raw;
          } else if (raw.templates && Array.isArray(raw.templates)) {
            classesSrc = raw.templates.flatMap(tpl => (Array.isArray(tpl.payload) ? tpl.payload.map(p => ({ ...p, _templateId: tpl.id })) : []));
          } else classesSrc = [];

          if ((!Array.isArray(classesSrc) || classesSrc.length === 0)) {
            try {
              const tpls = await tryFetchTimetable('/api/timetables');
              if (tpls && Array.isArray(tpls.templates)) {
                const evSrc = tpls.templates.flatMap(t => Array.isArray(t.events) ? t.events : []);
                if (evSrc && evSrc.length) classesSrc = evSrc;
              }
            } catch (e) { /* ignore */ }
          }

          let todayList = [];
          let weekCount = 0;
          const isLectureItem = (it) => {
            try {
              const t = (it && (it.type || (it.raw && it.raw.type) || it.eventType || '')).toString().toLowerCase();
              return t === 'lecture';
            } catch (e) { return false; }
          };
          const toLocalYmd = (v) => {
            try { const r = toYMDLocal(v); return r || null; } catch (e) { return null; }
          };
          const todayYmd = toLocalYmd(currentDate);
          if (Array.isArray(classesSrc) && classesSrc.length) {
            try {
              const startWeek = new Date(currentDate);
              startWeek.setDate(currentDate.getDate() - currentDate.getDay());
              startWeek.setHours(0, 0, 0, 0);
              const endWeek = new Date(startWeek);
              endWeek.setDate(startWeek.getDate() + 6);

              for (const c of classesSrc) {
                const start = c.time || '';
                const duration = c.duration || c.durationMinutes || 1;
                const end = start ? (() => {
                  try {
                    const [hh, mm] = String(start).split(':').map(Number);
                    const total = (hh || 0) * 60 + (mm || 0) + Math.round(Number(duration) * 60);
                    const endH = Math.floor((total % (24 * 60)) / 60);
                    const endM = total % 60;
                    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                  } catch (e) { return '' }
                })() : '';

                if (c.date && !c.repeat && c.repeatOption !== 'weekly' && c.dayOfWeek == null) {
                  const dYmd = (typeof c.date === 'string' && c.date.length >= 10) ? c.date.slice(0, 10) : toYMDLocal(c.date);
                  try {
                    const dd = buildLocalDateFromParts(dYmd);
                    const ddY = toLocalYmd(dd);
                    if (ddY && todayYmd && ddY === todayYmd && isLectureItem(c)) todayList.push({ id: c.id || `tt-${dYmd}`, code: c.code || c.module || extractModuleCode(c.title || c.subject || c.module, resolvedCourses) || 'TBA', name: c.title || c.subject || c.module || 'Lecture', time: start ? `${start} - ${end}` : '', instructor: c.instructor || c.lecturer || '', location: c.location || '' });
                    if (dd && !isNaN(dd.getTime())) {
                      const ddMid = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate());
                      if (ddMid >= startWeek && ddMid <= endWeek && isLectureItem(c)) weekCount++;
                    }
                  } catch (e) { }
                  continue;
                }

                const dow = (typeof c.dayOfWeek === 'number') ? c.dayOfWeek : (c.repeatOption === 'weekly' && typeof c.dayOfWeek === 'number' ? c.dayOfWeek : null);
                if (dow != null) {
                  if (dow === currentDate.getDay() && isLectureItem(c)) todayList.push({ id: c.id || `tt-${dow}-${start}`, code: c.code || c.module || extractModuleCode(c.title || c.subject || c.module, resolvedCourses) || 'TBA', name: c.title || c.subject || c.module || 'Lecture', time: start ? `${start} - ${end}` : '', instructor: c.instructor || c.lecturer || '', location: c.location || '' });
                  if (isLectureItem(c)) weekCount++;
                  continue;
                }

                if (c.date) {
                  const dYmd = (typeof c.date === 'string' && c.date.length >= 10) ? c.date.slice(0, 10) : toYMDLocal(c.date);
                  try {
                    const dd = buildLocalDateFromParts(dYmd);
                    const ddY = toLocalYmd(dd);
                    if (ddY && todayYmd && ddY === todayYmd && isLectureItem(c)) todayList.push({ id: c.id || `tt-${dYmd}`, code: c.code || c.module || extractModuleCode(c.title || c.subject || c.module, resolvedCourses) || 'TBA', name: c.title || c.subject || c.module || 'Lecture', time: start ? `${start} - ${end}` : '', instructor: c.instructor || c.lecturer || '', location: c.location || '' });
                    if (dd && !isNaN(dd.getTime())) {
                      const ddMid = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate());
                      if (ddMid >= startWeek && ddMid <= endWeek && isLectureItem(c)) weekCount++;
                    }
                  } catch (e) { }
                }
              }
            } catch (e) { }
          } else {
            try {
              const evs = await safeFetchJson('/api/events');
              if (evs && Array.isArray(evs.events)) {
                const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0);
                const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

                function parseEventStartEnd(ev) {
                  try {
                    let s = null, e = null;
                    if (ev.startDate) s = parseDatePreserveLocal(ev.startDate) || new Date(String(ev.startDate));
                    if (ev.endDate) e = parseDatePreserveLocal(ev.endDate) || new Date(String(ev.endDate));

                    if (!s && ev.date && (ev.startTime || ev.time)) {
                      const startTime = ev.startTime || (typeof ev.time === 'string' ? (ev.time.split('-')[0] || '').trim() : '');
                      if (startTime) s = buildLocalDateFromParts(String(ev.date).slice(0, 10), startTime);
                    }
                    if (!e && ev.date && (ev.endTime || ev.time)) {
                      const endTime = ev.endTime || (typeof ev.time === 'string' ? (ev.time.split('-')[1] || '').trim() : '');
                      if (endTime) e = buildLocalDateFromParts(String(ev.date).slice(0, 10), endTime);
                    }

                    if (s && !e) {
                      const durMin = Number(ev.durationMinutes || ev.duration || 0);
                      if (!Number.isNaN(durMin) && durMin > 0) e = new Date(s.getTime() + Math.round(durMin) * 60000);
                    }

                    if (!s && ev.date) {
                      const d = (typeof ev.date === 'string' && ev.date.length >= 10) ? ev.date.slice(0, 10) : toYMDLocal(ev.date);
                      if (d) s = buildLocalDateFromParts(d);
                      if (s && !e) e = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 23, 59, 59, 999);
                    }

                    let timeStr = '';
                    try {
                      if (s) {
                        const t0 = s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        if (e) {
                          const t1 = e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          timeStr = `${t0} - ${t1}`;
                        } else {
                          timeStr = t0;
                        }
                      } else if (ev.time) {
                        timeStr = ev.time;
                      } else if (ev.startTime || ev.endTime) {
                        timeStr = `${ev.startTime || ''}${ev.endTime ? ' - ' + ev.endTime : ''}`;
                      }
                    } catch (e) { timeStr = ev.time || '' }

                    return { start: s || null, end: e || null, timeStr };
                  } catch (err) { return { start: null, end: null, timeStr: ev.time || '' }; }
                }

                const lectures = evs.events.filter(ev => {
                  try {
                    const t = (ev && (ev.type || (ev.raw && ev.raw.type) || '')).toString().toLowerCase();
                    if (t !== 'lecture' && t !== 'class') return false;
                    const { start, end } = parseEventStartEnd(ev);
                    if (!start && !end && ev.date) {
                      const ed = parseDatePreserveLocal(ev.date) || buildLocalDateFromParts(String(ev.date).slice(0, 10));
                      const edY = ed ? toYMDLocal(ed) : null;
                      return edY && todayYmd && edY === todayYmd;
                    }
                    const sTime = start ? start.getTime() : (end ? end.getTime() : null);
                    const eTime = end ? end.getTime() : (start ? start.getTime() : null);
                    if (sTime == null || eTime == null) return false;
                    return (sTime <= dayEnd.getTime() && eTime >= dayStart.getTime());
                  } catch (er) { return false; }
                });

                todayList = lectures.map((e, i) => {
                  const { start, end, timeStr } = parseEventStartEnd(e);
                  return {
                    id: e.id || `ev-${i}`,
                    code: e.code || e.course || e.module || extractModuleCode(e.title || e.name || e.subject, resolvedCourses) || 'TBA',
                    name: e.title || e.name || e.subject || 'Lecture',
                    time: timeStr || `${e.startTime || ''}${e.endTime ? ' - ' + e.endTime : ''}`,
                    instructor: e.instructor || '',
                    location: e.location || '',
                    _start: start,
                    _end: end
                  };
                });

                try {
                  const startWeek = new Date(currentDate);
                  startWeek.setDate(currentDate.getDate() - currentDate.getDay());
                  startWeek.setHours(0, 0, 0, 0);
                  const endWeek = new Date(startWeek);
                  endWeek.setDate(startWeek.getDate() + 6);
                  weekCount = evs.events.reduce((cnt, ev) => {
                    if (!ev.date) return cnt;
                    const d = parseDatePreserveLocal(ev.date) || buildLocalDateFromParts(String(ev.date).slice(0, 10));
                    if (!d || isNaN(d.getTime())) return cnt;
                    const dMid = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    const t = (ev && (ev.type || (ev.raw && ev.raw.type) || '')).toString().toLowerCase();
                    return (dMid >= startWeek && dMid <= endWeek && t === 'lecture') ? cnt + 1 : cnt;
                  }, 0);
                } catch (e) { weekCount = 0; }
              }
            } catch (e) { }
          }

          if (mounted) {
            const parseStartMinutes = (t) => {
              try {
                if (!t) return Number.MAX_SAFE_INTEGER;
                const m = String(t).match(/^(\d{1,2}):(\d{2})/);
                if (!m) return Number.MAX_SAFE_INTEGER;
                const hh = parseInt(m[1], 10);
                const mm = parseInt(m[2], 10);
                if (Number.isNaN(hh) || Number.isNaN(mm)) return Number.MAX_SAFE_INTEGER;
                return hh * 60 + mm;
              } catch (e) { return Number.MAX_SAFE_INTEGER; }
            };

            (todayList || []).sort((a, b) => parseStartMinutes(a.time) - parseStartMinutes(b.time));

            const finalToday = (todayList || []).slice(0, 6);
            setTodayClasses(finalToday);
            setWeekClassesCount(weekCount || 0);

            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
            let alertClass = null;
            for (const cls of finalToday) {
              if (!cls.time) continue;
              const timeMatch = cls.time.match(/^(\d{1,2}):(\d{2})/);
              if (!timeMatch) continue;

              const [_, hours, minutes] = timeMatch;
              const classTime = new Date(now);
              classTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

              if (classTime > now && classTime <= oneHourFromNow) {
                const minsUntil = Math.round((classTime - now) / 60000);
                alertClass = { ...cls, minutesUntil: minsUntil };
                break;
              }
            }
            setNextClassAlert(alertClass);

            try {
              const toLocalMidnight = (d) => {
                try {
                  const dt = new Date(d);
                  if (isNaN(dt.getTime())) return null;
                  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
                } catch (e) { return null; }
              };

              const todayMid = toLocalMidnight(new Date());
              const upcomingLimit = 3;

              const evs = await safeFetchJson('/api/events');
              if (evs && Array.isArray(evs.events)) {
                const allUpcoming = evs.events
                  .filter(e => e && (e.type === 'lecture' || e.type === 'class') && e.date)
                  .map(e => ({
                    id: e.id,
                    date: e.date,
                    time: e.time,
                    name: e.title || e.name || e.subject || 'Class',
                    code: e.code || e.course || e.module || extractModuleCode(e.title || e.name || e.subject, resolvedCourses) || 'TBA',
                    location: e.location || '',
                    instructor: e.instructor || ''
                  }))
                  .map(e => ({ ...e, _dateObj: toLocalMidnight(e.date) }))
                  .filter(e => e._dateObj && e._dateObj.getTime() > todayMid.getTime())
                  .sort((a, b) => a._dateObj - b._dateObj)
                  .slice(0, 12)
                  .map(({ _dateObj, ...rest }) => ({ ...rest, _dateObj }));

                const upcomingRest = allUpcoming
                  .map(({ _dateObj, ...rest }) => rest)
                  .slice(0, upcomingLimit);

                setNextClasses(upcomingRest);
              } else {
                setNextClasses([]);
              }
            } catch (e) { setNextClasses([]); }
          }
        } finally { setIsLoadingClasses(false); }

        setIsLoadingDeadlines(true);
        try {
          const eventsPayload = await safeFetchJson('/api/events');
          if (mounted && eventsPayload && Array.isArray(eventsPayload.events)) {
            // Helper to compute final instant for an event (tries multiple fallbacks)
            const computeFinalInstant = (ev) => {
              try {
                // Prefer explicit endDate (ISO)
                const rawEnd = ev.endDate || ev.end_date || (ev.raw && (ev.raw.endDate || ev.raw.end_date));
                if (rawEnd) {
                  // If date-only (YYYY-MM-DD) treat as that date at 00:00 -> interpret as end of day
                  const s = String(rawEnd);
                  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
                    const [y, m, d] = s.split('-').map(Number);
                    // end of that day
                    return new Date(y, (m || 1) - 1, d, 23, 59, 59, 999);
                  }
                  const d = new Date(String(rawEnd));
                  if (!isNaN(d.getTime())) return d;
                }

                // If there's an endTime and a date, build local date from parts
                const endTime = ev.endTime || (typeof ev.time === 'string' && ev.time.includes('-') ? (ev.time.split('-')[1] || '').trim() : null);
                const dateStr = ev.date || (ev.startDate ? String(ev.startDate).slice(0, 10) : null);
                if (endTime && dateStr) {
                  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
                  const [hh, mm] = String(endTime).split(':').map(Number);
                  return new Date(y, (m || 1) - 1, d, Number.isFinite(hh) ? hh : 23, Number.isFinite(mm) ? mm : 59, 59, 999);
                }

                // If startDate and duration exist
                if (ev.startDate && (typeof ev.durationMinutes !== 'undefined' || typeof ev.duration !== 'undefined')) {
                  const s = new Date(String(ev.startDate));
                  if (!isNaN(s.getTime())) {
                    const dur = Number(ev.durationMinutes ?? ev.duration ?? 0);
                    if (!Number.isNaN(dur) && dur > 0) return new Date(s.getTime() + Math.round(dur) * 60000);
                    return s;
                  }
                }

                // If only date present, treat as end of that day
                if (dateStr) {
                  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
                  return new Date(y, (m || 1) - 1, d, 23, 59, 59, 999);
                }

                // Fallback: try to use endTime alone on today's date
                if (endTime) {
                  const now = new Date();
                  const [hh, mm] = String(endTime).split(':').map(Number);
                  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number.isFinite(hh) ? hh : 23, Number.isFinite(mm) ? mm : 59, 59, 999);
                }

                return null;
              } catch (err) { return null; }
            };

            const nowTs = Date.now();

              // Seed completed sets from server-side persisted flags so already-completed
              // deadlines are hidden immediately.
              const serverCompletedIds = new Set((eventsPayload.events || []).filter(ev => ev && (ev.type === 'deadline' || ev.type === 'assignment') && ev.completed).map(e => String(e.id)));
              if (serverCompletedIds.size) {
                setCompletedDeadlines(new Set(serverCompletedIds));
                setHiddenCompleted(new Set(serverCompletedIds));
              }

              const deadlines = eventsPayload.events
              .filter(e => e && (e.type === 'deadline' || e.type === 'assignment'))
              .map((e, i) => {
                const final = computeFinalInstant(e);
                const isExpired = final ? (final.getTime() <= nowTs) : false;
                return { ev: e, isExpired };
              })
              // hide expired deadlines from the upcoming list (soft-hide)
              .filter(x => !x.isExpired)
              .slice(0, 8)
              .map((x, i) => {
                const e = x.ev;
                const due = e.date ? (parseDatePreserveLocal(e.date) || buildLocalDateFromParts(String(e.date).slice(0, 10)) || new Date(String(e.date))) : null;
                return {
                  id: e.id || `ev-${i}`,
                  title: `${e.course ? e.course + ' - ' : ''}${e.title || e.name}`,
                  dueDate: due ? due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '',
                  type: e.type || 'assignment',
                  course: e.course || '',
                  daysLeft: due ? Math.max(0, Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0
                };
              });

            if (mounted) {
              setUpcomingDeadlines(deadlines);
              setAssignmentsDueCount(deadlines.length);
            }
          }
        } finally { setIsLoadingDeadlines(false); }

        setIsLoadingQuickStats(true);
        try {
          const courseList = Array.isArray(coursesBody?.courses) ? coursesBody.courses : (Array.isArray(courses) ? courses : []);
          const creditsSum = courseList.reduce((s, c) => s + (Number(c.credits || c.credit || 0)), 0);

          const gradesForStats = await safeFetchJson('/api/grades') || { data: [] };
          let avgPercentage = null;
          if (gradesForStats && Array.isArray(gradesForStats.data) && gradesForStats.data.length) {
            const percents = gradesForStats.data.map((c) => {
              const cats = c.categories || c.assessments || [];
              if (!cats || !cats.length) return null;
              let totalWeight = 0;
              let weighted = 0;
              for (const cat of cats) {
                const weight = Number(cat.weight || 0);
                totalWeight += weight;
                const items = cat.items || [];
                if (!items.length) continue;
                const avg = items.reduce((ss, it) => ss + ((it.score || it.grade || 0) / (it.maxScore || it.maxGrade || 100) * 100), 0) / items.length;
                weighted += (avg * weight) / 100;
              }
              if (totalWeight === 0) return null;
              return (weighted / totalWeight) * 100;
            }).filter(p => p !== null && !isNaN(p));
            if (percents.length) avgPercentage = percents.reduce((s, v) => s + v, 0) / percents.length;
          }

          const gpa = avgPercentage !== null ? Math.round(((avgPercentage / 100) * 4) * 100) / 100 : null;

          let attendanceRate = null;
          try {
            if (courseList && courseList.length) {
              const courseIds = courseList.map(c => c && c.id).filter(Boolean);
              if (courseIds.length) {
                const promises = courseIds.map(id => safeFetchJson(`/api/attendance?courseId=${id}`));
                const results = await Promise.all(promises);
                let totalSessions = 0;
                let totalPresent = 0;
                for (const att of results) {
                  if (att && Array.isArray(att.sessions) && att.sessions.length) {
                    totalSessions += att.sessions.length;
                    totalPresent += att.sessions.filter(s => String(s.status).toUpperCase() === 'PRESENT').length;
                  }
                }
                if (totalSessions > 0) {
                  attendanceRate = Math.round((totalPresent / totalSessions) * 100);
                  try { setStudyHoursLogged(totalSessions); } catch (e) { setStudyHoursLogged(0); }
                }
              }
            }
          } catch (e) { }

          if (mounted) setQuickStats({ gpa, credits: creditsSum, attendanceRate });
        } finally { setIsLoadingQuickStats(false); }

      } catch (e) { }
    })();

    return () => { mounted = false; };
  }, [currentDate, refreshCounter]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <CalendarHeader userName={userName} />
      
      <div className="max-w-[1450px] mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {isLoadingUser ? <Skeleton width="w-64" height="h-9" /> : `Welcome back, ${userName || 'Student'}`}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Next Class Alert */}
        {nextClassAlert && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                  Next class in {nextClassAlert.minutesUntil} minute{nextClassAlert.minutesUntil !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {nextClassAlert.code} • {nextClassAlert.name} {nextClassAlert.location && `• ${nextClassAlert.location}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
            label="Current GPA"
            value={quickStats.gpa !== null ? quickStats.gpa.toFixed(2) : '—'}
            loading={isLoadingQuickStats}
          />
          <StatCard
            icon={<BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
            label="Total Credits"
            value={quickStats.credits !== null ? quickStats.credits : '—'}
            loading={isLoadingQuickStats}
          />
          <StatCard
            icon={<Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
            label="Attendance Rate"
            value={quickStats.attendanceRate !== null ? `${quickStats.attendanceRate}%` : '—'}
            loading={isLoadingQuickStats}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Classes */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Today's Classes</h3>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {isLoadingClasses ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 animate-pulse">
                        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded-xl"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/3"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-2/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : todayClasses.length > 0 ? (
                  <div className="space-y-3">
                    {todayClasses.map((cls) => {
                      const ymd = cls.date || cls.dateStr || toYMDLocal(currentDate);
                      const goto = () => { window.location.href = `/calendar?date=${encodeURIComponent(String(ymd).slice(0, 10))}`; };
                      return (
                        <div
                          key={cls.id}
                          tabIndex={0}
                          role="button"
                          onClick={goto}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') goto(); }}
                          className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-600"
                        >
                          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20 px-2 py-0.5 rounded">
                                {cls.code || extractModuleCode(cls.name, courses)}
                              </span>
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{cls.name}</span>
                            </div>
                            <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-400">
                              {cls.time && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{cls.time}</span>
                                </div>
                              )}
                              {cls.location && (
                                <div className="flex items-center gap-1.5">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span>{cls.location}</span>
                                </div>
                              )}
                              {cls.instructor && (
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5" />
                                  <span>{cls.instructor}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-1 font-medium">No classes today</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">Enjoy your day off!</p>
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-xl transition-colors"
                      onClick={() => window.location.href = '/timetable'}
                    >
                      View Timetable
                    </button>
                    {nextClasses && nextClasses.length > 0 && (
                      <div className="mt-8 text-left">
                        <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
                          Upcoming Classes
                        </h4>
                        <div className="space-y-2">
                          {nextClasses.map(nc => (
                            <div key={nc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20 px-2 py-0.5 rounded">{nc.code}</span>
                                <span className="text-slate-900 dark:text-slate-100 truncate">{nc.name}</span>
                              </div>
                              <span className="text-xs text-slate-600 dark:text-slate-400 ml-2">
                                {new Date(nc.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines (simplified) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Upcoming Deadlines</h3>
                  </div>
                  <button
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                    onClick={() => window.location.href = '/calendar'}
                  >
                    View All
                  </button>
                </div>
              </div>

              <div className="p-6">
                {isLoadingDeadlines ? (
                  <div className="text-sm text-slate-500">Loading deadlines...</div>
                ) : (
                  upcomingDeadlines.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingDeadlines
                        .filter(d => !hiddenCompleted.has(d.id))
                        .map(d => (
                        <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                          <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={completedDeadlines.has(d.id)} onChange={async () => await toggleCompleted(d.id, !completedDeadlines.has(d.id))} className="sr-only peer" aria-checked={completedDeadlines.has(d.id)} />
                            <span className="w-5 h-5 flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 peer-checked:bg-purple-600 peer-checked:text-white peer-checked:border-transparent transition-colors transform peer-checked:scale-105 peer-checked:shadow-md peer-checked:[&>svg]:opacity-100 peer-checked:[&>svg]:scale-95">
                              <Check className="w-3.5 h-3.5 text-white opacity-0 transition-opacity transform" />
                            </span>
                          </label>
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-700/20 dark:to-purple-800/10">
                            <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium mb-0.5 text-slate-900 dark:text-slate-100 truncate">{d.title}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{d.dueDate}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{d.daysLeft}d</span>
                          </div>
                        </div>
                      ))}

                      {completedDeadlines && completedDeadlines.size > 0 && (
                        <div className="mt-3">
                          <button
                            aria-pressed={showCompletedDeadlines}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 hover:bg-purple-100 dark:bg-purple-700/20 dark:hover:bg-purple-700/30 text-purple-700 dark:text-purple-300 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                            onClick={async () => { const next = !showCompletedDeadlines; setShowCompletedDeadlines(next); if(next) await loadCompletedList(); }}
                          >
                            <CheckCircle className="w-4 h-4" />
                            {showCompletedDeadlines ? 'Hide completed' : `Show completed (${completedDeadlines.size})`}
                          </button>
                      {showCompletedDeadlines && (
                        <div className="mt-3 space-y-2">
                          {completedList.length === 0 ? (
                            <div className="text-sm text-slate-500">No completed deadlines.</div>
                          ) : (
                            completedList.map(cd => (
                              <div key={cd.id} className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700">
                                <label className="inline-flex items-center cursor-pointer">
                                  <input type="checkbox" checked={true} onChange={async () => { await toggleCompleted(cd.id, false); }} className="sr-only peer" />
                                  <span className="w-5 h-5 flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-600 peer-checked:bg-purple-600 peer-checked:border-transparent peer-checked:text-white transition-colors transform peer-checked:scale-105 peer-checked:shadow-md peer-checked:[&>svg]:opacity-100 peer-checked:[&>svg]:scale-95">
                                    <Check className="w-3.5 h-3.5 text-white opacity-0 transition-opacity transform" />
                                  </span>
                                </label>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium mb-0.5 line-through text-slate-500 truncate">{cd.title}</p>
                                      <p className="text-xs text-slate-400">{cd.dueDate}</p>
                                    </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mb-1 font-medium">All caught up!</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">No upcoming deadlines</p>
                      <button
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-xl transition-colors"
                        onClick={() => window.location.href = '/calendar'}
                      >
                        <Plus className="w-4 h-4" />
                        Create Event
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* This Week */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">This Week</h3>
              </div>
              
              <div className="grid grid-cols-7 gap-2 mb-6">
                {weekDays.map((day, idx) => {
                  const date = new Date(startOfWeek);
                  date.setDate(startOfWeek.getDate() + idx);
                  const isToday = date.toDateString() === currentDate.toDateString();

                  return (
                    <div key={day} className="text-center">
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{day}</div>
                      <div className={`w-9 h-9 mx-auto rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                        isToday
                          ? 'bg-purple-600 dark:bg-purple-500 text-white'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}>
                        {date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Classes this week</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{weekClassesCount ?? 0}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Assignments due</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{assignmentsDueCount ?? 0}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Study hours</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{studyHoursLogged ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Active Modules */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Active Modules</h3>
              </div>
              
              {courses.length > 0 ? (
                <div className="space-y-2">
                  {courses.slice(0, 5).map((course, idx) => (
                    <div 
                      key={course.id || idx}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-colors cursor-pointer"
                      onClick={() => window.location.href = '/courses'}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        idx % 3 === 0 ? 'bg-blue-500' : 
                        idx % 3 === 1 ? 'bg-green-500' : 
                        'bg-purple-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-0.5">{course.code || course.courseCode}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{course.name || course.title || course.module || course.courseName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">No modules yet</p>
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-xl transition-colors"
                    onClick={() => window.location.href = '/courses'}
                  >
                    <Plus className="w-4 h-4" />
                    Add Modules
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function extractModuleCode(str, courses) {
  try {
    if (!str) return null;
    const s = String(str);
    const m = s.match(/\b([A-Z]{2,6}\s?-?\s?\d{2,4})\b/);
    if (m && m[1]) return m[1].replace(/\s+/g, '');
    const m2 = s.match(/\b([A-Z]{2,6}\d{2,4})\b/);
    if (m2 && m2[1]) return m2[1];

    if (Array.isArray(courses) && courses.length) {
      const low = s.toLowerCase();
      for (const c of courses) {
        const names = [c.name, c.title, c.module, c.courseName, c.course].filter(Boolean);
        for (const n of names) {
          if (String(n).toLowerCase() === low) return c.code || c.courseCode || c.course || null;
        }
      }
      for (const c of courses) {
        const names = [c.name, c.title, c.module, c.courseName, c.course].filter(Boolean);
        for (const n of names) {
          if (String(n).length > 2 && (low.includes(String(n).toLowerCase()) || String(n).toLowerCase().includes(low))) return c.code || c.courseCode || c.course || null;
        }
      }
      for (const c of courses) {
        const code = (c.code || c.courseCode || c.course || '').toString();
        if (code && s.includes(code)) return code;
      }
    }

    const first = s.split(/\s+/)[0];
    return first || null;
  } catch (e) { return null; }
}