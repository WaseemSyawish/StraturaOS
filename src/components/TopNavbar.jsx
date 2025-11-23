import React from 'react';
import { useRouter } from 'next/router';
import { Menu, Search, Bell, User } from 'lucide-react';

export default function TopNavbar({ onToggleSidebar, userName, pageName, pageActions }) {
  const router = useRouter();
  
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 flex-shrink-0">
      {/* Left: Menu button and Page Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" strokeWidth={2} />
        </button>
        {pageName && (
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{pageName}</h1>
        )}
      </div>

      {/* Right: Page Actions, Notifications, User, Settings, Sign Out */}
      <div className="flex items-center gap-2">
        {/* Page-specific actions */}
        {pageActions && (
          <>
            {pageActions}
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
          </>
        )}

        {/* Notifications */}
        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" strokeWidth={2} />
        </button>

        {/* User Profile */}
        <button
          onClick={() => router.push('/profile')}
          className="w-9 h-9 rounded-full bg-slate-700 dark:bg-slate-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm hover:bg-slate-800 dark:hover:bg-slate-500 transition-all border border-slate-600 dark:border-slate-500"
          title={userName || 'Profile'}
        >
          {(userName || 'U').charAt(0).toUpperCase()}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => router.push('/settings')}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Sign Out Button */}
        <button
          onClick={() => router.push('/signout')}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          title="Sign Out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
