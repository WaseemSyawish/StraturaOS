"use client";

import React, { useState, useCallback, useMemo } from "react";
import { 
  X, 
  Clock, 
  Calendar, 
  MapPin, 
  Tag, 
  Edit3, 
  Trash2, 
  BookOpen,
  AlertCircle,
  ChevronRight,
  Repeat,
  Users,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Event } from "@/types";
import { parseDatePreserveLocal } from "@/lib/dateHelpers";
import { useTheme } from "next-themes";

interface EventDetailModalProps {
  event: Event;
  onClose: () => void;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
}

// Map event colors to hex values
const COLOR_HEX: Record<string, string> = {
  purple: '#9333EA',
  blue: '#3B82F6',
  green: '#10B981',
  emerald: '#10B981',
  red: '#EF4444',
  rose: '#F43F5E',
  orange: '#F97316',
  amber: '#F59E0B',
  pink: '#EC4899',
  cyan: '#06B6D4',
  teal: '#14B8A6',
  yellow: '#EAB308',
  indigo: '#6366F1',
  lime: '#84CC16',
};

export default function EventDetailModal({
  event,
  onClose,
  onEdit,
  onDelete,
}: EventDetailModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [isDeleting, setIsDeleting] = useState(false);

  const colorKey = (event.color || (event as any).variant || 'purple').toLowerCase();
  const hex = COLOR_HEX[colorKey] || COLOR_HEX.purple;

  const startDate = useMemo(() => {
    return parseDatePreserveLocal(event.startDate) || new Date(String(event.startDate));
  }, [event.startDate]);

  const endDate = useMemo(() => {
    return parseDatePreserveLocal(event.endDate) || new Date(String(event.endDate));
  }, [event.endDate]);

  // Format time for display
  const formatTime = (date: Date) => {
    const h = date.getHours();
    const m = date.getMinutes();
    const hour12 = h % 12 || 12;
    const ampm = h < 12 ? "AM" : "PM";
    return m === 0 ? `${hour12} ${ampm}` : `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate duration
  const duration = useMemo(() => {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, [startDate, endDate]);

  const handleDelete = useCallback(async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete?.(event);
      onClose();
    } catch (err) {
      console.error("Failed to delete event:", err);
      setIsDeleting(false);
    }
  }, [event, onDelete, onClose, isDeleting]);

  const handleEdit = useCallback(() => {
    onEdit?.(event);
    onClose();
  }, [event, onEdit, onClose]);

  // Event type label
  const eventTypeLabel = useMemo(() => {
    const type = event.type || 'event';
    return type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
  }, [event.type]);

  // Check if recurring
  const isRecurring = event.recurrenceRule || (event as any).isRecurring;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={cn(
          "relative w-full max-w-md mx-4 rounded-2xl overflow-hidden",
          "transform transition-all duration-300 ease-out",
          "animate-in fade-in zoom-in-95"
        )}
        style={{
          background: isDark 
            ? 'linear-gradient(180deg, rgba(24, 24, 32, 0.98) 0%, rgba(15, 15, 20, 0.99) 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.99) 100%)',
          boxShadow: isDark
            ? `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 60px -20px ${hex}40`
            : `0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05), 0 0 40px -20px ${hex}30`,
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Color accent bar */}
        <div 
          className="h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${hex}, ${hex}88)` }}
        />

        {/* Header */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-start gap-4">
            {/* Color dot */}
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ 
                background: `linear-gradient(135deg, ${hex}20 0%, ${hex}10 100%)`,
                border: `2px solid ${hex}40`
              }}
            >
              <div 
                className="w-6 h-6 rounded-full"
                style={{ 
                  background: `linear-gradient(135deg, ${hex} 0%, ${hex}cc 100%)`,
                  boxShadow: `0 4px 12px ${hex}50`
                }}
              />
            </div>

            {/* Title and type */}
            <div className="flex-1 min-w-0 pt-1">
              <h2 className={cn(
                "text-xl font-bold truncate mb-1",
                isDark ? "text-white" : "text-slate-900"
              )}>
                {event.title}
              </h2>
              <div className="flex items-center gap-2">
                <span 
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ 
                    background: `${hex}15`,
                    color: hex
                  }}
                >
                  {eventTypeLabel}
                </span>
                {isRecurring && (
                  <span className={cn(
                    "text-xs font-medium flex items-center gap-1",
                    isDark ? "text-gray-400" : "text-slate-500"
                  )}>
                    <Repeat className="w-3 h-3" />
                    Recurring
                  </span>
                )}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-xl transition-all duration-200",
                isDark 
                  ? "text-gray-400 hover:text-white hover:bg-white/10" 
                  : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-5 space-y-4">
          {/* Time & Date Card */}
          <div 
            className="rounded-xl p-4"
            style={{ 
              background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${hex}15` }}
              >
                <Calendar className="w-4 h-4" style={{ color: hex }} />
              </div>
              <div className="flex-1">
                <p className={cn("text-sm font-semibold", isDark ? "text-white" : "text-slate-900")}>
                  {formatDate(startDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${hex}15` }}
              >
                <Clock className="w-4 h-4" style={{ color: hex }} />
              </div>
              <div className="flex-1 flex items-center gap-2">
                <span className={cn("text-sm font-semibold", isDark ? "text-white" : "text-slate-900")}>
                  {formatTime(startDate)}
                </span>
                <ChevronRight className={cn("w-4 h-4", isDark ? "text-gray-500" : "text-slate-400")} />
                <span className={cn("text-sm font-semibold", isDark ? "text-white" : "text-slate-900")}>
                  {formatTime(endDate)}
                </span>
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full ml-auto",
                  isDark ? "bg-white/5 text-gray-400" : "bg-slate-100 text-slate-500"
                )}>
                  {duration}
                </span>
              </div>
            </div>
          </div>

          {/* Course info if linked */}
          {(event as any).courses?.name && (
            <div 
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ 
                background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)'
              }}
            >
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${hex}15` }}
              >
                <BookOpen className="w-4 h-4" style={{ color: hex }} />
              </div>
              <div className="flex-1">
                <p className={cn("text-xs font-medium uppercase tracking-wide mb-0.5", isDark ? "text-gray-500" : "text-slate-500")}>
                  Course
                </p>
                <p className={cn("text-sm font-semibold", isDark ? "text-white" : "text-slate-900")}>
                  {(event as any).courses.name}
                </p>
              </div>
            </div>
          )}

          {/* Description if present */}
          {event.description && (
            <div 
              className="rounded-xl p-4"
              style={{ 
                background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)'
              }}
            >
              <p className={cn(
                "text-sm leading-relaxed",
                isDark ? "text-gray-300" : "text-slate-600"
              )}>
                {event.description}
              </p>
            </div>
          )}

          {/* Location if present */}
          {(event as any).location && (
            <div 
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ 
                background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)'
              }}
            >
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${hex}15` }}
              >
                <MapPin className="w-4 h-4" style={{ color: hex }} />
              </div>
              <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-slate-900")}>
                {(event as any).location}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div 
          className="px-6 py-4 flex items-center justify-between gap-3"
          style={{
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)'
          }}
        >
          {/* Delete button */}
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200",
                isDeleting && "opacity-50 cursor-not-allowed",
                isDark 
                  ? "text-red-400 hover:bg-red-500/10" 
                  : "text-red-600 hover:bg-red-50"
              )}
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}

          {/* Edit button */}
          {onEdit && (
            <button
              onClick={handleEdit}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, ${hex} 0%, ${hex}cc 100%)`,
                boxShadow: `0 4px 14px ${hex}40`
              }}
            >
              <Edit3 className="w-4 h-4" />
              Edit Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
