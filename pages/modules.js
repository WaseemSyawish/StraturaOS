import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Plus, Edit, Trash2, Save, X, BookOpen, Users, Calendar, Loader2, AlertCircle, GraduationCap, CheckCircle, Clock, ChevronDown, Settings, Info, Sparkles, Layers } from 'lucide-react';
import Notification from '../src/components/Notification';
import SemesterSettings from '../src/components/SemesterSettings';
import { useSemesterContext } from '@/contexts/SemesterContext';
import CourseDetailsPanel from '../src/components/courses/CourseDetailsPanel';
import { showCustomConfirm } from '@/utils/dialogs';
import HygraphSidebar from '@/components/HygraphSidebar';

/* ─────────────────────────────────────────────────────────────
   DESIGN SYSTEM CONSTANTS — Matches landing/auth pages
   ───────────────────────────────────────────────────────────── */
const ds = {
  pageBg: 'min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-[#0a0a0f] dark:via-[#0a0a0f] dark:to-[#12121a]',
  headerBand: 'relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 dark:from-purple-900 dark:via-purple-800 dark:to-indigo-900 rounded-2xl mb-6',
  card: 'bg-white/80 dark:bg-[#12121a] rounded-2xl shadow-lg dark:shadow-2xl dark:shadow-purple-500/5 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm',
  headingXl: 'text-2xl sm:text-3xl font-extrabold text-white tracking-tight',
  statCard: 'p-4 rounded-xl bg-white/90 dark:bg-[#16161f] border border-slate-200/60 dark:border-slate-800/60 shadow-sm',
};

const ModulesManager = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [notification, setNotification] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
  
  // Authenticated user id is resolved server-side via next-auth; fetch current user
  const [currentUser, setCurrentUser] = useState(null);

  // Get semester context for cross-page semester switching
  const { selectedSemester, switchSemester, clearSemester } = useSemesterContext();

  // Form state for new/editing course
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    credits: 3,
    color: '#3B82F6',
    semester: '',
    instructor: '',
    description: ''
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

  // Modal accessibility & animation helpers
  const modalRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Semesters from database
  const [semesters, setSemesters] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [showSemesterConfig, setShowSemesterConfig] = useState(false);

  // Predefined color options
  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F472B6'
  ];

  // Helper function to get semester name from ID
  const getSemesterName = (semesterId) => {
    if (!semesterId) return null;
    const semester = semesters.find(s => s.id === semesterId);
    return semester ? semester.name : semesterId; // Fallback to ID if not found
  };

  // Fetch semesters from database
  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/semester-settings');
      if (!response.ok) {
        console.warn('Failed to fetch semesters, continuing without semester filtering');
        return; // Silently fail - modules will show all courses
      }
      const data = await response.json();
      if (data.success && data.settings) {
        // Sort semesters: active first, then by start date (soonest first)
        const today = new Date();
        const sortedSemesters = data.settings.sort((a, b) => {
          const aStart = new Date(a.start_date);
          const aEnd = new Date(a.end_date);
          const bStart = new Date(b.start_date);
          const bEnd = new Date(b.end_date);
          
          const aIsActive = today >= aStart && today <= aEnd;
          const bIsActive = today >= bStart && today <= bEnd;
          
          // Active semesters come first
          if (aIsActive && !bIsActive) return -1;
          if (!aIsActive && bIsActive) return 1;
          
          // Both active or both inactive: sort by start date (soonest first)
          return aStart - bStart;
        });
        
        setSemesters(sortedSemesters);
        // Auto-detect current semester (today falls within date range)
        const active = sortedSemesters.find(s => {
          const start = new Date(s.start_date);
          const end = new Date(s.end_date);
          return today >= start && today <= end;
        });
        
        if (active) {
          setCurrentSemester(active);
          // Set as default for new courses
          if (!courseForm.semester) {
            setCourseForm(prev => ({ ...prev, semester: active.id.toString() }));
          }
        } else {
          // No current semester - find the closest upcoming one
          const upcoming = data.settings
            .filter(s => new Date(s.start_date) > today)
            .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0];
          
          if (upcoming) {
            setCurrentSemester(upcoming);
            if (!courseForm.semester) {
              setCourseForm(prev => ({ ...prev, semester: upcoming.id.toString() }));
            }
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch semesters:', err);
      // Silently fail - modules will show all courses without semester filtering
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch('/api/auth/me');
        if (me.ok) {
          const meJson = await me.json();
          if (meJson.authenticated) {
            setCurrentUser(meJson);
          }
        }
        // Load data regardless of auth status
        await fetchSemesters();
        fetchCourses();
      } catch (e) {
        console.error('Error resolving user', e);
        // Still load data even if auth fails
        await fetchSemesters();
        fetchCourses();
      }
    })();
  }, []);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-dismiss compact toasts
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(t);
  }, [notification]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/courses');
      
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const msg = body?.message || body?.error || `HTTP ${response.status}: Failed to fetch courses`;
        throw new Error(msg);
      }

      const data = await response.json();

      if (!data.success) {
        const msg = data?.message || data?.error || 'Failed to fetch courses';
        throw new Error(msg);
      }
      
      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message);
      setNotification({ type: 'error', message: err.message });
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!courseForm.name.trim()) {
      errors.name = 'Course name is required';
    }
    
    if (courseForm.code && courseForm.code.length > 20) {
      errors.code = 'Course code must be 20 characters or less';
    }
    
    const credits = parseInt(courseForm.credits);
    if (isNaN(credits) || credits < 1 || credits > 20) {
      errors.credits = 'Credits must be between 1 and 20';
    }
    
    if (courseForm.instructor && courseForm.instructor.length > 100) {
      errors.instructor = 'Instructor name must be 100 characters or less';
    }
    
    if (courseForm.description && courseForm.description.length > 500) {
      errors.description = 'Description must be 500 characters or less';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setCourseForm({
      name: '',
      code: '',
      credits: 3,
      color: '#3B82F6',
      semester: '2025-1',
      instructor: '',
      description: ''
    });
    setFormErrors({});
  };

  const handleAddCourse = () => {
    resetForm();
    setShowAddForm(true);
    setEditingCourse(null);
    setError(null);
    setSuccess(null);
  };

  // When modal opens, run enter animation and focus the first input.
  useEffect(() => {
    let mounted = true;
    const prevActive = typeof document !== 'undefined' ? document.activeElement : null;
    if (showAddForm) {
      // small timeout to allow the element to mount then animate
      setTimeout(() => { if (mounted) setModalVisible(true); }, 10);

      // focus first input inside modal
      setTimeout(() => {
        try {
          const root = modalRef.current;
          if (root) {
            const el = root.querySelector('input, select, textarea, button');
            if (el && el.focus) el.focus();
          }
        } catch (e) { /* ignore */ }
      }, 50);

      const onKey = (ev) => {
        if (ev.key === 'Escape') {
          // animate close
          closeModal();
        }
        if (ev.key === 'Tab') {
          // simple focus trap
          const root = modalRef.current;
          if (!root) return;
          const focusable = root.querySelectorAll('a[href], button:not([disabled]), textarea, input, select');
          if (!focusable || focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (ev.shiftKey && document.activeElement === first) {
            ev.preventDefault(); last.focus();
          } else if (!ev.shiftKey && document.activeElement === last) {
            ev.preventDefault(); first.focus();
          }
        }
      };

      document.addEventListener('keydown', onKey);
      return () => {
        mounted = false;
        document.removeEventListener('keydown', onKey);
        if (prevActive && prevActive.focus) prevActive.focus();
      };
    }
    return () => { mounted = false; };
  }, [showAddForm]);

  // Close modal with exit animation
  const closeModal = () => {
    // start exit animation (matches CSS transition duration)
    setModalVisible(false);
    // after animation completes, call existing cancel handler
    setTimeout(() => {
      handleCancelEdit();
    }, 320);
  };

  const handleEditCourse = (course) => {
    setCourseForm({
      name: course.name || '',
      code: course.code || '',
      credits: course.credits || 3,
      color: course.color || '#3B82F6',
      semester: course.semester || (currentSemester?.id || ''),
      instructor: course.instructor || '',
      description: course.description || ''
    });
    setEditingCourse(course.id);
    setShowAddForm(true);
    setFormErrors({});
    setError(null);
    setSuccess(null);
  };

  const handleSaveCourse = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const courseData = {
        ...courseForm,
        credits: parseInt(courseForm.credits) || 3
      };

      const method = editingCourse ? 'PUT' : 'POST';
      
      if (editingCourse) {
        courseData.id = editingCourse;
      }

      const response = await fetch('/api/courses', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || body?.error || `HTTP ${response.status}: Failed to save course`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data?.message || data?.error || 'Failed to save course');
      }

      // Update local state
      if (editingCourse) {
        setCourses(prev => prev.map(c => c.id === editingCourse ? data.course : c));
        setSuccess('Course updated successfully!');
      } else {
        setCourses(prev => [...prev, data.course]);
        setSuccess('Course created successfully!');
      }

      // Reset form and animate modal close so user sees smooth exit
      // closeModal will call handleCancelEdit after the exit animation
      closeModal();
    } catch (err) {
      setError(err.message);
      setNotification({ type: 'error', message: err.message });
      console.error('Error saving course:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    const course = courses.find(c => c.id === courseId);
    const hasAttendance = course?.attendanceSessionsCount > 0;
    
    let confirmMessage = `Are you sure you want to delete "${courseName}"?`;
    if (hasAttendance) {
      confirmMessage += `\n\nThis will also delete ${course.attendanceSessionsCount} attendance session${course.attendanceSessionsCount === 1 ? '' : 's'}.`;
    }
    
    const confirmed = await showCustomConfirm(
      'Delete Module?',
      confirmMessage,
      { type: 'danger', confirmText: 'Delete' }
    );
    
    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      
      const response = await fetch('/api/courses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: courseId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || body?.error || `HTTP ${response.status}: Failed to delete course`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data?.message || data?.error || 'Failed to delete course');
      }

      setCourses(prev => prev.filter(c => c.id !== courseId));
      setSuccess(data.message || 'Course deleted successfully!');
    } catch (err) {
      setError(err.message);
      setNotification({ type: 'error', message: err.message });
      console.error('Error deleting course:', err);
    }
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingCourse(null);
    resetForm();
    setError(null);
  };

  // Dynamic semester-based course filtering
  const getCurrentSemesterCourses = () => {
    // If user has selected a different semester from context, use that
    let activeSemester = currentSemester;
    if (selectedSemester) {
      activeSemester = selectedSemester;
    }
    
    // If no semesters configured, show ALL courses
    if (!activeSemester || semesters.length === 0) return courses;
    
    // Match courses to current semester by name
    // This handles both new format (semester settings) and old format ("2025 - 1")
    return courses.filter(course => {
      // Direct match: course.semester matches semesterSetting.name
      if (course.semester === activeSemester.name) return true;
      
      // Also match by ID for newly created courses
      if (course.semester === activeSemester.id) return true;
      
      return false;
    });
  };

  const getUpcomingSemesterCourses = () => {
    const today = new Date();
    const upcomingSemesters = semesters
      .filter(s => new Date(s.start_date) > today)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    
    if (upcomingSemesters.length === 0) return [];
    
    const nextSemester = upcomingSemesters[0];
    return courses.filter(course => 
      course.semester === nextSemester.name || course.semester === nextSemester.id
    );
  };

  const getPreviousSemesterCourses = () => {
    const today = new Date();
    const previousSemesters = semesters
      .filter(s => new Date(s.end_date) < today);
    
    return courses.filter(course => 
      previousSemesters.some(sem => 
        course.semester === sem.name || course.semester === sem.id
      )
    );
  };

  const getUpcomingSemester = () => {
    const today = new Date();
    const upcomingSemesters = semesters
      .filter(s => new Date(s.start_date) > today)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    
    return upcomingSemesters[0] || null;
  };

  const getTotalCredits = (coursesList) => {
    return coursesList.reduce((total, course) => total + (course.credits || 0), 0);
  };

  return (
  <HygraphSidebar pageName="Modules">
  <div className={`modules-root ${ds.pageBg} p-4 sm:p-6`}>
      <Head>
        <title>Modules — StraturaOS</title>
      </Head>
      <style>{`
        /* Enhanced Dark mode overrides for Modules Manager */
        html.dark .modules-root { background: linear-gradient(180deg,#0a0a0f,#12121a); }
        html.dark .cozy { background-color: #12121a; border-color: rgba(255,255,255,0.04); box-shadow: none; }
        html.dark .cozy .text-gray-800 { color: rgba(255,255,255,0.92); }
        html.dark .text-gray-600 { color: rgba(255,255,255,0.72); }
        html.dark .text-gray-500 { color: rgba(255,255,255,0.6); }
        html.dark .text-gray-900 { color: rgba(255,255,255,0.92); }
        html.dark .text-gray-800 { color: rgba(255,255,255,0.92); }
        html.dark .bg-indigo-100 { background-color: rgba(99,102,241,0.1); }
        html.dark .bg-green-100 { background-color: rgba(16,185,129,0.1); }
        html.dark .bg-blue-100 { background-color: rgba(59,130,246,0.1); }
        html.dark .bg-gray-100 { background-color: rgba(255,255,255,0.05); }
        html.dark .border-gray-200 { border-color: rgba(255,255,255,0.06); }
        html.dark .border-gray-100 { border-color: rgba(255,255,255,0.04); }
        
        /* Enhanced card borders and shadows */
        html.dark .cozy { border: 1px solid rgba(139, 92, 246, 0.15); border-radius: 1rem; }
        html.dark .course-card-container { border: 1px solid rgba(139, 92, 246, 0.15); }
        html.dark .course-card-container:hover { border-color: rgba(139, 92, 246, 0.25); box-shadow: 0 0 20px rgba(139, 92, 246, 0.08); }
        
        /* Form controls */
        html.dark .cozy input,
        html.dark .cozy textarea,
        html.dark .cozy select {
          color: rgba(255,255,255,0.92) !important;
          background: #0b0b10 !important;
          caret-color: rgba(255,255,255,0.92) !important;
          -webkit-text-fill-color: rgba(255,255,255,0.92) !important;
          border-color: rgba(255,255,255,0.06);
        }
        html.dark .cozy input::placeholder,
        html.dark .cozy textarea::placeholder {
          color: rgba(255,255,255,0.4) !important;
          opacity: 1 !important;
        }
        html.dark .cozy select option { color: #0f1724; background: #fff; }
        html.dark .cozy input[type="number"] { color: rgba(255,255,255,0.92) !important; }
        html.dark .cozy input:focus, html.dark .cozy textarea:focus, html.dark .cozy select:focus {
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
      <div className="fixed top-6 right-6 z-50">
        <Notification type={notification?.type} message={notification?.message} onClose={() => setNotification(null)} />
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ─────────── Hero Header Band ─────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-700 dark:via-purple-800 dark:to-purple-900 p-6 sm:p-8 mb-6 shadow-xl shadow-purple-500/10 dark:shadow-purple-900/30">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/2" />
          </div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                <Layers className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Modules</h1>
                <p className="text-purple-100 dark:text-purple-200 text-sm mt-1">
                  {courses.length} {courses.length === 1 ? 'module' : 'modules'} • {getTotalCredits(courses)} credits
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSemesterConfig(true)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-white/10"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Semesters</span>
              </button>
              <button 
                onClick={handleAddCourse}
                className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 border border-white/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Module</span>
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages - only render if there's a message */}
        {success && (
          <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl flex items-center gap-2">
            <CheckCircle className="text-emerald-500 flex-shrink-0" size={20} />
            <span className="text-emerald-700 dark:text-emerald-400 flex-1">{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 text-lg font-bold"
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <span className="text-red-700 dark:text-red-400 flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300 text-lg font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Semester Configuration */}
        <div className="mb-6">
          <div className={`${ds.card} overflow-hidden`}>
            <button
              onClick={() => setShowSemesterConfig(!showSemesterConfig)}
              className="w-full p-4 sm:p-6 border-b border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/20 dark:from-purple-500/30 dark:to-purple-600/30 rounded-lg">
                  <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Semester Configuration
                    {semesters.length > 0 && (
                      <span className="text-xs font-normal px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full">
                        {semesters.length} {semesters.length === 1 ? 'semester' : 'semesters'}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 hidden sm:block">
                    Manage your academic semesters for course organization
                  </p>
                </div>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform ${showSemesterConfig ? 'rotate-180' : ''}`}
              />
            </button>
            {showSemesterConfig && (
              <div className="p-4 sm:p-6 animate-in">
                <SemesterSettings />
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showAddForm && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-300 ${
              modalVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <style dangerouslySetInnerHTML={{__html: `
            @keyframes popIn {
              from { opacity: 0; transform: scale(0.96); }
              to { opacity: 1; transform: scale(1); }
            }
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(-8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-in {
              animation: slideIn 0.2s ease-out;
            }
            .dropdown-scroll {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .dropdown-scroll::-webkit-scrollbar {
              width: 0px;
              height: 0px;
              background: transparent;
            }
          `}} />
            
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* Modal */}
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              style={{ transformOrigin: 'center', animation: 'popIn 160ms cubic-bezier(.2,.9,.25,1)' }}
              className={`relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl transform transition-all duration-300 overflow-y-auto ${
                modalVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
              }`}
            >
              {/* Content wrapper */}
              <div className="p-5">
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-0.5">
                      {editingCourse ? 'Edit Module' : 'Create Module'}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {editingCourse ? 'Update module details' : 'Add a new module to your schedule'}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  {/* Module Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Module Name
                    </label>
                    <input
                      type="text"
                      value={courseForm.name}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Web Technologies, Database Systems"
                      className={`w-full h-10 px-3 rounded-lg border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        formErrors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                      }`}
                      maxLength={100}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Module Code & Credits Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        Module Code
                      </label>
                      <input
                        type="text"
                        value={courseForm.code}
                        onChange={(e) => setCourseForm(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="e.g., CS301"
                        className={`w-full h-10 px-3 rounded-lg border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          formErrors.code ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                        }`}
                        maxLength={20}
                      />
                      {formErrors.code && (
                        <p className="text-xs text-red-400 mt-1">{formErrors.code}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Credits
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={courseForm.credits}
                        onChange={(e) => setCourseForm(prev => ({ ...prev, credits: e.target.value }))}
                        className={`w-full h-10 px-3 rounded-lg border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          formErrors.credits ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                        }`}
                      />
                      {formErrors.credits && (
                        <p className="text-xs text-red-400 mt-1">{formErrors.credits}</p>
                      )}
                    </div>
                  </div>

                  {/* Instructor & Semester Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Instructor
                      </label>
                      <input
                        type="text"
                        value={courseForm.instructor}
                        onChange={(e) => setCourseForm(prev => ({ ...prev, instructor: e.target.value }))}
                        placeholder="e.g., Dr. Smith"
                        className={`w-full h-10 px-3 rounded-lg border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          formErrors.instructor ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                        }`}
                        maxLength={100}
                      />
                      {formErrors.instructor && (
                        <p className="text-xs text-red-400 mt-1">{formErrors.instructor}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Semester
                        {currentSemester && (
                          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-300 font-medium">
                            Current
                          </span>
                        )}
                      </label>
                      <select
                        value={courseForm.semester}
                        onChange={(e) => setCourseForm(prev => ({ ...prev, semester: e.target.value }))}
                        className="w-full h-10 px-3 rounded-lg border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all border-slate-300 dark:border-slate-700 appearance-none cursor-pointer"
                      >
                        <option value="">Select semester...</option>
                        {/* Show configured semesters from semester_settings */}
                        {semesters.map(semester => (
                          <option 
                            key={semester.id} 
                            value={semester.id} 
                            className="bg-white dark:bg-slate-800"
                          >
                            {semester.name}
                            {currentSemester && currentSemester.id === semester.id ? ' (Current)' : ''}
                          </option>
                        ))}
                        
                        {/* Show legacy semester values from existing courses that aren't in semester_settings */}
                        {(() => {
                          const configuredSemesterIds = semesters.map(s => s.id);
                          const legacySemesters = [...new Set(
                            courses
                              .map(c => c.semester)
                              .filter(s => s && !configuredSemesterIds.includes(s))
                          )];
                          
                          if (legacySemesters.length > 0) {
                            return (
                              <>
                                <option disabled className="bg-slate-100 dark:bg-slate-900 text-slate-500">
                                  ──────────
                                </option>
                                <option disabled className="bg-slate-100 dark:bg-slate-900 text-slate-500 text-xs">
                                  Legacy semesters (migrate these)
                                </option>
                                {legacySemesters.map(sem => (
                                  <option 
                                    key={sem} 
                                    value={sem}
                                    className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                                  >
                                    {sem} (legacy)
                                  </option>
                                ))}
                              </>
                            );
                          }
                          return null;
                        })()}
                        
                        {semesters.length === 0 && (
                          <option value="" disabled className="text-slate-500">
                            Configure semesters below to assign modules
                          </option>
                        )}
                      </select>
                    </div>
                  </div>

                    {/* Color Selector - Inline Grid */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      Color
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {colorOptions.map(color => {
                        const isSelected = courseForm.color === color;
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setCourseForm(prev => ({ ...prev, color }))}
                            className={`h-10 rounded-lg transition-all ${
                              isSelected 
                                ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-105' 
                                 : 'hover:scale-105'
                              }`}                              style={{ backgroundColor: color }}
                            title={color}
                          >
                            {isSelected && (
                              <svg className="w-4 h-4 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                     </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={closeModal}
                    className="px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCourse}
                    disabled={saving || !courseForm.name?.trim()}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        {editingCourse ? 'Update Module' : 'Save Module'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading / Empty / Course Lists */}
        {loading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="max-w-md w-full">
              <div className="cozy rounded-2xl shadow-xl border border-gray-200 p-8">
                <div className="flex flex-col items-center text-center">
                  {/* Animated icon container */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
                      <BookOpen className="w-8 h-8 text-white" strokeWidth={2} />
                    </div>
                    {/* Spinning ring around icon */}
                    <div className="absolute inset-0 border-4 border-indigo-200 border-t-indigo-600 rounded-2xl animate-spin"></div>
                  </div>
                  
                  {/* Loading text */}
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Loading your modules
                  </h2>
                  <p className="text-sm text-gray-500">
                    Setting up your course manager...
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="max-w-2xl w-full mx-auto">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <BookOpen className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">No Modules Yet</h2>
                      <p className="text-indigo-100 text-sm">Let's get you set up</p>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="px-8 py-10">
                  <p className="text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
                    Start organizing your academic schedule by adding your first module.
                  </p>
                  {!currentSemester && (
                    <div className="mt-4 mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        💡 <strong>Tip:</strong> Configure your semester settings first to organize your modules by academic period.
                      </p>
                      <button
                        onClick={() => setShowSemesterConfig(true)}
                        className="mt-3 text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 font-medium underline"
                      >
                        Set up semester configuration
                      </button>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                    Once you add modules, you'll be able to track attendance, manage assignments, and monitor your grades.
                  </p>

                  {/* Action Button */}
                  <button
                    onClick={handleAddCourse}
                    className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Your First Module</span>
                  </button>

                  {/* Feature Highlights */}
                  <div className="mt-10 pt-8 border-t border-gray-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-6">
                      What you can do
                    </p>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Track Attendance</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Monitor class participation</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Manage Tasks</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Track assignments and deadlines</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Track Grades</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Monitor your academic progress</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* No Active Semester Message */}
            {!currentSemester && semesters.length === 0 && (
              <div className="mb-6 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">No Semester Configured</h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                      Set up your academic semesters to organize modules by time period.
                    </p>
                    <button
                      onClick={() => setShowSemesterConfig(true)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Configure Semesters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Semester Switcher - Allow browsing different semesters */}
            {semesters.length > 1 && (
              <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      <Calendar size={16} />
                      Switch Semester
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {selectedSemester ? `Viewing: ${selectedSemester.name}` : 'Click below to view a different semester'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {semesters.map(semester => (
                    <button
                      key={semester.id}
                      onClick={() => switchSemester(semester)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        (selectedSemester?.id === semester.id) 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-slate-700 border border-blue-200 dark:border-slate-700'
                      }`}
                    >
                      {semester.name}
                    </button>
                  ))}
                  {selectedSemester && (
                    <button
                      onClick={clearSemester}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 transition-all"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Current Modules - ALWAYS SHOW */}
            <div className="cozy rounded-xl shadow-lg mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="text-green-600" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        {currentSemester ? `Current Semester — ${currentSemester.name}` : 'All Modules'}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <BookOpen size={14} />
                          {getCurrentSemesterCourses().length} modules
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap size={14} />
                          {getTotalCredits(getCurrentSemesterCourses())} credits
                        </span>
                        {currentSemester && (
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(currentSemester.start_date).toLocaleDateString()} - {new Date(currentSemester.end_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {currentSemester && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Active</span>
                  )}
                </div>
              </div>
              <div className="p-6">
                {getCurrentSemesterCourses().length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <GraduationCap size={64} className="mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">No modules yet</h3>
                    <p className="mb-6">Start building your academic schedule by adding your first module.</p>
                    <button onClick={handleAddCourse} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Add Your First Module</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getCurrentSemesterCourses().map(course => (
                        <CourseCard 
                          key={course.id} 
                          course={course} 
                          onEdit={handleEditCourse} 
                          onDelete={handleDeleteCourse}
                          onShowDetails={setSelectedCourseDetails}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

            {/* Upcoming Semester */}
            {getUpcomingSemester() && (
              <div className="cozy rounded-xl shadow-lg mb-6">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">Upcoming Semester — {getUpcomingSemester().name}</h2>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <BookOpen size={14} />
                            {getUpcomingSemesterCourses().length} modules
                          </span>
                          <span className="flex items-center gap-1">
                            <GraduationCap size={14} />
                            {getTotalCredits(getUpcomingSemesterCourses())} credits
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            Starts {new Date(getUpcomingSemester().start_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Upcoming</span>
                  </div>
                </div>
                <div className="p-6">
                  {getUpcomingSemesterCourses().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock size={48} className="mx-auto mb-4 opacity-30" />
                      <h3 className="text-lg font-medium mb-2">No modules planned</h3>
                      <p>Plan ahead for next semester by adding modules.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {getUpcomingSemesterCourses().map(course => (
                        <CourseCard 
                          key={course.id} 
                          course={course} 
                          onEdit={handleEditCourse} 
                          onDelete={handleDeleteCourse} 
                          isUpcoming={true}
                          onShowDetails={setSelectedCourseDetails}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Previous Semesters */}
            {getPreviousSemesterCourses().length > 0 && (
              <div className="cozy rounded-xl shadow-lg">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <BookOpen className="text-gray-600" size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                          Previous Semesters
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <BookOpen size={14} />
                            {getPreviousSemesterCourses().length} modules
                          </span>
                          <span className="flex items-center gap-1">
                            <GraduationCap size={14} />
                            {getTotalCredits(getPreviousSemesterCourses())} credits
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                      Completed
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getPreviousSemesterCourses().map(course => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        onEdit={handleEditCourse}
                        onDelete={handleDeleteCourse}
                        isPrevious={true}
                        onShowDetails={setSelectedCourseDetails}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Course Details Panel */}
        {selectedCourseDetails && (
          <CourseDetailsPanel
            course={selectedCourseDetails}
            onClose={() => setSelectedCourseDetails(null)}
            onUpdate={fetchCourses}
          />
        )}
      </div>
    </div>
  </HygraphSidebar>
  );
};

// Course Card Component
const CourseCard = ({ course, onEdit, onDelete, onShowDetails, isPrevious = false, isUpcoming = false }) => {
  const getStatusBadge = () => {
    if (isPrevious) {
      return <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">Completed</span>;
    }
    if (isUpcoming) {
      return <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">Upcoming</span>;
    }
    return <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">Active</span>;
  };

  return (
  <div 
    className={`course-card-container border rounded-xl hover:shadow-lg transition-all duration-200 cozy ${
      isPrevious ? 'opacity-75' : 'hover:-translate-y-1'
    }`}
    style={{ padding: '1.25rem' }}
  >
      <div className="course-card-header flex items-start justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-5 h-5 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
            style={{ backgroundColor: course.color || '#3B82F6' }}
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 leading-tight text-base break-words">
              {course.name}
            </h3>
            {course.code && (
              <p className="text-sm text-gray-500 font-mono">{course.code}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onShowDetails(course)}
            className="text-gray-400 hover:text-purple-600 transition-colors p-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            aria-label="View details"
            title="Contact info & resources"
          >
            <Info size={16} />
          </button>
          <button
            onClick={() => onEdit(course)}
            className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded hover:bg-indigo-50"
            aria-label="Edit course"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(course.id, course.name)}
            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
            aria-label="Delete course"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="course-card-body space-y-3 text-sm text-gray-600">
        {course.instructor && (
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{course.instructor}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-gray-400" />
            <span>{course.credits} credit{course.credits !== 1 ? 's' : ''}</span>
          </div>
          {getStatusBadge()}
        </div>
        
        {course.attendanceSessionsCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-indigo-600">
            <Calendar size={14} />
            <span>{course.attendanceSessionsCount} attendance session{course.attendanceSessionsCount !== 1 ? 's' : ''}</span>
          </div>
        )}
        
        {course.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed border-t pt-3 mt-3">
            {course.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default ModulesManager;
