import React, { useState, useEffect, useRef } from 'react';
import {
  X, ChevronLeft,
  BookOpen, FlaskConical, Lightbulb, BookMarked,
  ClipboardList, Users, Heart, Tag,
} from 'lucide-react';
import { createPortal } from 'react-dom';

// ─── Event types ─────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { value: 'class',    label: 'Lecture',  Icon: BookOpen },
  { value: 'lab',      label: 'Lab',      Icon: FlaskConical },
  { value: 'tutorial', label: 'Tutorial', Icon: Lightbulb },
  { value: 'study',    label: 'Study',    Icon: BookMarked },
  { value: 'exam',     label: 'Exam',     Icon: ClipboardList },
  { value: 'meeting',  label: 'Meeting',  Icon: Users },
  { value: 'personal', label: 'Personal', Icon: Heart },
  { value: 'other',    label: 'Other',    Icon: Tag },
];

// ─── Duration presets ─────────────────────────────────────────────────────────
const DURATION_PRESETS = [30, 60, 90, 120, 180];

const formatDuration = (mins) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const calcEndTime = (startTime, durMins) => {
  try {
    const [h, m] = startTime.split(':').map(Number);
    const total = h * 60 + m + durMins;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  } catch { return '10:00'; }
};

export default function SimpleQuickAddModal({ 
  visible = true, 
  slot, 
  courseOptions = [], 
  onSave, 
  onClose, 
  onEntered 
}) {
  const { date, time: slotTime } = slot || {};
  const inputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('class');
  const [startTime, setStartTime] = useState(slotTime || '09:00');
  const [duration, setDuration] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset + auto-focus on open
  useEffect(() => {
    if (visible) {
      setStep(1);
      setTitle('');
      setEventType('class');
      setStartTime(slotTime || '09:00');
      setDuration(60);
    }
  }, [visible, slotTime]);

  useEffect(() => {
    if (step === 1 && visible) {
      setTimeout(() => inputRef.current?.focus?.(), 100);
    }
  }, [step, visible]);

  const dateStr = date
    ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : 'Today';

  const endTime = calcEndTime(startTime, duration);

  const handleSave = async () => {
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Safely convert date (works for both Date objects and ISO strings)
      const toDateParts = (d) => {
        const obj = (d instanceof Date) ? d : new Date(String(d));
        return [obj.getFullYear(), obj.getMonth() + 1, obj.getDate()];
      };
      const [y, mo, dy] = toDateParts(date);
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      // Build LOCAL ISO strings (no Z suffix) — the codebase convention
      // parseDatePreserveLocal treats all ISO components as local time
      const pad2 = (n) => String(n).padStart(2, '0');
      const startDateISO = `${y}-${pad2(mo)}-${pad2(dy)}T${pad2(sh)}:${pad2(sm)}:00`;
      const endDateISO = `${y}-${pad2(mo)}-${pad2(dy)}T${pad2(eh)}:${pad2(em)}:00`;

      const payload = {
        id: 'tmp-' + Date.now(),
        title: title.trim(),
        type: eventType,
        date,
        startTime,
        endTime,
        durationMinutes: duration,
        startDate: startDateISO,
        endDate: endDateISO,
      };
      await onSave?.(payload);
      onClose?.();
    } catch (err) {
      console.error('[SimpleQuickAddModal] save failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose?.(); }
    if (e.key === 'Enter' && step === 1 && title.trim()) { e.preventDefault(); setStep(2); }
    if (e.key === 'Enter' && step === 2 && !isSubmitting && title.trim()) { e.preventDefault(); handleSave(); }
  };

  if (!visible || !slot) return null;

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onKeyDown={handleKey}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#12121a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
        {/* Top accent stripe */}
        <div className="h-[3px] bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-1.5">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="p-1.5 -ml-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ChevronLeft size={15} />
              </button>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                {step === 1 ? 'New Event' : 'Set Time'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{dateStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Step dots */}
            <div className="flex items-center gap-1">
              <div className={`rounded-full transition-all duration-200 ${
                step === 1 ? 'w-4 h-1.5 bg-purple-500' : 'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600'
              }`} />
              <div className={`rounded-full transition-all duration-200 ${
                step === 2 ? 'w-4 h-1.5 bg-purple-500' : 'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600'
              }`} />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5">
          {step === 1 ? (
            <div className="space-y-4">
              {/* Title - borderless, big */}
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKey}
                placeholder="What's happening?"
                className="w-full px-0 py-2 text-xl font-bold text-slate-900 dark:text-white bg-transparent border-0 border-b-2 border-slate-100 dark:border-slate-700/80 focus:border-purple-400 dark:focus:border-purple-500 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-colors"
              />

              {/* Type grid — 4-col pill buttons */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Type</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {EVENT_TYPES.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEventType(value)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                        eventType === value
                          ? 'border-purple-300 dark:border-purple-700/80 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm'
                          : 'border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 hover:border-slate-200 dark:hover:border-slate-600 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      <Icon size={15} strokeWidth={2} />
                      <span className="text-[9px] font-bold tracking-wide">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Continue button */}
              <button
                type="button"
                onClick={() => { if (title.trim()) setStep(2); else inputRef.current?.focus(); }}
                disabled={!title.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-purple-500/20 hover:-translate-y-px active:translate-y-0"
              >
                Continue →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Visual time block */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Start</p>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      onKeyDown={handleKey}
                      className="w-full text-2xl font-extrabold text-slate-900 dark:text-white bg-transparent border-0 outline-none tabular-nums"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1 pb-1">
                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-600" />
                    <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600">
                      {formatDuration(duration)}
                    </span>
                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-600" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">End</p>
                    <p className="text-2xl font-extrabold text-slate-400 dark:text-slate-500 tabular-nums">{endTime}</p>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Duration</p>
                {/* Quick presets */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {DURATION_PRESETS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        duration === d
                          ? 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {formatDuration(d)}
                    </button>
                  ))}
                </div>
                {/* Custom minutes input */}
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="5"
                    max="600"
                    step="5"
                    value={duration}
                    onChange={(e) => {
                      const v = Math.max(5, Math.min(600, parseInt(e.target.value) || 5));
                      setDuration(v);
                    }}
                    className="w-20 px-2.5 py-1.5 text-sm font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-purple-400 dark:focus:border-purple-500 tabular-nums"
                  />
                  <span className="text-xs text-slate-400 dark:text-slate-500">min&nbsp;—&nbsp;or type any value</span>
                </div>
              </div>

              {/* Save */}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-purple-500/20 hover:-translate-y-px active:translate-y-0"
              >
                {isSubmitting ? 'Adding…' : 'Add to Schedule'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
}
