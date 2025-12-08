"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { parseDatePreserveLocal } from "@/lib/dateHelpers";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Calendar, Clock, MapPin, ChevronDown, Check,
  Repeat, BookOpen, Palette, AlertTriangle, Users, FileText, Target, GraduationCap, Trash2
} from "lucide-react";
import { Event } from "@/types";

// Module/Course type
interface Module {
  id: string;
  name: string;
  code?: string;
  color?: string;
}

// Hex color mapping for color keys
const HEX_COLORS: Record<string, string> = {
  purple: '#9333EA', blue: '#3B82F6', green: '#10B981', emerald: '#10B981',
  red: '#EF4444', rose: '#F43F5E', orange: '#F97316', amber: '#F59E0B',
  pink: '#EC4899', cyan: '#06B6D4', teal: '#14B8A6', yellow: '#EAB308',
  indigo: '#6366F1', lime: '#84CC16', slate: '#64748B', gray: '#6B7280'
};

// Get hex color from any color format
const getHexColor = (color: string | undefined): string => {
  if (!color) return '#9333EA';
  if (color.startsWith('#')) return color;
  return HEX_COLORS[color.toLowerCase()] || '#9333EA';
};

// Color options (used when no module is selected)
const COLORS = [
  { key: "purple", hex: "#9333EA", name: "Purple" },
  { key: "blue", hex: "#3B82F6", name: "Blue" },
  { key: "emerald", hex: "#10B981", name: "Emerald" },
  { key: "rose", hex: "#F43F5E", name: "Rose" },
  { key: "amber", hex: "#F59E0B", name: "Amber" },
  { key: "cyan", hex: "#06B6D4", name: "Cyan" },
  { key: "pink", hex: "#EC4899", name: "Pink" },
  { key: "indigo", hex: "#6366F1", name: "Indigo" },
];

const EVENT_TYPES = [
  { value: "class", label: "Class", Icon: BookOpen },
  { value: "lab", label: "Lab", Icon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg> },
  { value: "tutorial", label: "Tutorial", Icon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
  { value: "exam", label: "Exam", Icon: AlertTriangle },
  { value: "meeting", label: "Meeting", Icon: Users },
  { value: "study", label: "Study", Icon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
  { value: "deadline", label: "Deadline", Icon: Clock },
  { value: "assignment", label: "Assignment", Icon: FileText },
  { value: "other", label: "Other", Icon: Target },
];

const RECURRENCE_PRESETS = [
  { label: "No repeat", days: [], interval: 0 },
  { label: "Daily", days: [0, 1, 2, 3, 4, 5, 6], interval: 1 },
  { label: "Weekdays (Mon-Fri)", days: [1, 2, 3, 4, 5], interval: 1 },
  { label: "Weekends (Sat-Sun)", days: [0, 6], interval: 1 },
  { label: "MWF", days: [1, 3, 5], interval: 1 },
  { label: "Tue/Thu", days: [2, 4], interval: 1 },
  { label: "Weekly", days: [-1], interval: 1 },
  { label: "Biweekly", days: [-1], interval: 2 },
  { label: "Monthly", days: [-2], interval: 1 }, // -2 = same day of month
  { label: "Custom...", days: [], interval: 0, isCustom: true },
];

// Day abbreviations for custom recurrence
const DAY_ABBREVIATIONS = [
  { value: 0, label: 'S', fullLabel: 'Sun' },
  { value: 1, label: 'M', fullLabel: 'Mon' },
  { value: 2, label: 'T', fullLabel: 'Tue' },
  { value: 3, label: 'W', fullLabel: 'Wed' },
  { value: 4, label: 'T', fullLabel: 'Thu' },
  { value: 5, label: 'F', fullLabel: 'Fri' },
  { value: 6, label: 'S', fullLabel: 'Sat' },
];

// Duration options with cleaner labels - more granular
const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 75, label: "1h 15min" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2.5 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
  { value: -1, label: "Custom...", isCustom: true },
];

interface UnifiedEventModalProps {
  event?: Event | null;
  mode: 'view' | 'edit' | 'create';
  initialDate?: Date;
  initialTime?: string;
  onClose: () => void;
  onSave?: (eventData: any) => Promise<void>;
  onDelete?: (event: Event) => Promise<void>;
  onEdit?: (event: Event) => void;
}

// Active dropdown type for proper close handling
type DropdownType = 'type' | 'color' | 'recurrence' | 'duration' | 'module' | null;

export default function UnifiedEventModal({
  event,
  mode: initialMode,
  initialDate,
  initialTime,
  onClose,
  onSave,
  onDelete,
  onEdit,
}: UnifiedEventModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [mode, setMode] = useState(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState(event?.title || "");
  const [date, setDate] = useState(() => {
    if (event?.startDate) {
      const d = parseDatePreserveLocal(event.startDate) || new Date(String(event.startDate));
      return format(d, "yyyy-MM-dd");
    }
    if (initialDate) return format(initialDate, "yyyy-MM-dd");
    return format(new Date(), "yyyy-MM-dd");
  });
  const [startTime, setStartTime] = useState(() => {
    if (event?.startDate) {
      const d = parseDatePreserveLocal(event.startDate) || new Date(String(event.startDate));
      return format(d, "HH:mm");
    }
    if (initialTime) return initialTime;
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
    return format(now, "HH:mm");
  });
  const [duration, setDuration] = useState(() => {
    if (event?.startDate && event?.endDate) {
      const start = parseDatePreserveLocal(event.startDate) || new Date(String(event.startDate));
      const end = parseDatePreserveLocal(event.endDate) || new Date(String(event.endDate));
      return Math.round((end.getTime() - start.getTime()) / 60000);
    }
    return 60;
  });
  const [type, setType] = useState(event?.type || "class");
  const [color, setColor] = useState(() => {
    const c = event?.color || event?.colorKey || (event as any)?.variant || "purple";
    return c.toLowerCase();
  });
  const [location, setLocation] = useState((event as any)?.location || "");
  const [description, setDescription] = useState((event as any)?.description || "");
  const [recurrencePreset, setRecurrencePreset] = useState("No repeat");
  
  // Custom input states
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [customDurationHours, setCustomDurationHours] = useState(1);
  const [customDurationMinutes, setCustomDurationMinutes] = useState(0);
  const [showCustomRecurrence, setShowCustomRecurrence] = useState(false);
  const [customRecurrenceDays, setCustomRecurrenceDays] = useState<number[]>([]);
  
  // Module state - fetch from /api/courses
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(() => {
    // If event has a linked course, use it
    if ((event as any)?.courses) {
      return {
        id: (event as any).courses.id,
        name: (event as any).courses.name,
        color: (event as any).courses.color,
      };
    }
    if ((event as any)?.course_id) {
      return { id: (event as any).course_id, name: '', color: undefined };
    }
    return null;
  });
  
  // Fetch modules on mount
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch('/api/courses');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.courses)) {
            setModules(data.courses);
            // If we have a course_id but no name, find it
            if (selectedModule?.id && !selectedModule.name) {
              const found = data.courses.find((c: Module) => c.id === selectedModule.id);
              if (found) setSelectedModule(found);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch modules:', err);
      }
    };
    fetchModules();
  }, []);
  
  // Compute effective color - module color takes priority
  const effectiveColor = useMemo(() => {
    if (selectedModule?.color) {
      return getHexColor(selectedModule.color);
    }
    return getHexColor(color);
  }, [selectedModule, color]);
  
  // Single active dropdown state - only one can be open at a time
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);

  // Toggle dropdown - closes others and opens/closes this one
  const toggleDropdown = useCallback((dropdown: DropdownType) => {
    setActiveDropdown(prev => prev === dropdown ? null : dropdown);
  }, []);

  // Close all dropdowns
  const closeAllDropdowns = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  useEffect(() => {
    if ((mode === 'create' || mode === 'edit') && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeDropdown) {
          closeAllDropdowns();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mode, onClose, activeDropdown, closeAllDropdowns]);

  // Close dropdowns when clicking outside dropdown areas
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is outside any dropdown
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        closeAllDropdowns();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeAllDropdowns]);

  const selectedColor = COLORS.find(c => c.key === color) || COLORS[0];
  const selectedType = EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];

  // Format end time display
  const endTimeDisplay = useMemo(() => {
    const [h, m] = startTime.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const endMinutes = startMinutes + duration;
    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;
    const formatTime = (hour: number, min: number) => {
      const h12 = hour % 12 || 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      return min === 0 ? `${h12} ${ampm}` : `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
    };
    return formatTime(endH, endM);
  }, [startTime, duration]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const [h, m] = startTime.split(':').map(Number);
      const [y, mo, d] = date.split('-').map(Number);
      const startDate = new Date(y, mo - 1, d, h, m);
      const endDate = new Date(startDate.getTime() + duration * 60000);

      // Handle custom recurrence or preset
      let recurrenceDays: number[] = [];
      let recurrenceInterval = 1;
      
      if (showCustomRecurrence && customRecurrenceDays.length > 0) {
        // Use custom selected days
        recurrenceDays = [...customRecurrenceDays];
        recurrenceInterval = 1;
      } else {
        const preset = RECURRENCE_PRESETS.find(p => p.label === recurrencePreset);
        recurrenceDays = preset?.days || [];
        recurrenceInterval = preset?.interval || 1;
        
        // -1 means "same day as start date" (Weekly)
        if (recurrenceDays.includes(-1)) {
          recurrenceDays = [startDate.getDay()];
        }
        // -2 means "monthly" - same day of month
        if (recurrenceDays.includes(-2)) {
          recurrenceDays = [];
          // Monthly recurrence - handled differently
        }
      }

      const eventData = {
        id: event?.id,
        title: title.trim(),
        type,
        color: selectedModule?.color || color, // Use module color if available
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        date,
        time: startTime,
        durationMinutes: duration,
        location: location.trim() || null,
        course_id: selectedModule?.id || null, // Link to module
        meta: { 
          color: selectedModule?.color || color, 
          durationMinutes: duration, 
          location: location.trim() || null,
          course_id: selectedModule?.id || null,
        },
        ...(recurrenceDays.length > 0 && {
          repeatOption: 'weekly',
          byDays: recurrenceDays,
          interval: recurrenceInterval,
        }),
      };

      await onSave?.(eventData);
      onClose();
    } catch (err: any) {
      console.error('Failed to save event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete?.(event);
      onClose();
    } catch (err) {
      console.error('Failed to delete:', err);
      setIsDeleting(false);
    }
  };

  if (typeof window === 'undefined') return null;

  // VIEW MODE
  if (mode === 'view' && event) {
    const eventDate = parseDatePreserveLocal(event.startDate) || new Date(String(event.startDate));
    const eventEndDate = parseDatePreserveLocal(event.endDate) || new Date(String(event.endDate));
    
    return createPortal(
      <AnimatePresence mode="wait">
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg mx-4 rounded-xl shadow-2xl overflow-hidden bg-white dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-base font-medium text-slate-700 dark:text-slate-200">{event.title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="min-w-[80px] text-slate-500">Date</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {format(eventDate, "EEEE, MMMM d, yyyy")}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="min-w-[80px] text-slate-500">Time</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {format(eventDate, "h:mm a")} – {format(eventEndDate, "h:mm a")}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span className="min-w-[80px] text-slate-500">Type</span>
                <span 
                  className="px-2.5 py-1 rounded-md text-xs font-medium capitalize"
                  style={{ backgroundColor: `${selectedColor.hex}15`, color: selectedColor.hex }}
                >
                  {event.type || 'Event'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Palette className="w-4 h-4 text-slate-400" />
                <span className="min-w-[80px] text-slate-500">Color</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedColor.hex }} />
                  <span className="font-medium text-slate-900 dark:text-white capitalize">{color}</span>
                </div>
              </div>

              {(event as any).location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="min-w-[80px] text-slate-500">Location</span>
                  <span className="font-medium text-slate-900 dark:text-white">{(event as any).location}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              {onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => setMode('edit')}
                  className="ml-auto px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                  style={{ backgroundColor: selectedColor.hex }}
                >
                  Edit Event
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>,
      document.body
    );
  }

  // CREATE/EDIT MODE
  return createPortal(
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[99999] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-slate-900 max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - compact and subtle */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <h2 className="text-base font-medium text-slate-700 dark:text-slate-200">
              {mode === 'edit' ? 'Edit Event' : 'Create Event'}
            </h2>
            <div className="flex items-center gap-2">
              {mode === 'edit' && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title={isDeleting ? 'Deleting...' : 'Delete event'}
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-5">
              {/* Title Input - Large and prominent */}
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border-none bg-transparent text-xl font-semibold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                placeholder="Event title"
              />

              <div className="space-y-4">
                {/* Date Row */}
                <div className="flex items-center gap-3 text-[13px]">
                  <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="min-w-[80px] text-slate-500">Date</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Time Row - Start and End */}
                <div className="flex items-center gap-3 text-[13px]">
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="min-w-[80px] text-slate-500">Time</span>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-[110px] h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <span className="text-slate-400 font-medium">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium">
                      {endTimeDisplay}
                    </span>
                  </div>
                </div>

                {/* Duration Row - Input with quick presets */}
                <div className="flex items-center gap-3 text-[13px]">
                  <div className="w-4 h-4 flex-shrink-0" />
                  <span className="min-w-[80px] text-slate-500">Duration</span>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                      className="w-20 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <span className="text-slate-500 text-xs">min</span>
                    <div className="flex flex-wrap gap-1">
                      {[30, 60, 90, 120].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setDuration(mins)}
                          className={cn(
                            "px-2 py-1 text-[10px] font-medium rounded transition-all",
                            duration === mins
                              ? "bg-purple-600 text-white"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                          )}
                        >
                          {mins < 60 ? `${mins}m` : `${mins/60}h`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Event Type Row */}
                <div className="flex items-center gap-3 text-[13px]">
                  <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="min-w-[80px] text-slate-500">Type</span>
                  <div className="relative flex-1" data-dropdown>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleDropdown('type'); }}
                      className={cn(
                        "w-full h-9 px-3 rounded-lg border text-sm text-left flex items-center justify-between transition-all",
                        activeDropdown === 'type' 
                          ? "border-purple-500 ring-2 ring-purple-500 bg-white dark:bg-slate-800" 
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                    >
                      <span className="flex items-center gap-2 text-slate-900 dark:text-white">
                        <selectedType.Icon />
                        {selectedType.label}
                      </span>
                      <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", activeDropdown === 'type' && "rotate-180")} />
                    </button>
                    {activeDropdown === 'type' && (
                      <div className="absolute left-0 top-full z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
                        {EVENT_TYPES.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => { setType(t.value); closeAllDropdowns(); }}
                            className={cn(
                              "w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between",
                              type === t.value && "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <t.Icon />
                              {t.label}
                            </span>
                            {type === t.value && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Module/Course Row - Links event to a module for color */}
                <div className="flex items-center gap-3 text-[13px]">
                  <GraduationCap className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="min-w-[80px] text-slate-500">Module</span>
                  <div className="relative flex-1" data-dropdown>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleDropdown('module'); }}
                      className={cn(
                        "w-full h-9 px-3 rounded-lg border text-sm text-left flex items-center justify-between transition-all",
                        activeDropdown === 'module' 
                          ? "border-purple-500 ring-2 ring-purple-500 bg-white dark:bg-slate-800" 
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                      style={selectedModule?.color ? { 
                        backgroundColor: `${getHexColor(selectedModule.color)}08`,
                        borderColor: activeDropdown === 'module' ? undefined : `${getHexColor(selectedModule.color)}40`
                      } : undefined}
                    >
                      <span className="flex items-center gap-2">
                        {selectedModule ? (
                          <>
                            <span 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: getHexColor(selectedModule.color) }}
                            />
                            <span style={{ color: getHexColor(selectedModule.color) }} className="font-medium truncate">
                              {selectedModule.name || selectedModule.code || 'Module'}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400">No module linked</span>
                        )}
                      </span>
                      <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", activeDropdown === 'module' && "rotate-180")} />
                    </button>
                    {activeDropdown === 'module' && (
                      <div className="absolute left-0 top-full z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
                        {/* Clear selection */}
                        <button
                          type="button"
                          onClick={() => { setSelectedModule(null); closeAllDropdowns(); }}
                          className={cn(
                            "w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between",
                            !selectedModule && "bg-slate-50 dark:bg-slate-700"
                          )}
                        >
                          <span className="flex items-center gap-2 text-slate-500">
                            <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                            No module
                          </span>
                          {!selectedModule && <Check className="w-4 h-4 text-slate-500" />}
                        </button>
                        {modules.map((mod) => {
                          const modColor = getHexColor(mod.color);
                          const isSelected = selectedModule?.id === mod.id;
                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => { setSelectedModule(mod); closeAllDropdowns(); }}
                              className={cn(
                                "w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between"
                              )}
                              style={isSelected ? { backgroundColor: `${modColor}10` } : undefined}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <span 
                                  className="w-3 h-3 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: modColor }}
                                />
                                <span style={{ color: modColor }} className="font-medium truncate">
                                  {mod.name || mod.code}
                                </span>
                              </span>
                              {isSelected && <Check className="w-4 h-4 flex-shrink-0" style={{ color: modColor }} />}
                            </button>
                          );
                        })}
                        {modules.length === 0 && (
                          <div className="px-4 py-3 text-sm text-slate-400 text-center">
                            No modules found. Create modules in /modules first.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Color Row - Only show if no module selected */}
                {!selectedModule && (
                <div className="flex items-center gap-3 text-[13px]">
                  <Palette className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="min-w-[80px] text-slate-500">Color</span>
                  <div className="relative flex-1" data-dropdown>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleDropdown('color'); }}
                      className={cn(
                        "w-full h-9 px-3 rounded-lg border text-sm text-left flex items-center justify-between transition-all",
                        activeDropdown === 'color' 
                          ? "border-purple-500 ring-2 ring-purple-500 bg-white dark:bg-slate-800" 
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                      style={{ backgroundColor: `${selectedColor.hex}08` }}
                    >
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: selectedColor.hex }} />
                        <span style={{ color: selectedColor.hex }} className="font-medium">{selectedColor.name}</span>
                      </span>
                      <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", activeDropdown === 'color' && "rotate-180")} />
                    </button>
                    {activeDropdown === 'color' && (
                      <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
                        {COLORS.map((c) => (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() => { setColor(c.key); closeAllDropdowns(); }}
                            className={cn(
                              "w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between",
                              color === c.key && "bg-opacity-10"
                            )}
                            style={{ backgroundColor: color === c.key ? `${c.hex}15` : undefined }}
                          >
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: c.hex }} />
                              <span style={{ color: c.hex }} className="font-medium">{c.name}</span>
                            </span>
                            {color === c.key && <Check className="w-4 h-4" style={{ color: c.hex }} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Recurrence Row - Preset buttons with custom option */}
                <div className="flex items-center gap-3 text-[13px]">
                  <Repeat className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="min-w-[80px] text-slate-500">Repeat</span>
                  <div className="flex-1 flex flex-wrap gap-1.5">
                    {[
                      { label: 'None', value: 'No repeat' },
                      { label: 'Daily', value: 'Daily' },
                      { label: 'Weekly', value: 'Weekly' },
                      { label: 'MWF', value: 'MWF' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setRecurrencePreset(opt.value);
                          setShowCustomRecurrence(false);
                          setCustomRecurrenceDays([]);
                        }}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                          recurrencePreset === opt.value && !showCustomRecurrence
                            ? "bg-purple-600 text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowCustomRecurrence(!showCustomRecurrence)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                        showCustomRecurrence
                          ? "bg-purple-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                    >
                      Custom
                    </button>
                  </div>
                </div>
                
                {/* Custom Day Selector */}
                {showCustomRecurrence && (
                  <div className="flex items-center gap-3 text-[13px] ml-[100px]">
                    <div className="flex-1 flex gap-1.5">
                      {DAY_ABBREVIATIONS.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            setCustomRecurrenceDays(prev => 
                              prev.includes(day.value) 
                                ? prev.filter(d => d !== day.value)
                                : [...prev, day.value].sort()
                            );
                          }}
                          className={cn(
                            "w-8 h-8 rounded-full text-xs font-medium transition-all",
                            customRecurrenceDays.includes(day.value)
                              ? "bg-purple-600 text-white shadow-md"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                          )}
                          title={day.fullLabel}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </form>

          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!title.trim() || isSubmitting}
              className={cn(
                "px-5 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-lg",
                !title.trim() || isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:opacity-90 hover:shadow-xl"
              )}
              style={{ backgroundColor: effectiveColor, boxShadow: `0 4px 14px ${effectiveColor}40` }}
            >
              {isSubmitting ? "Saving..." : mode === 'edit' ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
