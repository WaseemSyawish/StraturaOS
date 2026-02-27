"use client";

import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, MapPin, Edit3, Trash2, BookOpen } from "lucide-react";
import { parseDatePreserveLocal } from "@/lib/dateHelpers";
import { Event } from "@/types";

interface EventDetailPopoverProps {
  event: Event;
  anchorRect: DOMRect;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

const HEX_COLORS: Record<string, string> = {
  purple: "#9333EA", blue: "#3B82F6", green: "#10B981", emerald: "#10B981",
  red: "#EF4444", rose: "#F43F5E", orange: "#F97316", amber: "#F59E0B",
  pink: "#EC4899", cyan: "#06B6D4", teal: "#14B8A6", yellow: "#EAB308",
  indigo: "#6366F1", lime: "#84CC16", slate: "#64748B", gray: "#6B7280",
};

const getHex = (color: string | undefined): string => {
  if (!color) return "#9333EA";
  if (color.startsWith("#")) return color;
  return HEX_COLORS[color.toLowerCase()] || "#9333EA";
};

const fmtTime = (date: Date): string => {
  const h = date.getHours();
  const m = date.getMinutes();
  const h12 = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const POPOVER_W = 288;
const POPOVER_H = 230;

export default function EventDetailPopover({
  event,
  anchorRect,
  onClose,
  onEdit,
  onDelete,
}: EventDetailPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Close on outside click / Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [onClose]);

  // Position: prefer right of anchor, clamp to viewport
  const pos = (() => {
    if (typeof window === "undefined") return { top: 0, left: 0 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = anchorRect.right + 10;
    let top = anchorRect.top;
    if (left + POPOVER_W > vw - 8) left = anchorRect.left - POPOVER_W - 10;
    if (left < 8) left = Math.max(8, Math.min(anchorRect.left, vw - POPOVER_W - 8));
    if (top + POPOVER_H > vh - 8) top = vh - POPOVER_H - 8;
    if (top < 8) top = 8;
    return { top, left };
  })();

  const start = parseDatePreserveLocal(event.startDate) || new Date(String(event.startDate));
  const end = parseDatePreserveLocal(event.endDate) || new Date(String(event.endDate));
  const durMins = Math.round((end.getTime() - start.getTime()) / 60000);
  const durLabel =
    durMins < 60
      ? `${durMins}m`
      : durMins % 60 === 0
      ? `${durMins / 60}h`
      : `${Math.floor(durMins / 60)}h ${durMins % 60}m`;

  const courseColor = (event as any).courses?.color;
  const rawColor = courseColor || event.color || (event as any).variant || "purple";
  const hex = getHex(rawColor);

  const location = (event as any).location || (event as any).raw?.location || null;
  const rawType = (event as any).type || (event as any).raw?.type || (event as any).raw?.sessionType || null;
  const typeLabel = rawType ? rawType.charAt(0).toUpperCase() + rawType.slice(1) : null;
  const courseCode = (event as any).courses?.code || null;
  const courseName = (event as any).courses?.name || null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!mounted) return null;

  const hexToRgba = (h: string, a: number) => {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  const content = (
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 6 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="fixed z-[9998] bg-white dark:bg-[#1a1a28] rounded-2xl border border-slate-200/80 dark:border-slate-700/60 overflow-hidden"
      style={{ 
        top: pos.top, 
        left: pos.left, 
        width: POPOVER_W,
        boxShadow: `0 20px 60px -15px ${hexToRgba(hex, 0.25)}, 0 8px 20px -8px rgba(0,0,0,0.15)`,
      }}
    >
      {/* Gradient header bar */}
      <div
        className="h-1.5 relative overflow-hidden"
        style={{ background: `linear-gradient(90deg, ${hex} 0%, ${hexToRgba(hex, 0.6)} 100%)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/10" />
      </div>

      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-start gap-2.5">
        <div
          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
          style={{ backgroundColor: hex }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 dark:text-white text-[13px] leading-snug line-clamp-2">
            {event.title}
          </p>
          {(courseName || courseCode) && (
            <p className="text-[10px] font-bold mt-0.5" style={{ color: hex }}>
              {courseCode
                ? `${courseCode}${courseName ? ` · ${courseName}` : ""}`
                : courseName}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 -mt-0.5 -mr-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
        >
          <X size={13} />
        </button>
      </div>

      {/* Meta rows */}
      <div className="px-4 pb-3 space-y-1.5">
        {/* Time */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Clock size={11} className="shrink-0" />
          <span className="font-medium">
            {fmtTime(start)} – {fmtTime(end)}
          </span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span>{durLabel}</span>
        </div>

        {/* Location */}
        {location && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        )}

        {/* Type badge */}
        {typeLabel && (
          <div className="pt-0.5">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: `${hex}15`, color: hex }}
            >
              <BookOpen size={9} />
              {typeLabel}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 dark:border-slate-700/50" />

      {/* Actions */}
      <div className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5"
              style={{
                color: hex,
                backgroundColor: hexToRgba(hex, 0.08),
                border: `1px solid ${hexToRgba(hex, 0.15)}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = hexToRgba(hex, 0.15);
                (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 12px ${hexToRgba(hex, 0.2)}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = hexToRgba(hex, 0.08);
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <Edit3 size={11} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-100 dark:border-rose-800/40 transition disabled:opacity-60"
            >
              {isDeleting ? (
                <div className="w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 size={11} />
              )}
            </button>
          </div>
      </div>
    </motion.div>
  );

  return createPortal(content, document.body);
}
