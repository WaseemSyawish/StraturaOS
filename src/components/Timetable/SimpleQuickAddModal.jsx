import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, BookOpen, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import CreateStepModal from './CreateStepModal';
import { showCustomAlert } from '@/utils/dialogs';

/**
 * Premium Quick Add Modal - minimal input, professional design
 * - Title, start time, category only
 * - Takes 10 seconds to fill
 * - Uses professional design matching UnifiedEventModal
 * - Smooth animations and proper visual hierarchy
 */
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
  const [selectedCategory, setSelectedCategory] = useState(courseOptions[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate end time (default 1 hour)
  const endTime = (() => {
    try {
      const [h, m] = startTime.split(':').map(Number);
      const total = h * 60 + m + 60;
      const hh = String(Math.floor(total / 60)).padStart(2, '0');
      const mm = String(total % 60).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch (e) {
      return '10:00';
    }
  })();

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

  const selectedCategoryData = courseOptions.find(c => String(c.id) === String(selectedCategory));

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
        categoryId: selectedCategory,
        categoryName: selectedCategoryData?.name || 'Uncategorized',
        categoryColor: selectedCategoryData?.color || '#9CA3AF',
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
            return new Date(y, (m || 1) - 1, d, eh || 10, em || 0, 0).toISOString();
          } catch (e) {
            return null;
          }
        })(),
        type: 'event',
        isExpanded: false
      };

      await onSave?.(payload);
      onClose?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
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
      <div className="relative w-full max-w-md">
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
              placeholder="What's happening?"
              className="w-full border-none bg-transparent text-lg font-semibold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
            />
          </motion.div>

          {/* Input Fields Grid */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {/* Time Row - Start time */}
            <div className="flex items-center gap-3 text-[13px]">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="min-w-[70px] text-slate-500">Time</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <span className="text-slate-400 font-medium">→</span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium min-w-fit">
                {endTime}
              </span>
            </div>

            {/* Category Row */}
            <div className="flex items-center gap-3 text-[13px]">
              <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="min-w-[70px] text-slate-500">Category</span>
              <div className="relative flex-1">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                  style={selectedCategoryData?.color ? {
                    backgroundColor: `${selectedCategoryData.color}08`,
                    borderColor: `${selectedCategoryData.color}40`
                  } : undefined}
                >
                  <option value="">— None —</option>
                  {courseOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name || option.title}
                    </option>
                  ))}
                </select>
                {selectedCategoryData?.color && (
                  <span 
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none"
                    style={{ backgroundColor: selectedCategoryData.color }}
                  />
                )}
              </div>
            </div>
          </motion.div>

          {/* Quick Tip */}
          <motion.div
            className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <Lightbulb className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Add basic info now. Click the event later to edit more details.
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
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Event'}
            </button>
          </motion.div>
        </form>
      </div>
    </CreateStepModal>
  );
}
