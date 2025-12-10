import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Menu, Search, Bell, User, AlertTriangle, X, CheckCircle2, Calendar, FileText, Clock } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function TopNavbar({ onToggleSidebar, userName, avatarColor = '#7c3aed', avatarUrl, pageName, pageActions }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [overdueNotifications, setOverdueNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Global search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ tasks: [], events: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Fetch notification count on mount and periodically
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchNotifications = async () => {
      try {
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const notificationsList = [];
        const overdueList = [];

        // Fetch events (which include tasks/deadlines)
        try {
          const eventsRes = await fetch('/api/events');
          const events = await eventsRes.json();
          
          if (Array.isArray(events)) {
            const deadlineTypes = ['deadline', 'assignment', 'project', 'quiz', 'exam', 'test', 'assessment', 'homework', 'task'];
            
            events.forEach(event => {
              const eventType = (event.type || '').toLowerCase();
              if (!deadlineTypes.includes(eventType)) return;
              if (event.completed) return;
              
              const dueDate = event.date || event.startDate || event.endDate || event.end_date;
              if (!dueDate) return;
              
              const eventDate = new Date(dueDate);
              if (isNaN(eventDate.getTime())) return;
              
              const isOverdue = eventDate < now;
              const daysOverdue = isOverdue ? Math.ceil((now - eventDate) / (1000 * 60 * 60 * 24)) : 0;
              
              if (isOverdue) {
                overdueList.push({
                  type: 'overdue',
                  title: event.title || 'Untitled',
                  dueDate: dueDate,
                  priority: event.meta?.priority || 'not-urgent-not-important',
                  id: event.id,
                  daysOverdue,
                  eventType: eventType,
                  hasTime: event.meta?.hasTime === true,
                  time: event.time || null
                });
              } else if (eventDate <= next7Days) {
                notificationsList.push({
                  type: 'event',
                  title: event.title || 'Untitled',
                  dueDate: dueDate,
                  priority: event.meta?.priority || 'not-urgent-not-important',
                  id: event.id,
                  courseName: event.courses?.name || event.course || '',
                  eventType: eventType,
                  hasTime: event.meta?.hasTime === true,
                  time: event.time || null
                });
              }
            });
          }
        } catch (e) {
          console.error('Failed to fetch events for notifications:', e);
        }

        // Also fetch tasks if available
        try {
          const tasksRes = await fetch('/api/tasks/search');
          if (tasksRes.ok) {
            const tasks = await tasksRes.json();
            
            if (Array.isArray(tasks)) {
              tasks.forEach(task => {
                if (!task.dueDate && !task.reminder) return;
                if (task.completed) return;
                
                const taskDate = new Date(task.dueDate || task.reminder);
                if (isNaN(taskDate.getTime())) return;
                
                const isOverdue = taskDate < now;
                const daysOverdue = isOverdue ? Math.ceil((now - taskDate) / (1000 * 60 * 60 * 24)) : 0;
                
                // Avoid duplicates with events
                const alreadyAdded = isOverdue 
                  ? overdueList.some(o => o.title === task.title && o.id !== task.id)
                  : notificationsList.some(n => n.title === task.title && n.id !== task.id);
                
                if (alreadyAdded) return;
                
                if (isOverdue) {
                  overdueList.push({
                    type: 'overdue',
                    title: task.title,
                    dueDate: task.dueDate || task.reminder,
                    priority: task.priority || 'not-urgent-not-important',
                    id: task.id,
                    daysOverdue,
                    eventType: 'task'
                  });
                } else if (taskDate <= next24Hours) {
                  notificationsList.push({
                    type: 'task',
                    title: task.title,
                    dueDate: task.reminder || task.dueDate,
                    priority: task.priority || 'not-urgent-not-important',
                    id: task.id,
                    eventType: 'task'
                  });
                }
              });
            }
          }
        } catch (e) {
          console.error('Failed to fetch tasks for notifications:', e);
        }

        // Sort overdue by most overdue first
        overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue);
        // Sort upcoming by soonest first
        notificationsList.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        setNotifications(notificationsList);
        setOverdueNotifications(overdueList);
        setNotificationCount(notificationsList.length + overdueList.length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [session]);
  
  // Global search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ tasks: [], events: [] });
      return;
    }
    
    // Debounce search
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        // Search tasks - fetch all and filter client-side
        const tasksRes = await fetch(`/api/tasks`);
        const tasksData = await tasksRes.json();
        const allTasks = tasksData.tasks || tasksData || [];
        const filteredTasks = Array.isArray(allTasks) 
          ? allTasks.filter(t => t.title?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
          : [];
        
        // Search events 
        const eventsRes = await fetch(`/api/events`);
        const events = await eventsRes.json();
        const filteredEvents = Array.isArray(events)
          ? events.filter(e => e.title?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
          : [];
        
        setSearchResults({
          tasks: filteredTasks,
          events: filteredEvents
        });
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults({ tasks: [], events: [] });
      }
      setSearchLoading(false);
    }, 300);
  }, [searchQuery]);
  
  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <header className="h-14 sm:h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-2 sm:px-4 flex-shrink-0">
      {/* Left: Menu button and Page Name */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" strokeWidth={2} />
        </button>
        {pageName && (
          <h1 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px] sm:max-w-none">{pageName}</h1>
        )}
      </div>

      {/* Right: Page Actions, Notifications, Settings, User, Sign Out */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Page-specific actions */}
        {pageActions && (
          <>
            <div className="hidden sm:flex">{pageActions}</div>
            <div className="hidden sm:block w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
          </>
        )}

        {/* Global Search Button */}
        <button
          onClick={() => {
            setShowSearch(true);
            setTimeout(() => searchInputRef.current?.focus(), 100);
          }}
          className="group w-9 h-9 sm:w-auto sm:h-9 sm:px-3.5 rounded-xl flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 border border-transparent sm:border-slate-200 sm:dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800"
          title="Search (Ctrl+K)"
        >
          <Search className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
          <span className="hidden sm:inline text-sm font-medium">Search</span>
          <kbd className="hidden md:inline ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-600 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:border-purple-200 dark:group-hover:border-purple-800 transition-all duration-200">⌘K</kbd>
        </button>

        {/* Search Modal/Overlay */}
        {showSearch && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 animate-fade-in">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => { setShowSearch(false); setSearchQuery(''); }}
            />
            
            {/* Search Panel */}
            <div className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-search-in">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <Search className="w-5 h-5 text-purple-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks, events, courses..."
                  className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none text-sm font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all duration-150">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-600">ESC</kbd>
              </div>
              
              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto p-2">
                {searchLoading && (
                  <div className="py-8 text-center">
                    <div className="w-6 h-6 mx-auto border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                
                {!searchLoading && !searchQuery && (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                    <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Start typing to search...</p>
                  </div>
                )}
                
                {!searchLoading && searchQuery && searchResults.tasks.length === 0 && searchResults.events.length === 0 && (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                    <p className="text-sm">No results found for "{searchQuery}"</p>
                  </div>
                )}
                
                {/* Tasks Results */}
                {searchResults.tasks.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide px-2 py-1">Tasks</p>
                    {searchResults.tasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => {
                          setShowSearch(false);
                          setSearchQuery('');
                          router.push('/tasks');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left group"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${task.completed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 ${task.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                            {task.title}
                          </p>
                          {task.dueDate && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Events Results */}
                {searchResults.events.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide px-2 py-1">Events</p>
                    {searchResults.events.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => {
                          setShowSearch(false);
                          setSearchQuery('');
                          router.push('/schedule');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100 dark:bg-blue-900/30">
                          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {event.title}
                          </p>
                          {event.startDate && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(event.startDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all relative"
            title="Notifications"
          >
            <Bell className={`w-4 h-4 sm:w-5 sm:h-5 ${overdueNotifications.length > 0 ? 'text-red-500' : ''}`} strokeWidth={2} />
            {notificationCount > 0 && (
              <span className={`absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex items-center justify-center min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-1 text-white text-[9px] sm:text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-900 ${overdueNotifications.length > 0 ? 'bg-red-500' : 'bg-purple-600'}`}>
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {showNotifications && (
            <div className="fixed md:absolute inset-x-2 sm:inset-x-4 md:inset-x-auto md:right-0 top-16 sm:top-20 md:top-full md:mt-2 w-auto md:w-96 max-h-[70vh] md:max-h-[500px] overflow-y-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50">
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Notifications {notificationCount > 0 && `(${notificationCount})`}
                </h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-2">
                {/* Overdue Section */}
                {overdueNotifications.length > 0 && (
                  <div className="mb-3">
                    <div className="px-2 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg mb-1">
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Overdue ({overdueNotifications.length})
                      </p>
                    </div>
                    <div className="space-y-1">
                      {overdueNotifications.slice(0, 5).map((notif, idx) => (
                        <button
                          key={`overdue-${notif.id}-${idx}`}
                          onClick={() => {
                            setShowNotifications(false);
                            router.push('/tasks');
                          }}
                          className="w-full text-left p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group border border-red-100 dark:border-red-900/30"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                {notif.title}
                              </p>
                              <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 font-medium">
                                {notif.daysOverdue === 1 ? '1 day overdue' : `${notif.daysOverdue} days overdue`}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Section */}
                {notifications.length > 0 && (
                  <div>
                    {overdueNotifications.length > 0 && (
                      <div className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-1">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Upcoming ({notifications.length})
                        </p>
                      </div>
                    )}
                    <div className="space-y-1">
                      {notifications.map((notif, idx) => (
                        <button
                          key={`${notif.type}-${notif.id}-${idx}`}
                          onClick={() => {
                            setShowNotifications(false);
                            router.push(notif.type === 'task' ? '/tasks' : '/grades');
                          }}
                          className="w-full text-left p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                              notif.type === 'task' 
                                ? notif.priority === 'urgent-important' 
                                  ? 'bg-red-100 dark:bg-red-900/30' 
                                  : 'bg-purple-100 dark:bg-purple-900/30'
                                : 'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                              {notif.type === 'task' ? (
                                <svg className={`w-4 h-4 ${
                                  notif.priority === 'urgent-important' 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : 'text-purple-600 dark:text-purple-400'
                                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {notif.title}
                              </p>
                              {notif.courseName && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  {notif.courseName}
                                </p>
                              )}
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {notif.hasTime 
                                  ? new Date(notif.dueDate).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })
                                  : new Date(notif.dueDate).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric'
                                    })
                                }
                              </p>
                            </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  </div>
                )}

                {/* Empty State */}
                {overdueNotifications.length === 0 && notifications.length === 0 && (
                  <div className="py-12 text-center">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">All caught up!</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No overdue or upcoming tasks</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          onClick={() => router.push('/signout')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          title="Sign Out"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
