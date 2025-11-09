import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, Save, X, CheckCircle } from 'lucide-react';
import { showCustomAlert, showCustomConfirm } from '@/utils/dialogs';

export default function SemesterSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/semester-settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to fetch semester settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setForm({
      name: '',
      start_date: '',
      end_date: '',
      is_active: settings.length === 0 // Auto-activate if first one
    });
    setEditing(null);
    setShowAdd(true);
  };

  const handleEdit = (setting) => {
    setForm({
      id: setting.id,
      name: setting.name,
      start_date: setting.start_date.split('T')[0],
      end_date: setting.end_date.split('T')[0],
      is_active: setting.is_active
    });
    setEditing(setting.id);
    setShowAdd(true);
  };

  const handleSave = async () => {
    try {
      const method = editing ? 'PATCH' : 'POST';
      const response = await fetch('/api/semester-settings', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json();
      if (data.success) {
        await fetchSettings();
        setShowAdd(false);
        setEditing(null);
      } else {
        await showCustomAlert('Save Failed', data.error || 'Failed to save semester', 'danger');
      }
    } catch (err) {
      console.error('Save error:', err);
      await showCustomAlert('Error', 'Failed to save semester', 'danger');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showCustomConfirm(
      'Delete Semester?',
      'Delete this semester configuration?',
      { type: 'danger', confirmText: 'Delete' }
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/semester-settings?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        await fetchSettings();
      } else {
        await showCustomAlert('Delete Failed', data.error || 'Failed to delete', 'danger');
      }
    } catch (err) {
      console.error('Delete error:', err);
      await showCustomAlert('Error', 'Failed to delete semester', 'danger');
    }
  };

  const handleSetActive = async (id) => {
    try {
      const response = await fetch('/api/semester-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: true })
      });

      const data = await response.json();
      if (data.success) {
        await fetchSettings();
      }
    } catch (err) {
      console.error('Activate error:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-6">
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-6 w-6 bg-gray-200 dark:bg-slate-700 rounded"></div>
          <div className="h-6 w-48 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  const activeSemester = settings.find(s => s.is_active);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-sm p-6 mb-6 border border-indigo-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Calendar className="text-indigo-600 dark:text-indigo-400" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">Semester Configuration</h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">Define your semester dates for smart scheduling</p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
        >
          <Plus size={16} />
          Add Semester
        </button>
      </div>

      {settings.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-700">
          <Calendar className="mx-auto mb-3 text-gray-400" size={32} />
          <p className="text-gray-600 dark:text-slate-400 mb-2">No semester configured yet</p>
          <p className="text-sm text-gray-500 dark:text-slate-500">Add your first semester to use Smart Timetable Creator</p>
        </div>
      ) : (
        <div className="space-y-3">
          {settings.map(setting => (
            <div
              key={setting.id}
              className={`bg-white dark:bg-slate-800 rounded-lg p-4 border-2 transition-all ${
                setting.is_active
                  ? 'border-indigo-500 shadow-md'
                  : 'border-gray-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-slate-100">{setting.name}</h3>
                    {setting.is_active && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full">
                        <CheckCircle size={12} />
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
                    <span>Start: {new Date(setting.start_date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>End: {new Date(setting.end_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!setting.is_active && (
                    <button
                      onClick={() => handleSetActive(setting.id)}
                      className="px-3 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded text-sm font-semibold transition-colors"
                    >
                      Set Active
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(setting)}
                    className="p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(setting.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                {editing ? 'Edit Semester' : 'Add Semester'}
              </h3>
              <button
                onClick={() => setShowAdd(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Semester Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., 2025/2026 - Semester 1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Set as active semester
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name || !form.start_date || !form.end_date}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
