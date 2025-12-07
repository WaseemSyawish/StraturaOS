"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X, Clock, Check, Calendar, Sparkles, Timer, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface InlineEventCreatorProps {
  date: Date;
  time?: string; // "HH:MM" format - optional, will default to now + 5 mins
  onSave: (data: { title: string; startTime: string; endTime: string; color: string }) => Promise<void>;
  onCancel: () => void;
  position?: { top: number; left: number; width: number };
}

// Premium gradient color palette matching landing page
const QUICK_COLORS = [
  { key: "purple", hex: "#9333EA", label: "Purple", gradient: "from-purple-500 to-violet-600", bg: "bg-purple-500", ring: "ring-purple-500" },
  { key: "blue", hex: "#3B82F6", label: "Blue", gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-500", ring: "ring-blue-500" },
  { key: "emerald", hex: "#10B981", label: "Emerald", gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-500", ring: "ring-emerald-500" },
  { key: "rose", hex: "#F43F5E", label: "Rose", gradient: "from-rose-500 to-pink-600", bg: "bg-rose-500", ring: "ring-rose-500" },
  { key: "amber", hex: "#F59E0B", label: "Amber", gradient: "from-amber-500 to-orange-500", bg: "bg-amber-500", ring: "ring-amber-500" },
  { key: "cyan", hex: "#06B6D4", label: "Cyan", gradient: "from-cyan-500 to-sky-500", bg: "bg-cyan-500", ring: "ring-cyan-500" },
];

const DURATION_OPTIONS = [
  { label: "15m", minutes: 15, display: "15 min" },
  { label: "30m", minutes: 30, display: "30 min" },
  { label: "1h", minutes: 60, display: "1 hour" },
  { label: "2h", minutes: 120, display: "2 hours" },
];

// Round time to next 5 minutes
const roundToNext5Minutes = (date: Date): Date => {
  const ms = 5 * 60 * 1000; // 5 minutes in ms
  return new Date(Math.ceil(date.getTime() / ms) * ms);
};

// Format time as HH:MM
const formatTimeHHMM = (date: Date): string => {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

export default function InlineEventCreator({
  date,
  time: providedTime,
  onSave,
  onCancel,
  position,
}: InlineEventCreatorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  // Helper: check if a time string (HH:MM) on the given date is in the past
  const isTimeInPast = useCallback((timeStr: string, eventDate: Date) => {
    const [h, m] = timeStr.split(":").map(Number);
    const now = new Date();
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(h, m, 0, 0);
    return eventDateTime < now;
  }, []);
  
  // Smart time: use provided time or default to now + 5 mins (rounded)
  // IMPORTANT: If provided time is in the past for today, redirect to now + 5 mins
  const smartDefaultTime = useMemo(() => {
    const now = new Date();
    const futureDefault = formatTimeHHMM(roundToNext5Minutes(new Date(now.getTime() + 5 * 60 * 1000)));
    
    if (!providedTime) return futureDefault;
    
    // Check if provided time is in the past (only relevant for today's date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDay = new Date(date);
    eventDay.setHours(0, 0, 0, 0);
    
    // If event is for today, check if time is in past
    if (eventDay.getTime() === today.getTime()) {
      const [h, m] = providedTime.split(":").map(Number);
      const eventTime = new Date();
      eventTime.setHours(h, m, 0, 0);
      if (eventTime < now) {
        // Past time clicked - redirect to now + 5 mins
        return futureDefault;
      }
    }
    
    return providedTime;
  }, [providedTime, date]);
  
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(smartDefaultTime);
  const [color, setColor] = useState("purple");
  const [duration, setDuration] = useState(60); // minutes
  const [saving, setSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [pastTimeWarning, setPastTimeWarning] = useState(false);

  // Calculate end time based on duration
  const getEndTime = useCallback(() => {
    const [h, m] = startTime.split(":").map(Number);
    const totalMinutes = h * 60 + m + duration;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  }, [startTime, duration]);

  // Format time for display (12-hour)
  const formatTimeDisplay = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const hour12 = h % 12 || 12;
    const ampm = h < 12 ? "AM" : "PM";
    return m === 0 ? `${hour12} ${ampm}` : `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
  };
  
  // Adjust time by minutes - with past time prevention for today
  const adjustTime = (minutes: number) => {
    const [h, m] = startTime.split(":").map(Number);
    let totalMinutes = h * 60 + m + minutes;
    if (totalMinutes < 0) totalMinutes = 0;
    if (totalMinutes >= 24 * 60) totalMinutes = 23 * 60 + 55;
    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    const newTimeStr = `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
    
    // Check if new time would be in the past for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDay = new Date(date);
    eventDay.setHours(0, 0, 0, 0);
    
    if (eventDay.getTime() === today.getTime()) {
      const now = new Date();
      const proposedTime = new Date();
      proposedTime.setHours(newH, newM, 0, 0);
      
      if (proposedTime < now) {
        // Show warning and prevent going to past
        setPastTimeWarning(true);
        setTimeout(() => setPastTimeWarning(false), 2000);
        return;
      }
    }
    
    setStartTime(newTimeStr);
  };

  useEffect(() => {
    // Animate in with slight delay for smooth entrance
    const animTimer = setTimeout(() => setIsVisible(true), 10);
    // Focus input
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => {
      clearTimeout(animTimer);
      clearTimeout(focusTimer);
    };
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (title.trim()) {
          handleSave();
        } else {
          onCancel();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [title, onCancel, startTime]);

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        startTime,
        endTime: getEndTime(),
        color,
      });
    } catch (err) {
      console.error("Failed to save event:", err);
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const selectedColor = QUICK_COLORS.find((c) => c.key === color) || QUICK_COLORS[0];

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute z-50",
        "transition-all duration-300 ease-out",
        isVisible 
          ? "opacity-100 translate-y-0 scale-100" 
          : "opacity-0 -translate-y-3 scale-95"
      )}
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        width: position?.width ? Math.max(position.width, 360) : 360,
      }}
    >
      {/* Adaptive light/dark modal */}
      <div 
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: isDark 
            ? 'linear-gradient(180deg, rgba(18, 18, 26, 0.98) 0%, rgba(10, 10, 15, 0.99) 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.99) 100%)',
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 80px -20px ' + selectedColor.hex + '40'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05), 0 0 60px -20px ' + selectedColor.hex + '30',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Gradient accent bar */}
        <div 
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${selectedColor.hex}, ${selectedColor.hex}88)` }}
        />
        
        <div className="p-5">
          {/* Header with icon and input */}
          <div className="flex items-start gap-4 mb-5">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
              style={{ 
                background: `linear-gradient(135deg, ${selectedColor.hex} 0%, ${selectedColor.hex}cc 100%)`,
                boxShadow: `0 8px 24px ${selectedColor.hex}40`
              }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 pt-1">
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's happening?"
                className={cn(
                  "w-full text-xl font-semibold bg-transparent border-none outline-none",
                  isDark ? "text-white placeholder:text-gray-500" : "text-slate-900 placeholder:text-slate-400"
                )}
                style={{ caretColor: selectedColor.hex }}
                disabled={saving}
              />
              <p className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-slate-500")}>Press Enter to save, Esc to cancel</p>
            </div>
          </div>

          {/* Time section - adaptive card */}
          <div 
            className="rounded-xl p-4 mb-4"
            style={{ 
              background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)'
            }}
          >
            {/* Date & Time display */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className={cn("w-4 h-4", isDark ? "text-gray-400" : "text-slate-500")} />
                <span className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-slate-700")}>
                  {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
              </div>
              <div 
                className="h-4 w-px"
                style={{ background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
              />
              <div className="flex items-center gap-3">
                {/* Time adjuster */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => adjustTime(-15)}
                    className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center transition-all",
                      isDark 
                        ? "text-gray-400 hover:text-white hover:bg-white/10" 
                        : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-lg",
                    isDark ? "bg-white/5" : "bg-slate-100"
                  )}>
                    <Clock className={cn("w-3.5 h-3.5", isDark ? "text-gray-400" : "text-slate-500")} />
                    <span className={cn("text-sm font-semibold tabular-nums", isDark ? "text-white" : "text-slate-900")}>
                      {formatTimeDisplay(startTime)}
                    </span>
                  </div>
                  <button
                    onClick={() => adjustTime(15)}
                    className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center transition-all",
                      isDark 
                        ? "text-gray-400 hover:text-white hover:bg-white/10" 
                        : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
                <span className={cn("", isDark ? "text-gray-500" : "text-slate-400")}>–</span>
                <span className={cn("text-sm font-medium tabular-nums", isDark ? "text-gray-400" : "text-slate-500")}>
                  {formatTimeDisplay(getEndTime())}
                </span>
              </div>
              
              {/* Past time warning */}
              {pastTimeWarning && (
                <div className={cn(
                  "text-xs font-medium animate-pulse px-2 py-1 rounded-md",
                  isDark 
                    ? "text-amber-400 bg-amber-500/10" 
                    : "text-amber-600 bg-amber-50"
                )}>
                  ⚠️ Can't schedule events in the past
                </div>
              )}
            </div>

            {/* Duration pills */}
            <div className="flex items-center gap-2">
              <Timer className={cn("w-4 h-4", isDark ? "text-gray-500" : "text-slate-500")} />
              <div className="flex items-center gap-1.5 flex-1">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.minutes}
                    onClick={() => setDuration(opt.minutes)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                      duration === opt.minutes
                        ? "text-white shadow-lg"
                        : isDark 
                          ? "text-gray-400 hover:text-white hover:bg-white/5"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    )}
                    style={duration === opt.minutes ? { 
                      background: `linear-gradient(135deg, ${selectedColor.hex} 0%, ${selectedColor.hex}cc 100%)`,
                      boxShadow: `0 4px 12px ${selectedColor.hex}40`
                    } : {}}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color picker & Actions */}
          <div className="flex items-center justify-between">
            {/* Color dots */}
            <div className="flex items-center gap-2.5">
              {QUICK_COLORS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setColor(c.key)}
                  className={cn(
                    "w-7 h-7 rounded-full transition-all duration-200 relative",
                    color === c.key 
                      ? "scale-110" 
                      : "opacity-50 hover:opacity-100 hover:scale-105"
                  )}
                  style={{ 
                    background: `linear-gradient(135deg, ${c.hex} 0%, ${c.hex}cc 100%)`,
                    boxShadow: color === c.key 
                      ? (isDark 
                          ? `0 0 0 2px rgba(10, 10, 15, 1), 0 0 0 4px ${c.hex}, 0 4px 12px ${c.hex}40` 
                          : `0 0 0 2px white, 0 0 0 4px ${c.hex}, 0 4px 12px ${c.hex}40`)
                      : 'none'
                  }}
                  title={c.label}
                >
                  {color === c.key && (
                    <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-200",
                  isDark 
                    ? "text-gray-400 hover:text-white hover:bg-white/5" 
                    : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                )}
                title="Cancel (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim() || saving}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
                  "flex items-center gap-2",
                  title.trim() && !saving
                    ? "text-white hover:-translate-y-0.5 active:translate-y-0"
                    : isDark ? "text-gray-500 cursor-not-allowed" : "text-slate-400 cursor-not-allowed"
                )}
                style={title.trim() && !saving ? { 
                  background: `linear-gradient(135deg, ${selectedColor.hex} 0%, ${selectedColor.hex}cc 100%)`,
                  boxShadow: `0 4px 14px ${selectedColor.hex}40`
                } : {
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }}
                title="Save (Enter)"
              >
                {saving ? (
                  <div 
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" 
                  />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{saving ? "Saving..." : "Create"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
