import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Video, Users, ExternalLink, CalendarOff, Clock } from 'lucide-react';
import { fadeIn, cardHover, staggerContainer, staggerItem } from '@/utils/animations';

/**
 * Today's Schedule Component
 * Timeline view of today's events with time badges and platform icons
 */
export default function TodaysSchedule({ events, currentDate, onViewDetails }) {
  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDateDisplay = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getEventTypeColor = (type) => {
    const colors = {
      lecture: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      lab: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      tutorial: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      meeting: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      exam: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    };
    return colors[type?.toLowerCase()] || colors.default;
  };

  const getPlatformIcon = (platform) => {
    // Simple platform detection from meeting links or platform field
    if (!platform) return null;
    const p = platform.toLowerCase();
    if (p.includes('zoom')) return { name: 'Zoom', color: 'text-blue-500' };
    if (p.includes('meet') || p.includes('google')) return { name: 'Google Meet', color: 'text-green-500' };
    if (p.includes('teams')) return { name: 'Teams', color: 'text-purple-500' };
    return { name: 'Online', color: 'text-gray-500' };
  };

  // Filter events for today
  const todayEvents = events
    .filter(event => {
      if (!event.startTime) return false;
      const eventDate = new Date(event.startTime);
      const today = currentDate || new Date();
      return eventDate.toDateString() === today.toDateString();
    })
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-purple-600 dark:bg-purple-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Clock className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Today's Schedule
              </h3>
              <p className="text-xs text-purple-100 mt-0.5">
                {formatDateDisplay(currentDate || new Date())}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
      {/* Event list */}
      {todayEvents.length === 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="py-16 text-center"
        >
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
            <CalendarOff className="w-7 h-7 text-gray-400 dark:text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            No classes today
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Enjoy your free day!
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {todayEvents.map((event, index) => {
            const typeColor = getEventTypeColor(event.type);
            const platform = getPlatformIcon(event.platform || event.location);

            return (
              <motion.div
                key={event.id || index}
                variants={staggerItem}
                whileHover="hover"
              >
                <motion.div
                  variants={cardHover}
                  className="relative pl-16 pr-4 py-3 rounded-xl border border-gray-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800/50 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  onClick={() => onViewDetails?.(event)}
                >
                  {/* Timeline dot and line */}
                  <div className="absolute left-4 top-0 bottom-0 flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-5 z-10"></div>
                    {index < todayEvents.length - 1 && (
                      <div className="flex-1 w-px bg-gray-200 dark:bg-slate-700 mt-1"></div>
                    )}
                  </div>

                  {/* Time badge */}
                  <div className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700/50 mb-2">
                    {formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 mr-3">
                      {/* Event title */}
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                        {event.title || event.name || 'Untitled Event'}
                      </h4>
                      
                      {/* Location/Platform */}
                      {(event.location || event.platform) && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          {platform ? (
                            <>
                              <Video className="w-3.5 h-3.5" />
                              <span>{platform.name}</span>
                            </>
                          ) : (
                            <span>{event.location}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* View detail link */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails?.(event);
                      }}
                      className="group flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
      </div>
    </div>
  );
}
