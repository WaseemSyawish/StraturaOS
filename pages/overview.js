import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Calendar, BookOpen, TrendingUp, Clock, CheckCircle, Check, AlertCircle, AlertTriangle, GraduationCap, Users, Plus, Home, Settings, LogOut, Target, Archive, XCircle, Award, MapPin, User, FileText, Timer, BarChart3, Flame, ChevronRight, Lightbulb, ArrowRight, CalendarOff, CheckSquare, Navigation, MoreVertical, Edit2, Trash2, Bell, Beaker, Tag, ListTodo } from 'lucide-react';
import AddEventModal from '@/components/schedule/_modals/add-event-modal';
import CustomModal from '@/components/ui/custom-modal';
import { useModal } from '@/providers/modal-context';
import { fetchWithCache, invalidateCache } from '../lib/cache';
import HygraphSidebar from '@/components/HygraphSidebar';
import TaskDetailPanel from '@/components/tasks/TaskDetailPanel';
import { parseDatePreserveLocal } from '@/lib/dateHelpers';

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

// Get type icon config for tasks
const getTaskTypeConfig = (type) => {
  const typeConfig = {
    exam: { 
      Icon: AlertTriangle, 
      color: 'text-red-500 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    },
    quiz: { 
      Icon: Beaker, 
      color: 'text-orange-500 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    },
    assignment: { 
      Icon: FileText, 
      color: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    project: { 
      Icon: Target, 
      color: 'text-purple-500 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    study: { 
      Icon: BookOpen, 
      color: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
    },
    default: { 
      Icon: ListTodo, 
      color: 'text-gray-500 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800/30'
    }
  };
  return typeConfig[type?.toLowerCase()] || typeConfig.default;
};

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
  
  // Calculate days difference using date comparison (not hours/24)
  // This ensures "Tomorrow" is only shown for the actual next day
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineStart = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  const diffDays = Math.round((deadlineStart - todayStart) / (1000 * 60 * 60 * 24));
  
  if (diffMs < 0) return 'OVERDUE';
  if (diffDays === 0) {
    // Same day - show hours/minutes
    if (diffMins < 60) return `IN ${diffMins}M`;
    return `IN ${diffHours}H`;
  }
  if (diffDays === 1) return 'TOMORROW';
  if (diffDays < 7) return `IN ${diffDays} DAYS`;
  return deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

// Quick Task Form component for the floating button
const QuickTaskForm = ({ onSubmit, onClose }) => {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit(title.trim());
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-2">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 dark:focus-within:ring-purple-900/30 transition-all">
          <Target className="w-5 h-5 text-purple-500" />
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you need to do?"
            className="flex-1 bg-transparent text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
          💡 Task will be added to today's list. Edit details from the Tasks page.
        </p>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Task
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

const CalendarHeader = React.memo(function CalendarHeader({ userName, todayTasksCount, upcomingClassTime, completedList, overdueList = [] }) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = React.useState(false);
  
  const hasOverdue = overdueList.length > 0;
  const notifCount = overdueList.length + completedList.length;
  
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
                <Bell className={`w-5 h-5 ${hasOverdue ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`} />
                {notifCount > 0 && (
                  <span className={`absolute -top-1 -right-1 w-5 h-5 text-white text-xs font-bold rounded-full flex items-center justify-center ${hasOverdue ? 'bg-red-500' : 'bg-green-600'}`}>
                    {notifCount > 9 ? '9+' : notifCount}
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
                      <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Overdue tasks & recent activity</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {/* Overdue / Missed Tasks Section */}
                      {overdueList.length > 0 && (
                        <div className="border-b border-gray-100 dark:border-slate-700">
                          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20">
                            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                              ⚠️ Overdue ({overdueList.length})
                            </p>
                          </div>
                          <div className="divide-y divide-gray-100 dark:divide-slate-700">
                            {overdueList.slice(0, 5).map((item, idx) => (
                              <div key={item.id || idx} className="p-3 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors">
                                <div className="flex items-start gap-3">
                                  <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full mt-0.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {item.name || item.title || 'Task'}
                                    </p>
                                    <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                                      {Math.abs(item.daysLeft || 0)} day{Math.abs(item.daysLeft || 0) !== 1 ? 's' : ''} overdue
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Completed Tasks Section */}
                      {completedList.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20">
                            <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                              ✓ Completed Today ({completedList.length})
                            </p>
                          </div>
                          <div className="divide-y divide-gray-100 dark:divide-slate-700">
                            {completedList.slice(0, 5).map((item, idx) => (
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
                        </div>
                      )}
                      
                      {/* Empty State */}
                      {overdueList.length === 0 && completedList.length === 0 && (
                        <div className="p-8 text-center">
                          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">All caught up!</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">No overdue tasks or recent activity</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-slate-700 flex gap-2">
                      <Link href="/tasks" prefetch={true} className="flex-1">
                        <button className="w-full text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                          View Tasks
                        </button>
                      </Link>
                      <Link href="/history" prefetch={true} className="flex-1">
                        <button className="w-full text-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:underline">
                          View History
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
  const { setOpen, setClose, isOpen } = modalCtx;
  
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
  const hideTimersRef = useRef({});
  const [completedAtMap, setCompletedAtMap] = useState({});
  const [showCompleted, setShowCompleted] = useState(false);
  const [checkingTasks, setCheckingTasks] = useState(new Set());
  
  // Toast notification state
  const [toast, setToast] = useState(null);
  // Recently completed items (temporary undo UI)
  const [recentlyCompleted, setRecentlyCompleted] = useState([]); // { id, title }
  const HIDE_GRACE_MS = 8 * 1000; // 8 seconds grace to undo
  
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

  // Full task creation modal - uses TaskDetailPanel from tasks page
  const openQuickTaskModal = useCallback(() => {
    const handleCreate = async (data) => {
      try {
        // Build event payload matching tasks page format
        const payload = {
          title: data.title,
          type: data.meta?.type || 'task',
          status: data.meta?.status || 'todo',
          priority: data.meta?.priority || 'not-urgent-not-important',
          startDate: data.dueDate || null,
          dueDate: data.dueDate || null,
          meta: {
            myDay: data.meta?.myDay || false,
            course: data.meta?.course || null,
            courseColor: data.meta?.courseColor || null,
            priority: data.meta?.priority || 'not-urgent-not-important',
            tags: data.meta?.tags || [],
            status: data.meta?.status || 'todo',
            type: data.meta?.type || 'task',
          },
        };
        
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
          showToast('Task added!', 'success');
          // Refresh events to show the new task
          const eventsRes = await fetch('/api/events');
          if (eventsRes.ok) {
            const eventsData = await eventsRes.json();
            setEvents(eventsData.events || []);
          }
          return { success: true };
        } else {
          const errData = await res.json().catch(() => ({}));
          return { success: false, error: errData.message || 'Failed to create task' };
        }
      } catch (err) {
        return { success: false, error: err.message || 'Failed to create task' };
      }
    };

    setOpen(
      <CustomModal title="Add Task">
        <TaskDetailPanel 
          mode="create"
          modules={courses}
          onCreate={handleCreate}
          onClose={() => setClose()}
        />
      </CustomModal>
    );
  }, [setOpen, setClose, showToast, courses]);

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ gpa: null, credits: null, attendanceRate: null });
  const [attendanceNeedsSignIn, setAttendanceNeedsSignIn] = useState(false);
  const [showGpaTip, setShowGpaTip] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);
  const [attendanceDebug, setAttendanceDebug] = useState({ courses: null, attendance: [] });
  const [weekClassesCount, setWeekClassesCount] = useState(0);
  const [assignmentsDueCount, setAssignmentsDueCount] = useState(0);
  const [studyHoursLogged, setStudyHoursLogged] = useState(0);

  // Check if GPA tip should be shown (only once per week)
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('gpaTipDismissed');
      if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const now = new Date();
        const daysSinceDismissed = (now - dismissedDate) / (1000 * 60 * 60 * 24);
        // Show tip again after 7 days
        setShowGpaTip(daysSinceDismissed > 7);
      } else {
        setShowGpaTip(true);
      }
    } catch (e) {
      setShowGpaTip(true);
    }
  }, []);

  const dismissGpaTip = useCallback(() => {
    setShowGpaTip(false);
    try {
      localStorage.setItem('gpaTipDismissed', new Date().toISOString());
    } catch (e) {}
  }, []);

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
      // Use parseDatePreserveLocal to avoid timezone shifts
      // Prioritize date field (where tasks store due date), then startDate, then end_date
      if (ev.date) {
        const d = parseDatePreserveLocal(ev.date);
        if (d && !isNaN(d.getTime())) {
          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
      }
      if (ev.startDate) {
        const d = parseDatePreserveLocal(ev.startDate);
        if (d && !isNaN(d.getTime())) {
          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
      }
      if (ev.end_date || ev.endDate) {
        const d = parseDatePreserveLocal(ev.end_date || ev.endDate);
        if (d && !isNaN(d.getTime())) {
          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
      }
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
        // For deadline types, prioritize date field (where tasks store due date), then end_date
        // Use parseDatePreserveLocal to avoid timezone shifts
        const d = parseDatePreserveLocal(ev.date || ev.startDate || ev.endDate || ev.end_date);
        const daysLeft = (!d || isNaN(d.getTime())) ? 9999 : Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())) / (1000 * 60 * 60 * 24));
        list.push({
          id: ev.id,
          title: ev.title || ev.name || '',
          dueDate: formatDue(ev),
          daysLeft: typeof daysLeft === 'number' ? daysLeft : null,
          type: ev.type || 'assignment',
          // Add fields needed for new rendering - prioritize date for tasks
          due: ev.date || ev.startDate || ev.endDate || ev.end_date,
          date: ev.date || ev.startDate || ev.endDate || ev.end_date,
          course: ev.course || ev.courseName || '',
          course_id: ev.course_id || ev.courseId,
          courseName: ev.courses?.name || ev.course || ev.courseName || '',
          courseCode: ev.courses?.code || '',
          courseColor: ev.courses?.color || ev.color || '',
          description: ev.description || '',
          priority: ev.meta?.priority || 'not-urgent-not-important',
          tags: (Array.isArray(ev.tags) && ev.tags.length > 0) ? ev.tags : (Array.isArray(ev.meta?.tags) && ev.meta.tags.length > 0) ? ev.meta.tags : []
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
        // If the deadline was marked completed, only show when `showCompleted` is true
        if (completedDeadlines.has(id) && !showCompleted) return false;
        // Otherwise show
        return true;
      });
      try { console.timeEnd && console.timeEnd('overview:memo:visibleUpcomingDeadlines'); } catch (e) {}
      return out;
    } catch (e) { try { console.timeEnd && console.timeEnd('overview:memo:visibleUpcomingDeadlines'); } catch (e) {} return []; }
  }, [upcomingDeadlines, showCompleted, completedDeadlines]);

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
      // Use cache for large static endpoints, but fetch session stats fresh to avoid stale safe-defaults
      const [evJson, coursesJson, gradesJson] = await Promise.all([
        fetchWithCache('/api/events', { credentials: 'same-origin' }, 120000),
        fetchWithCache('/api/courses', { credentials: 'same-origin' }, 120000),
        fetchWithCache('/api/grades', { credentials: 'same-origin' }, 120000),
      ]);

      let sessionsStatsJson = null;
      try {
        const resp = await fetch('/api/sessions/stats', { credentials: 'same-origin', cache: 'no-store' });
        try { console.log('[Overview] /api/sessions/stats status=', resp.status); } catch (e) {}
        sessionsStatsJson = resp.ok ? await resp.json() : null;
      } catch (e) {
        console.error('[Overview] Error fetching /api/sessions/stats:', e);
        sessionsStatsJson = null;
      }

      const fetchedEvents = Array.isArray(evJson.events) ? evJson.events : [];
      const fetchedCourses = coursesJson && coursesJson.success && Array.isArray(coursesJson.courses) ? coursesJson.courses : [];
      const fetchedGrades = gradesJson && gradesJson.success && Array.isArray(gradesJson.data) ? gradesJson.data : [];
      const sessionsStats = sessionsStatsJson && sessionsStatsJson.success && sessionsStatsJson.stats ? sessionsStatsJson.stats : null;

      setEvents(fetchedEvents);
      setCourses(fetchedCourses);
      setGradesData(fetchedGrades);
      
      // Calculate study hours from focus sessions (convert seconds to hours)
      if (sessionsStats && sessionsStats.week) {
        try {
          console.log('[Overview] sessionsStats received:', sessionsStats);
        } catch (e) {}

        // Prefer total_duration (seconds), fall back to focus_duration or other likely keys
        const weekDuration = Number(sessionsStats.week.total_duration || sessionsStats.week.focus_duration || sessionsStats.week.totalDuration || 0) || 0;
        // Convert seconds to fractional hours with one decimal place
        const studyHoursFloat = Number((weekDuration / 3600).toFixed(1));
        setStudyHoursLogged(studyHoursFloat);
      } else {
        // If stats missing, ensure UI doesn't stay at undefined
        setStudyHoursLogged(0);
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
      
      // Add to a recently-completed area with undo option, then finalize hide after grace
      setRecentlyCompleted(prev => {
        const title = event.title || event.name || 'Task';
        // avoid duplicates
        if (prev.some(p => String(p.id) === String(id))) return prev;
        return [{ id: String(id), title, ts: Date.now() }, ...prev];
      });
      // schedule finalization
      try {
        if (hideTimersRef && hideTimersRef.current) {
          if (hideTimersRef.current[String(id)]) clearTimeout(hideTimersRef.current[String(id)]);
          hideTimersRef.current[String(id)] = setTimeout(() => {
            // finalize: remove the recently-completed pill after the grace period
            setRecentlyCompleted(prev => prev.filter(p => String(p.id) !== String(id)));
            // Auto-archive past-due events
            const eventDate = event.startDate ? new Date(event.startDate) : (event.date ? new Date(event.date) : null);
            if (eventDate && !isNaN(eventDate.getTime())) {
              const eventMidnight = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
              const nowMidnight = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
              if (nowMidnight > eventMidnight) archiveDeadline(id);
            }
            delete hideTimersRef.current[String(id)];
          }, HIDE_GRACE_MS);
        }
      } catch (e) {}
    } else if (!nextValue) {
      // User is unchecking - nothing to hide; completed state drives visibility
    }

    const server = await toggleCompletedOnServer(id, nextValue);
    if (!server) {
      // revert local optimistic state on error
      // clear any pending timer & remove from recentlyCompleted
      try { if (hideTimersRef && hideTimersRef.current && hideTimersRef.current[String(id)]) { clearTimeout(hideTimersRef.current[String(id)]); delete hideTimersRef.current[String(id)]; } } catch (e) {}
      setRecentlyCompleted(prev => prev.filter(p => String(p.id) !== String(id)));
      setCompletedDeadlines(prev => { const n = new Set(prev); if (nextValue) n.delete(String(id)); else n.add(String(id)); return n; });
      setCompletedAtMap(prev => { const n = { ...prev }; if (nextValue) delete n[String(id)]; else n[String(id)] = (prev && prev[String(id)]) || null; return n; });
    } else {
      // persist any server-updated timestamps into events list
      setEvents(prev => prev.map(e => (e && String(e.id) === String(id) ? { ...e, completed: !!nextValue, completedAt: server.completedAt || server.completed_at || (nextValue ? new Date().toISOString() : null) } : e)));
      // Invalidate cache to ensure fresh data on next load
      invalidateCache('/api/events' + JSON.stringify({ credentials: 'same-origin' }));
    }
  };

  const undoRecentlyCompleted = (id) => {
    try { if (hideTimersRef && hideTimersRef.current && hideTimersRef.current[String(id)]) { clearTimeout(hideTimersRef.current[String(id)]); delete hideTimersRef.current[String(id)]; } } catch (e) {}
    // Optimistically uncheck locally and persist
    setCompletedDeadlines(prev => { const n = new Set(prev); n.delete(String(id)); return n; });
    setCompletedAtMap(prev => { const n = { ...prev }; delete n[String(id)]; return n; });
    setRecentlyCompleted(prev => prev.filter(p => String(p.id) !== String(id)));
    // Persist to server
    (async () => {
      try { await toggleCompletedOnServer(id, false); invalidateCache('/api/events' + JSON.stringify({ credentials: 'same-origin' })); } catch (e) {}
    })();
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

  // Overdue / missed tasks (daysLeft < 0)
  const overdueList = useMemo(() => {
    try {
      return upcomingDeadlines.filter(d => (d.daysLeft ?? 0) < 0);
    } catch (e) { return []; }
  }, [upcomingDeadlines]);

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
          <title>Overview — StraturaOS</title>
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

  // ─────────────────────────────────────────────────────────────────────────────
  // PRESENTATIONAL COMPONENTS (inline for simplicity)
  // ─────────────────────────────────────────────────────────────────────────────
  
  // KPI Stat Card - matches landing page metric style
  const OverviewStatCard = ({ icon: Icon, label, value, caption, statusChip, bgColor, iconColor, loading: isLoading }) => (
    <div className="group relative bg-white dark:bg-[#12121a] rounded-2xl p-5 border border-gray-200/60 dark:border-white/5 hover:border-purple-300 dark:hover:border-purple-800/50 transition-all duration-200 hover:shadow-lg dark:hover:shadow-purple-900/10">
      <div className="flex items-start justify-between gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bgColor} transition-transform duration-200 group-hover:scale-105`}>
          <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />
        </div>
        <div className="text-right flex-1 min-w-0">
          {isLoading ? (
            <div className="h-9 w-16 ml-auto bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          ) : (
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {value}
            </p>
          )}
          {caption && !isLoading && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{caption}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label}
        </p>
        {statusChip && !isLoading && statusChip}
      </div>
    </div>
  );

  // Section Card wrapper - consistent with landing page card styling
  const OverviewSectionCard = ({ icon: Icon, title, subtitle, action, children, className = '' }) => (
    <div className={`bg-white dark:bg-[#12121a] rounded-2xl border border-gray-200/60 dark:border-white/5 shadow-sm overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10 rounded-xl">
              <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
              {subtitle && <p className="text-[11px] text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  // Get greeting and status line
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusLine = () => {
    const pendingCount = visibleUpcomingDeadlines.length;
    const nextClass = todayClasses.find(cls => cls.startTs && cls.startTs > Date.now());
    
    if (nextClass) {
      const diffMs = nextClass.startTs - Date.now();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 60) return `Next class in ${diffMins}min • ${nextClass.code || nextClass.name}`;
      return `Next: ${nextClass.name || nextClass.name} at ${nextClass.startTime}`;
    }
    if (pendingCount === 0) return "You're all caught up! Time to relax.";
    if (pendingCount === 1) return "1 task pending today";
    return `${pendingCount} tasks pending`;
  };

  // GPA status chip
  const getGpaStatusChip = () => {
    if (stats.gpa === null) return null;
    if (stats.gpa >= 3.5) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
        <CheckCircle className="w-3 h-3" /> On Track
      </span>
    );
    if (stats.gpa >= 2.5) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
        <AlertCircle className="w-3 h-3" /> Needs Focus
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
        <AlertTriangle className="w-3 h-3" /> At Risk
      </span>
    );
  };

  // Attendance status chip
  const getAttendanceStatusChip = () => {
    if (stats.attendanceRate === null) return null;
    if (stats.attendanceRate >= 90) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
        <CheckCircle className="w-3 h-3" /> Excellent
      </span>
    );
    if (stats.attendanceRate >= 75) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
        Good
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
        <AlertTriangle className="w-3 h-3" /> Needs Attention
      </span>
    );
  };

  return (
    <HygraphSidebar pageName="Overview">
      <Head>
        <title>Overview — StraturaOS</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f]">
      
      {/* Main container with max-width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* ═══════════════════════════════════════════════════════════════════════
            HERO SUMMARY BAND - Command Center Header
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-700 dark:via-purple-800 dark:to-purple-900 p-6 sm:p-8 mb-6 shadow-xl shadow-purple-500/10 dark:shadow-purple-900/30">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left: Greeting & Status */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full mb-4">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-white/90">Welcome back</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2 tracking-tight">
                {getGreeting()}, {userName}
              </h1>
              <p className="text-base sm:text-lg text-white/80 font-medium">
                {getStatusLine()}
              </p>
            </div>

            {/* Right: Quick Action Pills */}
            <div className="flex flex-wrap items-center gap-3">
              {visibleUpcomingDeadlines.length > 0 && (
                <button
                  onClick={() => router.push('/tasks')}
                  className="group flex items-center gap-3 px-5 py-3 bg-white/95 dark:bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  <div>
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Tasks Pending</p>
                    <p className="text-2xl font-extrabold text-gray-900">{visibleUpcomingDeadlines.length}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              )}
              {overdueList.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 backdrop-blur-sm rounded-xl border border-red-400/30">
                  <AlertTriangle className="w-4 h-4 text-red-200" />
                  <div>
                    <p className="text-[10px] font-bold text-red-200 uppercase tracking-wider">Overdue</p>
                    <p className="text-lg font-extrabold text-white">{overdueList.length}</p>
                  </div>
                </div>
              )}
              {overdueList.length === 0 && visibleUpcomingDeadlines.length === 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 backdrop-blur-sm rounded-xl border border-emerald-400/30">
                  <CheckCircle className="w-4 h-4 text-emerald-200" />
                  <span className="text-sm font-semibold text-white">All caught up!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            KPI ROW - 3 Stat Cards
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <OverviewStatCard
            icon={Award}
            label="Current GPA"
            value={stats.gpa !== null ? stats.gpa.toFixed(2) : '—'}
            caption="/ 4.0 scale"
            statusChip={getGpaStatusChip()}
            bgColor="bg-blue-50 dark:bg-blue-900/20"
            iconColor="text-blue-600 dark:text-blue-400"
            loading={loading}
          />
          <OverviewStatCard
            icon={BookOpen}
            label="Credits Enrolled"
            value={stats.credits !== null ? stats.credits : '—'}
            caption={`${courses.length} ${courses.length === 1 ? 'module' : 'modules'}`}
            bgColor="bg-purple-50 dark:bg-purple-900/20"
            iconColor="text-purple-600 dark:text-purple-400"
            loading={loading}
          />
          <OverviewStatCard
            icon={CheckCircle}
            label="Attendance"
            value={stats.attendanceRate !== null ? `${Math.round(stats.attendanceRate)}%` : '—'}
            caption="This semester"
            statusChip={getAttendanceStatusChip()}
            bgColor="bg-emerald-50 dark:bg-emerald-900/20"
            iconColor="text-emerald-600 dark:text-emerald-400"
            loading={loading}
          />
        </div>
        
        {/* GPA Tip - only show when needed */}
        {!loading && stats.gpa === null && showGpaTip && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300 flex-1">
              <strong>Tip:</strong> Add grades to your assessments to see your GPA calculated here.
            </p>
            <button 
              onClick={dismissGpaTip}
              className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors p-1"
              aria-label="Dismiss tip"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            MAIN CONTENT GRID - Two Columns
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ─────────────────────────────────────────────────────────────────────
              LEFT COLUMN: Today's Schedule + This Week Strip
              ───────────────────────────────────────────────────────────────────── */}
          <div className="space-y-6">
            
            {/* Today's Schedule Card */}
            <OverviewSectionCard
              icon={Clock}
              title="Today's Schedule"
              subtitle={`${todayClasses.length} ${todayClasses.length === 1 ? 'class' : 'classes'} today`}
              action={
                <Link href="/schedule" prefetch={true}>
                  <button className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 px-3 py-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors">
                    Full Schedule →
                  </button>
                </Link>
              }
            >
              {todayClasses.length > 0 ? (
                <div className="space-y-2">
                  {todayClasses.slice(0, 5).map((cls, idx) => {
                    const isNow = cls.startTs && cls.endTs && Date.now() >= cls.startTs && Date.now() <= cls.endTs;
                    const isPast = cls.endTs && Date.now() > cls.endTs;
                    const courseData = courses.find(c => String(c.id) === String(cls.course_id));
                    const color = getCourseColor(courseData, idx);
                    
                    return (
                      <div
                        key={cls.id || idx}
                        className={`group relative flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-200 ${
                          isNow 
                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 shadow-sm' 
                            : isPast 
                              ? 'bg-gray-50 dark:bg-slate-800/30 border-gray-100 dark:border-slate-800 opacity-60' 
                              : 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700/50 hover:border-purple-200 dark:hover:border-purple-800'
                        }`}
                      >
                        {/* Color indicator */}
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full" style={{ background: color }} />
                        
                        {/* Time */}
                        <div className="flex-shrink-0 text-center min-w-[60px]">
                          <p className={`text-sm font-bold ${isNow ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>
                            {cls.startTime}
                          </p>
                          {cls.endTime && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{cls.endTime}</p>
                          )}
                        </div>
                        
                        {/* Divider */}
                        <div className="w-px h-10 bg-gray-200 dark:bg-slate-700" />
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {cls.code && (
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase">
                                {cls.code}
                              </span>
                            )}
                            {isNow && (
                              <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-[10px] font-bold uppercase animate-pulse">
                                Now
                              </span>
                            )}
                          </div>
                          <p className={`text-sm font-medium truncate mt-1 ${isPast ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {cls.name}
                          </p>
                          {cls.location && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" /> {cls.location}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                    <CalendarOff className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No classes today</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tomorrowFirstClass 
                      ? `Tomorrow: ${tomorrowFirstClass.name} at ${tomorrowFirstClass.time}` 
                      : 'Enjoy your free day!'}
                  </p>
                </div>
              )}
            </OverviewSectionCard>

            {/* This Week Strip Card */}
            <OverviewSectionCard
              icon={Calendar}
              title="This Week"
              subtitle={`${weekClassesCount} classes scheduled`}
              action={
                <Link href="/calendar" prefetch={true}>
                  <button className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 px-3 py-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors">
                    Calendar →
                  </button>
                </Link>
              }
            >
              {/* Week Navigator - 7 Day Strip */}
              <div className="grid grid-cols-7 gap-1.5 mb-5">
                {weekDays.map((day, i) => {
                  const dayDate = new Date(startOfWeek);
                  dayDate.setDate(dayDate.getDate() + i);
                  const isToday = dayDate.toDateString() === currentDate.toDateString();
                  const isPast = dayDate < new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                  const dayEvents = events.filter(e => {
                    if (!e || !e.startDate) return false;
                    const eventDate = new Date(e.startDate);
                    return eventDate.toDateString() === dayDate.toDateString();
                  });
                  const hasClasses = dayEvents.some(e => ['class', 'lecture', 'lab', 'tutorial', 'seminar'].includes((e.type || '').toLowerCase()));
                  const hasDeadlines = dayEvents.some(e => ['deadline', 'assignment', 'exam', 'quiz'].includes((e.type || '').toLowerCase()));
                  
                  return (
                    <button
                      key={day}
                      className={`relative flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-200 ${
                        isToday 
                          ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/20 scale-105' 
                          : isPast
                            ? 'bg-gray-50 dark:bg-slate-800/30 text-gray-400 dark:text-gray-500'
                            : 'bg-gray-50 dark:bg-slate-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-100 dark:border-slate-700'
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
                        isToday ? 'text-purple-200' : isPast ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {day}
                      </span>
                      <span className={`text-lg font-extrabold ${
                        isToday ? 'text-white' : isPast ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                      }`}>
                        {dayDate.getDate()}
                      </span>
                      
                      {/* Activity indicators */}
                      <div className="flex items-center gap-0.5 mt-1.5 h-1.5">
                        {hasClasses && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-purple-500'}`} />
                        )}
                        {hasDeadlines && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-amber-300' : 'bg-amber-500'}`} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Week Summary Stats */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-4">
                {/* Classes Progress */}
                <div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Classes attended</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {(() => {
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
                      })()}/{weekClassesCount}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500" 
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
                    />
                  </div>
                </div>
                
                {/* Focus Hours */}
                <div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Focus time</span>
                    <span className="font-bold text-gray-900 dark:text-white">{(Number(studyHoursLogged) || 0).toFixed(1)}h</span>
                  </div>
                  <Link href="/focus" prefetch={true}>
                    <button className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-400 hover:from-purple-100 hover:to-purple-100 dark:hover:from-purple-900/30 dark:hover:to-purple-900/20 rounded-xl transition-all duration-200 group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-200/50 dark:bg-purple-800/30 rounded-lg">
                          <Timer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm font-semibold">Start Focus Session</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                </div>
              </div>
            </OverviewSectionCard>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────
              RIGHT COLUMN: Upcoming Deadlines + Focus Summary
              ───────────────────────────────────────────────────────────────────── */}
          <div className="space-y-6">
            
            {/* Upcoming Deadlines Card */}
            <OverviewSectionCard
              icon={Target}
              title="Upcoming Deadlines"
              subtitle={`${visibleUpcomingDeadlines.length} pending`}
              action={
                <Link href="/tasks" prefetch={true}>
                  <button className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 px-3 py-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors">
                    All Tasks →
                  </button>
                </Link>
              }
              className="max-h-[600px] flex flex-col"
            >
              <div className="flex-1 overflow-y-auto -mx-4 px-4 custom-scrollbar">

              {visibleUpcomingDeadlines.length > 0 ? (
                  <div className="space-y-2.5">
                    {visibleUpcomingDeadlines.slice(0, 6).map((deadline, index) => {
                      const lookupCourse = courses.find(c => c.id === deadline.course_id || c.code === deadline.course);
                      const displayCourseName = deadline.courseCode || deadline.courseName || lookupCourse?.code || lookupCourse?.name || '';
                      const courseColor = deadline.courseColor || lookupCourse?.color || getCourseColor(lookupCourse, index);
                      
                      // Validate the date - skip items without valid dates
                      const rawDue = deadline.due || deadline.date;
                      if (!rawDue) return null; // Skip if no date
                      
                      // Use parseDatePreserveLocal to avoid timezone shifts
                      const dueDate = parseDatePreserveLocal(rawDue);
                      if (!dueDate || isNaN(dueDate.getTime())) return null; // Skip invalid dates
                      
                      const now = new Date();
                      const isOverdue = dueDate < now;
                      const diffMs = dueDate - now;
                      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                      const isChecked = completedDeadlines.has(String(deadline.id));
                      
                      // Urgency styling
                      const urgency = getUrgencyLevel(deadline.due || deadline.date);
                      const urgencyStyles = URGENCY_COLORS[urgency] || URGENCY_COLORS.normal;
                      
                      // Time display
                      const timeText = getTimeUntilText(deadline.due || deadline.date);
                      
                      const handleCheckTask = async () => {
                        const taskId = String(deadline.id);
                        const willBeChecked = !isChecked;
                        setCompletedDeadlines(prev => {
                          const next = new Set(prev);
                          if (willBeChecked) next.add(taskId);
                          else next.delete(taskId);
                          return next;
                        });
                        if (willBeChecked) {
                          setCompletedAtMap(prev => ({ ...prev, [taskId]: new Date().toISOString() }));
                        } else {
                          setCompletedAtMap(prev => { const next = { ...prev }; delete next[taskId]; return next; });
                        }
                        try {
                          const body = { completed: willBeChecked, completedAt: willBeChecked ? new Date().toISOString() : null };
                          const response = await fetch(`/api/events/${deadline.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body)
                          });
                          if (response.ok) {
                            setEvents(prev => prev.map(e => String(e.id) === taskId ? { ...e, completed: willBeChecked } : e));
                            showToast(willBeChecked ? 'Task completed!' : 'Task uncompleted', 'success');
                          } else {
                            setCompletedDeadlines(prev => { const next = new Set(prev); if (willBeChecked) next.delete(taskId); else next.add(taskId); return next; });
                            showToast('Failed to update task', 'error');
                          }
                        } catch (error) {
                          setCompletedDeadlines(prev => { const next = new Set(prev); if (willBeChecked) next.delete(taskId); else next.add(taskId); return next; });
                          showToast('Failed to update task', 'error');
                        }
                      };
                      
                      const typeConfig = getTaskTypeConfig(deadline.type);
                      const TypeIcon = typeConfig.Icon;
                      
                      return (
                        <div 
                          key={deadline.id}
                          onClick={() => router.push(`/tasks?openTask=${deadline.id}`)}
                          className={`group relative cursor-pointer rounded-xl border transition-all duration-200 hover:shadow-md ${
                            isChecked 
                              ? 'bg-gray-50 dark:bg-slate-800/30 border-gray-100 dark:border-slate-800 opacity-60' 
                              : `${urgencyStyles.bg} ${urgencyStyles.border}`
                          }`}
                        >
                          {/* Course color accent */}
                          <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ background: courseColor }} />
                          
                          <div className="p-3.5 pl-4">
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCheckTask(); }}
                                className={`flex-shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                  isChecked 
                                    ? 'border-purple-500 bg-purple-500 text-white' 
                                    : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-purple-400'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3" strokeWidth={3} />}
                              </button>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <p className={`text-sm font-semibold leading-tight ${isChecked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                    {deadline.title}
                                  </p>
                                  {/* Urgency badge */}
                                  <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${urgencyStyles.badge}`}>
                                    {timeText}
                                  </span>
                                </div>
                                
                                {/* Meta row */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Type icon */}
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${typeConfig.bgColor}`}>
                                    <TypeIcon className={`w-3 h-3 ${typeConfig.color}`} />
                                    <span className={`text-[10px] font-semibold uppercase ${typeConfig.color}`}>{deadline.type}</span>
                                  </span>
                                  
                                  {/* Course */}
                                  {displayCourseName && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700/50 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: courseColor }} />
                                      {displayCourseName}
                                    </span>
                                  )}
                                  
                                  {/* Due date with time (only show time if explicitly set) */}
                                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                    {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    {(() => {
                                      // Check if time was explicitly set - must have explicit time field or meta.hasTime
                                      // Don't show time if it's midnight (00:00) as that typically means no time was set
                                      const hasExplicitTime = deadline.meta?.hasTime === true || 
                                        deadline.time || 
                                        deadline.due_time;
                                      
                                      // Also check if hours/minutes are non-zero AND not exactly at noon (common default)
                                      const hasNonDefaultTime = (dueDate.getHours() !== 0 || dueDate.getMinutes() !== 0) &&
                                        !(dueDate.getHours() === 12 && dueDate.getMinutes() === 0 && !hasExplicitTime);
                                      
                                      if (deadline.meta?.hasTime === false) return null;
                                      if (!hasExplicitTime && !hasNonDefaultTime) return null;
                                      
                                      return ` at ${dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {visibleUpcomingDeadlines.length > 6 && (
                      <Link href="/tasks" prefetch={true}>
                        <button className="w-full py-2.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors">
                          View {visibleUpcomingDeadlines.length - 6} more tasks →
                        </button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/10 flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">All caught up!</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">No pending deadlines. Great work!</p>
                    
                    <button 
                      onClick={openQuickTaskModal}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      Add New Task
                    </button>
                  </div>
                )}
              </div>
            </OverviewSectionCard>

            {/* Focus Summary Card */}
            <OverviewSectionCard
              icon={Flame}
              title="Focus Summary"
              subtitle="This week's productivity"
              action={
                <Link href="/focus" prefetch={true}>
                  <button className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 px-3 py-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors">
                    Focus Mode →
                  </button>
                </Link>
              }
            >
              <div className="space-y-4">
                {/* Focus time stat */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-200/50 dark:bg-purple-800/30 rounded-lg">
                      <Timer className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{(Number(studyHoursLogged) || 0).toFixed(1)}h</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">focused this week</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">Goal: 20h</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round((studyHoursLogged / 20) * 100)}% complete</p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div>
                  <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 transition-all duration-500 rounded-full" 
                      style={{ width: `${Math.min((studyHoursLogged / 20) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                
                {/* Quick start button */}
                <Link href="/focus" prefetch={true}>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-200 group">
                    <Flame className="w-4 h-4" />
                    Start Focus Session
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </OverviewSectionCard>
          </div>
        </div>

      </div>
      
      {/* Floating Action Button - Add Task */}
      <button
        onClick={openQuickTaskModal}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-2xl shadow-xl shadow-purple-500/30 flex items-center justify-center transition-all z-40 group hover:scale-105 hover:shadow-purple-500/40"
        title="Add Task"
        aria-label="Add new task"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
        <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg pointer-events-none">
          Add Task
        </span>
      </button>
      
      {/* Recently completed undo UI */}
      {recentlyCompleted && recentlyCompleted.length > 0 && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-2 items-end">
          {recentlyCompleted.slice(0, 6).map(item => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-lg backdrop-blur-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[180px] truncate">{item.title}</span>
              <button onClick={() => undoRecentlyCompleted(item.id)} className="text-sm font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
                Undo
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl backdrop-blur-sm border ${
            toast.type === 'success' 
              ? 'bg-emerald-500/95 border-emerald-400 text-white' 
              : 'bg-red-500/95 border-red-400 text-white'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm font-semibold">{toast.message}</p>
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
