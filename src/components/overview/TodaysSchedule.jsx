import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Video, Users, ExternalLink, CalendarOff, Clock, GraduationCap } from 'lucide-react';
import { fadeIn, cardHover, staggerContainer, staggerItem } from '@/utils/animations';

/**
 * Today's Schedule Component
 * Timeline view of today's events with time badges and platform icons
 */
export default function TodaysSchedule({ events, currentDate, onViewDetails }) {
  const formatTime = (dateOrTime, fallbackDate) => {
    if (!dateOrTime) return '';
    // If it's a HH:MM string
    if (/^\d{1,2}:\d{2}$/.test(String(dateOrTime))) {
      return String(dateOrTime);
    }
    // If it's a Date/ISO string
    const d = new Date(dateOrTime);
    if (!isNaN(d.getTime())) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    // Fallback: try building from fallbackDate + time string
    if (fallbackDate && /^\d{1,2}:\d{2}$/.test(String(dateOrTime))) {
      try {
        const fd = new Date(fallbackDate);
        const m = String(dateOrTime).match(/(\d{1,2}):(\d{2})/);
        if (m) {
          fd.setHours(Number(m[1]), Number(m[2]), 0, 0);
          return fd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
      } catch (e) {}
    }
    return '';
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

  const getCourseCode = (event) => {
    try {
      if (!event) return null;
      if (event.meta && (event.meta.course || event.meta.courseCode)) return String(event.meta.course || event.meta.courseCode);
      if (event.course) return String(event.course);
      if (event.code) return String(event.code);
      // try common fields
      if (event.title) {
        const m = String(event.title).match(/([A-Z]{2,4}\s?-?\d{3,4})/);
        if (m) return m[1].replace(/\s+/, '');
      }
      if (event.name) {
        const m = String(event.name).match(/([A-Z]{2,4}\s?-?\d{3,4})/);
        if (m) return m[1].replace(/\s+/, '');
      }
      return null;
    } catch (e) { return null; }
  };

  // Filter events for today (support multiple event time formats)
  const todayEvents = (events || [])
    .map((event) => {
      // Determine a start timestamp for sorting and date comparison
      let startTs = null;
      let startRaw = null;
      try {
        if (event.startTime) {
          startRaw = event.startTime;
          const d = new Date(event.startTime);
          if (!isNaN(d.getTime())) startTs = d.getTime();
        } else if (event.startDate) {
          startRaw = event.startDate;
          const d = new Date(event.startDate);
          if (!isNaN(d.getTime())) startTs = d.getTime();
        } else if (event.date) {
          startRaw = event.date;
          const d = new Date(event.date);
          if (!isNaN(d.getTime())) startTs = d.getTime();
        } else if (event.time) {
          // time like '08:30' - attach to currentDate for comparison
          startRaw = event.time;
          if (currentDate) {
            const d = new Date(currentDate);
            const m = String(event.time).match(/(\d{1,2}):(\d{2})/);
            if (m) {
              d.setHours(Number(m[1]), Number(m[2]), 0, 0);
              startTs = d.getTime();
            }
          } else {
            // fallback to today
            const d = new Date();
            const m = String(event.time).match(/(\d{1,2}):(\d{2})/);
            if (m) {
              d.setHours(Number(m[1]), Number(m[2]), 0, 0);
              startTs = d.getTime();
            }
          }
        }
      } catch (e) {}

      return { __raw: event, __startTs: startTs, __startRaw: startRaw };
    })
    .filter(item => {
      const event = item.__raw;
      const startTs = item.__startTs;
      // If we couldn't determine a start timestamp, exclude
      if (!startTs) return false;
      const eventDate = new Date(startTs);
      const today = currentDate || new Date();
      return eventDate.toDateString() === today.toDateString();
    })
    .sort((a, b) => (a.__startTs || 0) - (b.__startTs || 0))
    .map(item => item.__raw);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
      {/* Consistent header styling */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Today's Schedule
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDateDisplay(currentDate || new Date())}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
      {/* Event list */}
      {todayEvents.length === 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="py-12 text-center"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <CalendarOff className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
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
          className="space-y-2"
        >
          {todayEvents.map((event, index) => {
            const typeColor = getEventTypeColor(event.type);
            const platform = getPlatformIcon(event.platform || event.location);
            const courseCode = getCourseCode(event);

            return (
              <motion.div key={event.id || index} variants={staggerItem} whileHover="hover">
                <motion.div
                  variants={cardHover}
                  className="relative pr-3 py-2.5 rounded-xl border border-gray-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800/50 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  onClick={() => onViewDetails?.(event)}
                >
                  <div className="flex items-center gap-3">
                    {/* Left icon square */}
                    <div className="ml-3 flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-600 dark:bg-indigo-500 text-white">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-3 mb-1">
                        {courseCode && (
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold text-white bg-purple-600 dark:bg-purple-500">
                            {courseCode}
                          </span>
                        )}
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {event.title || event.name || 'Untitled Event'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        {(() => {
                          // Check if the event has an explicit time set
                          const hasTime = event.meta?.hasTime !== false && (
                            event.time || 
                            event.meta?.hasTime === true ||
                            // Check if startDate/time is not midnight (00:00)
                            (() => {
                              const startVal = event.startTime || event.startDate || event.date || event.time;
                              if (!startVal) return false;
                              const d = new Date(startVal);
                              if (isNaN(d.getTime())) return false;
                              // If hours or minutes are non-zero, time was set
                              return d.getHours() !== 0 || d.getMinutes() !== 0;
                            })()
                          );
                          
                          if (!hasTime) {
                            return <span className="text-gray-400 dark:text-gray-500">All day</span>;
                          }
                          
                          const fallback = event.startDate || event.date || currentDate;
                          const startVal = event.startTime || event.startDate || event.date || event.time;
                          const endVal = event.endTime || event.endDate || null;
                          const startDisplay = formatTime(startVal, fallback);
                          const endDisplay = endVal ? formatTime(endVal, fallback) : null;
                          return (<>{startDisplay}{endDisplay ? ` • ${endDisplay}` : ''}</>);
                        })()}
                      </div>
                    </div>

                    {/* View detail link */}
                    <div className="flex-shrink-0 pr-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); onViewDetails?.(event); }}
                        className="group flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
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
