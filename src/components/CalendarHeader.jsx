import React from 'react';
import { Home, Settings, LogOut } from 'lucide-react';

export default function CalendarHeader({ userName }) {
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