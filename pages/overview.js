import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Calendar, BookOpen, TrendingUp, Clock, CheckCircle, Check, AlertCircle, GraduationCap, Users, Plus, Home, Settings, LogOut, Target } from 'lucide-react';
import AddEventModal from '@/components/schedule/_modals/add-event-modal';
import CustomModal from '@/components/ui/custom-modal';
import { useModal } from '@/providers/modal-context';

function CalendarHeader({ userName }) {
  const router = useRouter();
  return (
    <header className="border-b border-purple-100/50 bg-gradient-to-b from-white to-purple-50/30 sticky top-0 z-40 backdrop-blur-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/80">
      <div className="max-w-[1450px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center shadow-sm dark:from-purple-500/20 dark:to-purple-600/20">
            <Home className="w-5 h-5 text-purple-600 dark:text-purple-400" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Overview</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/settings" prefetch={true}>
            <button 
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
              title="Settings"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
          </Link>

          <button 
            onClick={async () => {
              try {
                try { await fetch('/api/auth/local-signout', { method: 'POST' }); } catch (e) { /* ignore */ }
                router.push('/signin');
              } catch (e) {
                router.push('/signout');
              }
            }}
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
            title="Sign Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function StatCard({ icon, label, value, loading, bgColor, iconColor }) {
  return (
    <div className="group bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
          {React.cloneElement(icon, { className: `w-6 h-6 ${iconColor}`, strokeWidth: 2.5 })}
        </div>
      </div>
      <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1.5">{label}</p>
      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
        {loading ? (
          <span className="inline-block w-20 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></span>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

export default function UniversityOverview() {
  const [currentDate] = useState(new Date());
  const [userName, setUserName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  
  // Modal context for creating events
  const modalCtx = useModal();
  const { setOpen, isOpen } = modalCtx;
  
  // Debug logs to detect whether this component mounts/unmounts on navigation
  useEffect(() => {
    try {
      console.log('[Overview] mounted at', router.asPath);
      return () => console.log('[Overview] unmounted from', router.asPath);
    } catch (e) { /* ignore */ }
  }, [router.asPath]);

  // Check authentication FIRST before loading any data
  useEffect(() => {
    async function checkAuth() {
      try {
        console.log('[Overview] Starting auth check...');
        const res = await fetch('/api/auth/me', { 
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        console.log('[Overview] Auth response status:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('[Overview] Auth data:', data);
          if (data.authenticated) {
            setUserName(data.name || 'User');
            setIsAuthenticated(true);
            console.log('[Overview] User authenticated:', data.name);
          } else {
            console.log('[Overview] User not authenticated');
            setUserName('User');
          }
        } else {
          console.log('[Overview] Auth check failed with status:', res.status);
          setUserName('User');
        }
      } catch (err) {
        console.error('[Overview] Auth check error:', err);
        setUserName('User');
      } finally {
        console.log('[Overview] Auth check complete, setting authChecked=true');
        setAuthChecked(true);
      }
    }
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('[Overview] Auth check timeout, forcing authChecked=true');
      setAuthChecked(true);
      setUserName('User');
    }, 5000); // 5 second timeout
    
    checkAuth().finally(() => clearTimeout(timeout));
    
    return () => clearTimeout(timeout);
  }, [router]);

  // Data fetched from backend
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [gradesData, setGradesData] = useState([]);

  // UI state
  const [completedDeadlines, setCompletedDeadlines] = useState(new Set());
  const [hiddenCompleted, setHiddenCompleted] = useState(new Set());
  const hideTimersRef = useRef({});
  const [completedAtMap, setCompletedAtMap] = useState({});
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState(null);
  
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);
  
  // Open modal for creating events
  const openCreateEventModal = useCallback(() => {
    setOpen(
      <CustomModal title="Add Event">
        <AddEventModal />
      </CustomModal>,
      async () => ({ default: { date: new Date().toISOString().split('T')[0] } })
    );
  }, [setOpen]);

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ gpa: null, credits: null, attendanceRate: null });
  const [attendanceNeedsSignIn, setAttendanceNeedsSignIn] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);
  const [attendanceDebug, setAttendanceDebug] = useState({ courses: null, attendance: [] });
  const [weekClassesCount, setWeekClassesCount] = useState(0);
  const [assignmentsDueCount, setAssignmentsDueCount] = useState(0);
  const [studyHoursLogged, setStudyHoursLogged] = useState(0);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  // Derived lists from fetched data
  const isSameDay = (a, b) => {
    try {
      if (!a || !b) return false;
      const da = new Date(String(a));
      const db = new Date(String(b));
      return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
    } catch (e) { return false; }
  };

  const formatTime = (v) => {
    try {
      if (!v) return '';
      // v may be 'HH:MM' or an ISO string
      if (/^\d{2}:\d{2}$/.test(String(v))) return String(v);
      const d = new Date(String(v));
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  };

  const formatDue = (ev) => {
    try {
      if (!ev) return '';
      if (ev.startDate) return new Date(ev.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (ev.date) return typeof ev.date === 'string' ? ev.date : new Date(ev.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return '';
    } catch (e) { return ''; }
  };

  const todayClasses = useMemo(() => {
    try {
      // Don't compute timezone-sensitive values during SSR — wait until client mount
      if (!mounted) return [];
      try { console.time && console.time('overview:memo:todayClasses'); } catch (e) {}
      const list = [];
      for (const ev of events || []) {
        if (!ev) continue;
        const t = (ev.type || '').toString().toLowerCase();
        if (t !== 'class' && t !== 'lecture' && t !== 'event') continue;
        if (ev.startDate && !isSameDay(ev.startDate, currentDate)) continue;
        if (!ev.startDate && ev.date && !isSameDay(ev.date, currentDate)) continue;

        let startTime = '';
        let endTime = '';
        let startTs = null;
        try {
          if (ev.startDate) startTime = formatTime(ev.startDate);
          else if (ev.time) startTime = formatTime(ev.time);
          if (ev.endDate) endTime = formatTime(ev.endDate);
          else if (ev.durationMinutes && ev.startDate) {
            const s = new Date(ev.startDate);
            if (!isNaN(s.getTime())) {
              const e = new Date(s.getTime() + (Number(ev.durationMinutes) || 0) * 60000);
              endTime = formatTime(e.toISOString());
            }
          }
          if (ev.startDate) {
            const d = new Date(ev.startDate);
            if (!isNaN(d.getTime())) startTs = d.getTime();
          } else if (ev.time) {
            const m = String(ev.time).match(/(\d{1,2}):(\d{2})/);
            if (m) {
              const d = new Date(currentDate);
              d.setHours(Number(m[1]), Number(m[2]), 0, 0);
              startTs = d.getTime();
            }
          }
        } catch (e) {}

        let moduleCode = ev.course_id || (ev.meta && (ev.meta.course || ev.meta.courseCode)) || '';
        try {
          if ((!moduleCode || moduleCode === '') && Array.isArray(courses)) {
            let found = courses.find(c => c && String(c.id) === String(ev.course_id));
            if (!found) found = courses.find(c => c && (String(c.code) === String(ev.course_id) || String(c.courseCode) === String(ev.course_id)));
            if (found && (found.code || found.courseCode)) moduleCode = found.code || found.courseCode;
          }
          if ((!moduleCode || moduleCode === '') && (ev.title || ev.name || ev.description)) {
            const extracted = extractModuleCode(ev.title || ev.name || ev.description, courses);
            if (extracted) moduleCode = extracted;
          }
          if (!moduleCode) moduleCode = '';
        } catch (e) {}

        list.push({
          id: ev.id,
          code: moduleCode || '',
          name: ev.title || ev.name || '',
          startTime,
          startTs,
          endTime,
          time: (startTime && endTime) ? `${startTime} - ${endTime}` : (startTime || ev.time || ''),
          instructor: ev.instructor || (ev.meta && ev.meta.instructor) || '',
          location: ev.location || ''
        });
      }
      list.sort((a, b) => {
        const ta = a.startTs || 0;
        const tb = b.startTs || 0;
        if (!ta && !tb) return 0;
        if (!ta) return 1;
        if (!tb) return -1;
        return ta - tb;
      });
      try { console.timeEnd && console.timeEnd('overview:memo:todayClasses'); } catch (e) {}
      return list;
    } catch (e) { try { console.timeEnd && console.timeEnd('overview:memo:todayClasses'); } catch (e) {} return []; }
  }, [events, courses, currentDate]);

  const upcomingDeadlines = useMemo(() => {
    try {
      try { console.time && console.time('overview:memo:upcomingDeadlines'); } catch (e) {}
      const list = [];
      for (const ev of events || []) {
        if (!ev) continue;
        const t = (ev.type || '').toString().toLowerCase();
        const evId = String(ev.id);
        // Use local completed state instead of ev.completed for real-time updates
        const isCompleted = completedDeadlines.has(evId) || ev.completed === true;
        if (!(t === 'deadline' || t === 'assignment') || isCompleted) continue;
        const d = ev.startDate ? new Date(ev.startDate) : (ev.date ? new Date(ev.date) : null);
        const daysLeft = (!d || isNaN(d.getTime())) ? 9999 : Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())) / (1000 * 60 * 60 * 24));
        list.push({
          id: ev.id,
          title: ev.title || ev.name || '',
          dueDate: formatDue(ev),
          daysLeft: typeof daysLeft === 'number' ? daysLeft : null,
          type: ev.type || 'assignment'
        });
      }
      list.sort((a, b) => (a.daysLeft || 9999) - (b.daysLeft || 9999));
      try { console.timeEnd && console.timeEnd('overview:memo:upcomingDeadlines'); } catch (e) {}
      return list;
    } catch (e) { try { console.timeEnd && console.timeEnd('overview:memo:upcomingDeadlines'); } catch (e) {} return []; }
  }, [events, currentDate, completedDeadlines]);

  const visibleUpcomingDeadlines = useMemo(() => {
    try {
      try { console.time && console.time('overview:memo:visibleUpcomingDeadlines'); } catch (e) {}
      const out = (upcomingDeadlines || []).filter(d => {
        const id = String(d.id);
        if (hiddenCompleted.has(id)) return false;
        if (showCompleted) return true;
        const ts = completedAtMap && completedAtMap[id] ? Date.parse(completedAtMap[id]) : null;
        if (ts && !isNaN(ts)) {
          if ((Date.now() - ts) >= AUTO_HIDE_MS) return false;
        }
        return true;
      });
      try { console.timeEnd && console.timeEnd('overview:memo:visibleUpcomingDeadlines'); } catch (e) {}
      return out;
    } catch (e) { try { console.timeEnd && console.timeEnd('overview:memo:visibleUpcomingDeadlines'); } catch (e) {} return []; }
  }, [upcomingDeadlines, hiddenCompleted, showCompleted, completedAtMap]);

  // --- Data loading and actions ---
  const safeFetchJson = async (url, opts) => {
    try {
      const fetchOpts = Object.assign({ credentials: 'same-origin', headers: { 'Accept': 'application/json' } }, opts || {});
      const r = await fetch(url, fetchOpts);
      const text = await r.text();
      try {
        const parsed = text ? JSON.parse(text) : null;
        return parsed;
      } catch (e) {
        // non-JSON response
        return { success: r.ok, status: r.status, body: text };
      }
    } catch (e) { return null; }
  };


  const loadAll = useCallback(async () => {
    try { console.time && console.time('overview:loadAll'); } catch (e) {}
    setLoading(true);
    console.log('[Overview] loadAll start');
    try {
      // Parallel fetch for better performance (NO CACHING TO AVOID SSR ISSUES)
      const [evJson, coursesJson, gradesJson] = await Promise.all([
        fetch('/api/events', { credentials: 'same-origin' }).then(r => r.json()).catch(() => ({ events: [] })),
        fetch('/api/courses', { credentials: 'same-origin' }).then(r => r.json()).catch(() => ({ success: false, courses: [] })),
        fetch('/api/grades', { credentials: 'same-origin' }).then(r => r.json()).catch(() => ({ success: false, data: [] }))
      ]);

      const fetchedEvents = Array.isArray(evJson.events) ? evJson.events : [];
      const fetchedCourses = coursesJson && coursesJson.success && Array.isArray(coursesJson.courses) ? coursesJson.courses : [];
      const fetchedGrades = gradesJson && gradesJson.success && Array.isArray(gradesJson.data) ? gradesJson.data : [];

      setEvents(fetchedEvents);
      setCourses(fetchedCourses);
      setGradesData(fetchedGrades);
    } finally {
      setLoading(false);
    }
    console.log('[Overview] loadAll complete');
    try { console.timeEnd && console.timeEnd('overview:loadAll'); } catch (e) {}
  }, []); // Empty deps - only recreate on mount

  // Only load data after authentication is confirmed
  useEffect(() => {
    console.log('[Overview] Data loading check - authChecked:', authChecked, 'isAuthenticated:', isAuthenticated);
    if (authChecked) {
      console.log('[Overview] Auth checked, loading data regardless of auth status');
      loadAll(); 
    }
  }, [loadAll, authChecked, isAuthenticated]);

  // Reload events when modal closes - MUST be after loadAll and showToast are defined
  const prevModalOpenRef = useRef(false);
  useEffect(() => {
    // Check if any modal is currently open
    const anyOpen = Object.keys(isOpen || {}).some(k => isOpen[k]);
    const wasOpen = prevModalOpenRef.current;
    
    // If a modal was open and is now closed, refresh data
    if (wasOpen && !anyOpen) {
      console.log('[Overview] Modal closed, reloading data...');
      loadAll();
    }
    prevModalOpenRef.current = anyOpen;
  }, [isOpen, loadAll]);

  // Ensure timezone-sensitive parsing runs only on client to avoid SSR timezone mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-archive uncompleted overdue events after 24 hours past their due date
  useEffect(() => {
    if (!mounted || !events || events.length === 0) return;
    
    const checkAndArchiveOverdue = async () => {
      const now = Date.now();
      const nowMidnight = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      
      for (const ev of events) {
        if (!ev) continue;
        const t = (ev.type || '').toString().toLowerCase();
        if (!(t === 'deadline' || t === 'assignment')) continue;
        if (ev.completed || ev.archived) continue;
        
        const eventDate = ev.startDate ? new Date(ev.startDate) : (ev.date ? new Date(ev.date) : null);
        if (!eventDate || isNaN(eventDate.getTime())) continue;
        
        const eventMidnight = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        const hoursSinceDue = (now - eventDate.getTime()) / (1000 * 60 * 60);
        
        // If uncompleted and 24+ hours past due date, auto-archive
        if (hoursSinceDue >= 24) {
          try {
            await archiveDeadline(ev.id);
          } catch (e) {
            // ignore errors for individual items
          }
        }
      }
    };
    
    // Run check on mount and events change
    checkAndArchiveOverdue();
  }, [mounted, events, currentDate]);

  useEffect(() => {
    try {
      // Seed completed set
      const completedIds = new Set(events.filter(e => e && (e.completed === true)).map(e => String(e.id)));
      setCompletedDeadlines(prev => { const next = new Set(prev); completedIds.forEach(id => next.add(id)); return next; });
      // Seed completedAtMap where possible
      const map = {};
      for (const e of events) {
        if (!e) continue;
        const id = String(e.id);
        if (e.completedAt) map[id] = String(e.completedAt);
        else if (e.completed === true) {
          // If server didn't provide a timestamp, mark as old so it will be
          // treated as already-archived unless user toggles showCompleted.
          map[id] = new Date(0).toISOString();
        }
      }
      setCompletedAtMap(prev => ({ ...prev, ...map }));

      // Assignments due count
      setAssignmentsDueCount(events.filter(e => e && (String(e.type || '').toLowerCase() === 'assignment' || String(e.type || '').toLowerCase() === 'deadline') && !e.completed).length);

      // Week classes
      const start = new Date(startOfWeek);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      setWeekClassesCount(events.filter(e => e && (String(e.type || '').toLowerCase() === 'class' || String(e.type || '').toLowerCase() === 'lecture') && e.startDate).filter(ev => {
        const d = new Date(ev.startDate);
        return d >= start && d < end;
      }).length);

      // Credits & GPA best-effort
      let credits = null;
      if (Array.isArray(gradesData) && gradesData.length) credits = gradesData.reduce((s, c) => s + (Number(c.credits) || 0), 0) || null;
      if (!credits && Array.isArray(courses) && courses.length) credits = courses.reduce((s, c) => s + (Number(c.credits) || 0), 0) || null;

      let gpa = null;
      try {
        const gradeItems = [];
        if (Array.isArray(gradesData)) {
          for (const c of gradesData) {
            if (Array.isArray(c.assessments)) {
              for (const a of c.assessments) {
                if (Array.isArray(a.items)) {
                  for (const it of a.items) {
                    if (typeof it.grade === 'number' && typeof it.maxGrade === 'number' && it.maxGrade > 0) {
                      gradeItems.push(it.grade / it.maxGrade);
                    }
                  }
                }
              }
            }
          }
        }
        if (gradeItems.length) {
          const avg = gradeItems.reduce((s, v) => s + v, 0) / gradeItems.length;
          gpa = Math.round(((avg * 4) + Number.EPSILON) * 100) / 100;
        }
      } catch (e) { gpa = null; }

  // Preserve any already-computed attendanceRate (avoid stomping it when events/courses update)
  setStats(prev => ({ ...prev, gpa, credits: credits || null }));
    } catch (e) {}
  }, [events, courses, gradesData, startOfWeek]);

  // Attendance aggregation: compute average attendance across courses

  useEffect(() => {
    let mounted = true;
    const loadAttendance = async () => {
      try { console.time && console.time('overview:loadAttendance'); } catch (e) {}
      try {
        // Prefer to fetch a canonical courses list from the API and use
        // course IDs when calling the attendance endpoint. If we can't
        // obtain a courses list (for example the user is not authenticated)
        // we bail early to avoid making repeated bad `courseCode` requests
        // which previously produced 400 responses.
        let courseList = null;
        let coursesJson = null;
        try {
          coursesJson = await safeFetchJson('/api/courses');
          if (coursesJson && coursesJson.success && Array.isArray(coursesJson.courses)) {
            courseList = coursesJson.courses;
          }
        } catch (e) { coursesJson = { success: false, error: String(e) }; }
        // stash debug copy (dev-only)
        try { if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') setAttendanceDebug(d => ({ ...d, courses: coursesJson })); } catch (e) {}

        if (!courseList) {
          // fall back to any already-loaded courses from parent loadAll
          if (Array.isArray(courses) && courses.length > 0) courseList = courses;
        }

        if (!courseList || !Array.isArray(courseList) || courseList.length === 0) {
          // nothing authoritative to use for attendance lookups — likely not signed in.
          // Show a sign-in hint instead of silently leaving the stat as '—'.
          setStats(prev => ({ ...prev, attendanceRate: null }));
          setAttendanceNeedsSignIn(true);
          setAttendanceError(coursesJson && coursesJson.error ? String(coursesJson.error) : 'No courses available to compute attendance');
          return;
        }

  const targets = courseList;
        // fetch attendance for each course in parallel. Try multiple param fallbacks when necessary.
        const fetchForCourse = async (c) => {
          try {
            if (!c) return null;
            // prefer by id when available
            if (c.id) {
              const id = encodeURIComponent(String(c.id));
              const r = await safeFetchJson(`/api/attendance?courseId=${id}`);
              if (r && Array.isArray(r.sessions)) return r;
              // if sessions exist but aren't an array (defensive), coerce
              if (r && r.sessions && typeof r.sessions === 'object' && Object.keys(r.sessions).length === 0) return { ...r, sessions: [] };
            }
            // try by known course code fields
            const code = (c && (c.code || c.courseCode || c.course)) ? String(c.code || c.courseCode || c.course) : null;
            if (code) {
              const r2 = await safeFetchJson(`/api/attendance?courseCode=${encodeURIComponent(code)}`);
              if (r2 && Array.isArray(r2.sessions)) return r2;
              if (r2 && r2.sessions && Array.isArray(Object.values(r2.sessions))) return { ...r2, sessions: Array.from(r2.sessions) };
              const r3 = await safeFetchJson(`/api/attendance?course=${encodeURIComponent(code)}`);
              if (r3 && Array.isArray(r3.sessions)) return r3;
              if (r3 && r3.sessions && Array.isArray(Object.values(r3.sessions))) return { ...r3, sessions: Array.from(r3.sessions) };
            }
            return null;
          } catch (e) { return null; }
        };

    try { console.time && console.time('overview:attendance:fetchAll'); } catch (e) {}
    const promises = targets.map(c => fetchForCourse(c));
  const results = await Promise.all(promises);
    try { console.timeEnd && console.timeEnd('overview:attendance:fetchAll'); } catch (e) {}
  try { if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') setAttendanceDebug(d => ({ ...d, attendance: results.slice(0, 8) })); } catch (e) {}
  setAttendanceError(null);
        // nothing to do here for debug
        // Debug: show which courses returned nothing (dev only)
        try {
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            results.forEach((r, idx) => {
              if (!r || !r.success || !Array.isArray(r.sessions)) {
                console.debug('Attendance fetch empty for course:', courses[idx] && (courses[idx].id || courses[idx].code || courses[idx].name), 'response:', r);
              }
            });
          }
        } catch (e) {}
  // Compute a global average across all attendance sessions (user-level),
        // not a simple mean of per-course percentages. This sums all earned
        // points and divides by total possible points so courses with more
        // sessions contribute proportionally.
  try { console.time && console.time('overview:attendance:computePoints'); } catch (e) {}
        const MAX_POINTS = 2;
        let globalPoints = 0;
        let globalCounted = 0;
        for (const r of results) {
          if (!r || !Array.isArray(r.sessions)) continue;
          const sessions = r.sessions || [];
          for (const s of sessions) {
            const pts = (s && typeof s.points === 'number') ? s.points : (s && s.status ? (() => {
              switch (String(s.status).toUpperCase()) {
                case 'PRESENT': return 2;
                case 'EXCUSED': return 1;
                case 'LATE': return 1;
                case 'ABSENT': return 0;
                case 'HOLIDAY': return null;
                default: return 0;
              }
            })() : 0);
            if (pts === null || pts === undefined) continue; // exclude HOLIDAY/unknown
            globalPoints += Number(pts) || 0;
            globalCounted++;
          }
        }
        try { console.timeEnd && console.timeEnd('overview:attendance:computePoints'); } catch (e) {}

        if (mounted) {
          setAttendanceNeedsSignIn(false);
          if (globalCounted === 0) {
            setStats(prev => ({ ...prev, attendanceRate: null }));
            if (Array.isArray(results) && results.length > 0) setAttendanceError('No attendance sessions found for your courses');
          } else {
            const raw = (globalPoints / (globalCounted * MAX_POINTS)) * 100;
            const avg = Math.round(raw * 10) / 10;
            setStats(prev => ({ ...prev, attendanceRate: avg }));
            setAttendanceError(null);
          }
        }
      } catch (e) {
        if (mounted) setStats(prev => ({ ...prev, attendanceRate: null }));
      }
    };
    loadAttendance();
    return () => { mounted = false; };
  }, [courses, events]);

  // Toggle completed with optimistic update and persist to server
  const toggleCompletedOnServer = async (id, nextValue) => {
    try {
      const body = { completed: !!nextValue };
      if (nextValue) body.completedAt = new Date().toISOString();
      else body.completedAt = null;
      const res = await fetch(`/api/events/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) return null;
      const json = await res.json();
      return json && (json.event || json) ? (json.event || json) : null;
    } catch (e) { return null; }
  };

  // Archive a deadline/event (optimistic UI, rollback on failure)
  const archiveDeadline = async (id) => {
    // Optimistically remove from the local events list for immediate feedback
    const prev = events || [];
    const eventToArchive = prev.find(e => String(e.id) === String(id));
    setEvents(prev.filter(e => String(e.id) !== String(id)));
    
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(id)}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ archived: true }) 
      });
      
      if (!res.ok) {
        // rollback
        setEvents(prev);
        const errorText = await res.text().catch(() => 'Unknown error');
        showToast('Failed to archive event. Please try again.', 'error');
        console.error('Archive failed:', errorText);
        return null;
      }
      
      const json = await res.json().catch(() => null);
      showToast(`"${eventToArchive?.title || 'Event'}" archived successfully`, 'success');
      
      // reload events to ensure any server-side changes are reflected
      try { await loadAll(); } catch (e) { /* ignore */ }
      return json && (json.event || json) ? (json.event || json) : null;
    } catch (e) {
      setEvents(prev);
      showToast('Network error. Could not archive event.', 'error');
      console.error('Archive error:', e);
      return null;
    }
  };

  const AUTO_HIDE_MS = 24 * 60 * 60 * 1000; // 24 hours

  const toggleCompleted = async (id, nextValue) => {
    // Find the original event to check its due date
    const event = events.find(e => String(e.id) === String(id));
    
    // Optimistic local update: mark completed and timestamp immediately
    setCompletedDeadlines(prev => { const n = new Set(prev); if (nextValue) n.add(id); else n.delete(id); return n; });
    setCompletedAtMap(prev => {
      const n = { ...prev };
      if (nextValue) n[String(id)] = new Date().toISOString();
      else delete n[String(id)];
      return n;
    });

    // Determine whether to hide immediately or auto-archive
    if (nextValue && event) {
      // User is marking as complete
      const eventDate = event.startDate ? new Date(event.startDate) : (event.date ? new Date(event.date) : null);
      
      if (eventDate && !isNaN(eventDate.getTime())) {
        // Normalize dates to midnight for comparison
        const eventMidnight = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        const nowMidnight = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        
        // If event date has passed (it's past midnight on the day after), auto-archive immediately
        if (nowMidnight > eventMidnight) {
          // Auto-archive this completed past-due event
          setTimeout(() => archiveDeadline(id), 100); // slight delay for UX
        }
      }
      
      // Hide from upcoming list immediately
      setHiddenCompleted(prev => { const n = new Set(prev); n.add(String(id)); return n; });
    } else if (!nextValue) {
      // User is unchecking - remove from hidden so it appears in upcoming again
      setHiddenCompleted(prev => { const n = new Set(prev); n.delete(String(id)); return n; });
    }

    const server = await toggleCompletedOnServer(id, nextValue);
    if (!server) {
      // revert local optimistic state on error
      setCompletedDeadlines(prev => { const n = new Set(prev); if (nextValue) n.delete(String(id)); else n.add(String(id)); return n; });
      setHiddenCompleted(prev => { const n = new Set(prev); if (nextValue) n.delete(String(id)); else n.add(String(id)); return n; });
      setCompletedAtMap(prev => { const n = { ...prev }; if (nextValue) delete n[String(id)]; else n[String(id)] = (prev && prev[String(id)]) || null; return n; });
    } else {
      // persist any server-updated timestamps into events list
      setEvents(prev => prev.map(e => (e && String(e.id) === String(id) ? { ...e, completed: !!nextValue, completedAt: server.completedAt || server.completed_at || (nextValue ? new Date().toISOString() : null) } : e)));
      // Reload all data to ensure consistency
      try { await loadAll(); } catch (e) { console.error('Failed to reload after toggle:', e); }
    }
  };

  const completedList = useMemo(() => {
    try {
      try { console.time && console.time('overview:memo:completedList'); } catch (e) {}
      const seen = new Set();
      const list = [];
      for (const e of events || []) {
        if (!e) continue;
        const id = String(e.id);
        if ((e.completed === true || completedDeadlines.has(id)) && !seen.has(id)) {
          seen.add(id);
          const withTs = { ...(e || {}), completedAt: (completedAtMap && completedAtMap[id]) || e.completedAt || e.completed_at || null };
          list.push(withTs);
        }
      }
      for (const id of Array.from(completedDeadlines)) {
        if (seen.has(String(id))) continue;
        const found = (events || []).find(ev => String(ev.id) === String(id));
        if (found) {
          const idStr = String(id);
          const withTs = { ...(found || {}), completedAt: (completedAtMap && completedAtMap[idStr]) || found.completedAt || found.completed_at || null };
          list.push(withTs);
          seen.add(String(id));
        } else {
          list.push({ id, title: 'Completed item', date: null, completedAt: (completedAtMap && completedAtMap[String(id)]) || null });
        }
      }
      const sorted = list.sort((a, b) => {
        const da = a.startDate ? new Date(a.startDate) : (a.date ? new Date(a.date) : null);
        const db = b.startDate ? new Date(b.startDate) : (b.date ? new Date(b.date) : null);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da - db;
      });
      try { console.timeEnd && console.timeEnd('overview:memo:completedList'); } catch (e) {}
      return sorted;
    } catch (e) { try { console.timeEnd && console.timeEnd('overview:memo:completedList'); } catch (e) {} return []; }
  }, [events, completedDeadlines, completedAtMap]);

  // Show loading screen while checking authentication
  if (!authChecked) {
    return (
      <>
        <Head>
          <title>Overview — University Planner</title>
        </Head>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Overview — University Planner</title>
      </Head>
      <div className="min-h-screen bg-white" style={{ background: '#ffffff' }}>
      <CalendarHeader userName={userName} />
      
      <div className="max-w-[1450px] mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-5xl font-black text-slate-900 dark:text-slate-100 mb-2" style={{ letterSpacing: '-0.02em' }}>
            Good {currentDate.getHours() < 12 ? 'morning' : currentDate.getHours() < 18 ? 'afternoon' : 'evening'}, {userName}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard
            icon={<TrendingUp />}
            label="Current GPA"
            loading={loading}
            value={stats.gpa !== null ? (typeof stats.gpa === 'number' ? stats.gpa.toFixed(2) : stats.gpa) : '—'}
            bgColor="bg-purple-100 dark:bg-purple-900/30"
            iconColor="text-purple-700 dark:text-purple-400"
          />
          <StatCard
            icon={<BookOpen />}
            label="Total Credits"
            loading={loading}
            value={stats.credits !== null ? stats.credits : '—'}
            bgColor="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-700 dark:text-blue-400"
          />
          <StatCard
            icon={<Users />}
            label="Attendance Rate"
            loading={loading}
            value={stats.attendanceRate !== null ? `${stats.attendanceRate}%` : '—'}
            bgColor="bg-emerald-100 dark:bg-emerald-900/30"
            iconColor="text-emerald-700 dark:text-emerald-400"
          />
        </div>

        {/* Attendance diagnostic (only visible when there's an issue) */}
    {/* Removed user-facing attendance hint: show neutral stat ('—') until data exists. Dev-only debug block still present below. */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Classes */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="bg-purple-600 px-6 py-5 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <Calendar className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-white">Today's Classes</h3>
                      <p className="text-xs text-purple-100">{todayClasses.length} {todayClasses.length === 1 ? 'class' : 'classes'} scheduled</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-purple-100 bg-white/10 px-3 py-1 rounded-lg">
                    {currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {todayClasses.length > 0 ? (
                  <div className="space-y-3">
                    {todayClasses.map((cls) => (
                      <div
                        key={cls.id}
                        className="group flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 cursor-pointer hover:shadow-md hover:-translate-y-1"
                      >
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <GraduationCap className="w-6 h-6 text-purple-700 dark:text-purple-400" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2.5 py-1 rounded-md">
                              {cls.code}
                            </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{cls.name}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
                            {cls.time && (
                              <div className="flex items-center gap-1.5 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{cls.time}</span>
                              </div>
                            )}
                            {cls.location && (
                              <div className="flex items-center gap-1.5 font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{cls.location}</span>
                              </div>
                            )}
                            {cls.instructor && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                <span>{cls.instructor}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                      <Calendar className="w-10 h-10 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">No classes today</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">You have a free day! Perfect time to catch up on assignments or relax.</p>
                    <Link href="/timetable" prefetch={true}>
                      <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        <Calendar className="w-4 h-4" />
                        View Timetable
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="bg-purple-600 px-6 py-5 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <Target className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-white">Upcoming Deadlines</h3>
                      <p className="text-xs text-purple-100">{visibleUpcomingDeadlines.length} active {visibleUpcomingDeadlines.length === 1 ? 'deadline' : 'deadlines'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/calendar" prefetch={true}>
                      <button className="text-sm text-purple-100 hover:text-white transition-colors font-semibold">
                        View All
                      </button>
                    </Link>
                    {completedList.length > 0 && (
                      <button
                        className="inline-flex items-center gap-2 text-sm bg-white/20 hover:bg-white/30 text-white px-3.5 py-1.5 rounded-lg transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
                        onClick={() => setShowCompleted(s => !s)}
                        aria-pressed={showCompleted}
                      >
                        {showCompleted ? (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            <span>Hide Completed</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" strokeWidth={2.5} />
                            <span>Show Completed</span>
                            <span className="ml-0.5 px-1.5 py-0.5 bg-white/20 rounded text-xs font-semibold">{completedList.length}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {visibleUpcomingDeadlines.length > 0 ? (
                  <div className="space-y-3">
                    {visibleUpcomingDeadlines.map(d => {
                      const isUrgent = d.daysLeft <= 2;
                      const isWarning = d.daysLeft > 2 && d.daysLeft <= 5;
                      const bgColor = isUrgent ? 'bg-red-100 dark:bg-red-900/30' : isWarning ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30';
                      const iconColor = isUrgent ? 'text-red-700 dark:text-red-400' : isWarning ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400';
                      const badgeBg = isUrgent ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : isWarning ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300';
                      
                      return (
                        <div key={d.id} className="group flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                          <label className="inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={completedDeadlines.has(d.id)} 
                              onChange={() => { toggleCompleted(d.id, !completedDeadlines.has(d.id)); }}
                              className="sr-only peer" 
                            />
                            <span className="w-5 h-5 flex items-center justify-center rounded border-2 border-slate-300 dark:border-slate-600 peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500 peer-checked:border-transparent transition-all">
                              <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={2.5} />
                            </span>
                          </label>
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor} group-hover:scale-105 transition-transform duration-300`}>
                            <AlertCircle className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium mb-1 ${completedDeadlines.has(d.id) ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'} truncate`}>
                              {d.title}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Due {d.dueDate}</p>
                          </div>
                          <div className={`px-2.5 py-1 rounded text-xs font-semibold ${badgeBg}`}>
                            {d.daysLeft}d
                          </div>
                          <button
                            onClick={() => archiveDeadline(d.id)}
                            className="ml-2 text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Archive this deadline"
                          >
                            Archive
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                      <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">All caught up!</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">No pending deadlines. You're doing great! Keep up the good work.</p>
                    <button
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      onClick={openCreateEventModal}
                    >
                      <Plus className="w-4 h-4" />
                      Create Event
                    </button>
                  </div>
                )}

                {/* Completed list (modern design with collapse animation) */}
                {showCompleted && (
                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                        </div>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">Completed Tasks</h4>
                      </div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded">
                        {completedList.length} {completedList.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    {completedList.length > 0 ? (
                      <div className="space-y-2">
                        {completedList.map(ev => (
                          <div 
                            key={ev.id} 
                            className="group flex items-center gap-3 p-3.5 rounded-lg bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-900/10 dark:to-transparent border border-emerald-200/50 dark:border-emerald-700/30 hover:border-emerald-300 dark:hover:border-emerald-600/50 transition-all duration-200 hover:shadow-sm"
                          >
                            <label className="inline-flex items-center cursor-pointer group/checkbox">
                              <input 
                                type="checkbox" 
                                checked={true} 
                                onChange={() => { toggleCompleted(ev.id, false); }} 
                                className="sr-only peer" 
                              />
                              <span className="w-5 h-5 flex items-center justify-center rounded border-2 border-emerald-500 dark:border-emerald-400 bg-emerald-500 dark:bg-emerald-400 text-white group-hover/checkbox:scale-110 transition-transform duration-200 shadow-sm">
                                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                              </span>
                            </label>
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                              <CheckCircle className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                {ev.title || ev.name || 'Completed item'}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                  Completed
                                </div>
                                {ev.startDate && (
                                  <>
                                    <span className="text-xs text-slate-400">•</span>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                      {new Date(ev.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => archiveDeadline(ev.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 px-2.5 py-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
                              title="Archive this task"
                            >
                              Archive
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">No completed items yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* This Week */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-shadow duration-300 hover:shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4.5 h-4.5 text-purple-700 dark:text-purple-400" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">This Week</h3>
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
                          ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}>
                        {date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-700 dark:text-slate-300">Classes this week</span>
                  <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">{weekClassesCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-700 dark:text-slate-300">Assignments due</span>
                  <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">{assignmentsDueCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-700 dark:text-slate-300">Study hours</span>
                  <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">{studyHoursLogged}</span>
                </div>
              </div>
            </div>

            {/* Active Modules */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-shadow duration-300 hover:shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4.5 h-4.5 text-blue-700 dark:text-blue-400" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Active Modules</h3>
              </div>
              
              <div className="space-y-2.5">
                {courses.map((course) => {
                  const colors = [
                    { dot: 'bg-blue-500', hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20' },
                    { dot: 'bg-emerald-500', hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
                    { dot: 'bg-violet-500', hover: 'hover:bg-violet-50 dark:hover:bg-violet-900/20' }
                  ];
                  const color = colors[courses.indexOf(course) % colors.length];
                  
                  return (
                    <Link href="/courses" key={course.id} prefetch={true}>
                      <div className={`group flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 ${color.hover} border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 cursor-pointer hover:shadow-md hover:-translate-y-0.5`}>
                        <div className={`w-2 h-2 rounded-full ${color.dot}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{course.code}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{course.name}</p>
                        </div>
                        <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border ${
            toast.type === 'success' 
              ? 'bg-emerald-500/95 border-emerald-400 text-white' 
              : 'bg-red-500/95 border-red-400 text-white'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
    </>
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