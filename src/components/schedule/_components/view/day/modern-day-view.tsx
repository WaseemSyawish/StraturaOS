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
const HOUR_HEIGHT = 60; // pixels per hour - slightly reduced for better fit
const START_HOUR = 0;
const END_HOUR = 24;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

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
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
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

interface ModernDayViewProps {
  CustomEventModal?: CustomEventModal;
  isSchedulePage?: boolean;
  onEventClick?: (event: Event) => void;
}

export default function ModernDayView({
  CustomEventModal: CustomEventModalProp,
  isSchedulePage = true,
  onEventClick,
}: ModernDayViewProps) {
  const { getters, handlers } = useScheduler();
  const { setOpen } = useModal();
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [slideDirection, setSlideDirection] = useState(0); // -1 left, 1 right
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
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

  // Check if viewing today
  const isToday = useMemo(() => {
    const today = new Date();
    return (
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  }, [currentDate]);

  // Current time position
  const currentTimePosition = useMemo(() => {
    if (!isToday) return -1;
    const hours = currentTime.getHours() + currentTime.getMinutes() / 60;
    return hours * HOUR_HEIGHT;
  }, [isToday, currentTime]);

  // Get events for current day
  const dayEvents = useMemo(() => {
    const events = getters.getEventsForDay(
      currentDate.getDate(),
      currentDate
    ) as Event[] | undefined;
    return events || [];
  }, [currentDate, getters]);

  // Navigation
  const goToPrevDay = useCallback(() => {
    setSlideDirection(-1);
    setCurrentDate((d) => {
      const newDate = new Date(d);
      newDate.setDate(d.getDate() - 1);
      return newDate;
    });
  }, []);

  const goToNextDay = useCallback(() => {
    setSlideDirection(1);
    setCurrentDate((d) => {
      const newDate = new Date(d);
      newDate.setDate(d.getDate() + 1);
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setSlideDirection(1);
    setCurrentDate(new Date());
  }, []);

  // Handle click on time slot - open create modal directly
  const handleSlotClick = useCallback(
    (hour: number, e: React.MouseEvent) => {
      if (!gridRef.current) return;

      const rect = gridRef.current.getBoundingClientRect();
      const offsetY = e.clientY - rect.top + gridRef.current.scrollTop;
      const minuteOffset = Math.floor((offsetY % HOUR_HEIGHT) / (HOUR_HEIGHT / 4)) * 15;
      const clickedHour = Math.floor(offsetY / HOUR_HEIGHT);
      const time = `${String(clickedHour).padStart(2, "0")}:${String(minuteOffset).padStart(2, "0")}`;

      // Open create modal directly instead of inline creator
      setCreateEventModal({
        date: new Date(currentDate),
        time,
      });
    },
    [currentDate]
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
        console.error('[ModernDayView] Failed to create event:', err);
      }
    },
    [handlers]
  );

  // Calculate event positioning with overlap handling
  const positionedEvents = useMemo(() => {
    if (!dayEvents.length) return [];

    const ensureDate = (d: any): Date =>
      d instanceof Date ? d : parseDatePreserveLocal(d) || new Date(String(d));

    const minuteStamp = (d: any) => {
      const dt = ensureDate(d);
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours(), dt.getMinutes(), 0, 0).getTime();
    };

    // Sort by start time
    const sorted = [...dayEvents].sort(
      (a, b) => ensureDate(a.startDate).getTime() - ensureDate(b.startDate).getTime()
    );

    // Find overlapping groups
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

    // Position events
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
          const duration = Math.max(endMinutes - startMinutes, 30); // Min 30 mins

          positioned.push({
            event,
            top: (startMinutes / 60) * HOUR_HEIGHT,
            height: Math.max((duration / 60) * HOUR_HEIGHT, 24), // Min height
            left: `calc(${(colIndex / totalColumns) * 100}% + 2px)`,
            width: `calc(${100 / totalColumns}% - 4px)`,
            zIndex: colIndex + 1,
          });
        });
      });
    });

    return positioned;
  }, [dayEvents]);

  // Format header date
  const headerDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    };
    return currentDate.toLocaleDateString("en-US", options);
  }, [currentDate]);

  return (
    <div 
      className="flex flex-col h-full rounded-2xl overflow-hidden relative bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/50 shadow-lg dark:shadow-2xl dark:shadow-black/20"
    >

      {/* Header - Premium styling */}
      <div 
        className="flex items-center justify-between px-5 py-4 relative border-b border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900/80"
      >
        <div className="flex items-center gap-4">
          {/* Navigation buttons with premium hover */}
          <div 
            className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60"
          >
            <button
              onClick={goToPrevDay}
              className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 transition-all duration-200 hover:shadow-md group"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
            </button>
            <button
              onClick={goToNextDay}
              className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 transition-all duration-200 hover:shadow-md group"
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #9333EA 0%, #A855F7 100%)',
                boxShadow: '0 4px 14px rgba(147, 51, 234, 0.35)'
              }}
            >
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <AnimatePresence mode="wait">
                <motion.h2 
                  key={headerDate}
                  initial={{ opacity: 0, x: slideDirection * 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -slideDirection * 20 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="text-lg font-bold text-slate-900 dark:text-white tracking-tight"
                >
                  {headerDate}
                </motion.h2>
              </AnimatePresence>
              {isToday && (
                <span 
                  className="text-xs font-semibold flex items-center gap-1"
                  style={{ color: '#9333EA' }}
                >
                  <Sparkles className="w-3 h-3" />
                  Today
                </span>
              )}
            </div>
          </div>
        </div>

        {!isToday && (
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            style={{
              color: '#9333EA',
              background: 'rgba(147, 51, 234, 0.08)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(147, 51, 234, 0.15)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(147, 51, 234, 0.08)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            Go to Today
          </button>
        )}
      </div>

      {/* Time Grid */}
      <div
        ref={gridRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white dark:bg-slate-950"
        style={{ 
          maxHeight: "calc(100vh - 300px)",
        }}
      >
        
        <div className="relative" style={{ minHeight: HOURS.length * HOUR_HEIGHT }}>
          {/* Hour rows */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full flex"
              style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            >
              {/* Time label */}
              <div className="w-16 flex-shrink-0 pr-3 text-right relative">
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 -mt-2 block tabular-nums tracking-tight">
                  {formatHour(hour)}
                </span>
              </div>

              {/* Grid line and clickable area */}
              <div
                className={cn(
                  "flex-1 cursor-pointer group relative",
                  "transition-all duration-200",
                )}
                onMouseEnter={() => setHoveredHour(hour)}
                onMouseLeave={() => setHoveredHour(null)}
                onClick={(e) => handleSlotClick(hour, e)}
              >
                {/* Hour line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-slate-100 dark:bg-slate-800" />

                {/* Half-hour line */}
                <div
                  className="absolute w-full h-px bg-slate-50 dark:bg-slate-800/50"
                  style={{ top: HOUR_HEIGHT / 2 }}
                />

                {/* Hover effect */}
                <div className={cn(
                  "absolute inset-0 opacity-0 transition-opacity duration-200 rounded-r-lg",
                  hoveredHour === hour && "opacity-100"
                )} 
                style={{
                  background: hoveredHour === hour 
                    ? 'linear-gradient(90deg, rgba(147, 51, 234, 0.04) 0%, rgba(147, 51, 234, 0.02) 50%, transparent 100%)' 
                    : 'none'
                }}
                />

                {/* Hover indicator pill */}
                {hoveredHour === hour && !createEventModal && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                    <div 
                      className="flex items-center gap-1.5 px-3 py-1.5 text-white text-[11px] font-semibold rounded-full transform group-hover:scale-100 scale-90 transition-transform duration-200"
                      style={{
                        background: 'linear-gradient(135deg, #9333EA 0%, #A855F7 100%)',
                        boxShadow: '0 4px 16px rgba(147, 51, 234, 0.3)'
                      }}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add event</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Events – Vibrant animated blocks */}
          <div className="absolute inset-0 pl-16 pr-3 pointer-events-none overflow-hidden">
            <div className="relative w-full h-full">
            <AnimatePresence mode="popLayout">
            {positionedEvents.map(({ event, top, height, left, width, zIndex }, idx) => {
              const courseColor = (event as any).courses?.color;
              const rawColor = courseColor || event.color || (event as any).variant || 'blue';
              const startDate = parseDatePreserveLocal(event.startDate) || new Date(String(event.startDate));
              const endDate = parseDatePreserveLocal(event.endDate) || new Date(String(event.endDate));
              
              // Size tiers for responsive content
              const isTiny = height < 32;
              const isCompact = height < 55;
              const isMedium = height >= 55 && height < 90;
              const isTall = height >= 90;
              const isVeryTall = height >= 140;
              
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
              const durationMins = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.92, y: 6 }}
                  animate={{ opacity: isPast ? 0.45 : 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -6 }}
                  transition={{ 
                    duration: 0.35, 
                    delay: idx * 0.04,
                    ease: [0.25, 0.46, 0.45, 0.94] 
                  }}
                  whileHover={!isPast ? { 
                    scale: 1.015, 
                    y: -2,
                    transition: { duration: 0.2 } 
                  } : undefined}
                  whileTap={!isPast ? { scale: 0.98 } : undefined}
                  className={cn(
                    "absolute cursor-pointer pointer-events-auto overflow-hidden group",
                    isPast && "grayscale-[30%]"
                  )}
                  style={{
                    top: top + 1,
                    height: Math.max(height - 2, 24),
                    left: 0,
                    right: 0,
                    marginLeft: left,
                    width: `min(${width}, calc(100% - 6px))`,
                    maxWidth: 'calc(100% - 6px)',
                    zIndex,
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${hexToRgba(hex, 0.22)} 0%, ${hexToRgba(hex, 0.12)} 100%)`,
                    borderLeft: `4px solid ${hex}`,
                    boxShadow: isPast ? 'none' : `0 2px 8px ${hexToRgba(hex, 0.12)}, 0 0 0 1px ${hexToRgba(hex, 0.08)}`,
                    backdropFilter: 'blur(8px)',
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
                  {/* Decorative gradient accent on hover */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
                    style={{ 
                      background: `linear-gradient(135deg, ${hexToRgba(hex, 0.08)} 0%, transparent 60%)`,
                      borderRadius: '12px' 
                    }} 
                  />
                  
                  <div className={cn(
                    "h-full flex overflow-hidden relative z-10",
                    isTiny ? "items-center px-2.5" : "flex-col justify-start px-3 py-2"
                  )}>
                    {isTiny ? (
                      /* ── Tiny: icon + title only ── */
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div 
                          className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center"
                          style={{ backgroundColor: hexToRgba(hex, 0.2) }}
                        >
                          <TypeIcon size={10} style={{ color: hex }} />
                        </div>
                        <span className="font-bold text-[11px] truncate" style={{ color: hex }}>
                          {event.title}
                        </span>
                      </div>
                    ) : isCompact ? (
                      /* ── Compact: icon + title, time below ── */
                      <>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div 
                            className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center"
                            style={{ backgroundColor: hexToRgba(hex, 0.2) }}
                          >
                            <TypeIcon size={11} style={{ color: hex }} />
                          </div>
                          <span className="font-bold text-[12px] truncate leading-tight" style={{ color: hex }}>
                            {event.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold mt-0.5 truncate" style={{ color: hexToRgba(hex, 0.6) }}>
                          {formatEventTime(startDate)} – {formatEventTime(endDate)}
                        </span>
                      </>
                    ) : (
                      /* ── Medium / Tall / Very Tall: clean layout ── */
                      <>
                        {/* Title — prominent, with type icon inline */}
                        <div className="flex items-start gap-1.5 mb-0.5">
                          <div 
                            className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5"
                            style={{ backgroundColor: hexToRgba(hex, 0.15) }}
                          >
                            <TypeIcon size={11} style={{ color: hex }} />
                          </div>
                          <p 
                            className={cn(
                              "font-bold leading-snug truncate",
                              isMedium ? "text-[13px]" : "text-[14px]"
                            )}
                            style={{ color: hex }}
                          >
                            {event.title}
                          </p>
                        </div>

                        {/* Time range */}
                        <p className="text-[11px] font-semibold flex items-center gap-1 ml-0.5" style={{ color: hexToRgba(hex, 0.55) }}>
                          <Clock size={10} className="flex-shrink-0" />
                          <span>{formatEventTime(startDate)} – {formatEventTime(endDate)}</span>
                          <span className="ml-auto text-[10px] tabular-nums" style={{ color: hexToRgba(hex, 0.45) }}>
                            {durationMins < 60 
                              ? `${durationMins}m` 
                              : durationMins % 60 === 0 
                                ? `${durationMins / 60}h` 
                                : `${Math.floor(durationMins / 60)}h${durationMins % 60}m`}
                          </span>
                        </p>

                        {/* Course + Location row (if tall enough) */}
                        {isTall && (courseName || eventLocation) && (
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] font-medium truncate" style={{ color: hexToRgba(hex, 0.5) }}>
                            {courseName && (
                              <span className="flex items-center gap-1 truncate">
                                <BookOpen size={9} className="flex-shrink-0" style={{ color: hexToRgba(hex, 0.4) }} />
                                <span className="truncate">{courseCode || courseName}</span>
                              </span>
                            )}
                            {courseName && eventLocation && (
                              <span style={{ color: hexToRgba(hex, 0.3) }}>·</span>
                            )}
                            {eventLocation && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin size={9} className="flex-shrink-0" style={{ color: hexToRgba(hex, 0.4) }} />
                                <span className="truncate">{eventLocation}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Description preview (only very tall blocks) */}
                        {isVeryTall && event.description && (
                          <p 
                            className="text-[10px] font-medium mt-2 line-clamp-2 leading-relaxed px-1.5 py-1 rounded-md"
                            style={{ 
                              color: hexToRgba(hex, 0.45),
                              backgroundColor: hexToRgba(hex, 0.05)
                            }}
                          >
                            {event.description}
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
          </div>

          {/* Current time indicator */}
          {isToday && currentTimePosition >= 0 && (
            <div
              className="absolute left-12 right-0 flex items-center z-30 pointer-events-none"
              style={{ top: currentTimePosition }}
            >
              <div 
                className="w-3 h-3 rounded-full -ml-1.5"
                style={{
                  background: 'linear-gradient(135deg, #F43F5E 0%, #EC4899 100%)',
                  boxShadow: '0 0 0 3px rgba(244, 63, 94, 0.2), 0 2px 8px rgba(244, 63, 94, 0.4)'
                }}
              />
              <div 
                className="flex-1 h-[2px]"
                style={{
                  background: 'linear-gradient(90deg, #F43F5E 0%, rgba(244, 63, 94, 0.3) 50%, transparent 100%)'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer with event count - Animated */}
      <div 
        className="px-5 py-3 relative border-t border-slate-200/80 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/80"
      >
        <div className="flex items-center justify-between relative">
          <AnimatePresence mode="wait">
            <motion.p 
              key={`${currentDate.toDateString()}-${dayEvents.length}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium text-slate-500 dark:text-slate-400"
            >
              {dayEvents.length === 0
                ? "No events scheduled"
                : `${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""} scheduled`}
            </motion.p>
          </AnimatePresence>
          {dayEvents.length > 0 && (
            <div className="flex -space-x-1">
              {dayEvents.slice(0, 4).map((e, i) => {
                const colorKey = e.color || (e as any).variant || 'purple';
                const hexColors: Record<string, string> = {
                  purple: '#9333EA', blue: '#3B82F6', green: '#10B981', emerald: '#10B981',
                  red: '#EF4444', rose: '#F43F5E', orange: '#F97316', amber: '#F59E0B',
                  pink: '#EC4899', cyan: '#06B6D4', teal: '#14B8A6', yellow: '#EAB308'
                };
                const hex = hexColors[colorKey.toLowerCase()] || hexColors.purple;
                return (
                  <div 
                    key={i} 
                    className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900"
                    style={{ background: hex, boxShadow: `0 0 4px ${hex}60` }}
                  />
                );
              })}
              {dayEvents.length > 4 && (
                <div 
                  className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-slate-900 flex items-center justify-center"
                  style={{ background: 'rgba(148, 163, 184, 0.2)' }}
                >
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">+{dayEvents.length - 4}</span>
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
