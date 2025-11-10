import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { Archive, Search, Calendar, Clock, Tag, X, RotateCcw, Trash2, ChevronDown, ChevronUp, BookOpen, AlertCircle, CheckCircle, Home, Settings, LogOut, FileText, TrendingUp, GraduationCap, Users, Package } from 'lucide-react';
import { fetchWithCache, invalidateCache } from '../lib/cache';

const ArchivedEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [isDark, setIsDark] = useState(false);

  // Authentication check
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/login';
          return;
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      }
    }
    checkAuth();
  }, []);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const dark = document.documentElement.classList.contains('dark');
      setIsDark(dark);
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Load archived events and courses
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Fetch events with archived included (use cache with 1 min TTL)
        const eventsData = await fetchWithCache('/api/events?includeArchived=true', { credentials: 'same-origin' }, 60000);
        console.log('[Archived] Raw API response:', eventsData);
        
        // Filter to only archived events
        const allEvents = eventsData.data || eventsData || [];
        console.log('[Archived] All events:', allEvents.length);
        const archived = allEvents.filter(ev => ev.archived === true);
        console.log('[Archived] Archived events filtered:', archived.length, archived);
        setEvents(archived);

        // Fetch courses (use cache with 2 min TTL)
        const coursesData = await fetchWithCache('/api/courses', { credentials: 'same-origin' }, 120000);
        setCourses(coursesData.data || coursesData || []);

        setLoading(false);
      } catch (err) {
        console.error('Failed to load data:', err);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Unarchive event
  const handleUnarchive = async (eventId) => {
    const event = events.find(e => String(e.id) === String(eventId));
    if (!window.confirm(`Unarchive "${event?.title || 'this event'}"?`)) return;

    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false })
      });

      if (res.ok) {
        // Remove from list
        setEvents(prev => prev.filter(e => String(e.id) !== String(eventId)));
        // Invalidate caches
        invalidateCache('/api/events?includeArchived=true' + JSON.stringify({ credentials: 'same-origin' }));
        invalidateCache('/api/events' + JSON.stringify({ credentials: 'same-origin' }));
        // Show success message
        alert(`"${event?.title || 'Event'}" has been unarchived successfully!`);
      } else {
        alert('Failed to unarchive event. Please try again.');
      }
    } catch (err) {
      console.error('Unarchive error:', err);
      alert('Network error. Could not unarchive event.');
    }
  };

  // Delete archived event permanently
  const handleDelete = async (eventId) => {
    const event = events.find(e => String(e.id) === String(eventId));
    if (!window.confirm(`Permanently delete "${event?.title || 'this event'}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setEvents(prev => prev.filter(e => String(e.id) !== String(eventId)));
        // Invalidate caches
        invalidateCache('/api/events?includeArchived=true' + JSON.stringify({ credentials: 'same-origin' }));
        invalidateCache('/api/events' + JSON.stringify({ credentials: 'same-origin' }));
        alert(`"${event?.title || 'Event'}" has been permanently deleted.`);
      } else {
        alert('Failed to delete event. Please try again.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Network error. Could not delete event.');
    }
  };

  // Get event type badge color
  const getTypeBadgeColor = (type) => {
    const typeColors = {
      'class': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'lecture': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'lab': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'tutorial': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      'assignment': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      'deadline': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'exam': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
      'quiz': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'project': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
    };
    return typeColors[type?.toLowerCase()] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
  };

  // Get event type icon
  const getTypeIcon = (type) => {
    const typeIcons = {
      'class': BookOpen,
      'lecture': BookOpen,
      'lab': AlertCircle,
      'tutorial': Users,
      'assignment': FileText,
      'deadline': AlertCircle,
      'exam': FileText,
      'quiz': FileText,
      'project': TrendingUp
    };
    const Icon = typeIcons[type?.toLowerCase()] || Tag;
    return <Icon className="w-4 h-4" />;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'No date';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Invalid date';
    }
  };

  // Format time
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    // Handle range format "08:30-10:00"
    if (timeStr.includes('-')) {
      const [start, end] = timeStr.split('-');
      return `${start.trim()} - ${end.trim()}`;
    }
    return timeStr;
  };

  // Get course name
  const getCourseName = (courseId) => {
    if (!courseId) return null;
    const course = courses.find(c => String(c.id) === String(courseId));
    return course ? `${course.code} - ${course.name}` : null;
  };

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ev => 
        ev.title?.toLowerCase().includes(term) ||
        ev.description?.toLowerCase().includes(term) ||
        ev.type?.toLowerCase().includes(term) ||
        ev.location?.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(ev => ev.type?.toLowerCase() === filterType.toLowerCase());
    }

    // Course filter
    if (filterCourse !== 'all') {
      filtered = filtered.filter(ev => String(ev.course_id) === String(filterCourse));
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date-desc') {
        const dateA = new Date(a.startDate || a.date);
        const dateB = new Date(b.startDate || b.date);
        return dateB - dateA;
      } else if (sortBy === 'date-asc') {
        const dateA = new Date(a.startDate || a.date);
        const dateB = new Date(b.startDate || b.date);
        return dateA - dateB;
      } else if (sortBy === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'title-desc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      return 0;
    });

    return filtered;
  }, [events, searchTerm, filterType, filterCourse, sortBy]);

  // Get unique event types
  const eventTypes = useMemo(() => {
    const types = [...new Set(events.map(ev => ev.type).filter(Boolean))];
    return types.sort();
  }, [events]);

  if (loading) {
    return (
      <>
        <Head>
          <title>Archived Events — University Planner</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading archived events...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Archived Events — University Planner</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Archive className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Archived Events</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {events.length} {events.length === 1 ? 'event' : 'events'} archived
                  </p>
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="flex items-center gap-2">
                <a href="/overview" className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Overview
                </a>
                <a href="/calendar" className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Calendar
                </a>
                <a href="/timetable" className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timetable
                </a>
                <a href="/grades" className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Grades
                </a>
              </nav>
            </div>

            {/* Filters */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Type filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Types</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              {/* Course filter */}
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Archive className="w-12 h-12 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {searchTerm || filterType !== 'all' || filterCourse !== 'all' ? 'No matching archived events' : 'No archived events'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                {searchTerm || filterType !== 'all' || filterCourse !== 'all' 
                  ? 'Try adjusting your filters to see more results.' 
                  : 'Events you archive will appear here. You can unarchive them at any time.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map(event => (
                <div
                  key={event.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Event header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${getTypeBadgeColor(event.type)}`}>
                            {getTypeIcon(event.type)}
                            {event.type || 'Event'}
                          </div>
                          {event.completed && (
                            <div className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Completed
                            </div>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formatDate(event.startDate || event.date)}
                          </div>
                          {event.time && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {formatTime(event.time)}
                            </div>
                          )}
                          {getCourseName(event.course_id) && (
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4" />
                              {getCourseName(event.course_id)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title={expandedEvent === event.id ? 'Collapse' : 'Expand'}
                        >
                          {expandedEvent === event.id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleUnarchive(event.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Unarchive
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete permanently"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedEvent === event.id && (
                    <div className="px-5 pb-5 pt-0 border-t border-slate-200 dark:border-slate-700 mt-4">
                      <div className="pt-4 space-y-3">
                        {event.description && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{event.description}</p>
                          </div>
                        )}
                        {event.location && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{event.location}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Created</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {formatDate(event.created_at)}
                            </p>
                          </div>
                          {event.completedAt && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Completed</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                {formatDate(event.completedAt)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ArchivedEventsPage;
