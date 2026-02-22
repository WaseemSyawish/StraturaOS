import React, { useState, useEffect, useRef } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import CreateStepModal from './CreateStepModal';
import { showCustomAlert } from '@/utils/dialogs';

/**
 * Ultra-minimal Quick Add Modal - title only
 * - Super fast entry: just type title and submit
 * - Time defaults to current time, 1 hour duration (editable later)
 * - All other fields customizable via event detail editor
 * - Follows Todoist/Any.do pattern: quick capture, full details on edit
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

  const handleSave = async () => {
    if (!title.trim()) {
      showCustomAlert('Error', 'Please enter a title', 'danger');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use slot time (default 1 hour duration)
      const startTime = slotTime || '09:00';
      const [h, m] = startTime.split(':').map(Number);
      const endHour = h + 1;
      const endTime = `${String(endHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      const payload = {
        id: 'tmp-' + Date.now(),
        title: title.trim(),
        categoryId: '',
        categoryName: 'Uncategorized',
        categoryColor: '#9CA3AF',
        date,
        startTime,
        endTime,
        startDate: (() => {
          try {
            const [y, mm, d] = String(date).slice(0, 10).split('-').map(Number);
            const [sh, sm] = startTime.split(':').map(Number);
            return new Date(y, (mm || 1) - 1, d, sh || 9, sm || 0, 0).toISOString();
          } catch (e) {
            return null;
          }
        })(),
        endDate: (() => {
          try {
            const [y, mm, d] = String(date).slice(0, 10).split('-').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            return new Date(y, (mm || 1) - 1, d, eh || 10, em || 0, 0).toISOString();
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
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden">
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

        {/* Form Content - Just title input */}
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-4">
          {/* Title Input - Large and prominent with visible background */}
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
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg font-semibold text-slate-900 dark:text-white outline-none placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </motion.div>

          {/* Quick Tip */}
          <motion.div
            className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Lightbulb className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Edit the event to customize time, date, and category.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            className="flex items-center justify-end gap-2 pt-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
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
