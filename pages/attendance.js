import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Download, Loader2, AlertCircle, Calendar, Settings, BookOpen, ArrowRight, X } from 'lucide-react';
import CustomSelect from '../src/components/CustomSelect';
// WeekView (timetable grid) removed from Attendance page per UI request
import Notification from '../src/components/Notification';
import Head from 'next/head';
import AddSessionModal from '../src/components/attendance/AddSessionModal';

const AttendanceTracker = () => {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const modalRef = useRef(null);
  const modalCloseTimerRef = useRef(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  
  const [editingSession, setEditingSession] = useState(null);

  // Fetch courses on component mount
  const fetchCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      setError(null);
      
  // Courses endpoint reads authenticated user from next-auth token
  const response = await fetch(`/api/courses`);
      
      console.log('Courses response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const msg = body?.message || body?.error || `HTTP ${response.status}: Failed to fetch courses`;
        console.error('Courses API Error Details:', msg);
        setNotification({ type: 'error', message: msg });
        throw new Error(msg);
      }
      
      const data = await response.json();
      console.log('Courses API Response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch courses');
      }
      
      const fetchedCourses = data.courses || [];
      setCourses(fetchedCourses);
      
      // Auto-select first course if available (only if nothing selected yet)
      if (fetchedCourses.length > 0) {
        const firstCourse = fetchedCourses[0];
        setSelectedCourse(prev => prev || firstCourse.name);
        setSelectedCourseId(prev => prev || firstCourse.id);
      }
      
      console.log('Courses loaded:', fetchedCourses.length);
    } catch (err) {
      const errorMessage = err.message || 'Unknown error occurred while fetching courses';
      setError(errorMessage);
      console.error('Error fetching courses:', err);
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // Helper to parse error responses robustly (try JSON, then text)
  const parseErrorResponse = async (response) => {
    let defaultMsg = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return json.error || JSON.stringify(json) || defaultMsg;
      } catch (e) {
        // Not JSON — return trimmed text body (first 1000 chars)
        const trimmed = text.trim();
        return trimmed ? `${defaultMsg} - ${trimmed.substring(0, 1000)}` : defaultMsg;
      }
    } catch (e) {
      return defaultMsg;
    }
  };

  // Fetch attendance data when course changes
  const fetchAttendanceData = useCallback(async () => {
    if (!selectedCourseId) return;
    
    try {
      setLoading(true);
      setError(null);
      
  console.log('Fetching attendance data for course ID:', selectedCourseId);
      
  const response = await fetch(`/api/attendance?courseId=${selectedCourseId}`);
      
      console.log('Attendance response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const msg = body?.message || body?.error || `HTTP ${response.status}: Failed to fetch attendance`;
        console.error('Attendance API Error Details:', msg);
        setNotification({ type: 'error', message: msg });
        throw new Error(msg);
      }
      
      const data = await response.json();
      console.log('Attendance API Response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch attendance data');
      }
      
      setSessions(sortSessionsByDate(data.sessions || []));
      console.log('Sessions loaded:', data.sessions?.length || 0);
    } catch (err) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching attendance:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => { if (selectedCourseId) fetchAttendanceData(); }, [selectedCourseId, fetchAttendanceData]);

  // Auto-dismiss compact toasts
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(t);
  }, [notification]);

  useEffect(() => {
  if (successMessage) {
    const timer = setTimeout(() => setSuccessMessage(null), 5000);
    return () => clearTimeout(timer);
  }
}, [successMessage]);

useEffect(() => {
  let mounted = true;
  const prevActive = typeof document !== 'undefined' ? document.activeElement : null;
  
  if (showAddSessionModal) {
    // Trigger enter animation
    setTimeout(() => { if (mounted) setModalVisible(true); }, 10);
    
    // Focus first input
    setTimeout(() => {
      try {
        const root = modalRef.current;
        if (root) {
          const el = root.querySelector('input, select, textarea, button');
          if (el && el.focus) el.focus();
        }
      } catch (e) {}
    }, 50);

    // Keyboard handling
      const onKey = (ev) => {
      if (ev.key === 'Escape') {
        closeModal();
      }
      if (ev.key === 'Tab') {
        const root = modalRef.current;
        if (!root) return;
        const focusable = root.querySelectorAll('a[href], button:not([disabled]), textarea, input, select');
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (ev.shiftKey && document.activeElement === first) {
          ev.preventDefault(); 
          last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault(); 
          first.focus();
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
}, [showAddSessionModal]);

  // Close modal with exit animation then hide
  const closeModal = () => {
    try {
      // start exit animation
      setModalVisible(false);
      // clear any previous timer
      if (modalCloseTimerRef.current) {
        clearTimeout(modalCloseTimerRef.current);
        modalCloseTimerRef.current = null;
      }
      modalCloseTimerRef.current = setTimeout(() => {
        setShowAddSessionModal(false);
        setEditingSession(null);
        modalCloseTimerRef.current = null;
      }, 320);
    } catch (e) {
      // fallback: hide immediately
      setShowAddSessionModal(false);
      setEditingSession(null);
    }
  };

  // Handler used by modal to save a session and close with success message
  const handleSaveSession = async (payload) => {
    try {
      // await existing addSessionWithPayload helper which manages saving
      await addSessionWithPayload(payload);
      const course = courses.find(c => c.id === (payload.courseId || selectedCourseId));
      const formattedDate = new Date(payload.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      setSuccessMessage(`Session added for ${course ? course.code : selectedCourse} on ${formattedDate}`);
      closeModal();
    } catch (e) {
      // addSessionWithPayload already surfaces errors; keep modal open for correction
      console.error('Error in handleSaveSession:', e);
    }
  };

  // Helper to sort sessions by date (oldest first)
  const sortSessionsByDate = (sessionsArray) => {
    return (sessionsArray || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  };
 

  // Calculate statistics - FIXED LOGIC WITH CAPPING SYSTEM
  const calculateStats = () => {
    const totalSessions = sessions.length;
    const holidays = sessions.filter(s => s.status === 'HOLIDAY').length;
    const present = sessions.filter(s => s.status === 'PRESENT').length;
    const absent = sessions.filter(s => s.status === 'ABSENT').length;
    const excused = sessions.filter(s => s.status === 'EXCUSED').length;
    const late = sessions.filter(s => s.status === 'LATE').length;
    
    // FIXED: Calculate attendance USING weighted points and EXCLUDING holidays entirely
    // Weighted points: PRESENT=2, LATE=1, EXCUSED=1, ABSENT=0, HOLIDAY excluded
    const attendableSessions = sessions.filter(s => s.status !== 'HOLIDAY');
    const eligibleSessions = attendableSessions.length;

    const MAX_POINTS = 2;
    const derivePoints = (session) => {
      if (!session) return 0;
      // prefer explicit numeric points when provided
      if (typeof session.points === 'number') return session.points;
      const st = (session.status || '').toString().toUpperCase();
      switch (st) {
        case 'PRESENT': return 2;
        case 'LATE': return 1;
        case 'EXCUSED': return 1;
        case 'ABSENT': return 0;
        case 'HOLIDAY': return null; // excluded
        default: return 0;
      }
    };

    let totalPointsEarned = 0;
    let countedSessions = 0;
    for (const s of sessions) {
      const pts = derivePoints(s);
      if (pts === null || pts === undefined) continue; // exclude holidays
      totalPointsEarned += Number(pts) || 0;
      countedSessions++;
    }
    const totalPointsPossible = countedSessions * MAX_POINTS;
    const attendancePercentage = totalPointsPossible > 0 ? (totalPointsEarned / totalPointsPossible) * 100 : 0;
    
    // Capping system calculations
    const requiredAttendancePercentage = 80; // 80% minimum required
  const maxSkippablePercentage = 20; // Can skip up to 20%
  const maxSkippableSessions = Math.max(0, Math.floor(eligibleSessions * (maxSkippablePercentage / 100)));
  const skippedSessions = absent; // Only count actual absences (not late/excused)
  const remainingSkippable = Math.max(0, maxSkippableSessions - skippedSessions);
  const isCapped = attendancePercentage < requiredAttendancePercentage;
  // Determine 'at risk' by proximity to the required attendance percentage.
  // This avoids negative-threshold issues when maxSkippableSessions is small.
  const riskMarginPoints = 5; // percentage points above the threshold considered 'at risk'
  const isAtRisk = !isCapped && attendancePercentage < (requiredAttendancePercentage + riskMarginPoints);
    
    return {
      totalSessions,
      holidays,
      present,
      absent,
      excused,
      late,
      attendancePercentage,
      totalPointsEarned,
      totalPointsPossible,
      eligibleSessions, // This is now sessions excluding holidays
      // Capping system data
      requiredAttendancePercentage,
      maxSkippableSessions,
      skippedSessions,
      remainingSkippable,
      isCapped,
      isAtRisk
    };
  };

  const stats = calculateStats();

  // Small inline dark-mode overrides specific to Attendance page
  // Keep minimal and rely on global src/index.css for broader coverage
    const attendanceDarkStyles = `
    html.dark .attendance-root { background: #071023; color: rgba(255,255,255,0.92); }
    html.dark .attendance-card { background: #071423; border-color: rgba(255,255,255,0.04); box-shadow: none; }
    html.dark .attendance-card .card-header, html.dark .attendance-card .card-body { color: rgba(255,255,255,0.92); }
    
    /* Enhanced card borders and outlines for better definition */
    html.dark .cozy { border: 1px solid rgba(139, 92, 246, 0.15); }
    html.dark .attendance-table-wrapper { border: 1px solid rgba(139, 92, 246, 0.15); border-radius: 0.75rem; }
    html.dark .summary-panel { border: 1px solid rgba(139, 92, 246, 0.2); box-shadow: 0 0 20px rgba(139, 92, 246, 0.08); }
    
  /* Table header surface and cells */
  html.dark .attendance-table thead { background: rgba(255,255,255,0.02) !important; }
  html.dark .attendance-table thead th { background: rgba(255,255,255,0.02) !important; color: rgba(255,255,255,0.92) !important; border-bottom-color: rgba(255,255,255,0.04) !important; }
  html.dark .attendance-table td { color: rgba(255,255,255,0.9) !important; }
  /* Table row hover in dark mode */
  html.dark .attendance-root table tbody tr:hover { background: rgba(255,255,255,0.02) !important; }
  /* Ensure cozy tbody background is dark */
  html.dark .attendance-root .cozy tbody { background: transparent !important; }
    /* Utility fix for hover:bg-gray-50 used on rows */
    html.dark .attendance-root .hover\:bg-gray-50:hover { background: rgba(255,255,255,0.02) !important; }

    /* Inputs, selects and small controls */
    html.dark .attendance-root input[type="date"],
    html.dark .attendance-root input[type="time"],
    html.dark .attendance-root input[type="number"],
    html.dark .attendance-root select,
    html.dark .attendance-root textarea {
      background: #0b1220; color: rgba(255,255,255,0.92); border-color: rgba(255,255,255,0.06);
    }
    /* Force native select dropdowns to use dark backgrounds and readable option text */
    html.dark .attendance-root select { background: #0b1220 !important; color: rgba(255,255,255,0.92) !important; }
    /* Some browsers render options in a native popup - style fallback for options */
    html.dark .attendance-root select option { background: #0b1220; color: rgba(255,255,255,0.92); }
    /* Focus/hover states for options (where supported) */
    html.dark .attendance-root select option:hover, html.dark .attendance-root select option:focus { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.98); }
    /* Ensure selected option text is visible without focusing the select */
    html.dark .attendance-root select, html.dark .attendance-root select option {
      color: rgba(255,255,255,0.92) !important; background: transparent !important;
    }
    /* Some browsers render the selected value in a pseudo-element; target common ones */
    html.dark .attendance-root select::-ms-value { color: rgba(255,255,255,0.92); }
    html.dark .attendance-root select::-webkit-textfield-decoration { color: rgba(255,255,255,0.92); }
    /* Force number inputs to show their value in dark mode */
    html.dark .attendance-root input[type="number"] { color: rgba(255,255,255,0.92) !important; }
    html.dark .attendance-root input:focus,
    html.dark .attendance-root select:focus,
    html.dark .attendance-root input:focus-visible {
      box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
    }

    /* Buttons and small controls */
    html.dark .attendance-root button,
    html.dark .attendance-root .btn-light {
      background: transparent; color: rgba(255,255,255,0.92); border-color: rgba(255,255,255,0.06);
    }

    /* Status badge color adjustments for dark mode */
    html.dark .bg-green-50 { background: rgba(16,185,129,0.06) !important; color: rgba(16,185,129,0.95) !important; }
    html.dark .bg-red-50 { background: rgba(239,68,68,0.06) !important; color: rgba(239,68,68,0.95) !important; }
    html.dark .bg-blue-50 { background: rgba(59,130,246,0.06) !important; color: rgba(59,130,246,0.95) !important; }
    html.dark .bg-yellow-50 { background: rgba(234,179,8,0.06) !important; color: rgba(234,179,8,0.95) !important; }
    html.dark .bg-orange-50 { background: rgba(249,115,22,0.06) !important; color: rgba(249,115,22,0.95) !important; }

    /* Stronger text mappings */
    html.dark .text-gray-900, html.dark .text-gray-800 { color: rgba(255,255,255,0.92) !important; }
    html.dark .text-gray-600 { color: rgba(255,255,255,0.72) !important; }

    /* Summary panels and cards */
    html.dark .cozy, html.dark .card { background: #071423; border-color: rgba(255,255,255,0.04); }

    html.dark .modal-backdrop { background: rgba(0,0,0,0.6); }
    html.dark .text-gray-600 { color: rgba(255,255,255,0.72) !important; }
  `;

  // Note: addSession flow is replaced by modal-driven addSessionWithPayload

  // New helper: add session with explicit payload (date in YYYY-MM-DD)
  const addSessionWithPayload = async (payload) => {
    if (!selectedCourseId && !payload.courseId) {
      setError('Please select a course first');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const derivePoints = (st) => {
        switch ((st || '').toUpperCase()) {
          case 'PRESENT': return 2;
          case 'EXCUSED': return 1;
          case 'LATE': return 1;
          case 'ABSENT': return 0;
          case 'HOLIDAY': return null;
          default: return 0;
        }
      };
      const status = (payload.status || 'PRESENT').toUpperCase();
      const body = {
        date: payload.date,
        status,
        points: (payload.points !== undefined ? payload.points : derivePoints(status)),
        courseId: payload.courseId || selectedCourseId
      };

      console.log('Adding session payload:', body);

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errMsg = await parseErrorResponse(response);
        setNotification({ type: 'error', message: errMsg });
        throw new Error(errMsg);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to add session');

      setSessions(prev => sortSessionsByDate([...(prev || []), data.session]));
      setNotification({ type: 'success', message: 'Session added' });
      // Broadcast a window-level event so other pages (e.g., timetable) can update live
      try {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('attendance:created', { detail: data.session }));
        }
      } catch (e) {
        console.warn('Failed to dispatch attendance:created event', e);
      }
    } catch (err) {
      setError(err.message || 'Unknown error adding session');
      console.error('Error adding session with payload:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateSession = async (id, field, value) => {
    try {
      setError(null);
      
      // Optimistic update
      const updatedSessions = sessions.map(session => {
        if (session.id === id) {
          const updated = { ...session, [field]: value };
          // Auto-calculate points based on status - UPDATED LOGIC
          if (field === 'status') {
            switch (value) {
              case 'PRESENT':
                updated.points = 2;
                break;
              case 'EXCUSED':
                updated.points = 1;
                break;
              case 'LATE':
                updated.points = 1; // Changed from 0 to 1
                break;
              case 'ABSENT':
                updated.points = 0;
                break;
              case 'HOLIDAY':
                updated.points = null; // Holidays don't affect attendance
                break;
              default:
                updated.points = 0;
            }
          }
          return updated;
        }
        return session;
      });
      setSessions(updatedSessions);

      // API call
      const response = await fetch(`/api/attendance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id,
            [field]: value
          }),
      });

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response);
        setNotification({ type: 'error', message: errorMessage || `HTTP ${response.status}: Failed to update session` });
        throw new Error(errorMessage || `HTTP ${response.status}: Failed to update session`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update session');
      }

      // Update with server response and sort to maintain order
      setSessions(prevSessions => {
        const replaced = prevSessions.map(s => s.id === id ? data.session : s);
        return sortSessionsByDate(replaced);
      });
    } catch (err) {
      setError(err.message);
      console.error('Error updating session:', err);
      // Revert optimistic update
      fetchAttendanceData();
    }
  };

  const deleteSession = async (id) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/attendance`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response);
        setNotification({ type: 'error', message: errorMessage || `HTTP ${response.status}: Failed to delete session` });
        throw new Error(errorMessage || `HTTP ${response.status}: Failed to delete session`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete session');
      }

      setSessions(prevSessions => prevSessions.filter(session => session.id !== id));
    } catch (err) {
      setError(err.message);
      console.error('Error deleting session:', err);
    }
  };

  // Full update helper for modal (edit mode)
  const updateSessionFull = async (payload) => {
    // payload expected to contain id and fields to update: date, time, status, points
    try {
      setSaving(true);
      setError(null);
      const response = await fetch(`/api/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errMsg = await parseErrorResponse(response);
        setNotification({ type: 'error', message: errMsg });
        throw new Error(errMsg);
      }
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to update session');
      setSessions(prev => sortSessionsByDate(prev.map(s => s.id === data.session.id ? data.session : s)));
      setNotification({ type: 'success', message: 'Session updated' });
      setEditingSession(null);
      setShowAddSessionModal(false);
    } catch (err) {
      setError(err.message || 'Unknown error updating session');
      console.error('Error updating session (full):', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteSessionFull = async (id) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/attendance`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        const errMsg = await parseErrorResponse(response);
        setNotification({ type: 'error', message: errMsg });
        throw new Error(errMsg);
      }
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete session');
      setSessions(prev => prev.filter(s => s.id !== id));
      setNotification({ type: 'success', message: 'Session deleted' });
      setEditingSession(null);
      setShowAddSessionModal(false);
    } catch (err) {
      setError(err.message || 'Unknown error deleting session');
      console.error('Error deleting session (full):', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCourseChange = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setSelectedCourse(course.name);
      setSelectedCourseId(courseId);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-50 text-green-800';
      case 'ABSENT': return 'bg-red-50 text-red-800';
      case 'HOLIDAY': return 'bg-blue-50 text-blue-800';
      case 'EXCUSED': return 'bg-yellow-50 text-yellow-800';
      case 'LATE': return 'bg-orange-50 text-orange-800';
      default: return 'bg-gray-50 text-gray-800';
    }
  };

  const exportData = () => {
    const selectedCourseData = courses.find(c => c.id === selectedCourseId);
    const exportData = {
      course: selectedCourseData,
      sessions: sessions,
      stats: stats,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedCourse || 'attendance'}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Show loading state while courses are loading
  if (coursesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <Head>
          <title>Attendance — University Planner</title>
        </Head>
        <div className="max-w-7xl mx-auto">
          <div className="cozy rounded-xl shadow-lg p-12">
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin mr-3" size={24} />
              <span className="text-gray-600">Loading your courses...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no courses exist
  if (!courses.length) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex items-center justify-center">
      <Head>
        <title>Attendance — University Planner</title>
      </Head>
      <div className="max-w-2xl w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="px-8 py-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              No Courses Found
            </h2>
            <p className="text-lg text-gray-600 mb-2 max-w-lg mx-auto leading-relaxed">
              You haven't added any courses yet. Get started by creating your first course in the Modules Manager.
            </p>
            <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
              Once you add courses, you'll be able to track attendance, manage assignments, and monitor your academic progress.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => window.location.href = '/modules'}
                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Course</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>

            {/* Feature Highlights */}
            <div className="mt-12 pt-8 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-6">
                What you can do with courses
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Track Attendance</h4>
                  <p className="text-xs text-gray-600">Monitor your class participation and stay on top of requirements</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Manage Tasks</h4>
                  <p className="text-xs text-gray-600">Keep track of assignments and deadlines for each course</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">
                    <div className="w-6 h-6 bg-indigo-500 rounded-full"></div>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">View Analytics</h4>
                  <p className="text-xs text-gray-600">Get insights into your academic performance and progress</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Helper */}
          <div className="bg-gray-50 px-8 py-5 border-t border-gray-100">
            <p className="text-sm text-gray-600 text-center">
              Need help getting started?{' '}
              <a href="/help" className="text-indigo-600 hover:text-indigo-700 font-medium underline">
                View our guide
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

  // Using extracted AddSessionModal component from src/components/attendance/AddSessionModal.jsx

  return (
    <div className="attendance-root calendar-root min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <Head>
        <title>Attendance — University Planner</title>
      </Head>
      <style>{`html.dark .attendance-root { background: linear-gradient(180deg,#071023,#071423); }
        html.dark .cozy, html.dark .card { background: #071423; color: rgba(255,255,255,0.92); border-color: rgba(255,255,255,0.04); }
        html.dark .text-gray-800 { color: rgba(255,255,255,0.92) !important; }
        html.dark .text-gray-600 { color: rgba(255,255,255,0.72) !important; }
        html.dark .bg-red-50 { background: rgba(255,0,0,0.04) !important; }
        ${attendanceDarkStyles}
        @keyframes popIn {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
        `}</style>
      {/* Top-right compact toasts */}
      <div className="fixed top-6 right-6 z-50">
        <Notification type={notification?.type} message={notification?.message} onClose={() => setNotification(null)} />
      </div>
  <div className="max-w-7xl mx-auto">
  <div className={`attendance-content ${showAddSessionModal ? 'blur-md pointer-events-none' : ''}`}>
    {/* Header */}
  <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40 backdrop-blur-sm bg-white/95">
  <div className="max-w-7xl mx-auto px-6 py-5">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Tracker</h1>
          <p className="text-sm text-slate-600">University Planner - Track your class attendance</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={() => window.location.href = '/courses'}
          className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2 border border-slate-200 hover:border-slate-300 hover:shadow-sm"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Manage Courses</span>
        </button>
        <button className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2 border border-slate-200 hover:border-slate-300 hover:shadow-sm">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Export</span>
        </button>
        <button 
          onClick={() => setShowAddSessionModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
        >
          <Plus className="w-4 h-4" />
          <span className="font-semibold">Add Session</span>
        </button>
      </div>
    </div>

    {/* Success Banner */}
    {successMessage && (
      <div className="max-w-7xl mx-auto px-6 pt-6 animate-slide-down">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="text-emerald-600 w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-emerald-900 font-semibold text-sm">Session Added Successfully</p>
            <p className="text-emerald-700 text-sm">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 p-2 rounded-lg transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )}

    {/* Course selector - keep your existing custom dropdown */}
    <div className="flex items-center gap-4 bg-slate-50 px-5 py-3.5 rounded-xl border border-slate-200">
      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <BookOpen className="w-4 h-4" />
        Course:
      </label>
      {/* YOUR EXISTING CUSTOM DROPDOWN COMPONENT HERE */}
      {/* Just paste your current custom dropdown code */}
      <div className="flex-1">
        <CustomSelect
          options={courses.map(c => ({ label: c.name || c.code || c.title || c.id, value: c.id }))}
          value={selectedCourseId}
          onChange={(val) => handleCourseChange(val)}
          placeholder="Select a course"
          className="w-full"
          id="course-select"
        />
      </div>
      <span className="text-sm text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200 font-medium whitespace-nowrap">
        {courses.length} courses available
      </span>
    </div>
  </div>
</header>

        {selectedCourseId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sessions Table */}
            <div className="lg:col-span-2">
              {/* Upcoming Sessions removed per user request */}
              <div className="cozy rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Sessions for {selectedCourse}
                  </h2>
                </div>
                
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin mr-2" size={24} />
                      <span>Loading attendance data...</span>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>No attendance sessions found for {selectedCourse}</p>
                      <button
                        onClick={() => setShowAddSessionModal(true)}
                        disabled={saving}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={16} />
                            Adding...
                          </span>
                        ) : (
                          'Add First Session'
                        )}
                      </button>
                    </div>
                  ) : (
                    <table className="w-full attendance-table">
                    <thead className="bg-gray-50 dark:bg-transparent">
                      <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-slate-100 uppercase tracking-wider">Session</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-slate-100 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-slate-100 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-slate-100 uppercase tracking-wider">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black dark:text-slate-100 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="cozy divide-y divide-gray-200">
                      {sessions.map((session, index) => (
                        <tr key={session.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 text-sm text-black dark:text-slate-100">
                            <input
                              type="date"
                              value={session.date}
                              onChange={(e) => updateSession(session.id, 'date', e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(session.date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={session.status}
                              onChange={(e) => updateSession(session.id, 'status', e.target.value)}
                              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)} border-0 focus:ring-2 focus:ring-blue-500 text-black dark:text-white`}
                            >
                              <option value="PRESENT">Present</option>
                              <option value="ABSENT">Absent</option>
                              <option value="LATE">Late</option>
                              <option value="HOLIDAY">Holiday</option>
                              <option value="EXCUSED">Excused</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-slate-100">
                            <div className="w-16 text-sm font-medium text-gray-800 dark:text-white">
                              {session.points === null || session.points === undefined ? '—' : session.points}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <button
                              onClick={() => deleteSession(session.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              aria-label="Delete session"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Panel */}
            <div className="lg:col-span-1">
              <div className="cozy rounded-xl shadow-lg p-6 lg:p-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Summary</h2>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-700 dark:text-slate-100">Attendance %</span>
                    <span className="text-2xl font-bold text-green-600">
                      {stats.attendancePercentage.toFixed(1)}%
                    </span>
                  </div>
                  
                    <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-100">Holidays:</span>
                      <span className="font-medium text-blue-600">{stats.holidays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-100">Present:</span>
                      <span className="font-medium text-green-600">{stats.present}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-100">Absent:</span>
                      <span className="font-medium text-red-600">{stats.absent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-100">Excused:</span>
                      <span className="font-medium text-yellow-600">{stats.excused}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-100">Late:</span>
                      <span className="font-medium text-orange-600">{stats.late}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Points Earned:</span>
                      <span className="font-medium">{stats.totalPointsEarned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Possible:</span>
                      <span className="font-medium">{stats.totalPointsPossible}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">
                        {stats.present}/{stats.eligibleSessions}
                      </div>
                      <div className="text-sm text-gray-500">
                        Present/Attendable Sessions
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        (Holidays excluded)
                      </div>
                    </div>
                  </div>

                  {/* Capping system */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Capping system</h3>
                    
                    {/* Main Status */}
                    <div className={`p-3 rounded-lg text-center mb-3 ${
                      stats.isCapped 
                        ? 'bg-red-50 text-red-800 border border-red-200' 
                        : stats.isAtRisk
                        ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                        : 'bg-green-50 text-green-800 border border-green-200'
                    }`}>
                      <div className="font-semibold text-lg">
                        {stats.isCapped ? 'CAPPED — action required' :
                         stats.isAtRisk ? 'At risk — pay attention' : 'Good — you meet the requirement'}
                      </div>
                      <div className="text-sm mt-1 text-gray-600">
                        {stats.isCapped ? 'Attendance below 80%. Contact your instructor.' :
                         stats.isAtRisk ? 'Approaching the maximum allowed absences. Aim to attend upcoming classes.' : 'Above 80% — keep it up.'}
                      </div>
                    </div>

                    {/* Detailed Numbers */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Required Attendance:</span>
                        <span className="font-medium">≥80%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Attendance:</span>
                        <span className={`font-medium ${stats.attendancePercentage >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.attendancePercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Skippable:</span>
                        <span className="font-medium">{stats.maxSkippableSessions} lectures</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Skipped:</span>
                        <span className={`font-medium ${stats.skippedSessions >= stats.maxSkippableSessions ? 'text-red-600' : 'text-gray-800'}`}>
                          {stats.skippedSessions} lectures
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Remaining Skippable:</span>
                        <span className={`font-medium ${
                          stats.remainingSkippable === 0 ? 'text-red-600' : 
                          stats.remainingSkippable <= 1 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {stats.remainingSkippable} lectures
                        </span>
                      </div>
                    </div>

                    {/* Warning/Info Messages */}
                    {stats.eligibleSessions > 0 && (
                      <div className="mt-3 p-2 bg-blue-50 rounded-lg text-xs text-blue-800">
                        <div className="font-medium mb-1">Guidance</div>
                        <div>
                          {stats.isCapped ? (
                            "You've exceeded the allowed absences. Contact your instructor or admin immediately."
                          ) : stats.isAtRisk ? (
                            `You may miss ${stats.remainingSkippable} more session${stats.remainingSkippable !== 1 ? 's' : ''} before being capped. Prioritize attendance.`
                          ) : (
                            `You can miss up to ${stats.remainingSkippable} more session${stats.remainingSkippable !== 1 ? 's' : ''} and still meet the 80% requirement.`
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Modal Backdrop & Add/Edit Session Modal - grouped to ensure valid JSX */}
    {showAddSessionModal && (
      <React.Fragment>
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => { closeModal(); }}
        />
        <AddSessionModal
          open={showAddSessionModal}
          visible={modalVisible}
          onClose={() => { closeModal(); }}
          onSave={handleSaveSession}
          onUpdate={updateSessionFull}
          onDelete={deleteSessionFull}
          defaultCourseId={selectedCourseId}
          editingSession={editingSession}
        />
      </React.Fragment>
    )}

  </div>
  );
};



export default AttendanceTracker;