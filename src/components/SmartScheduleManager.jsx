import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Clock, MapPin, Users, RotateCcw } from 'lucide-react';
import { showCustomAlert } from '@/utils/dialogs';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SmartScheduleManager({ onClose, onUpdate }) {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [groupedByType, setGroupedByType] = useState({});
  const [semesterSettings, setSemesterSettings] = useState([]);

  useEffect(() => {
    fetchPatterns();
    fetchSemesterSettings();
  }, []);

  const fetchSemesterSettings = async () => {
    try {
      const res = await fetch('/api/semester-settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSemesterSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to fetch semester settings:', err);
    }
  };

  const getActiveSemester = () => {
    if (!semesterSettings.length) return null;
    // Find active semester, or fall back to first one
    return semesterSettings.find(s => s.is_active) || semesterSettings[0];
  };

  const fetchPatterns = async () => {
    try {
      const res = await fetch('/api/timetable/patterns', {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success && data.patterns) {
        setPatterns(data.patterns);
        
        // Group by session type
        const grouped = {};
        data.patterns.forEach(p => {
          const type = p.sessionType || 'Lecture';
          if (!grouped[type]) grouped[type] = [];
          grouped[type].push(p);
        });
        setGroupedByType(grouped);
      }
    } catch (err) {
      console.error('Failed to fetch patterns:', err);
      showCustomAlert('Error', 'Failed to load smart schedules', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pattern) => {
    const confirmed = await showCustomAlert(
      'Delete Pattern',
      `Remove all ${pattern.totalInstances} instances of ${pattern.sessionType} on ${WEEKDAYS[pattern.dayOfWeek]} at ${pattern.startTime}?`,
      'warning',
      true
    );

    if (!confirmed) return;

    setDeleting(prev => ({ ...prev, [pattern.id]: true }));
    try {
      const res = await fetch(
        `/api/timetable/patterns?courseId=${pattern.courseId}&dayOfWeek=${pattern.dayOfWeek}&startTime=${pattern.startTime}`,
        { method: 'DELETE', credentials: 'include' }
      );

      const data = await res.json();
      if (data.success) {
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
      ...pattern
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleEditSave = async () => {
    const originalPattern = patterns.find(p => p.id === editingId);
    const activeSemester = getActiveSemester();
    
    if (!activeSemester) {
      showCustomAlert('Error', 'No active semester found. Please set up a semester first.', 'danger');
      return;
    }
    
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
          newPattern: editValues,
          semesterInfo: {
            start_date: activeSemester.start_date,
            end_date: activeSemester.end_date
          }
        })
      });

      const data = await res.json();
      if (data.success) {
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
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading patterns...</p>
        </div>
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
          <RotateCcw className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">No smart schedules found</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Create one using the Smart Schedule Creator</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Smart Schedules</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{patterns.length} pattern{patterns.length !== 1 ? 's' : ''} found</p>
        </div>
        <button
          onClick={fetchPatterns}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Refresh"
        >
          <RotateCcw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {Object.entries(groupedByType).map(([sessionType, typePatterns]) => (
          <div key={sessionType} className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
              {sessionType}s ({typePatterns.length})
            </h4>
            {typePatterns.map((pattern) => (
              <div
                key={pattern.id}
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
              >
                {editingId === pattern.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Day</label>
                        <select
                          value={editValues.dayOfWeek}
                          onChange={(e) => setEditValues({ ...editValues, dayOfWeek: parseInt(e.target.value) })}
                          className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          {WEEKDAYS.map((day, idx) => (
                            <option key={idx} value={idx}>{day}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Session Type</label>
                        <select
                          value={editValues.sessionType}
                          onChange={(e) => setEditValues({ ...editValues, sessionType: e.target.value })}
                          className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          <option>Lecture</option>
                          <option>Lab</option>
                          <option>Tutorial</option>
                          <option>Seminar</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Start Time</label>
                        <input
                          type="time"
                          value={editValues.startTime}
                          onChange={(e) => setEditValues({ ...editValues, startTime: e.target.value })}
                          className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">End Time</label>
                        <input
                          type="time"
                          value={editValues.endTime}
                          onChange={(e) => setEditValues({ ...editValues, endTime: e.target.value })}
                          className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Location</label>
                      <input
                        type="text"
                        value={editValues.location || ''}
                        onChange={(e) => setEditValues({ ...editValues, location: e.target.value })}
                        placeholder="e.g., Room 101"
                        className="w-full mt-1 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleEditSave}
                        className="flex-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="flex-1 px-3 py-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: pattern.courseColor }}
                        />
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {pattern.courseName}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {WEEKDAYS[pattern.dayOfWeek]} {pattern.startTime}-{pattern.endTime}
                        </div>
                        {pattern.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {pattern.location}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-500">
                        <Users className="w-3 h-3" />
                        {pattern.totalInstances} instance{pattern.totalInstances !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditStart(pattern)}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition-colors"
                        title="Edit pattern"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pattern)}
                        disabled={deleting[pattern.id]}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors disabled:opacity-50"
                        title="Delete all instances"
                      >
                        {deleting[pattern.id] ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
