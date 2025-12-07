/**
 * SectionCard - Content card component matching landing/auth design language
 * 
 * Usage:
 * <SectionCard
 *   title="Today's Schedule"
 *   subtitle="4 upcoming events"
 *   icon={Calendar}
 *   action={<button>View All</button>}
 * >
 *   {children}
 * </SectionCard>
 */
import React from 'react';

export function SectionCard({ 
  title, 
  subtitle,
  icon: Icon,
  action,
  badge,
  noPadding = false,
  className = '',
  children 
}) {
  return (
    <div className={`
      bg-[#12121a] rounded-2xl 
      border border-white/5
      overflow-hidden
      ${className}
    `}>
      {/* Header */}
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-purple-400" strokeWidth={2} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{title}</h3>
                {badge && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
          {action && (
            <div className="flex items-center">
              {action}
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
    </div>
  );
}

export default SectionCard;
