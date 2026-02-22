import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, Zap } from 'lucide-react';
import CreateStepModal from './CreateStepModal';
import { showCustomAlert } from '@/utils/dialogs';

/**
 * SUPER MINIMAL Quick Add Modal
 * - Title, time, category only
 * - Takes 10 seconds to fill
 * - After creation, users can optionally click to expand for full details
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
  const [endTime, setEndTime] = useState(() => {
    try {
      const [h, m] = (slotTime || '09:00').split(':').map(Number);
      const total = h * 60 + m + 60;
      const hh = String(Math.floor(total / 60)).padStart(2, '0');
      const mm = String(total % 60).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch (e) {
      return '10:00';
    }
  });
  const [selectedCategory, setSelectedCategory] = useState(courseOptions[0]?.id || '');

  // Auto-focus title input
  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus?.(), 100);
    }
  }, [visible]);

  // Parse slot date
  const dateStr = date ? new Date(date).toLocaleDateString(undefined, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  }) : 'Today';

  const handleSave = () => {
    if (!title.trim()) {
      showCustomAlert('Error', 'Please enter a title', 'danger');
      return;
    }

    const category = courseOptions.find(c => String(c.id) === String(selectedCategory));
    const payload = {
      id: 'tmp-' + Date.now(),
      title: title.trim(),
      categoryId: selectedCategory,
      categoryName: category?.name || 'Uncategorized',
      categoryColor: category?.color || '#9CA3AF',
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
      isExpanded: false // For event cards - allows optional detail expansion
    };

    onSave?.(payload);
    onClose?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
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
      <div className="relative w-full max-w-md mx-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Quick Add</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{dateStr}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - 3 simple inputs */}
        <div className="p-6 space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What's happening?
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Study maths, Team meeting"
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Time Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Start
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                End
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">— None —</option>
              {courseOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name || option.title}
                </option>
              ))}
            </select>
          </div>

          {/* Info text */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <p className="text-xs text-blue-800 dark:text-blue-300">
              Click the event to add more details after creation
            </p>
          </div>
        </div>

        {/* Footer - Action Buttons */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Add Event
          </button>
        </div>
      </div>
    </CreateStepModal>
  );
}
