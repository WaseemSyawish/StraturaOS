/**
 * EventItem - Event/task list item matching landing/auth design language
 * 
 * Usage:
 * <EventItem
 *   title="Data Structures Lecture"
 *   time="Today, 10:00 AM"
 *   type="Class"
 *   color="#9333EA"
 * />
 */
import React from 'react';

export function EventItem({ 
  title, 
  time,
  type,
  location,
  color = '#9333EA',
  onClick,
  className = '' 
}) {
  return (
    <div 
      onClick={onClick}
      className={`
        flex items-center gap-3.5 
        p-3.5 
        bg-white/[0.03] 
        rounded-xl 
        border border-white/5
        hover:bg-white/[0.05]
        hover:border-white/10
        transition-all duration-150
        cursor-pointer
        ${className}
      `}
    >
      {/* Color bar */}
      <div 
        className="w-1 h-10 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">
          {title}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {time}
          {location && ` • ${location}`}
        </div>
      </div>
      
      {/* Type badge */}
      {type && (
        <span 
          className="text-xs font-semibold px-2 py-1 rounded-md flex-shrink-0"
          style={{ 
            color: color,
            backgroundColor: `${color}15`,
          }}
        >
          {type}
        </span>
      )}
    </div>
  );
}

export default EventItem;
