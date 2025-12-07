/**
 * AppShell - Main app container matching landing/auth design language
 * Provides the consistent dark background and layout wrapper for all authenticated pages
 * 
 * Usage:
 * <AppShell>
 *   <PageHeader ... />
 *   <div className="grid ...">
 *     <StatCard ... />
 *     <SectionCard ... />
 *   </div>
 * </AppShell>
 */
import React from 'react';

export function AppShell({ 
  children, 
  className = '',
  maxWidth = '7xl' // '6xl', '7xl', 'full'
}) {
  const maxWidthClass = {
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full',
  }[maxWidth] || 'max-w-7xl';

  return (
    <div 
      className={`
        min-h-screen
        bg-[#0a0a0f]
        text-white
      `}
      style={{
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${className}`}>
        {children}
      </div>
    </div>
  );
}

export default AppShell;
