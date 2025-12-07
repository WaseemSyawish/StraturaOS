"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useModal } from "@/providers/modal-context";
import { useScheduler } from "@/providers/schedular-provider";
import { 
  Calendar, Clock, MapPin, ChevronDown, Sparkles, Timer, ArrowRight, Check,
  BookOpen, FlaskConical, Lightbulb, FileText, Users, BookMarked
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAddEventProps {
  initialDate?: Date;
  initialTime?: string;
  onSuccess?: () => void;
  isSchedulePage?: boolean;
}

// Premium color palette with gradients
const EVENT_COLORS = [
  { key: "purple", hex: "#9333EA", name: "Purple", gradient: "from-purple-500 to-violet-600", ring: "ring-purple-500" },
  { key: "blue", hex: "#3B82F6", name: "Blue", gradient: "from-blue-500 to-cyan-600", ring: "ring-blue-500" },
  { key: "emerald", hex: "#10B981", name: "Emerald", gradient: "from-emerald-500 to-teal-600", ring: "ring-emerald-500" },
  { key: "rose", hex: "#F43F5E", name: "Rose", gradient: "from-rose-500 to-pink-600", ring: "ring-rose-500" },
  { key: "amber", hex: "#F59E0B", name: "Amber", gradient: "from-amber-500 to-orange-600", ring: "ring-amber-500" },
  { key: "cyan", hex: "#06B6D4", name: "Cyan", gradient: "from-cyan-500 to-sky-600", ring: "ring-cyan-500" },
];

// Event types with icons and colors
const EVENT_TYPES = [
  { value: "class", label: "Class", Icon: BookOpen, color: "purple" },
  { value: "lab", label: "Lab", Icon: FlaskConical, color: "emerald" },
  { value: "tutorial", label: "Tutorial", Icon: Lightbulb, color: "amber" },
  { value: "exam", label: "Exam", Icon: FileText, color: "rose" },
  { value: "meeting", label: "Meeting", Icon: Users, color: "blue" },
  { value: "study", label: "Study", Icon: BookMarked, color: "cyan" },
];

// Duration options
const QUICK_DURATIONS = [
  { label: "30m", value: 30, display: "30 min" },
  { label: "1h", value: 60, display: "1 hour" },
  { label: "1.5h", value: 90, display: "1.5 hours" },
  { label: "2h", value: 120, display: "2 hours" },
];

// Format time as 12-hour with AM/PM
const formatTime12h = (time: string): string => {
  const [h, m] = time.split(':').map(Number);
  const hour12 = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return m === 0 ? `${hour12} ${ampm}` : `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
};

// Round time to next 5 minutes
const roundToNext5Minutes = (date: Date): string => {
  const ms = 5 * 60 * 1000;
  const rounded = new Date(Math.ceil(date.getTime() / ms) * ms);
  return `${String(rounded.getHours()).padStart(2, '0')}:${String(rounded.getMinutes()).padStart(2, '0')}`;
};

export default function QuickAddEvent({ 
  initialDate, 
  initialTime,
  onSuccess,
  isSchedulePage = true
}: QuickAddEventProps) {
  const { setClose } = useModal();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Try to get scheduler handlers if available
  let handlers: any = {};
  try {
    const sched = useScheduler();
    handlers = sched?.handlers || {};
  } catch (e) {
    handlers = {};
  }

  // Smart default time - now + 5 mins, rounded
  const smartDefaultTime = useMemo(() => {
    if (initialTime) {
      // Check if initial time is in the past for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDay = new Date(initialDate || new Date());
      eventDay.setHours(0, 0, 0, 0);
      
      if (eventDay.getTime() === today.getTime()) {
        const [h, m] = initialTime.split(':').map(Number);
        const eventTime = new Date();
        eventTime.setHours(h, m, 0, 0);
        if (eventTime < new Date()) {
          return roundToNext5Minutes(new Date(Date.now() + 5 * 60 * 1000));
        }
      }
      return initialTime;
    }
    return roundToNext5Minutes(new Date(Date.now() + 5 * 60 * 1000));
  }, [initialTime, initialDate]);

  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => {
    const d = initialDate || new Date();
    return d.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState(smartDefaultTime);
  const [duration, setDuration] = useState(60);
  const [color, setColor] = useState("purple");
  const [type, setType] = useState("class");
  const [location, setLocation] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Animation mount
  useEffect(() => {
    setMounted(true);
    inputRef.current?.focus();
  }, []);

  // Calculate end time from start + duration
  const getEndTime = useCallback(() => {
    const [h, m] = startTime.split(':').map(Number);
    const startMins = h * 60 + m;
    const endMins = startMins + duration;
    const endH = Math.floor(endMins / 60) % 24;
    const endM = endMins % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }, [startTime, duration]);

  // Get selected color object
  const selectedColor = EVENT_COLORS.find(c => c.key === color) || EVENT_COLORS[0];

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!title.trim()) {
      setError("Please enter an event title");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const [year, month, day] = date.split('-').map(Number);
      const [startH, startM] = startTime.split(':').map(Number);
      
      const startDate = new Date(year, month - 1, day, startH, startM);
      const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

      const eventData = {
        title: title.trim(),
        type,
        color,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        date: date,
        time: startTime,
        durationMinutes: duration,
        description: location || null,
        meta: {
          color,
          durationMinutes: duration,
        },
      };

      // Try provider handler first
      if (handlers && typeof handlers.handleAddEvent === 'function') {
        await handlers.handleAddEvent(eventData);
      } else {
        // Direct API call fallback
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
        
        if (!res.ok) {
          throw new Error('Failed to create event');
        }
      }

      onSuccess?.();
      setClose();
    } catch (err: any) {
      console.error('Failed to create event:', err);
      setError(err.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setClose();
    }
  };

  return (
    <div className={cn(
      "transition-all duration-300 ease-out",
      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
    )}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header with color accent */}
        <div className="relative">
          <div 
            className={cn(
              "absolute -top-6 -left-6 -right-6 h-2 rounded-t-xl bg-gradient-to-r",
              selectedColor.gradient
            )}
          />
          
          {/* Title Input - Premium styling */}
          <div className="pt-2">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's happening?"
              className={cn(
                "w-full text-2xl font-bold bg-transparent border-none outline-none",
                "text-slate-900 dark:text-white",
                "placeholder:text-slate-300 dark:placeholder:text-slate-600",
                "transition-colors"
              )}
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Press Enter to create, Escape to cancel
            </p>
          </div>
        </div>

        {/* Date & Time Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            When
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Date picker with nice styling */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl",
              "bg-slate-50 dark:bg-slate-800/60",
              "border border-slate-200 dark:border-slate-700/50",
              "hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            )}>
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={cn(
                  "bg-transparent border-none outline-none",
                  "text-sm font-medium text-slate-700 dark:text-slate-200"
                )}
              />
            </div>

            {/* Time display with nice styling */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl",
              "bg-slate-50 dark:bg-slate-800/60",
              "border border-slate-200 dark:border-slate-700/50",
              "hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            )}>
              <Timer className="w-4 h-4 text-slate-400" />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={cn(
                  "bg-transparent border-none outline-none",
                  "text-sm font-medium text-slate-700 dark:text-slate-200",
                  "w-[5.5rem]"
                )}
              />
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {formatTime12h(getEndTime())}
              </span>
            </div>
          </div>

          {/* Duration pills - Premium style */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_DURATIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDuration(d.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  "border",
                  duration === d.value
                    ? cn(
                        "text-white border-transparent shadow-md",
                        `bg-gradient-to-r ${selectedColor.gradient}`
                      )
                    : cn(
                        "bg-white dark:bg-slate-800",
                        "border-slate-200 dark:border-slate-700",
                        "text-slate-600 dark:text-slate-400",
                        "hover:border-slate-300 dark:hover:border-slate-600",
                        "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      )
                )}
              >
                {d.display}
              </button>
            ))}
          </div>
        </div>

        {/* Event Type Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <BookOpen className="w-3.5 h-3.5" />
            Type
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {EVENT_TYPES.map((t) => {
              const IconComponent = t.Icon;
              const isSelected = type === t.value;
              const typeColor = EVENT_COLORS.find(c => c.key === t.color) || EVENT_COLORS[0];
              
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setType(t.value);
                    setColor(t.color);
                  }}
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                    "border",
                    isSelected
                      ? cn(
                          "border-transparent shadow-lg",
                          `bg-gradient-to-br ${typeColor.gradient}`,
                          "text-white"
                        )
                      : cn(
                          "bg-white dark:bg-slate-800",
                          "border-slate-200 dark:border-slate-700",
                          "text-slate-600 dark:text-slate-400",
                          "hover:border-slate-300 dark:hover:border-slate-600",
                          "hover:shadow-md"
                        )
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5">
                      <Check className="w-3 h-3 text-white/80" />
                    </div>
                  )}
                  <IconComponent className={cn(
                    "w-5 h-5",
                    isSelected ? "text-white" : ""
                  )} />
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <Sparkles className="w-3.5 h-3.5" />
            Color
          </div>
          
          <div className="flex items-center gap-2">
            {EVENT_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setColor(c.key)}
                className={cn(
                  "w-8 h-8 rounded-full transition-all duration-200",
                  "bg-gradient-to-br",
                  c.gradient,
                  color === c.key
                    ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-110 shadow-lg"
                    : "hover:scale-110 opacity-70 hover:opacity-100",
                  color === c.key && c.ring
                )}
                title={c.name}
              >
                {color === c.key && (
                  <Check className="w-4 h-4 text-white mx-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-colors",
            "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform duration-200",
            showAdvanced && "rotate-180"
          )} />
          {showAdvanced ? 'Less options' : 'More options'}
        </button>

        {/* Advanced options */}
        {showAdvanced && (
          <div className={cn(
            "space-y-3 pt-3",
            "border-t border-slate-200 dark:border-slate-700/50",
            "animate-in slide-in-from-top-2 duration-200"
          )}>
            {/* Location */}
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl",
              "bg-slate-50 dark:bg-slate-800/60",
              "border border-slate-200 dark:border-slate-700/50",
              "focus-within:border-slate-300 dark:focus-within:border-slate-600",
              "transition-colors"
            )}>
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location..."
                className={cn(
                  "flex-1 bg-transparent border-none outline-none",
                  "text-sm text-slate-700 dark:text-slate-200",
                  "placeholder:text-slate-400 dark:placeholder:text-slate-500"
                )}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className={cn(
            "px-4 py-3 rounded-xl",
            "bg-red-50 dark:bg-red-900/20",
            "border border-red-200 dark:border-red-800/50"
          )}>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Submit buttons */}
        <div className="flex items-center justify-between pt-3">
          <button
            type="button"
            onClick={() => setClose()}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
              "text-slate-600 dark:text-slate-400",
              "hover:text-slate-900 dark:hover:text-white",
              "hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
              "text-white shadow-lg",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2",
              "bg-gradient-to-r hover:shadow-xl",
              selectedColor.gradient,
              `shadow-${selectedColor.key}-500/25 hover:shadow-${selectedColor.key}-500/40`
            )}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Create Event</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
