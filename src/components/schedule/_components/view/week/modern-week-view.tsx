"use client";

import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { parseDatePreserveLocal } from "@/lib/dateHelpers";
import { ChevronLeft, ChevronRight, Plus, Clock, CalendarDays, Sparkles } from "lucide-react";
import { useScheduler } from "@/providers/schedular-provider";
import { useModal } from "@/providers/modal-context";
import UnifiedEventModal from "../../../_modals/unified-event-modal";
import { Event, CustomEventModal } from "@/types";

// Constants
const HOUR_HEIGHT = 56; // pixels per hour - increased for better event visibility
const START_HOUR = 0;
const END_HOUR = 24;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
const DAYS_IN_WEEK = 7;

// Premium gradient color palette
const EVENT_COLORS: Record<string, { 
  gradient: string; 
  bg: string; 
  border: string; 
  text: string; 
  glow: string;
  dot: string;
}> = {
  purple: { 
    gradient: "bg-gradient-to-br from-purple-500 to-violet-600", 
    bg: "bg-purple-500/10 dark:bg-purple-500/20", 
    border: "border-l-purple-500", 
    text: "text-purple-900 dark:text-purple-100",
    glow: "shadow-purple-500/20",
    dot: "bg-purple-500"
  },
  blue: { 
    gradient: "bg-gradient-to-br from-blue-500 to-cyan-500", 
    bg: "bg-blue-500/10 dark:bg-blue-500/20", 
    border: "border-l-blue-500", 
    text: "text-blue-900 dark:text-blue-100",
    glow: "shadow-blue-500/20",
    dot: "bg-blue-500"
  },
  green: { 
    gradient: "bg-gradient-to-br from-emerald-500 to-teal-500", 
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20", 
    border: "border-l-emerald-500", 
    text: "text-emerald-900 dark:text-emerald-100",
    glow: "shadow-emerald-500/20",
    dot: "bg-emerald-500"
  },
  red: { 
    gradient: "bg-gradient-to-br from-rose-500 to-pink-600", 
    bg: "bg-rose-500/10 dark:bg-rose-500/20", 
    border: "border-l-rose-500", 
    text: "text-rose-900 dark:text-rose-100",
    glow: "shadow-rose-500/20",
    dot: "bg-rose-500"
  },
  orange: { 
    gradient: "bg-gradient-to-br from-orange-500 to-amber-500", 
    bg: "bg-orange-500/10 dark:bg-orange-500/20", 
    border: "border-l-orange-500", 
    text: "text-orange-900 dark:text-orange-100",
    glow: "shadow-orange-500/20",
    dot: "bg-orange-500"
  },
  pink: { 
    gradient: "bg-gradient-to-br from-pink-500 to-fuchsia-500", 
    bg: "bg-pink-500/10 dark:bg-pink-500/20", 
    border: "border-l-pink-500", 
    text: "text-pink-900 dark:text-pink-100",
    glow: "shadow-pink-500/20",
    dot: "bg-pink-500"
  },
  teal: { 
    gradient: "bg-gradient-to-br from-teal-500 to-cyan-500", 
    bg: "bg-teal-500/10 dark:bg-teal-500/20", 
    border: "border-l-teal-500", 
    text: "text-teal-900 dark:text-teal-100",
    glow: "shadow-teal-500/20",
    dot: "bg-teal-500"
  },
  amber: { 
    gradient: "bg-gradient-to-br from-amber-500 to-yellow-500", 
    bg: "bg-amber-500/10 dark:bg-amber-500/20", 
    border: "border-l-amber-500", 
    text: "text-amber-900 dark:text-amber-100",
    glow: "shadow-amber-500/20",
    dot: "bg-amber-500"
  },
};

const getEventColorClasses = (color: string | undefined) => {
  const key = color?.toLowerCase() || "purple";
  return EVENT_COLORS[key] || EVENT_COLORS.purple;
};

// Format hour for display
const formatHour = (hour: number): string => {
  if (hour === 0) return "12a";
  if (hour === 12) return "12p";
  if (hour < 12) return `${hour}a`;
  return `${hour - 12}p`;
};

// Format time for events
const formatEventTime = (date: Date): string => {
  const h = date.getHours();
  const m = date.getMinutes();
  const hour12 = h % 12 || 12;
  const ampm = h < 12 ? "a" : "p";
  return m === 0 ? `${hour12}${ampm}` : `${hour12}:${String(m).padStart(2, "0")}${ampm}`;
};

interface ModernWeekViewProps {
  CustomEventModal?: CustomEventModal;
  isSchedulePage?: boolean;
  onEventClick?: (event: Event) => void;
}

export default function ModernWeekView({
  CustomEventModal: CustomEventModalProp,
  isSchedulePage = true,
  onEventClick,
}: ModernWeekViewProps) {
  const { getters, handlers, weekStartsOn: rawWeekStartsOn = 0 } = useScheduler();
  const { setOpen } = useModal();
  const weekStartsOn = typeof rawWeekStartsOn === 'number' ? rawWeekStartsOn : 0;
  const gridRef = useRef<HTMLDivElement>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredSlot, setHoveredSlot] = useState<{ day: number; hour: number } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [createEventModal, setCreateEventModal] = useState<{
    date: Date;
    time: string;
  } | null>(null);

  // Current time indicator
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Get week days
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = (day - weekStartsOn + 7) % 7;
    start.setDate(start.getDate() - diff);

    return Array.from({ length: DAYS_IN_WEEK }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [currentDate, weekStartsOn]);

  // Check which day is today
  const todayIndex = useMemo(() => {
    const today = new Date();
    return weekDays.findIndex(
      (d) =>
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
    );
  }, [weekDays]);

  // Current time position
  const currentTimePosition = useMemo(() => {
    if (todayIndex === -1) return -1;
    const hours = currentTime.getHours() + currentTime.getMinutes() / 60;
    return hours * HOUR_HEIGHT;
  }, [todayIndex, currentTime]);

  // Get events for each day
  const weekEvents = useMemo(() => {
    return weekDays.map((day) => {
      const events = getters.getEventsForDay(day.getDate(), day) as Event[] | undefined;
      return events || [];
    });
  }, [weekDays, getters]);

  // Navigation
  const goToPrevWeek = useCallback(() => {
    setCurrentDate((d) => {
      const newDate = new Date(d);
      newDate.setDate(d.getDate() - 7);
      return newDate;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentDate((d) => {
      const newDate = new Date(d);
      newDate.setDate(d.getDate() + 7);
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Handle click on time slot - open create modal directly
  const handleSlotClick = useCallback(
    (dayIndex: number, hour: number, e: React.MouseEvent) => {
      const dayDate = weekDays[dayIndex];
      if (!dayDate || !gridRef.current) return;

      const gridRect = gridRef.current.getBoundingClientRect();
      const offsetY = e.clientY - gridRect.top + gridRef.current.scrollTop;
      const minuteOffset = Math.floor((offsetY % HOUR_HEIGHT) / (HOUR_HEIGHT / 4)) * 15;
      const clickedHour = Math.floor(offsetY / HOUR_HEIGHT);
      const time = `${String(clickedHour).padStart(2, "0")}:${String(minuteOffset).padStart(2, "0")}`;

      // Open create modal directly instead of inline creator
      setCreateEventModal({
        date: new Date(dayDate),
        time,
      });
    },
    [weekDays]
  );

  // Save event from create modal
  const handleCreateSave = useCallback(
    async (eventData: any) => {
      if (handlers?.handleAddEvent) {
        await handlers.handleAddEvent(eventData);
      } else {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        });
      }
      setCreateEventModal(null);
    },
    [handlers]
  );

  // Calculate event positioning for a day
  const getPositionedEventsForDay = useCallback((events: Event[]) => {
    if (!events.length) return [];

    const ensureDate = (d: any): Date =>
      d instanceof Date ? d : parseDatePreserveLocal(d) || new Date(String(d));

    const sorted = [...events].sort(
      (a, b) => ensureDate(a.startDate).getTime() - ensureDate(b.startDate).getTime()
    );

    const groups: Event[][] = [];
    let currentGroup: Event[] = [];
    let groupEnd = 0;

    sorted.forEach((event) => {
      const start = ensureDate(event.startDate).getTime();
      const end = ensureDate(event.endDate).getTime();

      if (currentGroup.length === 0 || start < groupEnd) {
        currentGroup.push(event);
        groupEnd = Math.max(groupEnd, end);
      } else {
        groups.push(currentGroup);
        currentGroup = [event];
        groupEnd = end;
      }
    });
    if (currentGroup.length) groups.push(currentGroup);

    const positioned: Array<{
      event: Event;
      top: number;
      height: number;
      left: string;
      width: string;
      zIndex: number;
    }> = [];

    groups.forEach((group) => {
      const columns: Event[][] = [];

      group.forEach((event) => {
        const eventStart = ensureDate(event.startDate).getTime();
        let placed = false;

        for (let i = 0; i < columns.length; i++) {
          const lastInColumn = columns[i][columns[i].length - 1];
          const lastEnd = ensureDate(lastInColumn.endDate).getTime();
          if (eventStart >= lastEnd) {
            columns[i].push(event);
            placed = true;
            break;
          }
        }

        if (!placed) {
          columns.push([event]);
        }
      });

      const totalColumns = columns.length;
      columns.forEach((column, colIndex) => {
        column.forEach((event) => {
          const start = ensureDate(event.startDate);
          const end = ensureDate(event.endDate);
          const startMinutes = start.getHours() * 60 + start.getMinutes();
          const endMinutes = end.getHours() * 60 + end.getMinutes();
          const duration = Math.max(endMinutes - startMinutes, 30);

          positioned.push({
            event,
            top: (startMinutes / 60) * HOUR_HEIGHT,
            height: Math.max((duration / 60) * HOUR_HEIGHT, 20),
            // When there are 3+ overlapping events, use staggered layout for better visibility
            left: totalColumns >= 3 
              ? `${(colIndex / totalColumns) * 85 + colIndex * 2}%`
              : `${(colIndex / totalColumns) * 100}%`,
            width: totalColumns >= 3 
              ? `${85 / totalColumns}%`
              : `${100 / totalColumns}%`,
            zIndex: colIndex + 1,
          });
        });
      });
    });

    return positioned;
  }, []);

  // Header date range
  const headerDateRange = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${year}`;
    }
    return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${year}`;
  }, [weekDays]);

  // Count total events
  const totalEvents = useMemo(() => weekEvents.flat().length, [weekEvents]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800/50 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-black/20">
      {/* Header - Premium styling */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-slate-800/50 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50">
        <div className="flex items-center gap-4">
          {/* Navigation buttons with premium hover */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50">
            <button
              onClick={goToPrevWeek}
              className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 hover:shadow-md group"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 hover:shadow-md group"
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {headerDateRange}
              </h2>
              {todayIndex >= 0 && (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  This week
                </span>
              )}
            </div>
          </div>
        </div>

        {todayIndex === -1 && (
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200 hover:shadow-md"
          >
            Go to Today
          </button>
        )}
      </div>

      {/* Day Headers - Premium */}
      <div className="flex border-b border-slate-200/80 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="w-14 flex-shrink-0" /> {/* Time column spacer */}
        {weekDays.map((day, idx) => {
          const isToday = idx === todayIndex;
          const dayEvents = weekEvents[idx] || [];
          return (
            <div
              key={idx}
              className={cn(
                "flex-1 py-3 text-center border-l border-slate-100 dark:border-slate-800/50 transition-colors",
                isToday && "bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent"
              )}
            >
              <div className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
              )}>
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div
                className={cn(
                  "text-xl font-bold mt-1 transition-all",
                  isToday
                    ? "text-white bg-gradient-to-br from-blue-500 to-cyan-500 w-9 h-9 rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30"
                    : "text-slate-900 dark:text-white"
                )}
              >
                {day.getDate()}
              </div>
              {dayEvents.length > 0 && (
                <div className="flex justify-center mt-1.5 gap-0.5">
                  {dayEvents.slice(0, 3).map((e, i) => {
                    const c = getEventColorClasses(e.color || (e as any).variant);
                    return <div key={i} className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />;
                  })}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] text-slate-400 ml-0.5">+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Time Grid */}
      <div
        ref={gridRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white dark:bg-slate-950"
        style={{ maxHeight: "calc(100vh - 350px)" }}
      >
        <div className="flex relative" style={{ minHeight: HOURS.length * HOUR_HEIGHT }}>
          {/* Time labels column */}
          <div className="w-14 flex-shrink-0 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full pr-3 text-right"
                style={{ top: hour * HOUR_HEIGHT - 6 }}
              >
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const isToday = dayIndex === todayIndex;
            const dayEventsPositioned = getPositionedEventsForDay(weekEvents[dayIndex]);

            return (
              <div
                key={dayIndex}
                className={cn(
                  "week-day-column flex-1 relative border-l border-slate-200 dark:border-slate-700",
                  isToday && "bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-900/10 dark:to-transparent"
                )}
              >
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className={cn(
                      "absolute w-full border-t border-slate-200 dark:border-slate-700 cursor-pointer group",
                      "transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent dark:hover:from-blue-900/20 dark:hover:to-transparent"
                    )}
                    style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    onClick={(e) => handleSlotClick(dayIndex, hour, e)}
                  >
                    {/* Half-hour line */}
                    <div
                      className="absolute w-full border-t border-dashed border-slate-200/70 dark:border-slate-700/70"
                      style={{ top: HOUR_HEIGHT / 2 }}
                    />
                    {/* Hover indicator */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 scale-75 group-hover:scale-100 transition-transform">
                        <Plus className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Events - Premium floating cards */}
                <div className="absolute inset-0 px-1 pointer-events-none overflow-hidden">
                  {dayEventsPositioned.map(({ event, top, height, left, width, zIndex }) => {
                    // Color priority: course.color → event.color → event.variant → fallback
                    const courseColor = (event as any).courses?.color;
                    const rawColor = courseColor || event.color || (event as any).variant || 'blue';
                    const startDate = parseDatePreserveLocal(event.startDate) || new Date(String(event.startDate));
                    const endDate = parseDatePreserveLocal(event.endDate) || new Date(String(event.endDate));
                    const isCompact = height < 48;
                    const isTiny = height < 32;
                    
                    // Check if event is in the past
                    const now = new Date();
                    const isPast = endDate < now;
                    
                    // Hex color mapping
                    const hexColors: Record<string, string> = {
                      purple: '#9333EA', blue: '#4285F4', green: '#0F9D58', emerald: '#0F9D58',
                      red: '#DB4437', rose: '#E91E63', orange: '#F4511E', amber: '#F09300',
                      pink: '#E91E63', cyan: '#00ACC1', teal: '#009688', yellow: '#F6BF26',
                      indigo: '#3F51B5', lime: '#7CB342', slate: '#607D8B', gray: '#616161'
                    };
                    
                    const hex = rawColor.startsWith('#') 
                      ? rawColor 
                      : (hexColors[rawColor.toLowerCase()] || hexColors.blue);
                    
                    const courseCode = (event as any).courses?.code || (event as any).course_code || null;

                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "absolute cursor-pointer pointer-events-auto overflow-hidden group transition-all duration-300",
                          isPast 
                            ? "opacity-50 hover:opacity-75" 
                            : "hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-0.5"
                        )}
                        style={{
                          top: top + 2,
                          height: Math.max(height - 4, 24),
                          left: `calc(${left} + 3px)`,
                          width: `calc(${width} - 8px)`,
                          zIndex,
                          borderRadius: '10px',
                          background: isPast 
                            ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.06) 0%, rgba(148, 163, 184, 0.03) 100%)'
                            : `linear-gradient(145deg, ${hex}12 0%, ${hex}06 100%)`,
                          border: isPast 
                            ? '1px solid rgba(148, 163, 184, 0.15)'
                            : `1px solid ${hex}20`,
                          boxShadow: !isPast 
                            ? `0 2px 8px ${hex}15, 0 1px 3px rgba(0,0,0,0.04)` 
                            : 'none',
                        }}
                        onClick={() => {
                          if (onEventClick) {
                            onEventClick(event);
                          } else {
                            setSelectedEvent(event);
                          }
                        }}
                      >
                        {/* Refined left accent bar */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-[3px]"
                          style={{ 
                            borderRadius: '10px 0 0 10px',
                            background: isPast 
                              ? 'rgba(148, 163, 184, 0.4)'
                              : `linear-gradient(180deg, ${hex} 0%, ${hex}BB 100%)`,
                          }}
                        />
                        
                        <div className={cn(
                          "h-full flex flex-col overflow-hidden pl-2.5 pr-2", 
                          isTiny ? "justify-center py-0.5" : "justify-center py-1.5"
                        )}>
                          {/* Title - prominent and readable */}
                          <div 
                            className={cn(
                              "font-semibold truncate leading-snug",
                              isPast ? "text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-white"
                            )}
                            style={{ fontSize: isTiny ? '11px' : isCompact ? '12px' : '13px' }}
                          >
                            {event.title}
                          </div>
                          {/* Time - subtle but visible */}
                          {!isTiny && (
                            <div className={cn(
                              "flex items-center gap-1 mt-0.5",
                              isPast ? "text-slate-400 dark:text-slate-600" : "text-slate-500 dark:text-slate-400"
                            )}
                            style={{ fontSize: '10px' }}
                            >
                              <Clock className="w-2.5 h-2.5 flex-shrink-0 opacity-70" />
                              <span className="font-medium">{formatEventTime(startDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Current time indicator - Premium */}
                {isToday && currentTimePosition >= 0 && (
                  <div
                    className="absolute left-0 right-0 flex items-center z-30 pointer-events-none"
                    style={{ top: currentTimePosition }}
                  >
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 -ml-1.5 shadow-lg shadow-rose-500/40 ring-2 ring-rose-500/20" />
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-rose-500 to-transparent" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer - Premium */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/50 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {totalEvents === 0
              ? "No events this week"
              : `${totalEvents} event${totalEvents > 1 ? "s" : ""} this week`}
          </p>
          {totalEvents > 0 && (
            <div className="flex -space-x-1">
              {weekEvents.flat().slice(0, 5).map((e, i) => {
                const c = getEventColorClasses(e.color || (e as any).variant);
                return (
                  <div key={i} className={cn("w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-950", c.dot)} />
                );
              })}
              {totalEvents > 5 && (
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-950 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">+{totalEvents - 5}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Event Edit Modal - Goes directly to edit mode */}
      {selectedEvent && (
        <UnifiedEventModal
          event={selectedEvent}
          mode="edit"
          onClose={() => setSelectedEvent(null)}
          onSave={async (eventData) => {
            if (handlers?.handleUpdateEvent) {
              await handlers.handleUpdateEvent(eventData, eventData.id, 'single');
            } else {
              await fetch(`/api/events/${encodeURIComponent(eventData.id)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData),
              });
            }
            try {
              window.dispatchEvent(new CustomEvent("scheduler:eventsChanged"));
            } catch (e) {}
          }}
          onDelete={async (event) => {
            if (handlers?.handleDeleteEvent) {
              await handlers.handleDeleteEvent(event.id);
            }
            try {
              window.dispatchEvent(new CustomEvent("scheduler:eventsChanged"));
            } catch (e) {}
          }}
        />
      )}

      {/* Create Event Modal */}
      {createEventModal && (
        <UnifiedEventModal
          mode="create"
          initialDate={createEventModal.date}
          initialTime={createEventModal.time}
          onClose={() => setCreateEventModal(null)}
          onSave={handleCreateSave}
        />
      )}
    </div>
  );
}
