"use client";

import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { parseDatePreserveLocal } from "@/lib/dateHelpers";
import { 
  ChevronLeft, ChevronRight, Plus, Clock, CalendarDays, Sparkles,
  BookOpen, FlaskConical, Lightbulb, ClipboardList, Users, Heart, Tag,
  MapPin, BookMarked, FileText, Target, AlertTriangle
} from "lucide-react";
import { useScheduler } from "@/providers/schedular-provider";
import { useModal } from "@/providers/modal-context";
import UnifiedEventModal from "../../../_modals/unified-event-modal";
import EventDetailPopover from "@/components/schedule/EventDetailPopover";
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

// Convert hex to rgba for visible colored fills
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

// Event type icon mapping
const EVENT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  class: BookOpen,
  lab: FlaskConical,
  tutorial: Lightbulb,
  study: BookMarked,
  exam: AlertTriangle,
  meeting: Users,
  personal: Heart,
  assignment: FileText,
  deadline: Clock,
  other: Target,
};

const getEventTypeIcon = (type?: string) => {
  return EVENT_TYPE_ICONS[type || 'other'] || Tag;
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
  const [slideDirection, setSlideDirection] = useState(0);
  const [hoveredSlot, setHoveredSlot] = useState<{ day: number; hour: number } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [popoverEvent, setPopoverEvent] = useState<Event | null>(null);
  const [popoverRect, setPopoverRect] = useState<DOMRect | null>(null);
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
    setSlideDirection(-1);
    setCurrentDate((d) => {
      const newDate = new Date(d);
      newDate.setDate(d.getDate() - 7);
      return newDate;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setSlideDirection(1);
    setCurrentDate((d) => {
      const newDate = new Date(d);
      newDate.setDate(d.getDate() + 7);
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setSlideDirection(1);
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
      try {
        if (handlers?.handleAddEvent) {
          await handlers.handleAddEvent(eventData);
        } else {
          const res = await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify(eventData),
          });
          if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(text || `POST /api/events failed (${res.status})`);
          }
        }
        setCreateEventModal(null);
      } catch (err) {
        console.error('[ModernWeekView] Failed to create event:', err);
      }
    },
    [handlers]
  );

  // Calculate event positioning for a day
  const getPositionedEventsForDay = useCallback((events: Event[]) => {
    if (!events.length) return [];

    const ensureDate = (d: any): Date =>
      d instanceof Date ? d : parseDatePreserveLocal(d) || new Date(String(d));

    const minuteStamp = (d: any) => {
      const dt = ensureDate(d);
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours(), dt.getMinutes(), 0, 0).getTime();
    };

    const sorted = [...events].sort(
      (a, b) => ensureDate(a.startDate).getTime() - ensureDate(b.startDate).getTime()
    );

    const groups: Event[][] = [];
    let currentGroup: Event[] = [];
    let groupEnd = 0;

    sorted.forEach((event) => {
      const start = minuteStamp(event.startDate);
      const end = minuteStamp(event.endDate);

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
        const eventStart = minuteStamp(event.startDate);
        let placed = false;

        for (let i = 0; i < columns.length; i++) {
          const lastInColumn = columns[i][columns[i].length - 1];
          const lastEnd = minuteStamp(lastInColumn.endDate);
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
              <AnimatePresence mode="wait">
                <motion.h2 
                  key={headerDateRange}
                  initial={{ opacity: 0, x: slideDirection * 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -slideDirection * 20 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="text-lg font-bold text-slate-900 dark:text-white tracking-tight"
                >
                  {headerDateRange}
                </motion.h2>
              </AnimatePresence>
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

      {/* Day Headers */}
      <div className="flex border-b border-slate-200/80 dark:border-slate-800/50 bg-white dark:bg-slate-900/50">
        <div className="w-14 flex-shrink-0" /> {/* Time column spacer */}
        {weekDays.map((day, idx) => {
          const isToday = idx === todayIndex;
          const dayEvents = (weekEvents[idx] || []).filter((e: any) => !e.isDateOnly);
          return (
            <div
              key={idx}
              className={cn(
                "flex-1 py-3 text-center border-l border-slate-100 dark:border-slate-800/50 transition-colors",
                isToday && "bg-blue-50/50 dark:bg-blue-900/15"
              )}
            >
              <div className={cn(
                "text-[10px] font-semibold uppercase tracking-widest",
                isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
              )}>
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div
                className={cn(
                  "text-lg font-bold mt-0.5 transition-all",
                  isToday
                    ? "text-white w-8 h-8 rounded-lg mx-auto flex items-center justify-center shadow-md"
                    : "text-slate-800 dark:text-slate-200"
                )}
                style={isToday ? {
                  background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
                  boxShadow: '0 3px 10px rgba(59, 130, 246, 0.3)'
                } : undefined}
              >
                {day.getDate()}
              </div>
              {dayEvents.length > 0 && (
                <div className="flex justify-center mt-1 gap-0.5">
                  {dayEvents.slice(0, 3).map((e, i) => {
                    const c = getEventColorClasses(e.color || (e as any).variant);
                    return <div key={i} className={cn("w-1 h-1 rounded-full", c.dot)} />;
                  })}
                  {dayEvents.length > 3 && (
                    <span className="text-[8px] text-slate-400 ml-0.5">+{dayEvents.length - 3}</span>
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
            const dayEventsPositioned = getPositionedEventsForDay(weekEvents[dayIndex].filter((e: any) => !e.isDateOnly));

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
                      "absolute w-full border-t border-slate-100 dark:border-slate-800 cursor-pointer group",
                      "transition-colors duration-150"
                    )}
                    style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    onClick={(e) => handleSlotClick(dayIndex, hour, e)}
                    onMouseEnter={() => setHoveredSlot({ day: dayIndex, hour })}
                    onMouseLeave={() => setHoveredSlot(null)}
                  >
                    {/* Half-hour line */}
                    <div
                      className="absolute w-full border-t border-dashed border-slate-50 dark:border-slate-800/60"
                      style={{ top: HOUR_HEIGHT / 2 }}
                    />
                    {/* Hover bg */}
                    {hoveredSlot?.day === dayIndex && hoveredSlot?.hour === hour && (
                      <div 
                        className="absolute inset-0 transition-opacity"
                        style={{ background: 'rgba(59, 130, 246, 0.03)' }}
                      />
                    )}
                    {/* Hover plus */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center scale-75 group-hover:scale-100 transition-transform"
                        style={{
                          background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
                        }}
                      >
                        <Plus className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Events – Vibrant animated blocks */}
                <div className="absolute inset-0 px-0.5 pointer-events-none overflow-hidden">
                  <AnimatePresence mode="popLayout">
                  {dayEventsPositioned.map(({ event, top, height, left, width, zIndex }, idx) => {
                    const courseColor = (event as any).courses?.color;
                    const rawColor = courseColor || event.color || (event as any).variant || 'blue';
                    const startDate = parseDatePreserveLocal(event.startDate) || new Date(String(event.startDate));
                    const endDate = parseDatePreserveLocal(event.endDate) || new Date(String(event.endDate));
                    
                    // Size tiers for week view (narrower columns)
                    const isTiny = height < 28;
                    const isCompact = height < 45;
                    const isMedium = height >= 45 && height < 75;
                    const isTall = height >= 75;
                    
                    const now = new Date();
                    const isPast = endDate < now;
                    
                    const hexColors: Record<string, string> = {
                      purple: '#8B5CF6', blue: '#3B82F6', green: '#10B981', emerald: '#10B981',
                      red: '#EF4444', rose: '#F43F5E', orange: '#F97316', amber: '#F59E0B',
                      pink: '#EC4899', cyan: '#06B6D4', teal: '#14B8A6', yellow: '#EAB308',
                      indigo: '#6366F1', lime: '#84CC16', slate: '#64748B', gray: '#6B7280'
                    };
                    
                    const hex = rawColor.startsWith('#') 
                      ? rawColor 
                      : (hexColors[rawColor.toLowerCase()] || hexColors.blue);

                    const courseName = (event as any).courses?.name || null;
                    const courseCode = (event as any).courses?.code || (event as any).course_code || null;
                    const eventLocation = (event as any).location || (event as any).room || null;
                    const eventType = event.type || 'other';
                    const TypeIcon = getEventTypeIcon(eventType);

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.9, y: 4 }}
                        animate={{ opacity: isPast ? 0.4 : 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -4 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: idx * 0.03,
                          ease: [0.25, 0.46, 0.45, 0.94] 
                        }}
                        whileHover={!isPast ? { 
                          scale: 1.03, 
                          y: -1,
                          transition: { duration: 0.15 } 
                        } : undefined}
                        whileTap={!isPast ? { scale: 0.97 } : undefined}
                        className={cn(
                          "absolute cursor-pointer pointer-events-auto overflow-hidden group",
                          isPast && "grayscale-[30%]"
                        )}
                        style={{
                          top: top + 2,
                          height: Math.max(height - 4, 20),
                          left: `calc(${left} + 1px)`,
                          width: `calc(${width} - 3px)`,
                          zIndex,
                          borderRadius: '8px',
                          background: `linear-gradient(135deg, ${hexToRgba(hex, 0.22)} 0%, ${hexToRgba(hex, 0.1)} 100%)`,
                          borderLeft: `3px solid ${hex}`,
                          boxShadow: isPast ? 'none' : `0 1px 4px ${hexToRgba(hex, 0.1)}, 0 0 0 1px ${hexToRgba(hex, 0.06)}`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEventClick) {
                            onEventClick(event);
                          } else {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setPopoverEvent(event);
                            setPopoverRect(rect);
                          }
                        }}
                      >
                        {/* Hover glow overlay */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" 
                          style={{ 
                            background: `linear-gradient(135deg, ${hexToRgba(hex, 0.08)} 0%, transparent 50%)`,
                            borderRadius: '8px' 
                          }} 
                        />
                        
                        <div className={cn(
                          "h-full flex flex-col overflow-hidden relative z-10", 
                          isTiny ? "justify-center px-1.5" : "justify-start px-1.5 py-1"
                        )}>
                          {isTiny ? (
                            /* ── Tiny: just title ── */
                            <div className="flex items-center gap-1 min-w-0">
                              <div 
                                className="flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center"
                                style={{ backgroundColor: hexToRgba(hex, 0.2) }}
                              >
                                <TypeIcon size={8} style={{ color: hex }} />
                              </div>
                              <span className="font-bold truncate leading-none" style={{ fontSize: '9px', color: hex }}>
                                {event.title}
                              </span>
                            </div>
                          ) : isCompact ? (
                            /* ── Compact: title + time ── */
                            <>
                              <div className="flex items-center gap-1 min-w-0">
                                <div 
                                  className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center"
                                  style={{ backgroundColor: hexToRgba(hex, 0.2) }}
                                >
                                  <TypeIcon size={9} style={{ color: hex }} />
                                </div>
                                <span className="font-bold truncate leading-tight" style={{ fontSize: '10px', color: hex }}>
                                  {event.title}
                                </span>
                              </div>
                              <span className="font-semibold truncate mt-px" style={{ fontSize: '8px', color: hexToRgba(hex, 0.6) }}>
                                {formatEventTime(startDate)}
                              </span>
                            </>
                          ) : (
                            /* ── Medium / Tall: clean title + time, course/location only for tall ── */
                            <>
                              {/* Title with type icon */}
                              <div className="flex items-center gap-1 min-w-0 mb-0.5">
                                <div 
                                  className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center"
                                  style={{ backgroundColor: hexToRgba(hex, 0.15) }}
                                >
                                  <TypeIcon size={9} style={{ color: hex }} />
                                </div>
                                <p className="font-bold truncate leading-tight" style={{ fontSize: '11px', color: hex }}>
                                  {event.title}
                                </p>
                              </div>

                              {/* Time */}
                              <p className="font-semibold flex items-center gap-0.5" style={{ fontSize: '9px', color: hexToRgba(hex, 0.55) }}>
                                <Clock size={8} className="flex-shrink-0" />
                                {formatEventTime(startDate)} – {formatEventTime(endDate)}
                              </p>

                              {/* Course + Location (tall only, single row) */}
                              {isTall && (courseName || eventLocation) && (
                                <p className="mt-0.5 font-medium truncate flex items-center gap-1" style={{ fontSize: '8px', color: hexToRgba(hex, 0.45) }}>
                                  {courseName && (
                                    <span className="flex items-center gap-0.5 truncate">
                                      <BookOpen size={7} className="flex-shrink-0" />
                                      <span className="truncate">{courseCode || courseName}</span>
                                    </span>
                                  )}
                                  {courseName && eventLocation && <span style={{ color: hexToRgba(hex, 0.3) }}>·</span>}
                                  {eventLocation && (
                                    <span className="flex items-center gap-0.5 truncate">
                                      <MapPin size={7} className="flex-shrink-0" />
                                      <span className="truncate">{eventLocation}</span>
                                    </span>
                                  )}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  </AnimatePresence>
                </div>

                {/* Current time indicator */}
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

      {/* Footer - Animated */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/50 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            <motion.p 
              key={`${headerDateRange}-${totalEvents}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium text-slate-500 dark:text-slate-400"
            >
              {totalEvents === 0
                ? "No events this week"
                : `${totalEvents} event${totalEvents > 1 ? "s" : ""} this week`}
            </motion.p>
          </AnimatePresence>
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

      {/* Event Detail Popover */}
      {popoverEvent && popoverRect && (
        <EventDetailPopover
          event={popoverEvent}
          anchorRect={popoverRect}
          onClose={() => { setPopoverEvent(null); setPopoverRect(null); }}
          onEdit={() => { setSelectedEvent(popoverEvent); setPopoverEvent(null); setPopoverRect(null); }}
          onDelete={async () => {
            if (handlers?.handleDeleteEvent) {
              await handlers.handleDeleteEvent(popoverEvent.id);
            }
            setPopoverEvent(null);
            setPopoverRect(null);
            try { window.dispatchEvent(new CustomEvent('scheduler:eventsChanged')); } catch (e) {}
          }}
        />
      )}

      {/* Event Edit Modal */}
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
