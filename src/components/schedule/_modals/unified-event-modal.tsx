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
  Repeat, BookOpen, Palette, AlertTriangle, Users, FileText, Target, GraduationCap, Trash2,
  FlaskConical, Lightbulb, Heart, Sparkles, ChevronRight
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

// Convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Color options with vibrant gradients
const COLORS = [
  { key: "purple", hex: "#9333EA", name: "Purple" },
  { key: "blue", hex: "#3B82F6", name: "Blue" },
  { key: "emerald", hex: "#10B981", name: "Emerald" },
  { key: "rose", hex: "#F43F5E", name: "Rose" },
  { key: "amber", hex: "#F59E0B", name: "Amber" },
  { key: "cyan", hex: "#06B6D4", name: "Cyan" },
  { key: "pink", hex: "#EC4899", name: "Pink" },
  { key: "indigo", hex: "#6366F1", name: "Indigo" },
  { key: "orange", hex: "#F97316", name: "Orange" },
  { key: "teal", hex: "#14B8A6", name: "Teal" },
];

const EVENT_TYPES = [
  { value: "class", label: "Class", Icon: BookOpen },
  { value: "lab", label: "Lab", Icon: FlaskConical },
  { value: "tutorial", label: "Tutorial", Icon: Lightbulb },
  { value: "exam", label: "Exam", Icon: AlertTriangle },
  { value: "meeting", label: "Meeting", Icon: Users },
  { value: "workshop", label: "Workshop", Icon: Sparkles },
  { value: "presentation", label: "Presentation", Icon: Users },
  { value: "study", label: "Study", Icon: BookOpen },
  { value: "deadline", label: "Deadline", Icon: Clock },
  { value: "assignment", label: "Assignment", Icon: FileText },
  { value: "personal", label: "Personal", Icon: Heart },
  { value: "other", label: "Other", Icon: Target },
];

const normalizeLabel = (value: unknown) =>
  String(value || '').trim().toLowerCase().replace(/[-_\s]+/g, ' ');

const getSemesterOrderFromName = (name: unknown) => {
  const s = String(name || '').toLowerCase();
  if (/\b(first|1st|semester\s*1|s1)\b/.test(s)) return '1';
  if (/\b(second|2nd|semester\s*2|s2)\b/.test(s)) return '2';
  if (/\b(third|3rd|semester\s*3|s3)\b/.test(s)) return '3';
  return null;
};

const RECURRENCE_PRESETS = [
  { label: "No repeat", days: [], interval: 0 },
  { label: "Daily", days: [0, 1, 2, 3, 4, 5, 6], interval: 1 },
  { label: "Weekdays (Mon-Fri)", days: [1, 2, 3, 4, 5], interval: 1 },
  { label: "MWF", days: [1, 3, 5], interval: 1 },
  { label: "Tue/Thu", days: [2, 4], interval: 1 },
  { label: "Weekly", days: [-1], interval: 1 },
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
  const [serverEvent, setServerEvent] = useState<any>(null);
  const [loadingEvent, setLoadingEvent] = useState(false);

  // Resolve the most complete event data: server > prop > raw
  const resolvedEvent = useMemo(() => {
    const ev = serverEvent || event;
    if (!ev) return null;
    const raw = (ev as any)?.raw || {};
    return {
      ...raw,
      ...ev,
      courses: ev.courses || (ev as any)?.courses || raw.courses || null,
      location: (ev as any)?.location || raw.location || null,
      type: (ev as any)?.type || raw.type || raw.sessionType || 'class',
      course_id: (ev as any)?.course_id || raw.course_id || null,
      meta: (ev as any)?.meta || raw.meta || null,
      template_id: (ev as any)?.template_id || raw.template_id || raw.templateId || null,
    };
  }, [serverEvent, event]);
  
  // Fetch full event data from server when editing/viewing
  useEffect(() => {
    if ((initialMode === 'edit' || initialMode === 'view') && event?.id) {
      setLoadingEvent(true);
      fetch(`/api/events/${encodeURIComponent(event.id)}`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const serverEv = data?.event || data;
          if (serverEv && typeof serverEv === 'object') {
            setServerEvent(serverEv);
          }
        })
        .catch(err => console.warn('Failed to fetch event details:', err))
        .finally(() => setLoadingEvent(false));
    }
  }, [event?.id, initialMode]);
  
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
  const [type, setType] = useState(() => {
    return (event as any)?.type || (event as any)?.raw?.type || "class";
  });
  const [color, setColor] = useState(() => {
    const c = event?.color || (event as any)?.colorKey || (event as any)?.variant || "purple";
    return c.toLowerCase();
  });
  const [location, setLocation] = useState(() => {
    return (event as any)?.location || (event as any)?.raw?.location || "";
  });
  const [description, setDescription] = useState(() => {
    let desc = (event as any)?.description || "";
    desc = desc.replace(/\[META\][\s\S]*?\[META\]/g, '').trim();
    const loc = ((event as any)?.location || (event as any)?.raw?.location || "").trim().toLowerCase();
    if (loc && desc.trim().toLowerCase() === loc) return "";
    return desc;
  });
  const [recurrencePreset, setRecurrencePreset] = useState("No repeat");
  const [showCustomRecurrence, setShowCustomRecurrence] = useState(false);
  const [customRecurrenceDays, setCustomRecurrenceDays] = useState<number[]>([]);
  const [showNotes, setShowNotes] = useState(() => {
    // Auto-expand if there's existing notes content
    const desc = (event as any)?.description || "";
    return desc.replace(/\[META\][\s\S]*?\[META\]/g, '').trim().length > 0;
  });
  const [showRecurrence, setShowRecurrence] = useState(false);
  
  // Module state - fetch from /api/courses
  const [modules, setModules] = useState<Module[]>([]);
  const [semesterSettings, setSemesterSettings] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(() => {
    if ((event as any)?.courses) {
      return {
        id: (event as any).courses.id || (event as any).course_id,
        name: (event as any).courses.name,
        code: (event as any).courses.code,
        color: (event as any).courses.color,
      };
    }
    if ((event as any)?.course_id) {
      return { id: (event as any).course_id, name: '', color: undefined };
    }
    return null;
  });

  const activeSemester = useMemo(() => {
    if (!semesterSettings.length) return null;
    return semesterSettings.find((s: any) => s && s.is_active) || semesterSettings[0];
  }, [semesterSettings]);

  const filteredModules = useMemo(() => {
    if (!modules.length) return [];
    if (!activeSemester) return modules;

    const activeId = String(activeSemester.id || '');
    const activeName = String(activeSemester.name || '');
    const activeYear = activeSemester.start_date ? new Date(activeSemester.start_date).getFullYear() : null;
    const activeOrder = getSemesterOrderFromName(activeName);
    const activeLegacy = activeYear && activeOrder ? `${activeYear}-${activeOrder}` : null;

    const inSemester = modules.filter((mod: any) => {
      const semRaw = String(mod?.semester || '').trim();
      if (!semRaw) return false;
      if (semRaw === activeId) return true;
      if (activeLegacy && semRaw === activeLegacy) return true;
      if (normalizeLabel(semRaw) === normalizeLabel(activeName)) return true;
      return false;
    });

    if (!selectedModule?.id) return inSemester;
    if (inSemester.some((m: any) => String(m.id) === String(selectedModule.id))) return inSemester;
    const selectedFromAll = modules.find((m: any) => String(m.id) === String(selectedModule.id));
    return selectedFromAll ? [selectedFromAll, ...inSemester] : inSemester;
  }, [modules, activeSemester, selectedModule]);

  // Update form fields when server event loads
  useEffect(() => {
    if (serverEvent) {
      if (serverEvent.location && !location) setLocation(serverEvent.location);
      if (serverEvent.type) setType(serverEvent.type);
      if (serverEvent.description && !description) {
        let desc = serverEvent.description || '';
        desc = desc.replace(/\[META\][\s\S]*?\[META\]/g, '').trim();
        const loc = (serverEvent.location || '').trim().toLowerCase();
        if (desc && (!loc || desc.trim().toLowerCase() !== loc)) setDescription(desc);
      }
      if (serverEvent.courses && !selectedModule?.name) {
        setSelectedModule({
          id: serverEvent.courses.id || serverEvent.course_id,
          name: serverEvent.courses.name,
          code: serverEvent.courses.code,
          color: serverEvent.courses.color,
        });
      }
      if (serverEvent.color) {
        setColor(serverEvent.color.toLowerCase());
      } else if (serverEvent.courses?.color) {
        setColor(serverEvent.courses.color.toLowerCase());
      }
    }
  }, [serverEvent]);
  
  // Fetch modules on mount
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const [coursesRes, semestersRes] = await Promise.all([
          fetch('/api/courses', { credentials: 'include' }),
          fetch('/api/semester-settings', { credentials: 'include' }),
        ]);

        if (coursesRes.ok) {
          const data = await coursesRes.json();
          if (data.success && Array.isArray(data.courses)) {
            setModules(data.courses);
            if (selectedModule?.id && !selectedModule.name) {
              const found = data.courses.find((c: Module) => c.id === selectedModule.id);
              if (found) setSelectedModule(found);
            }
          }
        }

        if (semestersRes.ok) {
          const semData = await semestersRes.json();
          if (semData?.success && Array.isArray(semData.settings)) {
            setSemesterSettings(semData.settings);
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
  
  useEffect(() => {
    if ((mode === 'create' || mode === 'edit') && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 200);
    }
  }, [mode]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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

  // Format start time for display (12-hour)
  const startTimeDisplay = useMemo(() => {
    const [h, m] = startTime.split(':').map(Number);
    const h12 = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }, [startTime]);

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
        description: description.trim() || null,
        course_id: selectedModule?.id || null, // Link to module
        meta: { 
          color: selectedModule?.color || color, 
          durationMinutes: duration, 
          location: location.trim() || null,
          description: description.trim() || null,
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

  // VIEW MODE - Vibrant detail card
  if (mode === 'view' && event) {
    const eventDate = parseDatePreserveLocal(event.startDate) || new Date(String(event.startDate));
    const eventEndDate = parseDatePreserveLocal(event.endDate) || new Date(String(event.endDate));
    const ev = resolvedEvent || event;
    const evLocation = (ev as any)?.location || null;
    const evCourses = (ev as any)?.courses || null;
    const evType = (ev as any)?.type || 'event';
    const evDescRaw = ((ev as any)?.description || '').replace(/\[META\][\s\S]*?\[META\]/g, '').trim();
    const evDesc = (evLocation && evDescRaw && evDescRaw.trim().toLowerCase() === String(evLocation).trim().toLowerCase()) ? '' : evDescRaw;
    const durMins = Math.round((eventEndDate.getTime() - eventDate.getTime()) / 60000);
    const durLabel = durMins < 60 ? `${durMins}m` : durMins % 60 === 0 ? `${durMins / 60}h` : `${Math.floor(durMins / 60)}h ${durMins % 60}m`;
    
    return createPortal(
      <AnimatePresence mode="wait">
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-white dark:bg-[#1a1a2e]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Vibrant colored header */}
            <div 
              className="relative px-6 pt-6 pb-8 overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${effectiveColor} 0%, ${hexToRgba(effectiveColor, 0.8)} 100%)`,
              }}
            >
              {/* Decorative circles */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
              
              <div className="relative flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm mb-3">
                    <selectedType.Icon size={12} />
                    {evType}
                  </span>
                  <h2 className="text-xl font-bold text-white leading-snug mb-1">{event.title}</h2>
                  {evCourses && (
                    <p className="text-white/80 text-sm font-medium">
                      {evCourses.code ? `${evCourses.code} · ` : ''}{evCourses.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all duration-200 backdrop-blur-sm"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="px-6 py-5 space-y-4">
              {/* Date & Time card */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: hexToRgba(effectiveColor, 0.1) }}
                >
                  <Calendar className="w-5 h-5" style={{ color: effectiveColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {format(eventDate, "EEEE, MMM d")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {format(eventDate, "h:mm a")} – {format(eventEndDate, "h:mm a")} · {durLabel}
                  </p>
                </div>
              </div>

              {/* Location */}
              {evLocation && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: hexToRgba(effectiveColor, 0.1) }}
                  >
                    <MapPin className="w-5 h-5" style={{ color: effectiveColor }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{evLocation}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
                  </div>
                </div>
              )}

              {/* Description */}
              {evDesc && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">{evDesc}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 px-6 py-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
              {onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all duration-200"
                >
                  <Trash2 size={15} />
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => setMode('edit')}
                  className="ml-auto flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                  style={{ 
                    background: `linear-gradient(135deg, ${effectiveColor} 0%, ${hexToRgba(effectiveColor, 0.85)} 100%)`,
                    boxShadow: `0 4px 14px ${hexToRgba(effectiveColor, 0.35)}`
                  }}
                >
                  Edit Event
                  <ChevronRight size={15} />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>,
      document.body
    );
  }

  // CREATE/EDIT MODE - Vibrant, card-based form
  return createPortal(
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden bg-white dark:bg-[#1a1a2e] max-h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Vibrant gradient header */}
          <div 
            className="relative px-6 py-5 flex-shrink-0 overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${effectiveColor} 0%, ${hexToRgba(effectiveColor, 0.8)} 100%)`,
            }}
          >
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="absolute -bottom-3 -left-3 w-16 h-16 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {(() => {
                    const SelectedTypeIcon = EVENT_TYPES.find(t => t.value === type)?.Icon || BookOpen;
                    return <SelectedTypeIcon size={20} className="text-white" />;
                  })()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {mode === 'edit' ? 'Edit Event' : 'New Event'}
                  </h2>
                  <p className="text-white/70 text-xs font-medium">
                    {mode === 'edit' ? 'Update event details' : 'Fill in the details below'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {mode === 'edit' && onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 rounded-xl bg-white/15 hover:bg-red-500/80 text-white transition-all duration-200 backdrop-blur-sm"
                    title={isDeleting ? 'Deleting...' : 'Delete event'}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all duration-200 backdrop-blur-sm"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Loading indicator */}
          {loadingEvent && (
            <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/30 flex-shrink-0">
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Loading event details...
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-5">
              {/* Title Input - Large and prominent with colored underline */}
              <div className="relative">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-none bg-transparent text-xl font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 pb-2"
                  placeholder="Event title"
                />
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300"
                  style={{ 
                    background: title.trim() 
                      ? `linear-gradient(90deg, ${effectiveColor} 0%, ${hexToRgba(effectiveColor, 0.3)} 100%)` 
                      : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
                  }}
                />
              </div>

              <div className="space-y-3">
                {/* Date & Time Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4" style={{ color: effectiveColor }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: effectiveColor }}>Date & Time</span>
                  </div>
                  
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{ '--tw-ring-color': effectiveColor } as any}
                  />
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Start</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 transition-all duration-200"
                        style={{ '--tw-ring-color': effectiveColor } as any}
                      />
                    </div>
                    <div className="flex items-center justify-center pt-5">
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">End</label>
                      <div className="h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center">
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{endTimeDisplay}</span>
                      </div>
                    </div>
                  </div>

                  {/* Duration quick picks */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Duration</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                        className="w-20 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 transition-all duration-200"
                        style={{ '--tw-ring-color': effectiveColor } as any}
                      />
                      <span className="text-xs text-slate-400 mr-1">min</span>
                      <div className="flex gap-1.5">
                        {[30, 60, 90, 120].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setDuration(mins)}
                            className={cn(
                              "px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200",
                              duration === mins
                                ? "text-white shadow-md"
                                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                            )}
                            style={duration === mins ? { 
                              background: effectiveColor,
                              boxShadow: `0 2px 8px ${hexToRgba(effectiveColor, 0.35)}`
                            } : undefined}
                          >
                            {mins < 60 ? `${mins}m` : `${mins/60}h`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Type card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4" style={{ color: effectiveColor }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: effectiveColor }}>Event Type</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {EVENT_TYPES.map((t) => {
                      const active = type === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setType(t.value)}
                          className={cn(
                            "h-9 px-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                            active
                              ? "text-white border-transparent"
                              : "bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                          )}
                          style={active ? { background: effectiveColor, boxShadow: `0 4px 10px ${hexToRgba(effectiveColor, 0.3)}` } : undefined}
                        >
                          <t.Icon size={12} />
                          <span className="truncate">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location card - placed higher for faster access */}
                {(selectedModule || ['class', 'lab', 'tutorial', 'exam', 'workshop', 'presentation', 'meeting'].includes(type)) && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" style={{ color: effectiveColor }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: effectiveColor }}>Location</span>
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Room, building, or link..."
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-slate-400"
                    style={{ '--tw-ring-color': effectiveColor } as any}
                  />
                </div>
                )}

                {/* Module/Course card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-4 h-4" style={{ color: effectiveColor }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: effectiveColor }}>Module / Course</span>
                  </div>
                  {activeSemester?.name && (
                    <p className="mb-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {activeSemester.name}
                    </p>
                  )}
                  <div className="relative">
                    <select
                      value={selectedModule?.id || ''}
                      onChange={(e) => {
                        const id = e.target.value;
                        if (!id) {
                          setSelectedModule(null);
                          return;
                        }
                        const found = filteredModules.find((m) => String(m.id) === String(id)) || null;
                        setSelectedModule(found);
                      }}
                      className="w-full h-11 px-3.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 transition-all duration-200 appearance-none"
                      style={{ '--tw-ring-color': effectiveColor } as any}
                    >
                      <option value="">No module</option>
                      {filteredModules.map((mod) => (
                        <option key={mod.id} value={mod.id}>
                          {mod.code ? `${mod.code} · ` : ''}{mod.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {filteredModules.length === 0 && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">No modules available for active semester</p>
                  )}
                </div>

                {/* Color picker - only when no module */}
                {!selectedModule && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="w-4 h-4" style={{ color: effectiveColor }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: effectiveColor }}>Color</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {COLORS.map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setColor(c.key)}
                          className={cn(
                            "h-9 rounded-xl border transition-all",
                            color === c.key ? "ring-2 ring-offset-2 dark:ring-offset-[#1a1a2e]" : "hover:scale-[1.03]"
                          )}
                          style={{
                            background: c.hex,
                            borderColor: color === c.key ? c.hex : 'transparent',
                            '--tw-ring-color': c.hex,
                          } as any}
                          title={c.name}
                        >
                          <span className="sr-only">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes - only shown in edit mode or if existing content */}
                {false && (mode === 'edit' && (showNotes || description)) && (
                <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowNotes(!showNotes)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" style={{ color: effectiveColor }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: effectiveColor }}>Notes</span>
                      {description && <span className="text-[10px] text-slate-400 font-medium ml-1">({description.length} chars)</span>}
                    </div>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", showNotes ? "rotate-180" : "")} style={{ color: hexToRgba(effectiveColor, 0.5) }} />
                  </button>
                  <AnimatePresence>
                    {showNotes && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add notes or description..."
                            rows={3}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-slate-400 resize-none"
                            style={{ '--tw-ring-color': effectiveColor } as any}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                )}

                {/* Recurrence - only shown in edit mode */}
                {false && mode === 'edit' && (
                <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowRecurrence(!showRecurrence)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Repeat className="w-4 h-4" style={{ color: effectiveColor }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: effectiveColor }}>Repeat</span>
                      {recurrencePreset !== 'No repeat' && (
                        <span 
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: effectiveColor }}
                        >
                          {recurrencePreset}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", showRecurrence ? "rotate-180" : "")} style={{ color: hexToRgba(effectiveColor, 0.5) }} />
                  </button>
                  <AnimatePresence>
                    {showRecurrence && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'None', value: 'No repeat' },
                      { label: 'Daily', value: 'Daily' },
                      { label: 'Weekly', value: 'Weekly' },
                      { label: 'MWF', value: 'MWF' },
                      { label: 'T/Th', value: 'Tue/Thu' },
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
                          "px-3 py-2 text-xs font-bold rounded-xl transition-all duration-200",
                          recurrencePreset === opt.value && !showCustomRecurrence
                            ? "text-white shadow-md"
                            : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                        )}
                        style={recurrencePreset === opt.value && !showCustomRecurrence ? { 
                          background: effectiveColor,
                          boxShadow: `0 2px 8px ${hexToRgba(effectiveColor, 0.3)}`
                        } : undefined}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowCustomRecurrence(!showCustomRecurrence)}
                      className={cn(
                        "px-3 py-2 text-xs font-bold rounded-xl transition-all duration-200",
                        showCustomRecurrence
                          ? "text-white shadow-md"
                          : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                      )}
                      style={showCustomRecurrence ? { 
                        background: effectiveColor,
                        boxShadow: `0 2px 8px ${hexToRgba(effectiveColor, 0.3)}`
                      } : undefined}
                    >
                      Custom
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {showCustomRecurrence && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-1.5 mt-3 justify-center">
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
                                "w-9 h-9 rounded-xl text-xs font-bold transition-all duration-200",
                                customRecurrenceDays.includes(day.value)
                                  ? "text-white shadow-md scale-105"
                                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                              )}
                              style={customRecurrenceDays.includes(day.value) ? { 
                                background: effectiveColor,
                                boxShadow: `0 2px 8px ${hexToRgba(effectiveColor, 0.35)}`
                              } : undefined}
                              title={day.fullLabel}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                )}
              </div>
            </div>
          </form>

          {/* Footer actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!title.trim() || isSubmitting}
              className={cn(
                "px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all duration-200 active:scale-[0.97]",
                !title.trim() || isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl hover:-translate-y-0.5"
              )}
              style={{ 
                background: `linear-gradient(135deg, ${effectiveColor} 0%, ${hexToRgba(effectiveColor, 0.85)} 100%)`,
                boxShadow: !title.trim() || isSubmitting ? 'none' : `0 4px 16px ${hexToRgba(effectiveColor, 0.4)}`
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : mode === 'edit' ? (
                <span className="flex items-center gap-1.5">
                  <Check size={15} />
                  Save Changes
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Sparkles size={15} />
                  Create Event
                </span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
