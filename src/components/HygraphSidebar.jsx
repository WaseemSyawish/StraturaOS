import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Home, Calendar, CheckSquare, BarChart3, Users, 
  Clock, Archive, Timer, BookOpen, Settings, FileText,
  Menu, X
} from 'lucide-react';
import TopNavbar from './TopNavbar';

// StraturaOS Logo SVG Component
const StraturaLogo = ({ size = 24, color = "gradient" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {color === "gradient" && (
      <defs>
        <linearGradient id="logoGradientSidebar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3730A3"/>
          <stop offset="50%" stopColor="#4F46E5"/>
          <stop offset="100%" stopColor="#6366F1"/>
        </linearGradient>
      </defs>
    )}
    <g transform="translate(0,64) scale(0.1,-0.1)" fill={color === "gradient" ? "url(#logoGradientSidebar)" : color}>
      <path d="M169 567 c-75 -40 -144 -78 -153 -86 -13 -11 -16 -36 -16 -160 0 -80 4 -151 8 -157 4 -6 76 -46 160 -89 l154 -79 145 74 c80 41 152 80 159 88 20 20 20 305 0 324 -19 19 -291 158 -307 157 -8 0 -75 -33 -150 -72z m271 -74 l110 -58 0 -67 c0 -40 -4 -68 -10 -68 -6 0 -56 23 -112 51 l-102 51 28 23 28 22 -31 12 c-27 12 -36 10 -100 -25 -39 -21 -71 -41 -71 -44 0 -3 81 -45 180 -92 99 -48 180 -91 179 -95 0 -4 -49 -32 -108 -62 l-108 -53 -114 58 c-107 55 -114 61 -117 92 -2 18 1 32 8 32 5 0 56 -23 112 -51 l102 -51 35 17 36 17 -148 74 -148 75 3 42 3 42 110 57 c61 32 113 57 117 58 5 0 57 -26 118 -57z"/>
    </g>
  </svg>
);

// Navigation structure
const navigationSections = [
  { 
    id: 'content',
    items: [
      { id: 'overview', label: 'Overview', icon: Home, path: '/overview' },
      { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: '/tasks' },
      { id: 'separator-before-schedule', type: 'separator' },
      { 
        id: 'schedule', 
        label: 'Schedule', 
        icon: Calendar,
        submenu: [
          { label: 'Timetable', path: '/schedule' },
          { label: 'Calendar', path: '/calendar' },
          { label: 'Setup', path: '/timetable-setup' },
        ]
      },
      { id: 'separator-after-schedule', type: 'separator' },
      { id: 'grades', label: 'Grades', icon: BarChart3, path: '/grades' },
      { id: 'attendance', label: 'Attendance', icon: Users, path: '/attendance' },
      { id: 'modules', label: 'Modules', icon: BookOpen, path: '/modules' },
      { id: 'separator-before-tools', type: 'separator' },
    ]
  },
  {
    id: 'tools',
    items: [
      { id: 'focus', label: 'Focus', icon: Timer, path: '/focus' },
      { id: 'sessions', label: 'Sessions', icon: Clock, path: '/sessions' },
      { id: 'history', label: 'History', icon: Archive, path: '/history' },
    ]
  }
];

export default function HygraphSidebar({ children, pageName, pageActions }) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [userName, setUserName] = useState('');
  const [avatarColor, setAvatarColor] = useState('#7c3aed');
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    // Single API call now returns all user data including avatar info
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.name) setUserName(data.name);
        if (data?.avatarColor) setAvatarColor(data.avatarColor);
        if (data?.avatarUrl) setAvatarUrl(data.avatarUrl);
      })
      .catch(() => {});
  }, []);

  const isActivePath = (path) => router.pathname === path;
  
  // Mobile navigation items
  const mobileNavItems = [
    { id: 'overview', label: 'Home', icon: Home, path: '/overview' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { id: 'schedule', label: 'Schedule', icon: Calendar, path: '/schedule' },
    { id: 'focus', label: 'Focus', icon: Timer, path: '/focus' },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Navbar */}
      <TopNavbar 
        onToggleSidebar={() => setIsExpanded(!isExpanded)} 
        userName={userName} 
        avatarColor={avatarColor}
        avatarUrl={avatarUrl}
        pageName={pageName}
        pageActions={pageActions}
      />
      
      {/* Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
      {/* Left Icon Sidebar - Hidden on mobile and when expanded sidebar is open */}
      <div className={`${isExpanded ? 'w-0 overflow-hidden' : 'w-16'} hidden md:flex bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex-col flex-shrink-0 transition-all duration-300`}>
        {/* Top spacing */}
        <div className="h-2"></div>

        {/* Navigation Icons - Always visible */}
        <div className="flex-1 overflow-y-auto">
          {navigationSections.map((section, sectionIdx) => (
            <React.Fragment key={section.id}>
              <div className="flex flex-col items-center gap-0.5 py-3 px-2">
                {section.items.map((item) => {
                  // Skip separators in collapsed sidebar
                  if (item.type === 'separator') {
                    return null;
                  }
                  
                  const Icon = item.icon;
                  const active = item.path && isActivePath(item.path);
                  const hasSubmenuActive = item.submenu?.some(sub => isActivePath(sub.path));
                  const isItemActive = active || hasSubmenuActive;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        const targetPath = item.id === 'schedule' ? '/schedule' : item.path;
                        if (targetPath) router.push(targetPath);
                      }}
                      className={`
                        w-full h-10 rounded-lg flex items-center justify-center relative
                        transition-all duration-200
                        ${isItemActive
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                        }
                      `}
                      title={item.label}
                    >
                      <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                      {isItemActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-slate-900 dark:bg-white rounded-r-full" />
                      )}
                    </button>
                  );
                })}
              </div>
              {sectionIdx < navigationSections.length - 1 && (
                <div className="mx-auto w-6 h-px bg-slate-200 dark:bg-slate-800" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Bottom: Settings + Profile */}
        <div className="mt-auto border-t border-slate-200/50 dark:border-slate-800 pt-2 pb-3 px-2 flex flex-col items-center gap-2">
          <button
            onClick={() => router.push('/settings')}
            className={`
              w-full h-10 rounded-lg flex items-center justify-center relative
              transition-all duration-200
              ${isActivePath('/settings')
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
              }
            `}
            title="Settings"
          >
            <Settings className="w-[18px] h-[18px]" strokeWidth={2} />
            {isActivePath('/settings') && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-slate-900 dark:bg-white rounded-r-full" />
            )}
          </button>

          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm hover:opacity-90 transition-all"
            style={{ backgroundColor: avatarColor }}
            title={userName || 'Profile'}
            onClick={() => router.push('/profile')}
          >
            {(userName || 'U').charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      {/* Overlay to close expanded sidebar */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Expandable Navigation Panel - Hygraph Style */}
      <div
        className={`
          fixed md:relative inset-y-0 left-0 md:inset-auto
          bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800
          transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 z-40
          ${isExpanded ? 'w-64' : 'w-0'}
        `}
      >
        {isExpanded && (
          <div className="w-64 h-full flex flex-col overflow-y-auto pb-20 md:pb-0">
            {/* Header */}
            <div className="px-4 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <StraturaLogo size={24} color="white" />
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">StraturaOS</div>
              </div>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 py-2 px-3">
              {navigationSections.map((section, idx) => (
                <div key={section.id} className={idx > 0 ? 'mt-8' : 'mt-2'}>
                  {/* Section label */}
                  {idx > 0 && (
                    <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                      {section.id === 'tools' ? 'Tools' : 'General'}
                    </div>
                  )}
                  
                  <nav className="space-y-1">
                    {section.items.map((item) => {
                      // Render separator
                      if (item.type === 'separator') {
                        return (
                          <div key={item.id} className="my-3 mx-3 h-px bg-slate-200 dark:bg-slate-800" />
                        );
                      }
                      
                      const hasSubmenu = item.submenu && item.submenu.length > 0;
                      const isItemActive = item.path && isActivePath(item.path);
                      const Icon = item.icon;
                      
                      if (hasSubmenu) {
                        return (
                          <div key={item.id} className="mb-3">
                            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-2">
                              <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                              {item.label}
                            </div>
                            <div className="mt-1 space-y-0.5">
                              {item.submenu.map((subItem) => {
                                const active = isActivePath(subItem.path);
                                return (
                                  <Link key={subItem.path} href={subItem.path}>
                                    <div
                                      className={`
                                        px-3 py-2 rounded-lg text-sm font-medium cursor-pointer
                                        transition-all duration-150 flex items-center gap-2
                                        ${active
                                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }
                                      `}
                                    >
                                      <span className="flex-1">{subItem.label}</span>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <Link key={item.id} href={item.path}>
                          <div
                            className={`
                              px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer
                              transition-all duration-150 flex items-center gap-3
                              ${isItemActive
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }
                            `}
                          >
                            <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                            <span className="flex-1">{item.label}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>

            {/* Bottom Section */}
            <div className="border-t border-slate-200/50 dark:border-slate-800 p-3 space-y-1">
              <Link href="/settings">
                <div className={`
                  px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer
                  transition-all duration-150 flex items-center gap-3
                  ${isActivePath('/settings')
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }
                `}>
                  <Settings className="w-[18px] h-[18px]" strokeWidth={2} />
                  <span>Settings</span>
                </div>
              </Link>
              
              <Link href="/profile">
                <div className="px-3 py-2 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {(userName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{userName || 'User'}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">View Profile</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path && isActivePath(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else if (item.path) {
                    router.push(item.path);
                  }
                }}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive 
                    ? 'text-purple-600 dark:text-purple-400' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
