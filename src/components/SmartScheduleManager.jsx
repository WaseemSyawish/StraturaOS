import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, Edit2, Clock, MapPin, RotateCcw, BookOpen, CalendarDays,
  Sparkles, Check, X, ChevronDown, FlaskConical, Lightbulb, Users,
  Plus, Calendar
} from 'lucide-react';
import { showCustomAlert } from '@/utils/dialogs';
import CustomSelect from '@/components/CustomSelect';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Session type icons and colors
const SESSION_STYLES = {
  Lecture: { icon: BookOpen, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', label: 'Lectures' },
  Lab: { icon: FlaskConical, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Labs' },
  Tutorial: { icon: Lightbulb, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', label: 'Tutorials' },
  Seminar: { icon: Users, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', label: 'Seminars' },
};

const normalizeSessionType = (sessionType) => {
  const raw = String(sessionType || '').trim().toLowerCase();
  if (!raw) return 'Lecture';
  if (raw === 'lab') return 'Lab';
  if (raw === 'tutorial') return 'Tutorial';
  if (raw === 'seminar') return 'Seminar';
  if (raw === 'class' || raw === 'lecture') return 'Lecture';
  return 'Lecture';
};

const hexToRgba = (hex, alpha) => {
  const clean = (hex || '#8B5CF6').replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function SmartScheduleManager({ onClose, onUpdate }) {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [groupedByType, setGroupedByType] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [expandedTypes, setExpandedTypes] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Add Instance state
  const [showAddForm, setShowAddForm] = useState(false);
  const [courses, setCourses] = useState([]);
  const [isAddingSaving, setIsAddingSaving] = useState(false);
  const [addForm, setAddForm] = useState({
    courseId: '',
    sessionType: 'Lecture',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
  });

  useEffect(() => {
    fetchPatterns();
    fetchCourses();
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/courses', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  }, []);

  const fetchPatterns = async () => {
    try {
      const res = await fetch('/api/timetable/patterns', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => null);
      
      if (data.success && data.patterns) {
        setPatterns(data.patterns);
        
        // Group by session type
        const grouped = {};
        data.patterns.forEach(p => {
          const type = normalizeSessionType(p.sessionType);
          if (!grouped[type]) grouped[type] = [];
          grouped[type].push({ ...p, sessionType: type });
        });
        setGroupedByType(grouped);
        // Auto-expand all types
        const expanded = {};
        Object.keys(grouped).forEach(t => { expanded[t] = true; });
        setExpandedTypes(prev => {
          // Only set if not already set (preserve user toggle state on refresh)
          const merged = { ...expanded };
          Object.keys(prev).forEach(k => { if (k in merged) merged[k] = prev[k]; });
          return merged;
        });
      }
    } catch (err) {
      console.error('Failed to fetch patterns:', err);
      showCustomAlert('Error', 'Failed to load smart schedules', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pattern) => {
    // First click: show inline confirmation
    if (confirmDeleteId !== pattern.id) {
      setConfirmDeleteId(pattern.id);
      return;
    }
    // Second click: confirmed — proceed with delete
    setConfirmDeleteId(null);
    setDeleting(prev => ({ ...prev, [pattern.id]: true }));
    try {
      const res = await fetch(
        `/api/timetable/patterns?courseId=${pattern.courseId}&dayOfWeek=${pattern.dayOfWeek}&startTime=${pattern.startTime}`,
        { method: 'DELETE', credentials: 'include' }
      );

      const data = await res.json().catch(() => null);
      if (data && data.success) {
        showCustomAlert('Success', `Deleted ${data.deletedCount} instances`, 'success');
        await fetchPatterns();
        onUpdate?.();
      }
    } catch (err) {
      console.error('Delete failed:', err);
      showCustomAlert('Error', 'Failed to delete pattern', 'danger');
    } finally {
      setDeleting(prev => ({ ...prev, [pattern.id]: false }));
    }
  };

  const handleEditStart = (pattern) => {
    setEditingId(pattern.id);
    setEditValues({
      ...pattern,
      sessionType: normalizeSessionType(pattern.sessionType)
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleEditSave = async () => {
    if (isSaving) return; // Prevent double-save
    const originalPattern = patterns.find(p => p.id === editingId);
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/timetable/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          oldPattern: {
            courseId: originalPattern.courseId,
            dayOfWeek: originalPattern.dayOfWeek,
            startTime: originalPattern.startTime
          },
          newPattern: editValues
        })
      });

      const data = await res.json().catch(() => null);
      if (data && data.success) {
        showCustomAlert('Success', data.message || 'Pattern updated', 'success');
        setEditingId(null);
        setEditValues({});
        await fetchPatterns();
        onUpdate?.();
      } else {
        showCustomAlert('Error', data.error || 'Failed to update pattern', 'danger');
      }
    } catch (err) {
      console.error('Update failed:', err);
      showCustomAlert('Error', 'Failed to update pattern', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleType = (type) => {
    setExpandedTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const sessionTypeToEventType = (sessionType) => {
    const map = { Lecture: 'class', Lab: 'lab', Tutorial: 'tutorial', Seminar: 'seminar' };
    return map[sessionType] || 'class';
  };

  const handleAddInstance = async () => {
    if (isAddingSaving) return;
    if (!addForm.courseId) return showCustomAlert('Error', 'Please select a module', 'danger');
    if (!addForm.date) return showCustomAlert('Error', 'Please select a date', 'danger');
    if (!addForm.startTime || !addForm.endTime) return showCustomAlert('Error', 'Please set start and end times', 'danger');
    if (addForm.startTime >= addForm.endTime) return showCustomAlert('Error', 'End time must be after start time', 'danger');

    const course = courses.find(c => String(c.id) === String(addForm.courseId));
    if (!course) return showCustomAlert('Error', 'Selected module not found', 'danger');

    setIsAddingSaving(true);
    try {
      const eventType = sessionTypeToEventType(addForm.sessionType);
      const dayOfWeek = new Date(addForm.date).getDay();

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: `${course.name} (${addForm.sessionType})`,
          type: eventType,
          date: addForm.date,
          time: addForm.startTime,
          description: `${addForm.sessionType} session for ${course.name}`,
          courseId: course.id,
          location: addForm.location || null,
          meta: {
            schedulePattern: {
              sessionType: addForm.sessionType.toLowerCase(),
              dayOfWeek,
              startTime: addForm.startTime,
              endTime: addForm.endTime,
              courseId: course.id,
              courseName: course.name,
              courseCode: course.code || '',
              courseColor: course.color || '#8B5CF6',
              location: addForm.location || '',
            },
          }
        })
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        showCustomAlert('Success', `Added ${addForm.sessionType} session for ${course.name}`, 'success');
        setShowAddForm(false);
        setAddForm({ courseId: '', sessionType: 'Lecture', date: '', startTime: '09:00', endTime: '10:00', location: '' });
        await fetchPatterns();
        onUpdate?.();
      } else {
        showCustomAlert('Error', data?.error || 'Failed to add session', 'danger');
      }
    } catch (err) {
      console.error('Add instance failed:', err);
      showCustomAlert('Error', 'Failed to add session', 'danger');
    } finally {
      setIsAddingSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-purple-200 dark:border-purple-900" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading schedules…</p>
        </motion.div>
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-14 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CalendarDays className="w-7 h-7 text-purple-500 dark:text-purple-400" />
        </div>
        <p className="text-gray-700 dark:text-gray-300 font-semibold">No smart schedules yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1.5 max-w-xs mx-auto">
          Use the Smart Schedule Creator to build your timetable automatically
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Smart Schedules</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{patterns.length} pattern{patterns.length !== 1 ? 's' : ''} across {Object.keys(groupedByType).length} type{Object.keys(groupedByType).length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAddForm(f => !f)}
            className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm"
            title="Add individual session"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Instance
          </button>
          <button
            onClick={fetchPatterns}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors group"
            title="Refresh"
          >
            <RotateCcw className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
          </button>
        </div>
      </div>

      {/* Add Instance Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-900/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Add Individual Session</p>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Module selector */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Module</label>
                <CustomSelect
                  value={addForm.courseId}
                  onChange={(val) => setAddForm(prev => ({ ...prev, courseId: val }))}
                  placeholder="Select a module..."
                  options={courses.map(c => ({ value: c.id, label: `${c.name}${c.code ? ` (${c.code})` : ''}` }))}
                />
              </div>

              {/* Type + Date */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Session Type</label>
                  <CustomSelect
                    value={addForm.sessionType}
                    onChange={(val) => setAddForm(prev => ({ ...prev, sessionType: val }))}
                    options={[
                      { value: 'Lecture', label: 'Lecture' },
                      { value: 'Lab', label: 'Lab' },
                      { value: 'Tutorial', label: 'Tutorial' },
                      { value: 'Seminar', label: 'Seminar' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Date</label>
                  <input
                    type="date"
                    value={addForm.date}
                    onChange={(e) => setAddForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full mt-1 px-2.5 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition"
                  />
                </div>
              </div>

              {/* Start/End time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Start Time</label>
                  <input
                    type="time"
                    value={addForm.startTime}
                    onChange={(e) => setAddForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full mt-1 px-2.5 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">End Time</label>
                  <input
                    type="time"
                    value={addForm.endTime}
                    onChange={(e) => setAddForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full mt-1 px-2.5 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Location (optional)</label>
                <input
                  type="text"
                  value={addForm.location}
                  onChange={(e) => setAddForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Room 101, Lab B"
                  className="w-full mt-1 px-2.5 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition placeholder:text-gray-400"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAddInstance}
                  disabled={isAddingSaving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isAddingSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Add Session
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  disabled={isAddingSaving}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-60"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grouped sections */}
      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-0.5 scrollbar-thin">
        {Object.entries(groupedByType).map(([sessionType, typePatterns]) => {
          const style = SESSION_STYLES[sessionType] || SESSION_STYLES.Lecture;
          const TypeIcon = style.icon;
          const isExpanded = expandedTypes[sessionType] !== false;

          return (
            <motion.div
              key={sessionType}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 overflow-hidden shadow-sm"
            >
              {/* Section header — clickable to toggle */}
              <button
                onClick={() => toggleType(sessionType)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: style.bg }}
                >
                  <TypeIcon className="w-4 h-4" style={{ color: style.color }} />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{style.label}</span>
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{typePatterns.length}</span>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </motion.div>
              </button>

              {/* Collapsible pattern list */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2">
                      {typePatterns.map((pattern) => {
                        const courseColor = pattern.courseColor || style.color;
                        return (
                          <motion.div
                            key={pattern.id}
                            layout
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            className="rounded-xl border overflow-hidden transition-colors"
                            style={{
                              borderColor: hexToRgba(courseColor, 0.15),
                              backgroundColor: hexToRgba(courseColor, 0.04),
                            }}
                          >
                            {editingId === pattern.id ? (
                              /* ── Edit Mode ───────────────────────────────── */
                              <div className="p-3.5 space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: courseColor }} />
                                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                    Editing: {pattern.courseName}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Day</label>
                                    <CustomSelect
                                      value={editValues.dayOfWeek}
                                      onChange={(val) => setEditValues({ ...editValues, dayOfWeek: parseInt(val) })}
                                      options={WEEKDAYS.map((day, idx) => ({ value: idx, label: day }))}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Type</label>
                                    <CustomSelect
                                      value={editValues.sessionType}
                                      onChange={(val) => setEditValues({ ...editValues, sessionType: val })}
                                      options={[
                                        { value: 'Lecture', label: 'Lecture' },
                                        { value: 'Lab', label: 'Lab' },
                                        { value: 'Tutorial', label: 'Tutorial' },
                                        { value: 'Seminar', label: 'Seminar' },
                                      ]}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Start</label>
                                    <input
                                      type="time"
                                      value={editValues.startTime}
                                      onChange={(e) => setEditValues({ ...editValues, startTime: e.target.value })}
                                      className="w-full mt-1 px-2.5 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">End</label>
                                    <input
                                      type="time"
                                      value={editValues.endTime}
                                      onChange={(e) => setEditValues({ ...editValues, endTime: e.target.value })}
                                      className="w-full mt-1 px-2.5 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Location</label>
                                  <input
                                    type="text"
                                    value={editValues.location || ''}
                                    onChange={(e) => setEditValues({ ...editValues, location: e.target.value })}
                                    placeholder="e.g., Room 101"
                                    className="w-full mt-1 px-2.5 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition"
                                  />
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={handleEditSave}
                                    disabled={isSaving}
                                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    {isSaving ? (
                                      <>
                                        <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-3.5 h-3.5" />
                                        Save Changes
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={handleEditCancel}
                                    disabled={isSaving}
                                    className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-60"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* ── View Mode ───────────────────────────────── */
                              <div className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: courseColor }} />
                                      <p className="font-bold text-sm text-gray-900 dark:text-white truncate leading-tight">
                                        {pattern.courseName}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                      <span className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        {WEEKDAY_SHORT[pattern.dayOfWeek]}s &middot; {pattern.startTime}–{pattern.endTime}
                                      </span>
                                      {pattern.location && (
                                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                          <MapPin className="w-3 h-3" />
                                          {pattern.location}
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-2">
                                      <span
                                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{
                                          backgroundColor: hexToRgba(courseColor, 0.1),
                                          color: courseColor,
                                        }}
                                      >
                                        <RotateCcw className="w-2.5 h-2.5" />
                                        {pattern.totalInstances} session{pattern.totalInstances !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Action buttons */}
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    {confirmDeleteId === pattern.id ? (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-2.5 py-1.5"
                                      >
                                        <span className="text-[11px] font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                                          Remove {pattern.totalInstances}?
                                        </span>
                                        <button
                                          onClick={() => setConfirmDeleteId(null)}
                                          className="px-2 py-0.5 text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition"
                                        >
                                          No
                                        </button>
                                        <button
                                          onClick={() => handleDelete(pattern)}
                                          disabled={deleting[pattern.id]}
                                          className="px-2 py-0.5 text-xs font-bold rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 transition"
                                        >
                                          {deleting[pattern.id] ? '…' : 'Yes'}
                                        </button>
                                      </motion.div>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleEditStart(pattern)}
                                          className="p-2 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                                          title="Edit pattern"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDelete(pattern)}
                                          disabled={deleting[pattern.id]}
                                          className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                          title="Delete all sessions"
                                        >
                                          {deleting[pattern.id] ? (
                                            <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-colors text-sm"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
}
