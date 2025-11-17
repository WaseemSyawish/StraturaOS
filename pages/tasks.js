// Tasks page - Student-friendly task management with inbox for undated tasks
import Head from 'next/head';
import React, { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Plus, Calendar as CalendarIcon, Filter, Search, Clock, Trash2, Edit3, ChevronRight, ListTodo } from 'lucide-react';
import { useModal } from '@/providers/modal-context';
import AddEventModal from '@/components/schedule/_modals/add-event-modal';
import CustomModal from '@/components/ui/custom-modal';
import { toYMDLocal } from '@/lib/dateHelpers';

const FILTER_VIEWS = [
  { id: 'inbox', label: 'Inbox', icon: CheckSquare },
  { id: 'today', label: 'Today', icon: CalendarIcon },
  { id: 'upcoming', label: 'Upcoming', icon: Clock },
  { id: 'completed', label: 'Completed', icon: CheckSquare },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const { setOpen, setClose } = useModal();

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load tasks');
      const data = await res.json();
      const events = Array.isArray(data?.events) ? data.events : (Array.isArray(data) ? data : []);
      
      // Show all events in tasks page (inbox should capture unscheduled items of any type)
      const filteredTasks = events;
      
      setTasks(filteredTasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleQuickAdd = () => {
    setOpen(
      <CustomModal title="Create Task" onClose={setClose}>
        <AddEventModal
          mode="task"
          onSuccess={() => {
            setClose();
            loadTasks();
          }}
        />
      </CustomModal>
    );
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    try {
      const res = await fetch(`/api/events/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      await loadTasks();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      const res = await fetch(`/api/events/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      await loadTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const getFilteredTasks = () => {
    const today = toYMDLocal(new Date());
    let filtered = [...tasks];

    // Apply view filter
    switch (activeView) {
      case 'inbox':
        // Undated tasks OR tasks without specific time
        filtered = filtered.filter(t => !t.completed && (!t.date || !t.time));
        break;
      case 'today':
        filtered = filtered.filter(t => !t.completed && t.date && toYMDLocal(new Date(t.date)) === today);
        break;
      case 'upcoming':
        filtered = filtered.filter(t => !t.completed && t.date && toYMDLocal(new Date(t.date)) > today);
        break;
      case 'completed':
        filtered = filtered.filter(t => t.completed);
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        (t.title || '').toLowerCase().includes(query) ||
        (t.description || '').toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      <Head>
        <title>Tasks — University Planner</title>
      </Head>

      {/* Header */}
      <header className="border-b border-blue-100/50 bg-white/80 backdrop-blur-sm sticky top-0 z-40 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center shadow-sm dark:from-blue-500/20 dark:to-blue-600/20">
              <ListTodo className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Tasks</h1>
          </div>

          <button
            onClick={handleQuickAdd}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4" />
            Quick Add
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - View Filters */}
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-lg sticky top-24">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
                Views
              </h2>
              <nav className="space-y-1">
                {FILTER_VIEWS.map(view => {
                  const Icon = view.icon;
                  const isActive = activeView === view.id;
                  const count = getFilteredTasks().length;
                  
                  return (
                    <button
                      key={view.id}
                      onClick={() => setActiveView(view.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 border border-blue-100 dark:border-blue-800'
                          : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{view.label}</span>
                      </div>
                      {isActive && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content - Task List */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
            </div>

            {/* Task List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-lg overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                    <CheckSquare className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {activeView === 'inbox' && 'Inbox is empty'}
                    {activeView === 'today' && 'No tasks for today'}
                    {activeView === 'upcoming' && 'No upcoming tasks'}
                    {activeView === 'completed' && 'No completed tasks'}
                  </h3>
                  <p className="text-gray-600 dark:text-slate-400 text-sm">
                    {activeView === 'completed' 
                      ? 'Completed tasks will appear here'
                      : 'Click "Quick Add" to create your first task'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {filteredTasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteTask}
                      onEdit={() => {
                        setOpen(
                          <CustomModal title={`Edit: ${task.title}`} onClose={setClose}>
                            <AddEventModal
                              mode="edit"
                              initialData={task}
                              onSuccess={() => {
                                setClose();
                                loadTasks();
                              }}
                            />
                          </CustomModal>
                        );
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TaskRow({ task, onToggleComplete, onDelete, onEdit }) {
  const hasDate = task.date && toYMDLocal(new Date(task.date));
  const isOverdue = hasDate && toYMDLocal(new Date(task.date)) < toYMDLocal(new Date()) && !task.completed;

  return (
    <div
      className={`group flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
        task.completed ? 'opacity-60' : ''
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete(task.id, task.completed)}
        className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 transition-all ${
          task.completed
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 dark:border-slate-600 hover:border-blue-500'
        }`}
      >
        {task.completed && (
          <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium text-gray-900 dark:text-white ${task.completed ? 'line-through' : ''}`}>
          {task.title || 'Untitled Task'}
        </h3>
        
        {task.description && (
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Task Metadata */}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-slate-500">
          {hasDate && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
              <CalendarIcon className="w-3 h-3" />
              {new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.time}
            </span>
          )}
          {task.courses && task.courses.name && (
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded-full">
              {task.courses.name}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Edit task"
        >
          <Edit3 className="w-4 h-4 text-gray-600 dark:text-slate-400" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </div>
    </div>
  );
}
