/**
 * TaskDetailPanel - Shared component for creating/editing tasks
 * Extracted from pages/tasks.js for reuse across pages
 */
import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CalendarIcon,
  Check,
  ChevronDown,
  Clock3,
  Circle,
  FileText,
  Flag,
  Layers,
  Plus,
  Tag,
  Target,
  Users,
  X,
  AlertTriangle,
} from 'lucide-react';

// Priority constants and helpers
export const PRIORITY_DEFAULT = 'not-urgent-not-important';

export const priorityMeta = {
  'urgent-important': { label: 'Urgent & Important', color: '#ef4444', weight: 0, icon: Flag },
  'urgent-not-important': { label: 'Urgent · Low Impact', color: '#f97316', weight: 1, icon: Flag },
  'not-urgent-important': { label: 'Important, not urgent', color: '#0ea5e9', weight: 2, icon: Flag },
  'not-urgent-not-important': { label: 'Low effort', color: '#94a3b8', weight: 3, icon: Flag },
};

export const getPriorityMeta = (key) => priorityMeta[key] || priorityMeta[PRIORITY_DEFAULT];

const accentPurple = '#8b5cf6';

// Inline ReminderPicker for standalone use
const ReminderPicker = ({ value, onChange, onDelete, onApply, onClose }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initialDate = value ? new Date(value).toISOString().split('T')[0] : '';
  const initialTime = value
    ? new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '07:45';

  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [viewMonth, setViewMonth] = useState(value ? new Date(value) : new Date());

  const selectedDate = date ? new Date(date + 'T00:00:00') : null;
  if (selectedDate) selectedDate.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();

  const applyShortcut = (daysOffset, defaultTime = '07:45') => {
    if (daysOffset === null) {
      setDate('');
      setTime('07:45');
      onChange?.(null);
      return;
    }

    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    const dateStr = target.toISOString().split('T')[0];
    let timeStr = defaultTime;

    if (daysOffset === 0) {
      const now = new Date();
      now.setHours(now.getHours() + 3);
      timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    } else {
      timeStr = defaultTime;
    }

    setDate(dateStr);
    setTime(timeStr);
    const [hours, minutes] = timeStr.split(':');
    const dateTime = new Date(dateStr);
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    onChange?.(dateTime.toISOString());
  };

  const handleSet = () => {
    if (!date) {
      onChange?.(null);
      onApply?.();
      return;
    }
    const [hours, minutes] = time.split(':');
    const dateTime = new Date(date + 'T00:00:00');
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    onChange?.(dateTime.toISOString());
    onApply?.();
  };

  const handleDateClick = (day) => {
    const year = viewMonth.getFullYear();
    const month = String(viewMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const newDate = `${year}-${month}-${dayStr}`;
    setDate(newDate);

    const [hours, minutes] = time.split(':');
    const dateTime = new Date(newDate + 'T00:00:00');
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    onChange?.(dateTime.toISOString());
  };

  const prevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  return (
    <div className="w-[420px] rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl">
      <div className="p-4 border-b border-slate-100">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Date</label>
            <input
              type="text"
              value={date ? new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : ''}
              readOnly
              className="w-full rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100"
              placeholder="Select date"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => {
                const newTime = e.target.value;
                setTime(newTime);
                if (date) {
                  const [hours, minutes] = newTime.split(':');
                  const dateTime = new Date(date + 'T00:00:00');
                  dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  onChange?.(dateTime.toISOString());
                }
              }}
              className="w-full rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">{viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
          <div className="flex gap-1">
            <button type="button" onClick={prevMonth} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <ChevronDown size={16} className="rotate-90 text-slate-600" />
            </button>
            <button type="button" onClick={nextMonth} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <ChevronDown size={16} className="-rotate-90 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 mb-3">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const cellDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
            cellDate.setHours(0, 0, 0, 0);
            const isToday = cellDate.getTime() === today.getTime();
            const isSelected = selectedDate && cellDate.getTime() === selectedDate.getTime();

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDateClick(day)}
                className={`aspect-square rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-blue-500 text-white scale-105 ring-2 ring-blue-200'
                    : isToday
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-700'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <button type="button" onClick={() => applyShortcut(0)} className="rounded-md bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            Later today
          </button>
          <button type="button" onClick={() => applyShortcut(1, '09:00')} className="rounded-md bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            Tomorrow
          </button>
          <button type="button" onClick={() => applyShortcut(7, '09:00')} className="rounded-md bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            Next week
          </button>
          <button type="button" onClick={() => applyShortcut(null)} className="rounded-md bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            Someday
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-800">
        <button type="button" onClick={() => { setDate(''); setTime('07:45'); onChange?.(null); }} className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
          Clear
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors px-4">
            Cancel
          </button>
          <button type="button" onClick={handleSet} className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            Set
          </button>
        </div>
      </div>
    </div>
  );
};

const TaskDetailPanel = ({ 
  task, 
  mode = 'detail', // 'detail' or 'create'
  onToggleComplete, 
  onQuickAction, 
  onStatusChange, 
  onUpdateFields, 
  onTagsChange, 
  onDeleteTask, 
  modules = [],
  onCreate,
  onClose,
  initialStatus,
  initialDueDate,
  setOpen,
  setClose
}) => {
  const isCreateMode = mode === 'create';
  
  const [localTitle, setLocalTitle] = useState(task?.title || '');
  const [localDescription, setLocalDescription] = useState(task?.description || '');
  const [dueStartInput, setDueStartInput] = useState('');
  const [dueEndInput, setDueEndInput] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [modalPage, setModalPage] = useState('main'); // 'main' or 'reminder'
  const [tempDueDate, setTempDueDate] = useState(null);
  const [localDueDate, setLocalDueDate] = useState(task?.dueDate || '');
  const [localStatus, setLocalStatus] = useState(initialStatus || task?.status || 'todo');
  const [localPriority, setLocalPriority] = useState(task?.priority || PRIORITY_DEFAULT);
  const [localEventType, setLocalEventType] = useState(task?.type || 'task');
  const [localCourse, setLocalCourse] = useState(task?.course || null);
  const [localCourseColor, setLocalCourseColor] = useState(task?.courseColor || null);
  const [localTags, setLocalTags] = useState([]);
  const [includeMyDay, setIncludeMyDay] = useState(true);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isCreateMode) {
      if (initialDueDate) {
        setDueStartInput(initialDueDate);
        setDueEndInput(initialDueDate);
      }
      return;
    }
    
    setLocalTitle(task?.title || '');
    setLocalDescription(task?.description || '');
    setLocalTags(Array.isArray(task?.tags) ? task.tags : []);
    setLocalDueDate(task?.dueDate || '');
    if (task?.dueDate) {
      const date = new Date(task.dueDate);
      const dateStr = date.toISOString().split('T')[0];
      setDueStartInput(dateStr);
      setDueEndInput(dateStr);
    } else {
      setDueStartInput('');
      setDueEndInput('');
    }
    setTagDraft('');
    setLocalStatus(task?.status || 'todo');
    setLocalPriority(task?.priority || PRIORITY_DEFAULT);
  }, [task?.id, task?.dueDate, task?.status, task?.priority, task?.title, task?.description, task?.tags, isCreateMode, initialDueDate]);

  // Helper to close all dropdowns except the one being opened
  const closeAllDropdowns = (exceptId = null) => {
    const dropdownTypes = ['status', 'eventtype', 'priority', 'module'];
    const taskId = task?.id || 'new';
    dropdownTypes.forEach(type => {
      const id = `${type}-dropdown-${taskId}`;
      if (id !== exceptId) {
        document.getElementById(id)?.classList.add('hidden');
      }
    });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const taskId = task?.id || 'new';
      const dropdownTypes = ['status', 'eventtype', 'priority', 'module'];
      
      dropdownTypes.forEach(type => {
        const dropdown = document.getElementById(`${type}-dropdown-${taskId}`);
        if (dropdown && !dropdown.classList.contains('hidden')) {
          const button = dropdown.previousElementSibling;
          if (!dropdown.contains(event.target) && !button?.contains(event.target)) {
            dropdown.classList.add('hidden');
          }
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [task?.id]);

  if (!isCreateMode && !task) {
    return <p className="text-sm text-slate-500">Task data unavailable.</p>;
  }

  // Always use localTags for immediate UI feedback, synced from task.tags in useEffect
  const tags = localTags;
  const priorityInfo = getPriorityMeta(localPriority);
  
  const statusOptions = [
    { value: 'todo', label: 'To Do', color: '#f59e0b' },
    { value: 'doing', label: 'In Progress', color: '#8b5cf6' },
    { value: 'later', label: 'Later', color: '#f59e0b' },
    { value: 'done', label: 'Done', color: '#10b981' },
  ];
  
  const currentStatus = statusOptions.find(s => s.value === localStatus) || statusOptions[0];
  
  const courseModuleTags = modules.map(m => m.name || m.title || m.code).filter(Boolean);

  const handleAddTag = () => {
    const trimmed = tagDraft.trim();
    if (!trimmed) return;
    
    // Update local state immediately for UI feedback
    setLocalTags(prev => {
      const newTags = Array.from(new Set([...prev, trimmed]));
      
      // Also update backend if in edit mode
      if (!isCreateMode) {
        onTagsChange?.(task.id, newTags);
      }
      
      return newTags;
    });
    
    setTagDraft('');
  };

  const handleRemoveTag = (tag) => {
    // Update local state immediately for UI feedback
    setLocalTags(prev => {
      const newTags = prev.filter((value) => value !== tag);
      
      // Also update backend if in edit mode
      if (!isCreateMode) {
        onTagsChange?.(task.id, newTags);
      }
      
      return newTags;
    });
  };

  const handleDueStartChange = (newDate) => {
    setDueStartInput(newDate);
    if (!isCreateMode) {
      if (newDate) {
        const dateObj = new Date(newDate + 'T23:59:00');
        onUpdateFields?.(task.id, { dueDate: dateObj.toISOString() });
      } else {
        onUpdateFields?.(task.id, { dueDate: null });
      }
    }
  };

  const handleDueEndChange = (newDate) => {
    setDueEndInput(newDate);
    if (!isCreateMode && newDate) {
      const dateObj = new Date(newDate + 'T23:59:00');
      onUpdateFields?.(task.id, { dueDate: dateObj.toISOString() });
    }
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    if (busy || !isCreateMode) return;
    if (!localTitle.trim()) {
      setError('Title is required');
      return;
    }
    setBusy(true);
    const dueDate = dueStartInput ? new Date(dueStartInput) : null;
    const meta = {
      myDay: includeMyDay,
      course: localCourse || null,
      courseColor: localCourseColor || null,
      priority: localPriority,
      tags: localTags,
      status: localStatus,
      type: localEventType,
    };
    const result = await onCreate({
      title: localTitle,
      dueDate: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate.toISOString() : null,
      meta,
    });
    setBusy(false);
    if (result?.success) {
      setError(null);
      onClose?.();
    } else {
      setError(result?.error || 'Unable to create task');
    }
  };

  const createdDate = task?.meta?.createdAt || task?.createdAt;

  return (
    <form className="flex flex-col" onSubmit={handleSubmit}>
      {modalPage === 'reminder' ? (
        <div className="px-6 py-6">
          <button
            type="button"
            onClick={() => setModalPage('main')}
            className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronDown size={16} className="rotate-90" />
            Back
          </button>
          <ReminderPicker
            value={tempDueDate}
            onChange={(dueDate) => {
              setTempDueDate(dueDate);
            }}
            onDelete={() => {
              setTempDueDate(null);
            }}
            onApply={() => {
              if (isCreateMode) {
                setDueStartInput(tempDueDate || '');
              } else {
                setLocalDueDate(tempDueDate || '');
                onUpdateFields?.(task.id, { dueDate: tempDueDate });
              }
              setModalPage('main');
            }}
            onClose={() => {
              setTempDueDate(isCreateMode ? (dueStartInput || null) : (task?.dueDate || null));
              setModalPage('main');
            }}
          />
        </div>
      ) : (
      <div className="space-y-5 px-6 py-6">
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={(e) => {
            if (isCreateMode) return;
            const newTitle = e.target.value.trim();
            if (newTitle && newTitle !== task.title) {
              onUpdateFields?.(task.id, { title: newTitle });
            }
          }}
          className="w-full border-none bg-transparent text-2xl font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
          placeholder="Task title"
          autoFocus={isCreateMode}
        />

        <div className="space-y-3.5">
          {!isCreateMode && (
            <div className="flex items-center gap-3 text-[13px]">
              <Clock3 size={15} className="text-slate-400" />
              <span className="min-w-[110px] text-slate-500">Created time</span>
              <span className="text-slate-700 dark:text-slate-300">
                {createdDate ? new Date(createdDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}
                {createdDate ? `  ${new Date(createdDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : ''}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 text-[13px]">
            <div className="flex items-center gap-2.5">
              <Circle size={15} className="text-slate-400" />
              <span className="min-w-[95px] text-slate-500">Status</span>
            </div>
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  const dropdownId = `status-dropdown-${task?.id || 'new'}`;
                  const dropdown = document.getElementById(dropdownId);
                  if (dropdown?.classList.contains('hidden')) {
                    closeAllDropdowns(dropdownId);
                    dropdown.classList.remove('hidden');
                  } else {
                    dropdown?.classList.add('hidden');
                  }
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                style={{ backgroundColor: `${currentStatus.color}15`, color: currentStatus.color }}
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: currentStatus.color }}></span>
                {currentStatus.label}
                <ChevronDown size={14} className="ml-auto opacity-60" />
              </button>
              <div id={`status-dropdown-${task?.id || 'new'}`} className="absolute left-0 top-full z-50 mt-1 hidden w-48 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setLocalStatus(opt.value);
                      if (!isCreateMode) {
                        onStatusChange?.(task.id, opt.value);
                        onUpdateFields?.(task.id, { status: opt.value });
                      }
                      document.getElementById(`status-dropdown-${task?.id || 'new'}`)?.classList.add('hidden');
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                    style={{ backgroundColor: localStatus === opt.value ? `${opt.color}08` : 'transparent' }}
                  >
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: opt.color }}></span>
                    <span style={{ color: opt.color }}>{opt.label}</span>
                    {localStatus === opt.value && <Check size={16} className="ml-auto" style={{ color: opt.color }} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[13px]">
            <BookOpen size={15} className="text-slate-400" />
            <span className="min-w-[110px] text-slate-500">Event Type</span>
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => {
                  const dropdownId = `eventtype-dropdown-${task?.id || 'new'}`;
                  const dropdown = document.getElementById(dropdownId);
                  if (dropdown?.classList.contains('hidden')) {
                    closeAllDropdowns(dropdownId);
                    dropdown.classList.remove('hidden');
                  } else {
                    dropdown?.classList.add('hidden');
                  }
                }}
                className="w-full h-9 px-3 rounded-lg border text-left text-xs font-medium bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent flex items-center justify-between gap-2 transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  {localEventType === 'class' && <BookOpen className="w-4 h-4" />}
                  {localEventType === 'lab' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 2h12M9 2v6l-4 8a4 4 0 003.6 6h6.8a4 4 0 003.6-6l-4-8V2" />
                    </svg>
                  )}
                  {localEventType === 'tutorial' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )}
                  {localEventType === 'exam' && <AlertTriangle className="w-4 h-4" />}
                  {localEventType === 'quiz' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  )}
                  {localEventType === 'assignment' && <FileText className="w-4 h-4" />}
                  {localEventType === 'project' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  )}
                  {localEventType === 'deadline' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {localEventType === 'meeting' && <Users className="w-4 h-4" />}
                  {localEventType === 'study-session' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )}
                  {localEventType === 'personal' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  {localEventType === 'task' && <Target className="w-4 h-4" />}
                  {localEventType === 'other' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  )}
                  <span className="capitalize">{localEventType}</span>
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-200 transition-transform duration-200" />
              </button>
              <div id={`eventtype-dropdown-${task?.id || 'new'}`} className="absolute left-0 top-full z-50 mt-1 hidden w-full max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                {[
                  { value: 'class', label: 'Class', icon: BookOpen },
                  { value: 'lab', label: 'Lab', icon: () => (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 2h12M9 2v6l-4 8a4 4 0 003.6 6h6.8a4 4 0 003.6-6l-4-8V2" />
                    </svg>
                  ) },
                  { value: 'tutorial', label: 'Tutorial', icon: () => (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  ) },
                  { value: 'exam', label: 'Exam', icon: AlertTriangle },
                  { value: 'quiz', label: 'Quiz', icon: () => (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  ) },
                  { value: 'assignment', label: 'Assignment', icon: FileText },
                  { value: 'project', label: 'Project', icon: () => (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  ) },
                  { value: 'deadline', label: 'Deadline', icon: () => (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) },
                  { value: 'meeting', label: 'Meeting', icon: Users },
                  { value: 'study-session', label: 'Study Session', icon: () => (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  ) },
                  { value: 'personal', label: 'Personal', icon: () => (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ) },
                  { value: 'task', label: 'Task', icon: Target },
                  { value: 'other', label: 'Other', icon: () => (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  ) }
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setLocalEventType(type.value);
                      if (!isCreateMode) {
                        onUpdateFields?.(task.id, { type: type.value });
                      }
                      document.getElementById(`eventtype-dropdown-${task?.id || 'new'}`)?.classList.add('hidden');
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    {typeof type.icon === 'function' ? <type.icon /> : <type.icon size={16} />}
                    {type.label}
                    {localEventType === type.value && <Check size={16} className="ml-auto text-purple-600" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[13px]">
            <div className="flex items-center gap-2.5">
              <Flag size={15} className="text-slate-400" />
              <span className="min-w-[95px] text-slate-500">Priority</span>
            </div>
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  const dropdownId = `priority-dropdown-${task?.id || 'new'}`;
                  const dropdown = document.getElementById(dropdownId);
                  if (dropdown?.classList.contains('hidden')) {
                    closeAllDropdowns(dropdownId);
                    dropdown.classList.remove('hidden');
                  } else {
                    dropdown?.classList.add('hidden');
                  }
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                style={{ backgroundColor: `${priorityInfo.color}15`, color: priorityInfo.color }}
              >
                {priorityInfo.icon && <priorityInfo.icon size={14} />}
                {priorityInfo.label}
                <ChevronDown size={14} className="ml-auto opacity-60" />
              </button>
              <div id={`priority-dropdown-${task?.id || 'new'}`} className="absolute left-0 top-full z-50 mt-1 hidden w-56 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                {Object.entries(priorityMeta).map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setLocalPriority(key);
                      if (!isCreateMode) {
                        onUpdateFields?.(task.id, { priority: key });
                      }
                      document.getElementById(`priority-dropdown-${task?.id || 'new'}`)?.classList.add('hidden');
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                    style={{ backgroundColor: localPriority === key ? `${meta.color}08` : 'transparent', color: meta.color }}
                  >
                    {meta.icon && <meta.icon size={14} />}
                    {meta.label}
                    {localPriority === key && <Check size={16} className="ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Module/Course selector */}
          {modules.length > 0 && (
            <div className="flex items-center gap-3 text-[13px]">
              <div className="flex items-center gap-2.5">
                <Layers size={15} className="text-slate-400" />
                <span className="min-w-[95px] text-slate-500">Module</span>
              </div>
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => {
                    const dropdownId = `module-dropdown-${task?.id || 'new'}`;
                    const dropdown = document.getElementById(dropdownId);
                    if (dropdown?.classList.contains('hidden')) {
                      closeAllDropdowns(dropdownId);
                      dropdown.classList.remove('hidden');
                    } else {
                      dropdown?.classList.add('hidden');
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  style={{ 
                    backgroundColor: localCourseColor ? `${localCourseColor}15` : 'rgba(148, 163, 184, 0.1)', 
                    color: localCourseColor || '#64748b' 
                  }}
                >
                  <span 
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: localCourseColor || '#94a3b8' }}
                  />
                  {localCourse || 'Select module'}
                  <ChevronDown size={14} className="ml-auto opacity-60" />
                </button>
                <div id={`module-dropdown-${task?.id || 'new'}`} className="absolute left-0 top-full z-50 mt-1 hidden w-64 max-h-60 overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                  {/* Clear selection option */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setLocalCourse(null);
                      setLocalCourseColor(null);
                      if (!isCreateMode) {
                        onUpdateFields?.(task.id, { course: null, courseColor: null });
                      }
                      document.getElementById(`module-dropdown-${task?.id || 'new'}`)?.classList.add('hidden');
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                  >
                    <span className="inline-block h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    No module
                    {!localCourse && <Check size={16} className="ml-auto text-purple-600" />}
                  </button>
                  {modules.map((mod) => {
                    const moduleName = mod.name || mod.title || mod.code;
                    const moduleColor = mod.color || accentPurple;
                    return (
                      <button
                        key={mod.id || moduleName}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setLocalCourse(moduleName);
                          setLocalCourseColor(moduleColor);
                          if (!isCreateMode) {
                            onUpdateFields?.(task.id, { course: moduleName, courseColor: moduleColor });
                          }
                          document.getElementById(`module-dropdown-${task?.id || 'new'}`)?.classList.add('hidden');
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                        style={{ 
                          backgroundColor: localCourse === moduleName ? `${moduleColor}08` : 'transparent',
                          color: moduleColor 
                        }}
                      >
                        <span 
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: moduleColor }}
                        />
                        <span className="truncate">{moduleName}</span>
                        {localCourse === moduleName && <Check size={16} className="ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-[13px]">
            <CalendarIcon size={15} className="text-slate-400" />
            <span className="min-w-[110px] text-slate-500">Due & Reminder</span>
            <button
              type="button"
              onClick={() => {
                const currentDate = isCreateMode ? dueStartInput : localDueDate;
                setTempDueDate(currentDate || null);
                setModalPage('reminder');
              }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {(isCreateMode ? dueStartInput : localDueDate) ? new Date(isCreateMode ? dueStartInput : localDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Set due date & reminder'}
            </button>
          </div>

          <div className="flex items-start gap-3 text-[13px]">
            <Tag size={15} className="mt-0.5 text-slate-400" />
            <span className="min-w-[110px] text-slate-500">Tags</span>
            <div className="flex flex-1 flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    <X size={11} />
                  </button>
                </span>
              ))}
              {courseModuleTags.filter(ct => !localTags.includes(ct)).slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setLocalTags(prev => {
                      const newTags = Array.from(new Set([...prev, suggestion]));
                      if (!isCreateMode) {
                        onTagsChange?.(task.id, newTags);
                      }
                      return newTags;
                    });
                  }}
                  className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  + {suggestion}
                </button>
              ))}
              <div className="flex flex-1 items-center gap-1">
                <input
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder={tags.length === 0 ? 'Type tag name and press +' : 'Add another tag'}
                  className="min-w-[80px] flex-1 rounded-md border-0 bg-slate-50 dark:bg-slate-700 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-slate-200 dark:focus:ring-slate-600"
                />
                {tagDraft.trim() && (
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-slate-400" />
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Description</p>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-700 p-3.5">
            <textarea
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              onBlur={(e) => {
                if (isCreateMode) return;
                const newDesc = e.target.value.trim();
                if (newDesc !== (task?.description || '')) {
                  onUpdateFields?.(task.id, { description: newDesc });
                }
              }}
              placeholder="Add a description for this task..."
              rows={3}
              className="w-full resize-none border-0 bg-transparent text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}
      </div>
      )}

      {isCreateMode && (
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-purple-600 hover:bg-purple-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 shadow-sm"
          >
            {busy ? 'Adding…' : 'Add task'}
          </button>
        </div>
      )}

    </form>
  );
};

export default TaskDetailPanel;
