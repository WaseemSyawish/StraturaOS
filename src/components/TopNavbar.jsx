import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Menu, Search, Bell, User, AlertTriangle } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function TopNavbar({ onToggleSidebar, userName, avatarColor = '#7c3aed', pageName, pageActions }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [overdueNotifications, setOverdueNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch notification count on mount and periodically
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchNotifications = async () => {
      try {
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Fetch upcoming task reminders
        const tasksRes = await fetch('/api/tasks/search');
        const tasks = await tasksRes.json();
        
        // Fetch upcoming assessment deadlines
        const assessmentsRes = await fetch('/api/assessments');
        const assessments = await assessmentsRes.json();

        const notificationsList = [];
        const overdueList = [];

        // Add tasks with reminders in next 24 hours or overdue
        if (Array.isArray(tasks)) {
          tasks.forEach(task => {
            if (!task.dueDate && !task.reminder) return;
            if (task.completed) return; // Skip completed tasks
            
            const taskDate = new Date(task.dueDate || task.reminder);
            const isOverdue = taskDate < now;
            const daysOverdue = isOverdue ? Math.ceil((now - taskDate) / (1000 * 60 * 60 * 24)) : 0;
            
            if (isOverdue) {
              // Overdue task
              overdueList.push({
                type: 'overdue',
                title: task.title,
                dueDate: task.dueDate || task.reminder,
                priority: task.priority || 'not-urgent-not-important',
                id: task.id,
                daysOverdue
              });
            } else if (taskDate <= next24Hours) {
              // Due soon
              notificationsList.push({
                type: 'task',
                title: task.title,
                dueDate: task.reminder || task.dueDate,
                priority: task.priority || 'not-urgent-not-important',
                id: task.id
              });
            }
          });
        }

        // Add assessments due in next 7 days
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (Array.isArray(assessments)) {
          assessments.filter(assessment => {
            if (!assessment.dueDate) return false;
            const dueDate = new Date(assessment.dueDate);
            return dueDate >= now && dueDate <= next7Days;
          }).forEach(assessment => {
            notificationsList.push({
              type: 'assessment',
              title: assessment.title || assessment.name,
              dueDate: assessment.dueDate,
              courseName: assessment.courseName,
              id: assessment.id
            });
          });
        }

        // Sort overdue by most overdue first
        overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue);

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
                                {new Date(notif.dueDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
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

        {/* Settings Button */}
        <button
          onClick={() => router.push('/settings')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
          title="Settings"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Separator between tools and account */}
        <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

        {/* User Profile Avatar */}
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm border border-white/20 cursor-default"
          style={{ backgroundColor: avatarColor }}
          title={userName || 'User'}
        >
          {(userName || 'U').charAt(0).toUpperCase()}
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
