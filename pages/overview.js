import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Calendar, BookOpen, TrendingUp, Clock, CheckCircle, Check, AlertCircle, GraduationCap, Users, Plus, Home, Settings, LogOut, Target, Archive, XCircle, Award, MapPin, User, FileText, Timer, BarChart3, Flame, ChevronRight, Lightbulb, ArrowRight, CalendarOff, CheckSquare, Navigation, MoreVertical, Edit2, Trash2, Bell, Beaker, Tag, ListTodo } from 'lucide-react';
import AddEventModal from '@/components/schedule/_modals/add-event-modal';
import CustomModal from '@/components/ui/custom-modal';
import { useModal } from '@/providers/modal-context';
import { fetchWithCache, invalidateCache } from '../lib/cache';
import HeroSection from '@/components/overview/HeroSection';
import RecentTasks from '@/components/overview/RecentTasks';
import TodaysSchedule from '@/components/overview/TodaysSchedule';
import HygraphSidebar from '@/components/HygraphSidebar';

// Course color palette (matches design doc)
const DEFAULT_COURSE_COLORS = [
  '#7C3AED', // purple
  '#2563EB', // blue
  '#059669', // green
  '#DC2626', // red
  '#EA580C', // orange
  '#CA8A04', // yellow
];

// Urgency-based colors (matches design doc)
const URGENCY_COLORS = {
  critical: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  urgent: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400', badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
  soon: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-400', badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
  normal: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  success: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
};

// Get course color with fallback
function getCourseColor(course, index = 0) {
  if (course?.color) return course.color;
  return DEFAULT_COURSE_COLORS[index % DEFAULT_COURSE_COLORS.length];
}

// Calculate urgency level for a deadline
function getUrgencyLevel(date) {
  if (!date) return 'normal';
  const now = new Date();
  const deadline = new Date(date);
  const diffMs = deadline - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  if (diffMs < 0) return 'critical'; // overdue
  if (diffHours < 24) return 'urgent'; // due today
  if (diffDays < 7) return 'soon'; // due this week
  return 'normal'; // upcoming
}

// Format time until deadline
function getTimeUntilText(date) {
  if (!date) return '';
  const now = new Date();
  const deadline = new Date(date);
  const diffMs = deadline - now;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMs < 0) return 'OVERDUE';
  if (diffMins < 60) return `in ${diffMins}min`;
  if (diffHours < 24) return `in ${diffHours}h`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `in ${diffDays} days`;
  return deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CalendarHeader = React.memo(function CalendarHeader({ userName, todayTasksCount, upcomingClassTime, completedList }) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = React.useState(false);
  
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Overview</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 relative transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                {completedList.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {completedList.length > 9 ? '9+' : completedList.length}
                  </span>
                )}
              </button>
              
              {notifOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                      <h3 className="font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Completed today</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {completedList.length === 0 ? (
                        <div className="p-8 text-center">
                          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">No completed tasks yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 dark:divide-slate-700">
                          {completedList.slice(0, 10).map((item, idx) => (
                            <div key={item.id || idx} className="p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full mt-0.5">
                                  <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {item.name || item.title || 'Task'}
                                  </p>
                                  {item.completedAt && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {new Date(item.completedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-slate-700">
                      <Link href="/history" prefetch={true}>
                        <button className="w-full text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                          View All History
                        </button>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <Link href="/settings" prefetch={true}>
              <button 
                className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-gray-700 dark:text-slate-300"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
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
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-gray-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});

const StatCard = React.memo(function StatCard({ icon, label, value, loading, bgColor, iconColor }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor}`}>
          {React.cloneElement(icon, { className: `w-5 h-5 ${iconColor}` })}
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {loading ? (
            <span className="inline-block w-16 h-8 bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse"></span>
          ) : (
            value
          )}
        </p>
      </div>
    </div>
  );
});

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
  const [checkingTasks, setCheckingTasks] = useState(new Set());
  
  // Toast notification state
  const [toast, setToast] = useState(null);
  
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // Cmd/Ctrl + K - Quick add command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCreateEventModal();
      }
      // Cmd/Ctrl + N - New task
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        openCreateEventModal();
      }
      // Cmd/Ctrl + 1-5 for navigation
      if ((e.metaKey || e.ctrlKey) && ['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        const routes = ['/overview', '/schedule', '/tasks', '/modules', '/analytics'];
        router.push(routes[parseInt(e.key) - 1]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
  
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

  // Memoize week calculations for performance - START ON MONDAY
  const weekDays = useMemo(() => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], []);
  const startOfWeek = useMemo(() => {
    const date = new Date(currentDate);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day; // If Sunday (0), go back 6 days; otherwise go to Monday
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [currentDate]);

  // Derived lists from fetched data
  const isSameDay = useCallback((a, b) => {
    try {
      if (!a || !b) return false;
      const da = new Date(String(a));
      const db = new Date(String(b));
      return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
    } catch (e) { return false; }
  }, []);

  const formatTime = useCallback((v) => {
    try {
      if (!v) return '';
      // v may be 'HH:MM' or an ISO string
      if (/^\d{2}:\d{2}$/.test(String(v))) return String(v);
      const d = new Date(String(v));
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  }, []);

  const formatDue = useCallback((ev) => {
    try {
      if (!ev) return '';
      if (ev.startDate) return new Date(ev.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (ev.date) return typeof ev.date === 'string' ? ev.date : new Date(ev.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return '';
    } catch (e) { return ''; }
  }, []);

  const todayClasses = useMemo(() => {
    try {
      // Don't compute timezone-sensitive values during SSR â€” wait until client mount
      if (!mounted) return [];
      try { console.time && console.time('overview:memo:todayClasses'); } catch (e) {}
      const list = [];
      for (const ev of events || []) {
        if (!ev) continue;
        const t = (ev.type || '').toString().toLowerCase();
        // Today's classes: instructional/session types only
        const classTypes = ['class', 'lecture', 'lab', 'tutorial', 'seminar', 'workshop', 'practical'];
        if (!classTypes.includes(t)) continue;
        if (ev.startDate && !isSameDay(ev.startDate, currentDate)) continue;
        if (!ev.startDate && ev.date && !isSameDay(ev.date, currentDate)) continue;

        let startTime = '';
        let endTime = '';
        let startTs = null;
        try {
          // Extract start time
          if (ev.startDate) {
            const d = new Date(ev.startDate);
            if (!isNaN(d.getTime())) {
              startTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              startTs = d.getTime();
            }
          } else if (ev.time) {
            // If time is in HH:MM format
            if (/^\d{2}:\d{2}$/.test(ev.time)) {
              startTime = ev.time;
            } else {
              startTime = formatTime(ev.time);
            }
            // Parse timestamp for sorting
            const m = String(ev.time).match(/(\d{1,2}):(\d{2})/);
            if (m) {
              const d = new Date(currentDate);
              d.setHours(Number(m[1]), Number(m[2]), 0, 0);
              startTs = d.getTime();
            }
          }
          
          // Extract end time
          if (ev.endDate) {
            const d = new Date(ev.endDate);
            if (!isNaN(d.getTime())) {
              endTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            }
          } else if (ev.durationMinutes && startTs) {
            const e = new Date(startTs + (Number(ev.durationMinutes) || 0) * 60000);
            endTime = e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          }
        } catch (e) {}

        let moduleCode = (ev.meta && (ev.meta.course || ev.meta.courseCode)) || '';
        try {
          // First try to find the course by course_id and get its code
          if (ev.course_id && Array.isArray(courses)) {
            const found = courses.find(c => c && String(c.id) === String(ev.course_id));
            if (found && (found.code || found.courseCode)) {
              moduleCode = found.code || found.courseCode;
            }
          }
          // If still no code, try extracting from title/name/description
          if ((!moduleCode || moduleCode === '') && (ev.title || ev.name || ev.description)) {
            const extracted = extractModuleCode(ev.title || ev.name || ev.description, courses);
            if (extracted) moduleCode = extracted;
          }
          if (!moduleCode) moduleCode = '';
        } catch (e) {}

        // Calculate end timestamp
        let endTs = null;
        if (ev.endDate) {
          const d = new Date(ev.endDate);
          if (!isNaN(d.getTime())) endTs = d.getTime();
        } else if (ev.durationMinutes && startTs) {
          endTs = startTs + (Number(ev.durationMinutes) || 0) * 60000;
        } else if (startTs && endTime) {
          // Parse end time from string
          const m = endTime.match(/(\d{1,2}):(\d{2})/);
          if (m) {
            const d = new Date(currentDate);
            d.setHours(Number(m[1]), Number(m[2]), 0, 0);
            endTs = d.getTime();
          }
        }

        list.push({
          id: ev.id,
          code: moduleCode || '',
          name: ev.title || ev.name || '',
          startTime,
          startTs,
          endTime,
          endTs,
          time: (startTime && endTime) ? `${startTime} - ${endTime}` : (startTime || ev.time || ''),
          instructor: ev.instructor || (ev.meta && ev.meta.instructor) || '',
          location: ev.location || '',
          course_id: ev.course_id,
          course: ev.course || moduleCode
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
  }, [events, courses, currentDate, mounted, isSameDay, formatTime]);

  // Tomorrow's first class
  const tomorrowFirstClass = useMemo(() => {
    try {
      if (!mounted) return null;
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const tomorrowClasses = [];
      for (const ev of events || []) {
        if (!ev) continue;
        const t = (ev.type || '').toString().toLowerCase();
        const classTypes = ['class', 'lecture', 'lab', 'tutorial', 'seminar', 'workshop', 'practical'];
        if (!classTypes.includes(t)) continue;
        
        if (ev.startDate && isSameDay(ev.startDate, tomorrow)) {
          tomorrowClasses.push(ev);
        } else if (!ev.startDate && ev.date && isSameDay(ev.date, tomorrow)) {
          tomorrowClasses.push(ev);
        }
      }
      
      if (tomorrowClasses.length === 0) return null;
      
      // Sort by time and get first
      tomorrowClasses.sort((a, b) => {
        const getTime = (ev) => {
          if (ev.startDate) return new Date(ev.startDate).getTime();
          if (ev.time) {
            const m = String(ev.time).match(/(\d{1,2}):(\d{2})/);
            if (m) return Number(m[1]) * 60 + Number(m[2]);
          }
          return 9999;
        };
        return getTime(a) - getTime(b);
      });
      
      const first = tomorrowClasses[0];
      let startTime = '';
      if (first.startDate) {
        const d = new Date(first.startDate);
        startTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      } else if (first.time) {
        startTime = first.time;
      }
      
      let moduleCode = '';
      if (first.course_id && Array.isArray(courses)) {
        const found = courses.find(c => c && String(c.id) === String(first.course_id));
        if (found) moduleCode = found.code || found.courseCode || '';
      }
      if (!moduleCode) moduleCode = extractModuleCode(first.title || first.name, courses) || '';
      
      return {
        code: moduleCode,
        name: first.title || first.name || '',
        time: startTime,
        location: first.location || ''
      };
    } catch (e) {
      return null;
    }
  }, [events, courses, currentDate, mounted, isSameDay, extractModuleCode]);

  const upcomingDeadlines = useMemo(() => {
    try {
      try { console.time && console.time('overview:memo:upcomingDeadlines'); } catch (e) {}
      const list = [];
      for (const ev of events || []) {
        if (!ev) continue;
        const t = (ev.type || '').toString().toLowerCase();
        const evId = String(ev.id);
        // Upcoming deadlines: assessment/submission types only
        const deadlineTypes = ['deadline', 'assignment', 'project', 'quiz', 'exam', 'test', 'assessment', 'homework'];
        if (!deadlineTypes.includes(t)) continue;
        const d = ev.startDate ? new Date(ev.startDate) : (ev.date ? new Date(ev.date) : null);
        const daysLeft = (!d || isNaN(d.getTime())) ? 9999 : Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())) / (1000 * 60 * 60 * 24));
        list.push({
          id: ev.id,
          title: ev.title || ev.name || '',
          dueDate: formatDue(ev),
          daysLeft: typeof daysLeft === 'number' ? daysLeft : null,
          type: ev.type || 'assignment',
          // Add fields needed for new rendering
          due: ev.startDate || ev.date,
          date: ev.startDate || ev.date,
          course: ev.course || ev.courseName || '',
          course_id: ev.course_id || ev.courseId,
          description: ev.description || '',
          priority: ev.meta?.priority || 'not-urgent-not-important'
        });
      }
      list.sort((a, b) => (a.daysLeft || 9999) - (b.daysLeft || 9999));
      try { console.timeEnd && console.timeEnd('overview:memo:upcomingDeadlines'); } catch (e) {}
      return list;
    } catch (e) { try { console.timeEnd && console.timeEnd('overview:memo:upcomingDeadlines'); } catch (e) {} return []; }
  }, [events, currentDate, completedDeadlines, formatDue]);

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
  }, [upcomingDeadlines, hiddenCompleted, showCompleted, completedAtMap, completedDeadlines]);

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
      // Use cached data with 2 minute TTL for much better performance
      const [evJson, coursesJson, gradesJson, sessionsStatsJson] = await Promise.all([
        fetchWithCache('/api/events', { credentials: 'same-origin' }, 120000),
        fetchWithCache('/api/courses', { credentials: 'same-origin' }, 120000),
        fetchWithCache('/api/grades', { credentials: 'same-origin' }, 120000),
        fetchWithCache('/api/sessions/stats', { credentials: 'same-origin' }, 120000)
      ]);

      const fetchedEvents = Array.isArray(evJson.events) ? evJson.events : [];
      const fetchedCourses = coursesJson && coursesJson.success && Array.isArray(coursesJson.courses) ? coursesJson.courses : [];
      const fetchedGrades = gradesJson && gradesJson.success && Array.isArray(gradesJson.data) ? gradesJson.data : [];
      const sessionsStats = sessionsStatsJson && sessionsStatsJson.success && sessionsStatsJson.stats ? sessionsStatsJson.stats : null;

      setEvents(fetchedEvents);
      setCourses(fetchedCourses);
      setGradesData(fetchedGrades);
      
      // Calculate study hours from focus sessions (convert seconds to hours)
      if (sessionsStats && sessionsStats.week) {
        const weekDuration = sessionsStats.week.total_duration || 0;
        const studyHours = Math.floor(weekDuration / 3600);
        setStudyHoursLogged(studyHours);
      }
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
      // If still no credits but we have courses, assume 15 credits per course
      if (!credits && Array.isArray(courses) && courses.length > 0) credits = courses.length * 15;

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
          // nothing authoritative to use for attendance lookups â€” likely not signed in.
          // Show a sign-in hint instead of silently leaving the stat as 'â€”'.
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
      
      // Invalidate events cache to ensure fresh data on next load
      invalidateCache('/api/events' + JSON.stringify({ credentials: 'same-origin' }));
      
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
      // Invalidate cache to ensure fresh data on next load
      invalidateCache('/api/events' + JSON.stringify({ credentials: 'same-origin' }));
    }
  };

  const completedList = useMemo(() => {
    try {
      try { console.time && console.time('overview:memo:completedList'); } catch (e) {}
      const seen = new Set();
      const list = [];
      
      // Get today's midnight for filtering
      const todayMidnight = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      
      for (const e of events || []) {
        if (!e) continue;
        const id = String(e.id);
        if ((e.completed === true || completedDeadlines.has(id)) && !seen.has(id)) {
          seen.add(id);
          const withTs = { ...(e || {}), completedAt: (completedAtMap && completedAtMap[id]) || e.completedAt || e.completed_at || null };
          
          // Filter: only show if completed TODAY (on or after today's midnight)
          if (withTs.completedAt) {
            const completedDate = new Date(withTs.completedAt);
            if (!isNaN(completedDate.getTime()) && completedDate >= todayMidnight) {
              list.push(withTs);
            }
          } else {
            // If no completedAt timestamp, include it (assume recently completed)
            list.push(withTs);
          }
        }
      }
      for (const id of Array.from(completedDeadlines)) {
        if (seen.has(String(id))) continue;
        const found = (events || []).find(ev => String(ev.id) === String(id));
        if (found) {
          const idStr = String(id);
          const withTs = { ...(found || {}), completedAt: (completedAtMap && completedAtMap[idStr]) || found.completedAt || found.completed_at || null };
          
          // Filter: only show if completed TODAY
          if (withTs.completedAt) {
            const completedDate = new Date(withTs.completedAt);
            if (!isNaN(completedDate.getTime()) && completedDate >= todayMidnight) {
              list.push(withTs);
              seen.add(String(id));
            }
          } else {
            // No timestamp, include it
            list.push(withTs);
            seen.add(String(id));
          }
        } else {
          const completedAt = (completedAtMap && completedAtMap[String(id)]) || null;
          if (completedAt) {
            const completedDate = new Date(completedAt);
            if (!isNaN(completedDate.getTime()) && completedDate >= todayMidnight) {
              list.push({ id, title: 'Completed item', date: null, completedAt });
            }
          } else {
            list.push({ id, title: 'Completed item', date: null, completedAt: null });
          }
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
  }, [events, completedDeadlines, completedAtMap, currentDate]);

  // Calculate quick stats for header (must be before early return to avoid hook order issues)
  const todayTasksCount = useMemo(() => {
    return upcomingDeadlines.filter(d => {
      if (!d.due && !d.date) return false;
      const deadlineDate = new Date(d.due || d.date);
      const today = new Date();
      return deadlineDate.toDateString() === today.toDateString();
    }).length;
  }, [upcomingDeadlines]);

  const upcomingClassTime = useMemo(() => {
    if (todayClasses.length === 0) return null;
    const now = new Date();
    const upcoming = todayClasses.find(cls => {
      if (!cls.startTs) return false;
      return cls.startTs > now.getTime();
    });
    if (!upcoming) return null;
    const diffMs = upcoming.startTs - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `Class in ${diffMins}min`;
    const diffHours = Math.floor(diffMins / 60);
    return `Class in ${diffHours}h`;
  }, [todayClasses]);

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
    <HygraphSidebar pageName="Overview">
      <Head>
        <title>Overview — University Planner</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      
      {/* Main container with max-width */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Hero Section */}
        <HeroSection 
          userName={userName}
          tasksInProgress={upcomingDeadlines.filter(d => !completedDeadlines.has(String(d.id))).length}
          onViewTasks={() => router.push('/tasks')}
        />

        {/* Academic Overview - Detailed */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200/60 dark:border-slate-800/60 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Academic Overview</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your academic performance</p>
            </div>
            <Link href="/grades" prefetch={true}>
              <button className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                View Details
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {/* GPA - Horizontal Layout */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-gray-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-3">
                {/* Icon left */}
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                {/* Number right */}
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : stats.gpa !== null ? stats.gpa.toFixed(2) : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">/ 4.0</p>
                </div>
              </div>
              {/* Label below */}
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Current GPA</p>
            </div>

            {/* Credits - Horizontal Layout */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-gray-200/60 dark:border-slate-700/60">
              <div className="flex items-start justify-between mb-3">
                {/* Icon left */}
                <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                {/* Number right */}
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : stats.credits !== null ? stats.credits : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{courses.length} {courses.length === 1 ? 'module' : 'modules'}</p>
                </div>
              </div>
              
              {/* Label */}
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Credits Enrolled</p>
            </div>

            {/* Attendance - Horizontal Layout */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-gray-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-3">
                {/* Icon left */}
                <div className="p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                {/* Number right */}
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : stats.attendanceRate !== null ? `${Math.round(stats.attendanceRate)}%` : 'N/A'}
                  </p>
                  {!loading && stats.attendanceRate !== null && stats.attendanceRate >= 90 && (
                    <p className="text-xs text-green-600 dark:text-green-400">On Track</p>
                  )}
                </div>
              </div>
              {/* Label below */}
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Attendance Rate</p>
            </div>
          </div>
          
          {!loading && stats.gpa === null && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Tip:</strong> Add grades to your assessments to see your GPA here.
              </p>
            </div>
          )}
        </div>

        {/* Main Content Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN: Today's Schedule + Tasks */}
          <div className="space-y-6">
            <TodaysSchedule
              events={events}
              currentDate={currentDate}
              onViewDetails={(event) => console.log('View event:', event)}
            />
          
            {/* TASKS CARD */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
              <div className="bg-purple-600 dark:bg-purple-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Target className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Tasks</h2>
                      <p className="text-xs text-purple-100 mt-0.5">
                        {upcomingDeadlines.filter(d => !completedDeadlines.has(String(d.id))).length} {upcomingDeadlines.filter(d => !completedDeadlines.has(String(d.id))).length === 1 ? 'task' : 'tasks'} to complete
                      </p>
                    </div>
                  </div>
                  <Link href="/tasks" prefetch={true}>
                    <button className="text-xs font-medium text-white hover:text-purple-100 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors">
                      View All
                    </button>
                  </Link>
                </div>
              </div>

              <div className="p-6">

              {upcomingDeadlines.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingDeadlines.slice(0, 5).map((deadline, index) => {
                      const course = courses.find(c => c.id === deadline.course_id || c.code === deadline.course);
                      const courseColor = getCourseColor(course, index);
                      const dueDate = new Date(deadline.due || deadline.date);
                      const now = new Date();
                      const isOverdue = dueDate < now;
                      const diffMs = dueDate - now;
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                      
                      // Priority configuration with softer colors
                      const priorityConfig = {
                        'urgent-important': { 
                          label: 'Do First', 
                          color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
                          Icon: AlertCircle
                        },
                        'not-urgent-important': { 
                          label: 'Schedule', 
                          color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
                          Icon: Target
                        },
                        'urgent-not-important': { 
                          label: 'Delegate', 
                          color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
                          Icon: Clock
                        },
                        'not-urgent-not-important': { 
                          label: 'Low Priority', 
                          color: 'bg-gray-50 dark:bg-gray-800/20 text-gray-600 dark:text-gray-400',
                          Icon: FileText
                        },
                      };
                      
                      const priority = priorityConfig[deadline.priority] || priorityConfig['not-urgent-not-important'];
                      const PriorityIcon = priority.Icon;
                      
                      // Time display
                      let timeText = '';
                      let timeColor = 'text-gray-600 dark:text-gray-400';
                      let urgencyBadge = null;
                      
                      if (isOverdue) {
                        const overdueDays = Math.abs(diffDays);
                        timeText = '';
                        timeColor = 'text-red-600 dark:text-red-400 font-semibold';
                        urgencyBadge = (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white rounded-md font-bold text-xs uppercase tracking-wide shadow-sm">
                            <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                            Overdue
                          </span>
                        );
                      } else if (diffDays === 0) {
                        if (diffHours < 3) {
                          timeText = `Due in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
                          timeColor = 'text-red-600 dark:text-red-400 font-semibold';
                        } else {
                          timeText = 'Due today';
                          timeColor = 'text-orange-600 dark:text-orange-400 font-semibold';
                        }
                        urgencyBadge = (
                          <span className="px-2.5 py-1 bg-orange-500 text-white rounded-md font-bold text-xs uppercase tracking-wide shadow-sm">
                            Today
                          </span>
                        );
                      } else if (diffDays === 1) {
                        timeText = 'Due tomorrow';
                        timeColor = 'text-yellow-600 dark:text-yellow-400 font-medium';
                      } else if (diffDays <= 3) {
                        timeText = `Due in ${diffDays} days`;
                        timeColor = 'text-yellow-600 dark:text-yellow-400 font-medium';
                      } else if (diffDays <= 7) {
                        timeText = `Due in ${diffDays} days`;
                        timeColor = 'text-blue-600 dark:text-blue-400';
                      } else {
                        timeText = dueDate.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: dueDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
                        });
                        timeColor = 'text-gray-600 dark:text-gray-400';
                      }
                      
                      const isChecked = completedDeadlines.has(String(deadline.id));
                      
                      const handleCheckTask = async () => {
                        const taskId = String(deadline.id);
                        const willBeChecked = !isChecked;
                        
                        // Optimistic update
                        setCompletedDeadlines(prev => {
                          const next = new Set(prev);
                          if (willBeChecked) {
                            next.add(taskId);
                          } else {
                            next.delete(taskId);
                          }
                          return next;
                        });
                        
                        // Update completedAtMap
                        if (willBeChecked) {
                          setCompletedAtMap(prev => ({ ...prev, [taskId]: new Date().toISOString() }));
                        } else {
                          setCompletedAtMap(prev => {
                            const next = { ...prev };
                            delete next[taskId];
                            return next;
                          });
                        }
                        
                        try {
                          const body = { completed: willBeChecked };
                          if (willBeChecked) {
                            body.completedAt = new Date().toISOString();
                          } else {
                            body.completedAt = null;
                          }
                          
                          const response = await fetch(`/api/events/${deadline.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body)
                          });
                          
                          if (response.ok) {
                            const json = await response.json();
                            const updatedEvent = json.event || json;
                            
                            // Update the events array with the new completed status
                            setEvents(prev => prev.map(e => 
                              String(e.id) === taskId ? { ...e, completed: willBeChecked } : e
                            ));
                            
                            showToast(willBeChecked ? 'Task completed!' : 'Task uncompleted', 'success');
                          } else {
                            // Revert on failure
                            setCompletedDeadlines(prev => {
                              const next = new Set(prev);
                              if (willBeChecked) {
                                next.delete(taskId);
                              } else {
                                next.add(taskId);
                              }
                              return next;
                            });
                            setCompletedAtMap(prev => {
                              if (!willBeChecked) {
                                return { ...prev, [taskId]: new Date().toISOString() };
                              }
                              const next = { ...prev };
                              delete next[taskId];
                              return next;
                            });
                            showToast('Failed to update task', 'error');
                          }
                        } catch (error) {
                          console.error('Error updating task:', error);
                          // Revert on error
                          setCompletedDeadlines(prev => {
                            const next = new Set(prev);
                            if (willBeChecked) {
                              next.delete(taskId);
                            } else {
                              next.add(taskId);
                            }
                            return next;
                          });
                          setCompletedAtMap(prev => {
                            if (!willBeChecked) {
                              return { ...prev, [taskId]: new Date().toISOString() };
                            }
                            const next = { ...prev };
                            delete next[taskId];
                            return next;
                          });
                          showToast('Failed to update task', 'error');
                        }
                      };
                      
                      return (
                        <div 
                          key={deadline.id} 
                          className={`group relative rounded-xl border bg-white dark:bg-slate-800/50 transition-all duration-200 hover:shadow-md hover:border-purple-200 dark:hover:border-purple-700 cursor-pointer ${
                            isChecked 
                              ? 'opacity-50 border-gray-200/60 dark:border-slate-700/60' 
                              : 'border-gray-200 dark:border-slate-700 hover:-translate-y-0.5'
                          }`}
                        >
                          <div className="p-4">
                            <div className="flex items-start gap-3.5">
                              {/* Custom Checkbox */}
                              <div className="flex-shrink-0 pt-0.5">
                                <button
                                  onClick={handleCheckTask}
                                  className="relative w-5 h-5 rounded-md border-2 cursor-pointer transition-all hover:scale-110 flex items-center justify-center shadow-sm"
                                  style={isChecked ? { 
                                    borderColor: courseColor,
                                    backgroundColor: courseColor
                                  } : {
                                    borderColor: '#cbd5e1'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isChecked) {
                                      e.currentTarget.style.borderColor = courseColor;
                                      e.currentTarget.style.backgroundColor = courseColor + '20';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isChecked) {
                                      e.currentTarget.style.borderColor = '#cbd5e1';
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                  }}
                                >
                                  {isChecked && (
                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                  )}
                                </button>
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                {/* Title */}
                                <h4 className={`text-[15px] font-semibold text-gray-900 dark:text-white mb-2.5 leading-snug ${isChecked ? 'line-through' : ''}`}>
                                  {deadline.title}
                                </h4>
                                
                                {/* Meta info row */}
                                <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                                  {/* Course badge */}
                                  {course && (
                                    <span 
                                      className="px-2.5 py-1 rounded-md text-xs font-semibold text-white shadow-sm"
                                      style={{ backgroundColor: courseColor }}
                                    >
                                      {course.code || course.name}
                                    </span>
                                  )}
                                  
                                  {/* Priority badge */}
                                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${priority.color}`}>
                                    <PriorityIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                                    {priority.label}
                                  </span>
                                </div>
                                
                                {/* Time info */}
                                <div className="flex items-center gap-1.5 text-xs mb-2">
                                  {urgencyBadge ? (
                                    urgencyBadge
                                  ) : (
                                    <>
                                      <Clock className={`w-3.5 h-3.5 ${timeColor}`} />
                                      <span className={timeColor}>{timeText}</span>
                                    </>
                                  )}
                                </div>
                                
                                {/* Description preview */}
                                {deadline.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                    {deadline.description}
                                  </p>
                                )}
                              </div>
                              
                              {/* Archive button */}
                              <div className="flex-shrink-0">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm('Archive this task? It will be moved to history.')) {
                                      await archiveDeadline(deadline.id);
                                    }
                                  }}
                                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                  title="Archive task"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 dark:text-green-400 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">All caught up</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">No pending deadlines</p>
                    
                    {/* 2x2 Action Button Grid */}
                    <div className="max-w-md mx-auto">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                        What to do next
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <Link href="/timetable" prefetch={true}>
                          <button className="w-full h-11 flex items-center justify-start px-4 gap-2.5 border border-gray-300 dark:border-slate-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left">
                            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Review Schedule</span>
                          </button>
                        </Link>
                        <Link href="/grades" prefetch={true}>
                          <button className="w-full h-11 flex items-center justify-start px-4 gap-2.5 border border-gray-300 dark:border-slate-600 rounded-lg hover:border-orange-500 dark:hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-left">
                            <BarChart3 className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Update Grades</span>
                          </button>
                        </Link>
                        <Link href="/tasks" prefetch={true}>
                          <button className="w-full h-11 flex items-center justify-start px-4 gap-2.5 border border-gray-300 dark:border-slate-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left">
                            <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Plan Study</span>
                          </button>
                        </Link>
                        <button 
                          onClick={openCreateEventModal}
                          className="w-full h-11 flex items-center justify-start px-4 gap-2.5 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 rounded-lg transition-colors text-left shadow-sm"
                        >
                          <Plus className="w-4 h-4 text-white flex-shrink-0" />
                          <span className="text-sm font-medium text-white">New Event</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: This Week Navigator */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
              <div className="bg-purple-600 dark:bg-purple-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">This Week</h3>
                  </div>
                  <Link href="/timetable" prefetch={true}>
                    <button className="text-xs font-medium text-white hover:text-purple-100 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors">
                      View Calendar
                    </button>
                  </Link>
                </div>
              </div>

              <div className="p-6">
          
            {/* Week Navigator */}
            <div className="grid grid-cols-7 gap-2 mb-6">
                  {weekDays.map((day, i) => {
                    const dayDate = new Date(startOfWeek);
                    dayDate.setDate(dayDate.getDate() + i);
                    const isToday = dayDate.toDateString() === currentDate.toDateString();
                    const dayEvents = events.filter(e => {
                      if (!e || !e.startDate) return false;
                      const eventDate = new Date(e.startDate);
                      return eventDate.toDateString() === dayDate.toDateString();
                    });
                    const hasClasses = dayEvents.some(e => ['class', 'lecture', 'lab', 'tutorial', 'seminar'].includes((e.type || '').toLowerCase()));
                    
                    return (
                      <button
                        key={day}
                        className={`flex flex-col items-center justify-center py-2.5 rounded-lg transition-all relative border-2 ${
                          isToday 
                            ? 'bg-purple-600 text-white shadow-sm border-purple-700' 
                            : 'border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                        }`}
                      >
                        <span className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${
                          isToday ? 'text-purple-200' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {day}
                        </span>
                        <span className={`text-lg font-bold ${
                          isToday ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}>
                          {dayDate.getDate()}
                        </span>
                        
                        {/* Event Indicator */}
                        {hasClasses && (
                          <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full" style={{
                            backgroundColor: isToday ? 'white' : '#9333EA'
                          }}></div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                <div className="border-t border-gray-200 dark:border-slate-700 my-4"></div>
                
                {/* Week Summary */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Week Summary
                  </p>
                  
                  {/* Classes Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Classes</span>
                      <span className="font-bold text-gray-900 dark:text-white">{(() => {
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(endOfWeek.getDate() + 7);
                        const attended = events.filter(e => {
                          if (!e || !e.startDate) return false;
                          const t = (e.type || '').toLowerCase();
                          if (!['class', 'lecture', 'lab', 'tutorial', 'seminar'].includes(t)) return false;
                          const d = new Date(e.startDate);
                          const isThisWeek = d >= startOfWeek && d < endOfWeek;
                          const isPast = e.endDate ? new Date(e.endDate) < currentDate : d < currentDate;
                          return isThisWeek && isPast;
                        }).length;
                        return attended;
                      })()}/{weekClassesCount}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 dark:bg-purple-500" 
                        style={{ width: `${weekClassesCount > 0 ? (((() => {
                          const endOfWeek = new Date(startOfWeek);
                          endOfWeek.setDate(endOfWeek.getDate() + 7);
                          return events.filter(e => {
                            if (!e || !e.startDate) return false;
                            const t = (e.type || '').toLowerCase();
                            if (!['class', 'lecture', 'lab', 'tutorial', 'seminar'].includes(t)) return false;
                            const d = new Date(e.startDate);
                            const isThisWeek = d >= startOfWeek && d < endOfWeek;
                            const isPast = e.endDate ? new Date(e.endDate) < currentDate : d < currentDate;
                            return isThisWeek && isPast;
                          }).length;
                        })() / weekClassesCount) * 100) : 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{(() => {
                      const endOfWeek = new Date(startOfWeek);
                      endOfWeek.setDate(endOfWeek.getDate() + 7);
                      const remaining = events.filter(e => {
                        if (!e || !e.startDate) return false;
                        const t = (e.type || '').toLowerCase();
                        if (!['class', 'lecture', 'lab', 'tutorial', 'seminar'].includes(t)) return false;
                        const d = new Date(e.startDate);
                        return d >= startOfWeek && d < endOfWeek && d >= currentDate;
                      }).length;
                      return remaining;
                    })()} remaining this week</p>
                  </div>
                  
                  {/* Assignments */}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Assignments</span>
                    {assignmentsDueCount === 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">
                        <Check className="w-3 h-3" />
                        All caught up!
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{assignmentsDueCount} due</span>
                    )}
                  </div>
                  
                  {/* Study Hours */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Study Hours</span>
                      <span className="font-bold text-gray-900 dark:text-white">{studyHoursLogged}h / 20h</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600" 
                        style={{ width: `${(studyHoursLogged / 20) * 100}%` }}
                      ></div>
                    </div>
                    <Link href="/focus" prefetch={true}>
                      <button className="w-full mt-2 flex items-center justify-between px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                          <Timer className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm font-medium">Start Focus</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      
      {/* Floating Action Button - Create Event */}
      <button
        onClick={openCreateEventModal}
        className="fixed bottom-8 right-8 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-40 group hover:scale-105"
        title="Create Event"
        aria-label="Create new event"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
        <span className="absolute right-full mr-3 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg pointer-events-none">
          Create Event
        </span>
      </button>
      
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
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}
      </div>
    </HygraphSidebar>
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
