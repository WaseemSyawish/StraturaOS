/**
 * TaskDetailPanel - Shared component for creating/editing tasks
 * Todoist-inspired two-column layout with inline detail menus
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  AlarmClock,
  ArrowRight,
  BookOpen,
  CalendarIcon,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardList,
  Clock,
  Clock3,
  FileText,
  Flag,
  GripVertical,
  Layers,
  Lightbulb,
  ListTodo,
  Loader2,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Sun,
  Tag,
  Target,
  Users,
  X,
  AlertTriangle,
} from 'lucide-react';

// Priority constants and helpers
export const PRIORITY_DEFAULT = 'not-urgent-not-important';

export const priorityMeta = {
  'urgent-important': { label: 'Urgent & Important', color: '#ef4444', weight: 0, icon: Flag, desc: 'Do it now' },
  'urgent-not-important': { label: 'Urgent · Low Impact', color: '#f97316', weight: 1, icon: Flag, desc: 'Delegate if possible' },
  'not-urgent-important': { label: 'Important, not urgent', color: '#0ea5e9', weight: 2, icon: Flag, desc: 'Schedule it' },
  'not-urgent-not-important': { label: 'Low effort', color: '#94a3b8', weight: 3, icon: Flag, desc: 'Maybe later' },
};

export const getPriorityMeta = (key) => priorityMeta[key] || priorityMeta[PRIORITY_DEFAULT];

const accentPurple = '#8b5cf6';

// Date helpers
const getStartOfDay = (date) => { const c = new Date(date); c.setHours(0,0,0,0); return c; };
const addDays = (date, days) => { const n = new Date(date); n.setDate(n.getDate() + days); return n; };
const toDateSafe = (v) => { if (!v && v !== 0) return null; if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : new Date(v); const p = new Date(v); return Number.isNaN(p.getTime()) ? null : p; };
const padTime = (v) => String(v).padStart(2, '0');
const toYMDLocal = (v) => { const d = toDateSafe(v); if (!d) return ''; return `${d.getFullYear()}-${padTime(d.getMonth()+1)}-${padTime(d.getDate())}`; };
const getNextDayOfWeek = (date, targetDay) => { const r = new Date(date instanceof Date ? date : new Date()); const diff = (targetDay + 7 - r.getDay()) % 7 || 7; r.setDate(r.getDate() + diff); r.setHours(0,0,0,0); return r; };

const parseNaturalLanguageDate = (input) => {
  if (!input) return null;
  const text = input.toLowerCase();
  const now = new Date();
  const tokens = [
    { match: 'today', date: now },
    { match: 'tomorrow', date: addDays(now, 1) },
    { match: 'next week', date: addDays(now, 7) },
    { match: 'next month', date: addDays(now, 30) },
    { match: 'this weekend', date: getNextDayOfWeek(now, 6) },
  ];
  for (const token of tokens) { if (text.includes(token.match)) return token.date; }
  const weekdayMatch = text.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (weekdayMatch) {
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const index = dayNames.indexOf(weekdayMatch[1]);
    if (index >= 0) return getNextDayOfWeek(now, index);
  }
  const inMatch = text.match(/in\s+(\d+)\s+(day|days|week|weeks)/);
  if (inMatch) { const val = Number(inMatch[1]); if (!Number.isNaN(val)) { const unit = inMatch[2].startsWith('week') ? 7 : 1; return addDays(now, val * unit); } }
  const explicitMatch = text.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s(\d{1,2})/);
  if (explicitMatch) {
    const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const monthIndex = monthNames.indexOf(explicitMatch[1].slice(0,3));
    const day = Number(explicitMatch[2]);
    if (monthIndex >= 0 && day > 0) { const c = new Date(now.getFullYear(), monthIndex, day); if (c < now) c.setFullYear(c.getFullYear()+1); return c; }
  }
  return null;
};

const TaskDetailPanel = ({
  task, mode = 'detail', onToggleComplete, onQuickAction, onStatusChange,
  onUpdateFields, onTagsChange, onDeleteTask, modules = [],
  onCreate, onClose, initialStatus, initialDueDate, setOpen, setClose, toast,
}) => {
  const isCreateMode = mode === 'create';
  const [localTitle, setLocalTitle] = useState(task?.title || '');
  const [localDescription, setLocalDescription] = useState(task?.description || '');
  const [dueStartInput, setDueStartInput] = useState('');
  const [dueEndInput, setDueEndInput] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [localDueDate, setLocalDueDate] = useState(task?.dueDate || '');
  const [localStatus, setLocalStatus] = useState(initialStatus || task?.status || 'todo');
  const [localPriority, setLocalPriority] = useState(task?.priority || PRIORITY_DEFAULT);
  const [localEventType, setLocalEventType] = useState(task?.type || 'task');
  const [localCourse, setLocalCourse] = useState(task?.course || null);
  const [localCourseColor, setLocalCourseColor] = useState(task?.courseColor || null);
  const [localTags, setLocalTags] = useState([]);
  const [localSubtasks, setLocalSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [includeMyDay, setIncludeMyDay] = useState(false);
  const [openDetailMenu, setOpenDetailMenu] = useState(null);
  const [dueDraftDate, setDueDraftDate] = useState('');
  const [dueDraftTime, setDueDraftTime] = useState('');
  const [duePickerMonth, setDuePickerMonth] = useState(() => {
    const dateVal = task?.dueDate;
    if (dateVal) { const d = new Date(dateVal); if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1); }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });
  const detailPanelRef = useRef(null);
  const dueBtnRef = useRef(null);
  const [dueBtnRect, setDueBtnRect] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isCreateMode) { if (initialDueDate) { setDueStartInput(initialDueDate); setDueEndInput(initialDueDate); } return; }
    setLocalTitle(task?.title || '');
    setLocalDescription(task?.description || '');
    setLocalTags(Array.isArray(task?.tags) ? task.tags : []);
    setLocalSubtasks(Array.isArray(task?.subtasks) ? task.subtasks : []);
    setLocalDueDate(task?.dueDate || '');
    if (task?.dueDate) { const date = new Date(task.dueDate); setDueStartInput(date.toISOString().split('T')[0]); setDueEndInput(date.toISOString().split('T')[0]); }
    else { setDueStartInput(''); setDueEndInput(''); }
    setTagDraft('');
    setLocalStatus(task?.status || 'todo');
    setLocalPriority(task?.priority || PRIORITY_DEFAULT);
  }, [task?.id, task?.dueDate, task?.status, task?.priority, task?.title, task?.description, task?.tags, isCreateMode, initialDueDate]);

  useEffect(() => {
    const sourceValue = isCreateMode ? dueStartInput : localDueDate;
    if (!sourceValue) { setDueDraftDate(''); setDueDraftTime(''); return; }
    const parsed = new Date(sourceValue);
    if (Number.isNaN(parsed.getTime())) { setDueDraftDate(''); setDueDraftTime(''); return; }
    setDueDraftDate(toYMDLocal(parsed));
    const hasExplicitTime = !isCreateMode && (task?.hasTime === true || task?.meta?.hasTime === true);
    const hasNonDefaultTime = parsed.getHours() !== 0 || parsed.getMinutes() !== 0;
    if (hasExplicitTime || hasNonDefaultTime) { setDueDraftTime(`${String(parsed.getHours()).padStart(2,'0')}:${String(parsed.getMinutes()).padStart(2,'0')}`); }
    else { setDueDraftTime(''); }
  }, [dueStartInput, isCreateMode, localDueDate, task?.hasTime, task?.meta?.hasTime]);

  useEffect(() => {
    if (!openDetailMenu) return;
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!detailPanelRef.current?.contains(target)) { setOpenDetailMenu(null); return; }
      if (!target.closest('[data-detail-menu]') && !target.closest('[data-detail-trigger]')) { setOpenDetailMenu(null); }
    };
    const handleEscape = (event) => { if (event.key === 'Escape') setOpenDetailMenu(null); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEscape); };
  }, [openDetailMenu]);

  if (!isCreateMode && !task) return <p className="text-sm text-slate-500">Task data unavailable.</p>;

  const tags = localTags;
  const priorityInfo = getPriorityMeta(localPriority);
  const statusOptions = [
    { value: 'todo', label: 'To Do', icon: Circle, color: '#e01a1aff', desc: 'Not started yet' },
    { value: 'doing', label: 'In Progress', icon: Loader2, color: '#8b5cf6', desc: 'Currently working on' },
    { value: 'later', label: 'Later', icon: Clock, color: '#f59e0b', desc: 'Deferred for later' },
    { value: 'done', label: 'Done', icon: CheckCircle2, color: '#10b981', desc: 'Completed' },
  ];
  const currentStatus = statusOptions.find(s => s.value === localStatus) || statusOptions[0];
  const typeOptions = [
    { value: 'task', label: 'Task', icon: ListTodo, color: '#6366f1' },
    { value: 'class', label: 'Class', icon: BookOpen, color: '#8b5cf6' },
    { value: 'lab', label: 'Lab', icon: Lightbulb, color: '#06b6d4' },
    { value: 'tutorial', label: 'Tutorial', icon: MessageSquare, color: '#14b8a6' },
    { value: 'exam', label: 'Exam', icon: AlertTriangle, color: '#ef4444' },
    { value: 'quiz', label: 'Quiz', icon: ClipboardList, color: '#f97316' },
    { value: 'assignment', label: 'Assignment', icon: FileText, color: '#3b82f6' },
    { value: 'project', label: 'Project', icon: Target, color: '#8b5cf6' },
    { value: 'deadline', label: 'Deadline', icon: AlarmClock, color: '#ef4444' },
    { value: 'meeting', label: 'Meeting', icon: Users, color: '#06b6d4' },
    { value: 'study-session', label: 'Study Session', icon: Clock3, color: '#f59e0b' },
    { value: 'personal', label: 'Personal', icon: Sparkles, color: '#ec4899' },
    { value: 'other', label: 'Other', icon: MoreHorizontal, color: '#64748b' },
  ];
  const currentType = typeOptions.find(t => t.value === localEventType) || typeOptions[0];
  const courseModuleTags = modules.map(m => m.name || m.title || m.code).filter(Boolean);

  const applyDueSelection = (dateToken, timeToken = '') => {
    if (!dateToken) {
      if (isCreateMode) { setDueStartInput(''); setDueEndInput(''); }
      else { setLocalDueDate(''); onUpdateFields?.(task.id, { dueDate: null, meta: { ...(task?.meta || {}), hasTime: false } }); }
      setDueDraftDate(''); setDueDraftTime(''); setOpenDetailMenu(null); return;
    }
    const candidate = new Date(`${dateToken}T${timeToken || '00:00'}:00`);
    if (Number.isNaN(candidate.getTime())) return;
    const isoValue = candidate.toISOString();
    if (isCreateMode) { setDueStartInput(dateToken); setDueEndInput(dateToken); }
    else { setLocalDueDate(isoValue); onUpdateFields?.(task.id, { dueDate: isoValue, meta: { ...(task?.meta || {}), hasTime: Boolean(timeToken) } }); }
    setOpenDetailMenu(null);
  };

  const applyDueShortcut = (shortcut) => {
    const base = getStartOfDay(new Date());
    if (shortcut === 'clear') { applyDueSelection(null); return; }
    if (shortcut === 'today') { applyDueSelection(toYMDLocal(base), dueDraftTime); return; }
    if (shortcut === 'tomorrow') { applyDueSelection(toYMDLocal(addDays(base, 1)), dueDraftTime); return; }
    if (shortcut === 'weekend') { const day = base.getDay(); const offset = (6 - day + 7) % 7 || 7; applyDueSelection(toYMDLocal(addDays(base, offset)), dueDraftTime); return; }
    if (shortcut === 'next-week') { applyDueSelection(toYMDLocal(addDays(base, 7)), dueDraftTime); }
  };

  const handleAddTag = () => { const trimmed = tagDraft.trim(); if (!trimmed) return; setLocalTags(prev => { const n = Array.from(new Set([...prev, trimmed])); if (!isCreateMode) onTagsChange?.(task.id, n); return n; }); setTagDraft(''); };
  const handleRemoveTag = (tag) => { setLocalTags(prev => { const n = prev.filter(v => v !== tag); if (!isCreateMode) onTagsChange?.(task.id, n); return n; }); };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim(); if (!trimmed) return;
    const ns = { id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2,9)}`, title: trimmed, completed: false, createdAt: new Date().toISOString() };
    setLocalSubtasks(prev => { const n = [...prev, ns]; if (!isCreateMode) onUpdateFields?.(task.id, { subtasks: n }); return n; });
    setNewSubtaskTitle('');
  };
  const handleUpdateSubtaskTitle = (subtaskId, newTitle) => { const trimmed = newTitle.trim(); if (!trimmed) return; setLocalSubtasks(prev => { const n = prev.map(st => st.id === subtaskId ? { ...st, title: trimmed } : st); if (!isCreateMode) onUpdateFields?.(task.id, { subtasks: n }); return n; }); };
  const handleReorderSubtasks = (fromIndex, toIndex) => { if (fromIndex === toIndex) return; setLocalSubtasks(prev => { const n = [...prev]; const [removed] = n.splice(fromIndex, 1); n.splice(toIndex, 0, removed); if (!isCreateMode) onUpdateFields?.(task.id, { subtasks: n }); return n; }); };
  const handleToggleSubtask = (subtaskId) => { setLocalSubtasks(prev => { const n = prev.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st); if (!isCreateMode) onUpdateFields?.(task.id, { subtasks: n }); return n; }); };
  const handleDeleteSubtask = (subtaskId) => { setLocalSubtasks(prev => { const n = prev.filter(st => st.id !== subtaskId); if (!isCreateMode) onUpdateFields?.(task.id, { subtasks: n }); return n; }); };

  const handleSubmit = async (event) => {
    event?.preventDefault(); if (busy || !isCreateMode) return;
    if (!localTitle.trim()) { if (toast) toast.showToast('Title is required', 'error'); else setError('Title is required'); return; }
    setBusy(true);
    const dueDate = dueStartInput ? new Date(`${dueStartInput}T${dueDraftTime || '00:00'}:00`) : null;
    const meta = { myDay: includeMyDay, course: localCourse || null, courseColor: localCourseColor || null, priority: localPriority, tags: localTags, subtasks: localSubtasks, status: localStatus, type: localEventType, hasTime: Boolean(dueDraftTime) };
    const result = await onCreate({ title: localTitle, dueDate: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate.toISOString() : null, meta });
    setBusy(false);
    if (result?.success) { setError(null); if (toast) toast.showToast('Task created', 'success'); onClose?.(); }
    else { if (toast) toast.showToast(result?.error || 'Unable to create task', 'error'); else setError(result?.error || 'Unable to create task'); }
  };

  const createdDate = task?.meta?.createdAt || task?.createdAt;
  const dateVal = isCreateMode ? dueStartInput : localDueDate;
  const parsedDate = dateVal ? new Date(dateVal) : null;
  const hasDate = parsedDate && !isNaN(parsedDate.getTime());
  const todayStart = getStartOfDay(new Date());
  const isOverdue = hasDate && parsedDate < new Date() && !task?.completed;
  const isToday = hasDate && getStartOfDay(parsedDate).getTime() === todayStart.getTime();
  const isTomorrow = hasDate && getStartOfDay(parsedDate).getTime() === addDays(todayStart, 1).getTime();
  const dueTriggerColor = !hasDate ? 'text-gray-400 dark:text-gray-500' : isOverdue ? 'text-red-600 dark:text-red-400' : isToday ? 'text-emerald-600 dark:text-emerald-400' : isTomorrow ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white';
  const dueTriggerBg = !hasDate ? {} : isOverdue ? { backgroundColor: '#ef444410' } : isToday ? { backgroundColor: '#10b98110' } : isTomorrow ? { backgroundColor: '#f9731610' } : { backgroundColor: '#6366f110' };
  const dueDisplayText = (() => { if (!hasDate) return 'No date'; if (isToday) return 'Today'; if (isTomorrow) return 'Tomorrow'; return parsedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); })();
  const tmrw = addDays(todayStart, 1);
  const weekendDay = (() => { const d = todayStart.getDay(); const off = (6 - d + 7) % 7 || 7; return addDays(todayStart, off); })();
  const nextWeekDay = addDays(todayStart, 7);
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dueShortcuts = [
    { key: 'today', label: 'Today', icon: CalendarIcon, accent: '#10b981', info: dayNames[todayStart.getDay()], action: () => applyDueShortcut('today') },
    { key: 'tomorrow', label: 'Tomorrow', icon: Sun, accent: '#f97316', info: dayNames[tmrw.getDay()], action: () => applyDueShortcut('tomorrow') },
    { key: 'weekend', label: 'This Weekend', icon: Moon, accent: '#3b82f6', info: weekendDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), action: () => applyDueShortcut('weekend') },
    { key: 'next-week', label: 'Next Week', icon: ArrowRight, accent: '#8b5cf6', info: nextWeekDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), action: () => applyDueShortcut('next-week') },
  ];
  const calMonth = duePickerMonth;
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
  const firstDow = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();
  const prevMonthDays = new Date(calMonth.getFullYear(), calMonth.getMonth(), 0).getDate();
  const leadingBlanks = (firstDow + 6) % 7;

  return (
    <form ref={detailPanelRef} className="flex flex-col" onSubmit={handleSubmit}>
      <div className="flex flex-col md:flex-row">
        {/* LEFT COLUMN */}
        <div className="flex-1 min-w-0 px-6 pt-5 pb-4 md:border-r md:border-gray-100 md:dark:border-white/[0.06]">
          <div className="flex items-start gap-3">
            {!isCreateMode && (
              <button type="button" onClick={() => onToggleComplete?.(task.id)}
                className={`flex-shrink-0 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 mt-1 transition-all duration-200 ${task.completed ? 'border-gray-800 dark:border-white bg-gray-800 dark:bg-white scale-95' : 'border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'}`}>
                {task.completed && <Check size={11} strokeWidth={3} className="text-white dark:text-gray-900" />}
              </button>
            )}
            <input type="text" value={localTitle} onChange={e => setLocalTitle(e.target.value)}
              onBlur={e => { if (isCreateMode) return; const v = e.target.value.trim(); if (v && v !== task.title) onUpdateFields?.(task.id, { title: v }); }}
              className={`w-full border-none bg-transparent text-xl font-bold outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 tracking-[-0.01em] ${task?.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}
              placeholder="Task title" autoFocus={isCreateMode} />
          </div>
          <textarea value={localDescription} onChange={e => setLocalDescription(e.target.value)}
            onBlur={() => { if (isCreateMode) return; if (localDescription !== (task.description || '')) onUpdateFields?.(task.id, { description: localDescription }); }}
            placeholder="Add description..." rows={3}
            className="mt-3 w-full resize-none border-none bg-transparent text-[13px] leading-relaxed text-gray-600 dark:text-gray-400 outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600" />

          {/* Subtasks */}
          <div className="mt-5 border-t border-gray-100 dark:border-white/[0.04] pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-gray-400 dark:text-gray-500" />
                <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Sub-tasks</p>
                {localSubtasks.length > 0 && <span className="text-[11px] text-gray-400 dark:text-gray-500">{localSubtasks.filter(st => st.completed).length}/{localSubtasks.length}</span>}
              </div>
            </div>
            {localSubtasks.length > 0 && (
              <div className="h-1 w-full rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden mb-3">
                <div className="h-full rounded-full bg-purple-500 transition-all duration-300" style={{ width: `${(localSubtasks.filter(st => st.completed).length / localSubtasks.length) * 100}%` }} />
              </div>
            )}
            <div>
              {localSubtasks.length > 0 && (
                <div className="space-y-1 mb-3">
                  {localSubtasks.map((subtask, index) => (
                    <div key={subtask.id} draggable
                      onDragStart={e => { e.dataTransfer.setData('subtaskIndex', index.toString()); e.currentTarget.classList.add('opacity-50'); }}
                      onDragEnd={e => e.currentTarget.classList.remove('opacity-50')}
                      onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('bg-purple-50','dark:bg-purple-900/20'); }}
                      onDragLeave={e => e.currentTarget.classList.remove('bg-purple-50','dark:bg-purple-900/20')}
                      onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('bg-purple-50','dark:bg-purple-900/20'); handleReorderSubtasks(parseInt(e.dataTransfer.getData('subtaskIndex'),10), index); }}
                      className="group flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors cursor-grab active:cursor-grabbing">
                      <GripVertical size={11} className="flex-shrink-0 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button type="button" onClick={() => handleToggleSubtask(subtask.id)}
                        className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${subtask.completed ? 'bg-purple-600 border-purple-600' : 'border-slate-300 dark:border-slate-500 hover:border-purple-400'}`}>
                        {subtask.completed && <Check size={10} className="text-white" strokeWidth={3} />}
                      </button>
                      <input type="text" defaultValue={subtask.title}
                        onBlur={e => { const v = e.target.value.trim(); if (v && v !== subtask.title) handleUpdateSubtaskTitle(subtask.id, v); else if (!v) e.target.value = subtask.title; }}
                        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); else if (e.key === 'Escape') { e.currentTarget.value = subtask.title; e.currentTarget.blur(); } }}
                        className={`flex-1 text-[13px] bg-transparent border-0 outline-none focus:bg-gray-50 dark:focus:bg-white/[0.04] focus:px-2 focus:py-0.5 focus:-mx-2 focus:-my-0.5 focus:rounded transition-all ${subtask.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`} />
                      <button type="button" onClick={() => handleDeleteSubtask(subtask.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-3 flex-shrink-0" />
                <div className="flex-shrink-0 w-4 h-4 rounded border-2 border-dashed border-gray-200 dark:border-gray-600" />
                <input type="text" value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                  placeholder="Add a sub-task..." className="flex-1 text-[13px] bg-transparent border-0 outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                {newSubtaskTitle.trim() && <button type="button" onClick={handleAddSubtask} className="flex h-5 w-5 items-center justify-center rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors"><Plus size={12} /></button>}
              </div>
            </div>
          </div>

          {error && <p className="mt-3 text-xs font-semibold text-red-500">{error}</p>}
          {!isCreateMode && createdDate && <p className="mt-4 text-[11px] text-gray-400 dark:text-gray-500">Created {new Date(createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full md:w-[300px] flex-shrink-0 px-5 pt-5 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Details</p>
          <div className="space-y-1">
            {/* Status */}
            <div className="py-1.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 whitespace-nowrap"><currentStatus.icon size={13} style={{ color: currentStatus.color }} /> Status</span>
                <div className="relative">
                  <button type="button" data-detail-trigger onClick={() => setOpenDetailMenu(prev => prev === 'status' ? null : 'status')}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-all hover:shadow-sm" style={{ color: currentStatus.color, backgroundColor: `${currentStatus.color}0a` }}>
                    <currentStatus.icon size={14} className={localStatus === 'doing' ? 'animate-spin' : ''} /> {currentStatus.label} <ChevronDown size={11} className="opacity-50" />
                  </button>
                  {openDetailMenu === 'status' && (
                    <div data-detail-menu className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1d] shadow-2xl">
                      <div className="p-1.5">
                        {statusOptions.map(opt => { const isActive = localStatus === opt.value; const StatusIcon = opt.icon; return (
                          <button key={opt.value} type="button" onMouseDown={e => { e.preventDefault(); setLocalStatus(opt.value); if (!isCreateMode) { onStatusChange?.(task.id, opt.value); onUpdateFields?.(task.id, { status: opt.value }); } setOpenDetailMenu(null); }}
                            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 ${isActive ? '' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'}`}
                            style={isActive ? { backgroundColor: `${opt.color}12`, boxShadow: `inset 0 0 0 1px ${opt.color}25` } : {}}>
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${isActive ? '' : 'bg-gray-100/80 dark:bg-white/[0.06]'}`} style={isActive ? { backgroundColor: `${opt.color}18` } : {}}>
                              <StatusIcon size={15} style={{ color: opt.color }} className={opt.value === 'doing' ? 'animate-spin' : ''} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className={`text-[13px] font-semibold leading-tight ${isActive ? '' : 'text-gray-800 dark:text-gray-200'}`} style={isActive ? { color: opt.color } : {}}>{opt.label}</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">{opt.desc}</p>
                            </div>
                            {isActive && <Check size={15} style={{ color: opt.color }} className="flex-shrink-0" />}
                          </button>
                        ); })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Type */}
            <div className="py-1.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 whitespace-nowrap"><currentType.icon size={13} style={{ color: currentType.color }} /> Type</span>
                <div className="relative">
                  <button type="button" data-detail-trigger onClick={() => setOpenDetailMenu(prev => prev === 'eventtype' ? null : 'eventtype')}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-all hover:shadow-sm" style={{ color: currentType.color, backgroundColor: `${currentType.color}0a` }}>
                    <currentType.icon size={14} /> {currentType.label} <ChevronDown size={11} className="opacity-50" />
                  </button>
                  {openDetailMenu === 'eventtype' && (
                    <div data-detail-menu className="absolute right-0 top-full z-50 mt-2 w-56 max-h-[320px] overflow-y-auto overflow-x-hidden rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1d] shadow-2xl">
                      <div className="p-1.5">
                        {typeOptions.map(type => { const isActive = localEventType === type.value; const TypeIcon = type.icon; return (
                          <button key={type.value} type="button" onMouseDown={e => { e.preventDefault(); setLocalEventType(type.value); if (!isCreateMode) onUpdateFields?.(task.id, { type: type.value }); setOpenDetailMenu(null); }}
                            className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 transition-all duration-150 ${isActive ? '' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'}`}
                            style={isActive ? { backgroundColor: `${type.color}12`, boxShadow: `inset 0 0 0 1px ${type.color}25` } : {}}>
                            <div className={`flex h-6 w-6 items-center justify-center rounded-md transition-all ${isActive ? '' : 'bg-gray-100/80 dark:bg-white/[0.06]'}`} style={isActive ? { backgroundColor: `${type.color}18` } : {}}>
                              <TypeIcon size={13} style={{ color: type.color }} />
                            </div>
                            <span className={`text-[13px] font-medium flex-1 text-left ${isActive ? '' : 'text-gray-800 dark:text-gray-200'}`} style={isActive ? { color: type.color } : {}}>{type.label}</span>
                            {isActive && <Check size={14} style={{ color: type.color }} className="flex-shrink-0" />}
                          </button>
                        ); })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Priority */}
            <div className="py-1.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 whitespace-nowrap"><Flag size={13} style={{ color: priorityInfo.color }} /> Priority</span>
                <div className="relative">
                  <button type="button" data-detail-trigger onClick={() => setOpenDetailMenu(prev => prev === 'priority' ? null : 'priority')}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-all hover:shadow-sm" style={{ color: priorityInfo.color, backgroundColor: `${priorityInfo.color}0a` }}>
                    <Flag size={14} fill={priorityInfo.color} /> {priorityInfo.label} <ChevronDown size={11} className="opacity-50" />
                  </button>
                  {openDetailMenu === 'priority' && (
                    <div data-detail-menu className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1d] shadow-2xl">
                      <div className="p-1.5">
                        {Object.entries(priorityMeta).map(([key, meta]) => { const isActive = localPriority === key; return (
                          <button key={key} type="button" onMouseDown={e => { e.preventDefault(); setLocalPriority(key); if (!isCreateMode) onUpdateFields?.(task.id, { priority: key }); setOpenDetailMenu(null); }}
                            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 ${isActive ? '' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'}`}
                            style={isActive ? { backgroundColor: `${meta.color}12`, boxShadow: `inset 0 0 0 1px ${meta.color}25` } : {}}>
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${isActive ? '' : 'bg-gray-100/80 dark:bg-white/[0.06]'}`} style={isActive ? { backgroundColor: `${meta.color}18` } : {}}>
                              <Flag size={15} fill={isActive ? meta.color : 'none'} style={{ color: meta.color }} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className={`text-[13px] font-semibold leading-tight ${isActive ? '' : 'text-gray-800 dark:text-gray-200'}`} style={isActive ? { color: meta.color } : {}}>{meta.label}</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">{meta.desc}</p>
                            </div>
                            {isActive && <Check size={15} style={{ color: meta.color }} className="flex-shrink-0" />}
                          </button>
                        ); })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div className="py-1.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 whitespace-nowrap"><CalendarIcon size={13} className="text-gray-400 dark:text-gray-500" /> Due date</span>
                <div className="relative">
                  <button type="button" data-detail-trigger ref={dueBtnRef}
                    onClick={() => {
                      const rect = dueBtnRef.current?.getBoundingClientRect();
                      if (rect) {
                        const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
                        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
                        const modalEl = dueBtnRef.current?.closest('[role="dialog"]');
                        const modalRect = modalEl?.getBoundingClientRect();
                        const spaceRight = modalRect ? vw - modalRect.right : vw - rect.right;
                        const spaceLeft = modalRect ? modalRect.left : rect.left;
                        let placement = 'right';
                        if (spaceRight < 310 && spaceLeft >= 310) placement = 'left';
                        else if (spaceRight < 310) placement = 'inline';
                        setDueBtnRect({ top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, modalRight: modalRect?.right || rect.right, modalLeft: modalRect?.left || rect.left, modalTop: modalRect?.top || 40, modalBottom: modalRect?.bottom || vh - 40, placement, vh });
                      } else { setDueBtnRect(null); }
                      setOpenDetailMenu(prev => prev === 'due' ? null : 'due');
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-all hover:shadow-sm ${dueTriggerColor}`} style={dueTriggerBg}>
                    <CalendarIcon size={14} /> {dueDisplayText}
                    {hasDate && dueDraftTime && <span className="text-[11px] opacity-60">{dueDraftTime}</span>}
                    <ChevronDown size={11} className="opacity-50" />
                  </button>

                  {openDetailMenu === 'due' && dueBtnRect && (
                    <div data-detail-menu style={{
                      position: 'fixed',
                      ...(dueBtnRect.placement === 'right' ? { left: dueBtnRect.modalRight + 12, top: Math.max(8, Math.min(dueBtnRect.top - 170, (dueBtnRect.vh || 800) - 580)) }
                        : dueBtnRect.placement === 'left' ? { right: typeof window !== 'undefined' ? window.innerWidth - dueBtnRect.modalLeft + 12 : 20, top: Math.max(8, Math.min(dueBtnRect.top - 170, (dueBtnRect.vh || 800) - 580)) }
                        : { top: Math.min(dueBtnRect.bottom + 8, (dueBtnRect.vh || 800) - 580), right: typeof window !== 'undefined' ? window.innerWidth - dueBtnRect.right : 20 }),
                      zIndex: 999999, width: 270, maxHeight: 'calc(100vh - 16px)', overflowY: 'auto'
                    }} className="overflow-hidden rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1d] shadow-2xl">
                      <div className="px-3 pt-3 pb-2">
                        <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] px-3 py-2">
                          <Search size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <input type="text" placeholder="Type a date..." className="w-full bg-transparent border-0 outline-none text-[13px] text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            onKeyDown={e => { if (e.key === 'Enter') { const result = parseNaturalLanguageDate(e.target.value); if (result) { applyDueSelection(toYMDLocal(result), dueDraftTime); e.target.value = ''; } } }} />
                        </div>
                      </div>
                      <div className="border-t border-gray-100 dark:border-white/[0.05]">
                        {dueShortcuts.map(s => { const ShortcutIcon = s.icon; return (
                          <button key={s.key} type="button" onMouseDown={e => { e.preventDefault(); s.action(); }}
                            className="flex w-full items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: `${s.accent}15` }}><ShortcutIcon size={14} style={{ color: s.accent }} /></div>
                            <span className="flex-1 text-left text-[13px] font-medium text-gray-800 dark:text-gray-200">{s.label}</span>
                            <span className="text-[12px] font-medium text-gray-400 dark:text-gray-500">{s.info}</span>
                          </button>
                        ); })}
                      </div>
                      <div className="border-t border-gray-100 dark:border-white/[0.05] p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200">{calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                          <div className="flex gap-0.5">
                            <button type="button" onMouseDown={e => { e.preventDefault(); setDuePickerMonth(new Date(calMonth.getFullYear(), calMonth.getMonth()-1, 1)); }} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"><ChevronDown size={14} className="rotate-90 text-gray-500" /></button>
                            <button type="button" onMouseDown={e => { e.preventDefault(); setDuePickerMonth(new Date(calMonth.getFullYear(), calMonth.getMonth()+1, 1)); }} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"><ChevronDown size={14} className="-rotate-90 text-gray-500" /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-7 text-center mb-1">
                          {['M','T','W','T','F','S','S'].map((d,i) => <div key={i} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 py-1">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-px">
                          {Array.from({ length: leadingBlanks }).map((_,i) => <div key={`prev-${i}`} className="aspect-square flex items-center justify-center text-[11px] text-gray-300 dark:text-gray-600">{prevMonthDays - leadingBlanks + 1 + i}</div>)}
                          {Array.from({ length: daysInMonth }).map((_,i) => {
                            const day = i + 1;
                            const cellDate = new Date(calMonth.getFullYear(), calMonth.getMonth(), day); cellDate.setHours(0,0,0,0);
                            const isCellToday = cellDate.getTime() === todayStart.getTime();
                            const isCellSelected = dueDraftDate === toYMDLocal(cellDate);
                            const isPast = cellDate < todayStart;
                            return (
                              <button key={day} type="button" onMouseDown={e => { e.preventDefault(); const nd = toYMDLocal(cellDate); setDueDraftDate(nd); applyDueSelection(nd, dueDraftTime); }}
                                className={`aspect-square flex items-center justify-center rounded-md text-[11px] font-semibold transition-all ${isCellSelected ? 'bg-purple-600 text-white shadow-sm' : isCellToday ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-300/50 dark:ring-emerald-600/30' : isPast ? 'text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-white/[0.03]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]'}`}>
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="border-t border-gray-100 dark:border-white/[0.05] px-3 py-2.5 flex items-center gap-2.5">
                        <Clock size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">Time</span>
                        <input type="time" value={dueDraftTime} onChange={e => setDueDraftTime(e.target.value)}
                          className="ml-auto rounded-md border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-2 py-1 text-[12px] font-medium text-gray-700 dark:text-gray-300 outline-none focus:border-purple-400 w-24" />
                        {dueDraftTime && <button type="button" onMouseDown={e => { e.preventDefault(); setDueDraftTime(''); }} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><X size={12} /></button>}
                      </div>
                      <div className="border-t border-gray-100 dark:border-white/[0.05] flex items-center justify-between px-3 py-2.5 bg-gray-50/50 dark:bg-white/[0.02]">
                        <button type="button" onMouseDown={e => { e.preventDefault(); applyDueShortcut('clear'); }} className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"><X size={12} /> No date</button>
                        <button type="button" onMouseDown={e => { e.preventDefault(); applyDueSelection(dueDraftDate, dueDraftTime); }} className="rounded-lg bg-purple-600 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm">Save</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Module */}
            {modules.length > 0 && (
              <div className="flex items-center justify-between py-2 text-[13px]">
                <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 whitespace-nowrap"><Layers size={13} className="text-gray-400 dark:text-gray-500" /> Module</span>
                <div className="relative">
                  <button type="button" data-detail-trigger onClick={() => setOpenDetailMenu(prev => prev === 'module' ? null : 'module')}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-all hover:shadow-sm"
                    style={{ color: localCourseColor || '#64748b', backgroundColor: localCourseColor ? `${localCourseColor}18` : 'rgba(100,116,139,0.08)' }}>
                    <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: localCourseColor || '#94a3b8' }} />
                    <span className="truncate max-w-[130px]">{localCourse || 'None'}</span>
                    <ChevronDown size={11} className="opacity-50" />
                  </button>
                  {openDetailMenu === 'module' && (
                    <div data-detail-menu className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1d] shadow-xl">
                      <div className="max-h-52 overflow-y-auto py-1">
                        <button type="button" onMouseDown={e => { e.preventDefault(); setLocalCourse(null); setLocalCourseColor(null); if (!isCreateMode) onUpdateFields?.(task.id, { course: null, courseColor: null }); setOpenDetailMenu(null); }}
                          className={`flex w-full items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04] ${!localCourse ? 'bg-gray-50/80 dark:bg-white/[0.03]' : ''}`}>
                          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gray-100 dark:bg-white/[0.06] shrink-0"><span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" /></div>
                          <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 flex-1 text-left">No module</p>
                          {!localCourse && <Check size={12} className="text-purple-600 dark:text-purple-400 shrink-0" />}
                        </button>
                        {modules.map(mod => {
                          const moduleName = mod.name || mod.title || mod.code;
                          const moduleColor = mod.color || accentPurple;
                          const isSelected = localCourse === moduleName;
                          return (
                            <button key={mod.id || moduleName} type="button" onMouseDown={e => { e.preventDefault(); setLocalCourse(moduleName); setLocalCourseColor(moduleColor); if (!isCreateMode) onUpdateFields?.(task.id, { course: moduleName, courseColor: moduleColor }); setOpenDetailMenu(null); }}
                              className={`flex w-full items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04] ${isSelected ? 'bg-gray-50/80 dark:bg-white/[0.03]' : ''}`}>
                              <div className="flex h-5 w-5 items-center justify-center rounded-md shrink-0" style={{ backgroundColor: `${moduleColor}20` }}><span className="w-2 h-2 rounded-full" style={{ backgroundColor: moduleColor }} /></div>
                              <p className="text-[12px] font-semibold flex-1 text-left truncate" style={{ color: moduleColor }}>{moduleName}</p>
                              {isSelected && <Check size={12} className="shrink-0" style={{ color: moduleColor }} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Labels */}
            <div className="py-2 text-[13px]">
              <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 mb-2"><Tag size={13} className="text-gray-400 dark:text-gray-500" /> Labels</span>
              <div className="flex flex-wrap gap-1.5 ml-5">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:text-gray-300">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><X size={9} /></button>
                  </span>
                ))}
                {courseModuleTags.filter(ct => !localTags.includes(ct)).slice(0, 2).map(suggestion => (
                  <button key={suggestion} type="button" onClick={() => { setLocalTags(prev => { const n = Array.from(new Set([...prev, suggestion])); if (!isCreateMode) onTagsChange?.(task.id, n); return n; }); }}
                    className="inline-flex items-center rounded-md border border-dashed border-gray-200 dark:border-white/[0.08] px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-white/[0.12] hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    + {suggestion}
                  </button>
                ))}
                <div className="flex items-center gap-1 w-full mt-1">
                  <input value={tagDraft} onChange={e => setTagDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                    placeholder={tags.length === 0 ? 'Add label...' : ''} className="min-w-[60px] flex-1 bg-transparent border-0 px-1 py-0.5 text-[11px] text-gray-700 dark:text-gray-300 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                  {tagDraft.trim() && <button type="button" onClick={handleAddTag} className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"><Plus size={12} /></button>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isCreateMode && (
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-white/[0.06] px-6 py-4 sticky bottom-0 bg-white dark:bg-slate-900 z-10">
          <button type="button" onClick={onClose} disabled={busy} className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Cancel</button>
          <button type="submit" disabled={busy} className="rounded-lg bg-purple-600 hover:bg-purple-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 shadow-sm">{busy ? 'Adding...' : 'Add task'}</button>
        </div>
      )}
    </form>
  );
};

export default TaskDetailPanel;
