"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { parseDatePreserveLocal } from "@/lib/dateHelpers";
import { ChevronLeft, ChevronRight, Calendar, Sparkles, Clock, X } from "lucide-react";
import { useScheduler } from "@/providers/schedular-provider";
import { useModal } from "@/providers/modal-context";
import UnifiedEventModal from "../../../_modals/unified-event-modal";
import { Event, CustomEventModal } from "@/types";

// Premium gradient color palette
const EVENT_COLORS: Record<string, { 
  gradient: string; 
  bg: string; 
  text: string;
  dot: string;
  glow: string;
}> = {
  purple: { 
    gradient: "bg-gradient-to-r from-purple-500 to-violet-600", 
    bg: "bg-purple-500/10 hover:bg-purple-500/20 dark:bg-purple-500/20 dark:hover:bg-purple-500/30", 
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
    glow: "shadow-purple-500/20"
  },
  blue: { 
    gradient: "bg-gradient-to-r from-blue-500 to-cyan-500", 
    bg: "bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-500/20 dark:hover:bg-blue-500/30", 
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    glow: "shadow-blue-500/20"
  },
  green: { 
    gradient: "bg-gradient-to-r from-emerald-500 to-teal-500", 
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30", 
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    glow: "shadow-emerald-500/20"
  },
  red: { 
    gradient: "bg-gradient-to-r from-rose-500 to-pink-600", 
    bg: "bg-rose-500/10 hover:bg-rose-500/20 dark:bg-rose-500/20 dark:hover:bg-rose-500/30", 
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
    glow: "shadow-rose-500/20"
  },
  orange: { 
    gradient: "bg-gradient-to-r from-orange-500 to-amber-500", 
    bg: "bg-orange-500/10 hover:bg-orange-500/20 dark:bg-orange-500/20 dark:hover:bg-orange-500/30", 
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
    glow: "shadow-orange-500/20"
  },
  pink: { 
    gradient: "bg-gradient-to-r from-pink-500 to-fuchsia-500", 
    bg: "bg-pink-500/10 hover:bg-pink-500/20 dark:bg-pink-500/20 dark:hover:bg-pink-500/30", 
    text: "text-pink-700 dark:text-pink-300",
    dot: "bg-pink-500",
    glow: "shadow-pink-500/20"
  },
  teal: { 
    gradient: "bg-gradient-to-r from-teal-500 to-cyan-500", 
    bg: "bg-teal-500/10 hover:bg-teal-500/20 dark:bg-teal-500/20 dark:hover:bg-teal-500/30", 
    text: "text-teal-700 dark:text-teal-300",
    dot: "bg-teal-500",
    glow: "shadow-teal-500/20"
  },
  amber: { 
    gradient: "bg-gradient-to-r from-amber-500 to-yellow-500", 
    bg: "bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:hover:bg-amber-500/30", 
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    glow: "shadow-amber-500/20"
  },
};

const getEventColorClasses = (color: string | undefined) => {
  const key = color?.toLowerCase() || "purple";
  return EVENT_COLORS[key] || EVENT_COLORS.purple;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ModernMonthViewProps {
  CustomEventModal?: CustomEventModal;
  isSchedulePage?: boolean;
  onEventClick?: (event: Event) => void;
  onDayClick?: (date: Date) => void;
}

export default function ModernMonthView({
  CustomEventModal: CustomEventModalProp,
  isSchedulePage = true,
  onEventClick,
  onDayClick,
}: ModernMonthViewProps) {
  const { getters, handlers, weekStartsOn: rawWeekStartsOn = 0 } = useScheduler();
  const weekStartsOn = typeof rawWeekStartsOn === 'number' ? rawWeekStartsOn : 0;
  const { setOpen } = useModal();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Get calendar grid
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Calculate start offset based on week start
    const startOffset = (firstDayOfWeek - weekStartsOn + 7) % 7;
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const grid: Array<{
      date: Date;
      day: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];
    
    const today = new Date();
    
    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      grid.push({
        date: new Date(year, month - 1, d),
        day: d,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      grid.push({
        date,
        day: d,
        isCurrentMonth: true,
        isToday:
          d === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear(),
      });
    }
    
    // Next month days to fill grid (6 rows max)
    const remainingSlots = 42 - grid.length; // 6 weeks * 7 days
    for (let d = 1; d <= remainingSlots && grid.length < 42; d++) {
      grid.push({
        date: new Date(year, month + 1, d),
        day: d,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    return grid;
  }, [currentDate, weekStartsOn]);

  // Get events for each day
  const eventsByDay = useMemo(() => {
    const map: Record<string, Event[]> = {};
    
    calendarGrid.forEach(({ date }) => {
      const key = date.toISOString().split("T")[0];
      const events = getters.getEventsForDay(date.getDate(), date) as Event[] | undefined;
      map[key] = events || [];
    });
    
    return map;
  }, [calendarGrid, getters]);

  // Navigation
  const goToPrevMonth = useCallback(() => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setExpandedDay(null);
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setExpandedDay(null);
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
    setExpandedDay(null);
  }, []);

  // Handle day click
  const handleDayClick = useCallback(
    (date: Date, dayIndex: number) => {
      if (onDayClick) {
        onDayClick(date);
      } else {
        setExpandedDay(expandedDay === dayIndex ? null : dayIndex);
      }
    },
    [onDayClick, expandedDay]
  );



  // Weekday headers adjusted for week start
  const weekdayHeaders = useMemo(() => {
    const headers = [];
    for (let i = 0; i < 7; i++) {
      headers.push(WEEKDAYS[(i + weekStartsOn) % 7]);
    }
    return headers;
  }, [weekStartsOn]);

  // Header month/year
  const headerText = useMemo(() => {
    return currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [currentDate]);

  // Check if current month contains today
  const containsToday = useMemo(() => {
    const today = new Date();
    return (
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  }, [currentDate]);

  // Count events in current month
  const monthEventCount = useMemo(() => {
    return calendarGrid
      .filter((c) => c.isCurrentMonth)
      .reduce((acc, c) => acc + (eventsByDay[c.date.toISOString().split("T")[0]]?.length || 0), 0);
  }, [calendarGrid, eventsByDay]);

  return (
    <div className="flex flex-col bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800/50 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-black/20">
      {/* Header - Premium styling */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-slate-800/50 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50">
        <div className="flex items-center gap-4">
          {/* Navigation buttons with premium hover */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 hover:shadow-md group"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 hover:shadow-md group"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {headerText}
              </h2>
              {containsToday && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  This month
                </span>
              )}
            </div>
          </div>
        </div>

        {!containsToday && (
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all duration-200 hover:shadow-md"
          >
            Go to Today
          </button>
        )}
      </div>

      {/* Weekday Headers - Premium */}
      <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
        {weekdayHeaders.map((day, idx) => (
          <div
            key={day}
            className={cn(
              "py-3 text-center text-xs font-semibold uppercase tracking-wider",
              "text-slate-500 dark:text-slate-400",
              idx > 0 && "border-l border-slate-200 dark:border-slate-700",
              (idx === 0 || idx === 6) && "text-slate-500/80 dark:text-slate-500"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid - Premium */}
      <div className="grid grid-cols-7 bg-white dark:bg-slate-950">
        {calendarGrid.map((cell, idx) => {
          const key = cell.date.toISOString().split("T")[0];
          const dayEvents = eventsByDay[key] || [];
          const isExpanded = expandedDay === idx;
          const displayEvents = isExpanded ? dayEvents : dayEvents.slice(0, 2);
          const moreCount = dayEvents.length - 2;
          const isWeekend = (idx % 7 === 0) || (idx % 7 === 6);

          return (
            <div
              key={idx}
              className={cn(
                "min-h-[110px] p-2 border-t border-l border-slate-200 dark:border-slate-700 relative group",
                "transition-all duration-200",
                !cell.isCurrentMonth && "bg-slate-50/80 dark:bg-slate-900/80",
                cell.isToday && "bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/10",
                idx % 7 === 0 && "border-l-0",
                isExpanded && "bg-slate-50 dark:bg-slate-800/50 z-10 shadow-lg",
                isWeekend && cell.isCurrentMonth && !cell.isToday && "bg-slate-50/50 dark:bg-slate-900/30"
              )}
            >
              {/* Day number and add button */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => handleDayClick(cell.date, idx)}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-xl text-sm font-semibold",
                    "transition-all duration-200",
                    cell.isToday
                      ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105"
                      : cell.isCurrentMonth
                      ? "text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      : "text-slate-400 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  {cell.day}
                </button>


              </div>

              {/* Events list - Google Calendar style pills */}
              <div className="space-y-1">
                {displayEvents.map((event) => {
                  // Color priority: course.color → event.color → variant → default
                  const courseColor = (event as any).courses?.color;
                  const colorKey = courseColor || event.color || (event as any).variant || 'blue';
                  const startDate = parseDatePreserveLocal(event.startDate) || new Date(String(event.startDate));
                  const timeStr = startDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  
                  // Hex color mapping - Google Calendar palette
                  const hexColors: Record<string, string> = {
                    purple: '#9333EA', blue: '#4285F4', green: '#0F9D58', emerald: '#0F9D58',
                    red: '#DB4437', rose: '#E91E63', orange: '#F4511E', amber: '#F09300',
                    pink: '#E91E63', cyan: '#00ACC1', teal: '#009688', yellow: '#F6BF26',
                    indigo: '#3F51B5', slate: '#607D8B', gray: '#616161'
                  };
                  // Support both hex strings directly and named colors
                  const hex = colorKey.startsWith('#') ? colorKey : (hexColors[colorKey.toLowerCase()] || hexColors.blue);

                  return (
                    <button
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEventClick) {
                          onEventClick(event);
                        } else {
                          setSelectedEvent(event);
                        }
                      }}
                      className="w-full text-left px-2 py-1 rounded-md text-[11px] truncate"
                      style={{
                        backgroundColor: hex,
                        color: 'white',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(0.92)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
                      }}
                      title={`${event.title} at ${timeStr}`}
                    >
                      <span className="font-medium truncate">
                        {event.title}
                      </span>
                    </button>
                  );
                })}

                {/* More events indicator - Premium */}
                {!isExpanded && moreCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDay(idx);
                    }}
                    className="w-full text-left px-2 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all duration-200"
                  >
                    +{moreCount} more
                  </button>
                )}

                {/* Collapse button when expanded - Premium */}
                {isExpanded && dayEvents.length > 2 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDay(null);
                    }}
                    className="w-full text-left px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Collapse
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer - Premium */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/50 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {monthEventCount === 0
              ? "No events this month"
              : `${monthEventCount} event${monthEventCount > 1 ? "s" : ""} this month`}
          </p>
          {monthEventCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {Object.values(eventsByDay).flat().slice(0, 5).map((e, i) => {
                  const c = getEventColorClasses(e.color || (e as any).variant);
                  return (
                    <div key={i} className={cn("w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-950", c.dot)} />
                  );
                })}
              </div>
              {monthEventCount > 5 && (
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  +{monthEventCount - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <UnifiedEventModal
          event={selectedEvent}
          mode="view"
          onClose={() => setSelectedEvent(null)}
          onEdit={(event) => {
            setSelectedEvent(null);
            setTimeout(() => setSelectedEvent(event), 50);
          }}
          onSave={async (eventData) => {
            if (handlers?.handleUpdateEvent) {
              await handlers.handleUpdateEvent(eventData, eventData.id);
            } else {
              await fetch(`/api/events/${encodeURIComponent(eventData.id)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData),
              });
            }
          }}
          onDelete={async (event) => {
            if (handlers?.handleDeleteEvent) {
              await handlers.handleDeleteEvent(event.id);
            }
          }}
        />
      )}
    </div>
  );
}
