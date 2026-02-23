import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, Zap, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import CreateStepModal from './CreateStepModal';
import { showCustomAlert } from '@/utils/dialogs';

/**
 * Quick Add Modal - title, time, duration, type
 * - Flexible duration with smart presets (15min, 30min, 1hr, 2hr, etc.)
 * - Event type selector (Class, Meeting, Study, Exam, etc.)
 * - Professional styling matching UnifiedEventModal
 */

// Event types matching UnifiedEventModal
const EVENT_TYPES = [
  { value: "class", label: "Class", Icon: BookOpen },
  { value: "meeting", label: "Meeting", Icon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 8.646 4 4 0 010-8.646M9 10a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" /></svg> },
  { value: "study", label: "Study", Icon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
  { value: "exam", label: "Exam", Icon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { value: "task", label: "Task", Icon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
  { value: "other", label: "Other", Icon: Zap },
];

// Duration presets - much more flexible
const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
];

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

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState(slotTime || '09:00');
  const [duration, setDuration] = useState(60); // 1 hour default
  const [eventType, setEventType] = useState('class');
  const [showDurationOptions, setShowDurationOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-focus title input
  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus?.(), 150);
    }
  }, [visible]);

  // Parse slot date
  const dateStr = date ? new Date(date).toLocaleDateString(undefined, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  }) : 'Today';

  // Calculate end time based on duration
  const endTime = (() => {
    try {
      const [h, m] = startTime.split(':').map(Number);
      const totalMinutes = h * 60 + m + duration;
      const eh = Math.floor(totalMinutes / 60) % 24;
      const em = totalMinutes % 60;
      return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
    } catch (e) {
      return '10:00';
    }
  })();

  // Format duration display
  const formatDuration = (mins) => {
    if (mins < 60) return `${mins}m`;
    if (mins === 60) return '1h';
    if (mins === 90) return '1.5h';
    return `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}`;
  };

  const currentTypeOption = EVENT_TYPES.find(t => t.value === eventType);
  const currentDurationLabel = DURATION_OPTIONS.find(d => d.value === duration)?.label || formatDuration(duration);

  const handleSave = async () => {
    if (!title.trim()) {
      showCustomAlert('Error', 'Please enter a title', 'danger');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: 'tmp-' + Date.now(),
        title: title.trim(),
        type: eventType,
        date,
        startTime,
        endTime,
        startDate: (() => {
          try {
            const [y, m, d] = String(date).slice(0, 10).split('-').map(Number);
            const [sh, sm] = startTime.split(':').map(Number);
            return new Date(y, (m || 1) - 1, d, sh || 9, sm || 0, 0).toISOString();
          } catch (e) {
            return null;
          }
        })(),
        endDate: (() => {
          try {
            const [y, m, d] = String(date).slice(0, 10).split('-').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            return new Date(y, (m || 1) - 1, d, eh, em, 0).toISOString();
          } catch (e) {
            return null;
          }
        })(),
        isExpanded: false
      };

      await onSave?.(payload);
      onClose?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSubmitting && title.trim()) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
    }
  };

  if (!slot) return null;

  return (
    <CreateStepModal visible={visible} onClose={onClose} onEntered={onEntered} ariaLabel="Quick add event">
      <div className="relative w-full bg-white dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Quick Add</div>
            <div className="text-base font-medium text-slate-700 dark:text-slate-200">{dateStr}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-5">
          {/* Title Input - Large and prominent */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Event title"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg font-semibold text-slate-900 dark:text-white outline-none placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </motion.div>

          {/* Input Fields */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {/* Time Row */}
            <div className="flex items-center gap-3 text-[13px]">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="min-w-[60px] text-slate-600 dark:text-slate-400 font-medium">Time</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <span className="text-slate-400 font-medium text-xs">→</span>
              <span className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium whitespace-nowrap">
                {endTime}
              </span>
            </div>

            {/* Duration Row - Flexible with presets */}
            <div className="flex items-center gap-3 text-[13px]">
              <div className="w-4 h-4 flex-shrink-0" />
              <span className="min-w-[60px] text-slate-600 dark:text-slate-400 font-medium">Duration</span>
              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setShowDurationOptions(!showDurationOptions)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-left font-medium"
                >
                  {currentDurationLabel}
                </button>
                {showDurationOptions && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                    {DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setDuration(opt.value);
                          setShowDurationOptions(false);
                        }}
                        className={`w-full px-3 py-2 text-sm text-left transition-colors ${
                          duration === opt.value
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Event Type Row */}
            <div className="flex items-center gap-3 text-[13px]">
              <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="min-w-[60px] text-slate-600 dark:text-slate-400 font-medium">Type</span>
              <div className="relative flex-1 grid grid-cols-3 gap-1.5">
                {EVENT_TYPES.map((type) => {
                  const TypeIcon = type.Icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setEventType(type.value)}
                      title={type.label}
                      className={`h-9 rounded-lg border transition-all flex items-center justify-center gap-1 text-[11px] font-medium ${
                        eventType === type.value
                          ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <TypeIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="hidden sm:inline">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Quick Tip */}
          <motion.div
            className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <Zap className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Click event later for location, notes, recurrence & more.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            className="flex items-center justify-end gap-2 pt-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Event'}
            </button>
          </motion.div>
        </form>
      </div>
    </CreateStepModal>
  );
}
