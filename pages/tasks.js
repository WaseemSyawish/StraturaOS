// Tasks page - Student-friendly task management with inbox for undated tasks
import Head from 'next/head';
import React, { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Plus, Calendar as CalendarIcon, Filter, Search, Clock, Trash2, Edit3, ChevronRight, ListTodo, ArrowUpDown, Zap, Target, AlertCircle, TrendingUp, ChevronDown, ChevronUp, BookOpen, GraduationCap, Check } from 'lucide-react';
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

const SORT_OPTIONS = [
  { id: 'date', label: 'Due Date', icon: CalendarIcon },
  { id: 'priority', label: 'Priority', icon: Target },
  { id: 'course', label: 'Course', icon: BookOpen },
];

const EISENHOWER_QUADRANTS = [
  { id: 'urgent-important', label: 'Do First', color: 'red', icon: AlertCircle, description: 'Urgent & Important' },
  { id: 'not-urgent-important', label: 'Schedule', color: 'blue', icon: Target, description: 'Not Urgent but Important' },
  { id: 'urgent-not-important', label: 'Delegate', color: 'amber', icon: Zap, description: 'Urgent but Not Important' },
  { id: 'not-urgent-not-important', label: 'Eliminate', color: 'gray', icon: TrendingUp, description: 'Not Urgent & Not Important' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [expandedGroups, setExpandedGroups] = useState({});
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

  const sortTasks = (tasksToSort) => {
    const sorted = [...tasksToSort];
    
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { 'urgent-important': 1, 'not-urgent-important': 2, 'urgent-not-important': 3, 'not-urgent-not-important': 4 };
        sorted.sort((a, b) => {
          const aPriority = a.priority || 'not-urgent-not-important';
          const bPriority = b.priority || 'not-urgent-not-important';
          const priorityDiff = (priorityOrder[aPriority] || 99) - (priorityOrder[bPriority] || 99);
          if (priorityDiff !== 0) return priorityDiff;
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(a.date) - new Date(b.date);
        });
        break;
      case 'date':
        sorted.sort((a, b) => {
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(a.date) - new Date(b.date);
        });
        break;
      case 'course':
        sorted.sort((a, b) => {
          const aCourse = a.courses?.name || a.type || 'No Course';
          const bCourse = b.courses?.name || b.type || 'No Course';
          const courseDiff = aCourse.localeCompare(bCourse);
          if (courseDiff !== 0) return courseDiff;
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(a.date) - new Date(b.date);
        });
        break;
    }
    
    return sorted;
  };

  // Group by course for better organization
  const groupTasksByCourse = (tasksToGroup) => {
    const grouped = {};
    const classes = {};
    const assignments = {};
    const other = {};
    
    tasksToGroup.forEach(task => {
      const courseName = task.courses?.name || 'No Course';
      const type = task.type || 'other';
      
      if (type === 'class' || type === 'lecture') {
        if (!classes[courseName]) classes[courseName] = [];
        classes[courseName].push(task);
      } else if (type === 'assignment' || type === 'exam') {
        if (!assignments[courseName]) assignments[courseName] = [];
        assignments[courseName].push(task);
      } else {
        if (!other[courseName]) other[courseName] = [];
        other[courseName].push(task);
      }
    });
    
    return { classes, assignments, other };
  };

  const groupTasksByQuadrant = (tasksToGroup) => {
    const groups = {
      'urgent-important': [],
      'not-urgent-important': [],
      'urgent-not-important': [],
      'not-urgent-not-important': [],
    };
    
    tasksToGroup.forEach(task => {
      const quadrant = task.priority || 'not-urgent-not-important';
      if (groups[quadrant]) {
        groups[quadrant].push(task);
      } else {
        groups['not-urgent-not-important'].push(task);
      }
    });
    
    return groups;
  };

  // Smart grouping for date-based view
  const groupTasksByTimeframe = (tasksToGroup) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() + 7);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 14);
    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() + 1);
    
    const groups = {
      tomorrow: [],
      thisWeek: [],
      nextWeek: [],
      thisMonth: [],
      later: []
    };
    
    tasksToGroup.forEach(task => {
      if (!task.date) {
        groups.later.push(task);
        return;
      }
      
      const taskDate = new Date(task.date);
      const todayStr = toYMDLocal(today);
      const tomorrowStr = toYMDLocal(tomorrow);
      const taskStr = toYMDLocal(taskDate);
      
      if (taskStr === tomorrowStr) {
        groups.tomorrow.push(task);
      } else if (taskDate <= thisWeek) {
        groups.thisWeek.push(task);
      } else if (taskDate <= nextWeek) {
        groups.nextWeek.push(task);
      } else if (taskDate <= thisMonth) {
        groups.thisMonth.push(task);
      } else {
        groups.later.push(task);
      }
    });
    
    return groups;
  };

  const filteredTasks = getFilteredTasks();
  const sortedTasks = sortTasks(filteredTasks);
  const courseGroups = sortBy === 'course' ? groupTasksByCourse(sortedTasks) : null;
  const timeframeGroups = sortBy === 'date' && activeView !== 'completed' ? groupTasksByTimeframe(sortedTasks) : null;
  const priorityGroups = sortBy === 'priority' ? groupTasksByQuadrant(sortedTasks) : null;

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-slate-950">
      <Head>
        <title>Tasks — University Planner</title>
      </Head>

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your work and stay organized</p>
            </div>

            <button
              onClick={handleQuickAdd}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredTasks.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Tasks</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.filter(t => t.completed).length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tasks.filter(t => !t.completed && t.date && new Date(t.date) < new Date()).length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Overdue</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tasks.filter(t => !t.completed && t.date && toYMDLocal(new Date(t.date)) === toYMDLocal(new Date())).length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Due Today</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - View Filters */}
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-800">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                Views
              </h2>
              <nav className="space-y-1">
                {FILTER_VIEWS.map(view => {
                  const Icon = view.icon;
                  const isActive = activeView === view.id;
                  
                  return (
                    <button
                      key={view.id}
                      onClick={() => setActiveView(view.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{view.label}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content - Task List */}
          <div className="lg:col-span-3">
            {/* Search Bar + Sort Controls */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white shadow-sm"
                />
              </div>
              
              {/* Sort Dropdown - Show in all views except completed */}
              {activeView !== 'completed' && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-medium cursor-pointer hover:border-gray-300 dark:hover:border-slate-700 transition-colors shadow-sm"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>
                      Sort: {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Task List */}
            <div className="space-y-4">
              {loading ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-gray-100 dark:border-slate-800 shadow-sm">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
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
              ) : courseGroups ? (
                // Course-based view with Classes/Lectures separated from Assignments
                <div className="space-y-6">
                  {/* Classes & Lectures Section */}
                  {Object.keys(courseGroups.classes).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Classes & Lectures</h2>
                        <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
                          {Object.values(courseGroups.classes).flat().length}
                        </span>
                      </div>
                      
                      <div className="grid gap-4">
                        {Object.entries(courseGroups.classes).map(([courseName, tasks]) => {
                          const groupKey = `classes-${courseName}`;
                          const isExpanded = expandedGroups[groupKey];
                          const visibleTasks = isExpanded ? tasks : tasks.slice(0, 3);
                          
                          return (
                            <div key={groupKey} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                              <button
                                onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-700 dark:text-purple-400 font-semibold text-sm">
                                    {courseName.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="text-left">
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{courseName}</h3>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">{tasks.length} lecture{tasks.length !== 1 ? 's' : ''}</p>
                                  </div>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                              
                              {isExpanded && (
                                <div className="border-t border-gray-100 dark:border-slate-800">
                                  {visibleTasks.map(task => (
                                    <div key={task.id} className="p-4 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group border-b border-gray-50 dark:border-slate-800/50 last:border-0">
                                      <div className="flex items-start gap-3">
                                        <button
                                          onClick={() => handleToggleComplete(task.id, task.completed)}
                                          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all ${
                                            task.completed
                                              ? 'bg-green-500 border-green-500'
                                              : 'border-gray-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500'
                                          }`}
                                        >
                                          {task.completed && (
                                            <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                          )}
                                        </button>
                                        
                                        <div className="flex-1 min-w-0">
                                          <h4 className={`font-medium text-gray-900 dark:text-white text-sm ${task.completed ? 'line-through opacity-60' : ''}`}>
                                            {task.title || 'Untitled Class'}
                                          </h4>
                                          {task.description && (
                                            <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                                          )}
                                          <div className="flex items-center gap-2 mt-2">
                                            {task.date && (
                                              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                                                <CalendarIcon className="w-3 h-3" />
                                                {new Date(task.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                              </span>
                                            )}
                                            {task.time && (
                                              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                                                <Clock className="w-3 h-3" />
                                                {task.time}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => {
                                              setOpen(
                                                <CustomModal title={`Edit: ${task.title}`} onClose={setClose}>
                                                  <AddEventModal mode="edit" initialData={task} onSuccess={() => { setClose(); loadTasks(); }} />
                                                </CustomModal>
                                              );
                                            }}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                                          >
                                            <Edit3 className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {tasks.length > 3 && !isExpanded && (
                                    <button
                                      onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: true }))}
                                      className="w-full py-2.5 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors font-medium"
                                    >
                                      Show {tasks.length - 3} more
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Assignments & Exams Section */}
                  {Object.keys(courseGroups.assignments).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assignments & Exams</h2>
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                          {Object.values(courseGroups.assignments).flat().length}
                        </span>
                      </div>
                      
                      <div className="grid gap-4">
                        {Object.entries(courseGroups.assignments).map(([courseName, tasks]) => {
                          const groupKey = `assignments-${courseName}`;
                          const isExpanded = expandedGroups[groupKey];
                          const visibleTasks = isExpanded ? tasks : tasks.slice(0, 3);
                          
                          return (
                            <div key={groupKey} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                              <button
                                onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-700 dark:text-blue-400 font-semibold text-sm">
                                    {courseName.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="text-left">
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{courseName}</h3>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">{tasks.length} assignment{tasks.length !== 1 ? 's' : ''}</p>
                                  </div>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                              
                              {isExpanded && (
                                <div className="border-t border-gray-100 dark:border-slate-800">
                                  {visibleTasks.map(task => (
                                    <div key={task.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group">
                                      <div className="flex items-start gap-3">
                                        <button
                                          onClick={() => handleToggleComplete(task.id, task.completed)}
                                          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all ${
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
                                        
                                        <div className="flex-1 min-w-0">
                                          <h4 className={`font-medium text-gray-900 dark:text-white ${task.completed ? 'line-through opacity-60' : ''}`}>
                                            {task.title || 'Untitled Assignment'}
                                          </h4>
                                          {task.description && (
                                            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                                          )}
                                          <div className="flex items-center gap-2 mt-2">
                                            {task.date && (
                                              <span className={`flex items-center gap-1 text-xs font-medium ${
                                                toYMDLocal(new Date(task.date)) < toYMDLocal(new Date()) && !task.completed
                                                  ? 'text-red-600 dark:text-red-400'
                                                  : 'text-gray-600 dark:text-slate-400'
                                              }`}>
                                                <CalendarIcon className="w-3 h-3" />
                                                {new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                              </span>
                                            )}
                                            {task.time && (
                                              <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400">
                                                <Clock className="w-3 h-3" />
                                                {task.time}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => {
                                              setOpen(
                                                <CustomModal title={`Edit: ${task.title}`} onClose={setClose}>
                                                  <AddEventModal mode="edit" initialData={task} onSuccess={() => { setClose(); loadTasks(); }} />
                                                </CustomModal>
                                              );
                                            }}
                                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg"
                                          >
                                            <Edit3 className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg"
                                          >
                                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {tasks.length > 3 && !isExpanded && (
                                    <button
                                      onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: true }))}
                                      className="w-full py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium"
                                    >
                                      Show {tasks.length - 3} more
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Other Tasks Section */}
                  {Object.keys(courseGroups.other).length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Other Tasks</h2>
                        <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 rounded-full text-sm font-medium">
                          {Object.values(courseGroups.other).flat().length}
                        </span>
                      </div>
                      
                      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800">
                        {Object.values(courseGroups.other).flat().map(task => (
                          <div key={task.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group">
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => handleToggleComplete(task.id, task.completed)}
                                className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all ${
                                  task.completed
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-gray-300 dark:border-slate-600 hover:border-gray-500'
                                }`}
                              >
                                {task.completed && (
                                  <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-medium text-gray-900 dark:text-white ${task.completed ? 'line-through opacity-60' : ''}`}>
                                  {task.title || 'Untitled Task'}
                                </h4>
                                {task.description && (
                                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  {task.date && (
                                    <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400">
                                      <CalendarIcon className="w-3 h-3" />
                                      {new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setOpen(
                                      <CustomModal title={`Edit: ${task.title}`} onClose={setClose}>
                                        <AddEventModal mode="edit" initialData={task} onSuccess={() => { setClose(); loadTasks(); }} />
                                      </CustomModal>
                                    );
                                  }}
                                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg"
                                >
                                  <Edit3 className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : timeframeGroups ? (
                // Timeframe-based view - grouped by date proximity
                <div className="space-y-6">
                  {[
                    { key: 'tomorrow', label: 'Tomorrow', icon: CalendarIcon, color: 'red' },
                    { key: 'thisWeek', label: 'This Week', icon: CalendarIcon, color: 'orange' },
                    { key: 'nextWeek', label: 'Next Week', icon: Clock, color: 'blue' },
                    { key: 'thisMonth', label: 'This Month', icon: Clock, color: 'purple' },
                    { key: 'later', label: 'Later', icon: Clock, color: 'gray' }
                  ].map(timeframe => {
                    const tasks = timeframeGroups[timeframe.key];
                    if (!tasks || tasks.length === 0) return null;
                    
                    const TimeframeIcon = timeframe.icon;
                    const groupKey = `timeframe-${timeframe.key}`;
                    const isExpanded = expandedGroups[groupKey];
                    const visibleTasks = isExpanded ? tasks : tasks.slice(0, 5);
                    
                    return (
                      <div key={timeframe.key} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                        <button
                          onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <TimeframeIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <div className="text-left">
                              <h3 className="font-bold text-gray-900 dark:text-white">{timeframe.label}</h3>
                              <p className="text-xs text-gray-600 dark:text-slate-400">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        
                        {isExpanded && (
                          <div className="border-t border-gray-100 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800">
                            {visibleTasks.map(task => (
                              <div key={task.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group">
                                <div className="flex items-start gap-3">
                                  <button
                                    onClick={() => handleToggleComplete(task.id, task.completed)}
                                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all ${
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
                                  
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`font-medium text-gray-900 dark:text-white ${task.completed ? 'line-through opacity-60' : ''}`}>
                                      {task.title || 'Untitled Task'}
                                    </h4>
                                    {task.description && (
                                      <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      {task.date && (
                                        <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400">
                                          <CalendarIcon className="w-3 h-3" />
                                          {new Date(task.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                      )}
                                      {task.time && (
                                        <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400">
                                          <Clock className="w-3 h-3" />
                                          {task.time}
                                        </span>
                                      )}
                                      {task.courses?.name && (
                                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-xs font-medium">
                                          {task.courses.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => {
                                        setOpen(
                                          <CustomModal title={`Edit: ${task.title}`} onClose={setClose}>
                                            <AddEventModal mode="edit" initialData={task} onSuccess={() => { setClose(); loadTasks(); }} />
                                          </CustomModal>
                                        );
                                      }}
                                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg"
                                    >
                                      <Edit3 className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {tasks.length > 5 && !isExpanded && (
                              <button
                                onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: true }))}
                                className="w-full py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium"
                              >
                                Show {tasks.length - 5} more
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : priorityGroups ? (
                // Eisenhower Matrix view - Modern card-based design
                <div className="space-y-4">
                  {EISENHOWER_QUADRANTS.map(quadrant => {
                    const QuadrantIcon = quadrant.icon;
                    const tasks = priorityGroups[quadrant.id];
                    
                    if (tasks.length === 0) return null;
                    
                    // Color mapping for inline styles
                    const colorMap = {
                      red: { 
                        bg: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30', 
                        icon: 'text-red-600 dark:text-red-400', 
                        accent: 'bg-red-500',
                        border: 'border-red-200 dark:border-red-900/50',
                        hover: 'hover:shadow-red-200/50 dark:hover:shadow-red-900/30'
                      },
                      blue: { 
                        bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30', 
                        icon: 'text-blue-600 dark:text-blue-400', 
                        accent: 'bg-blue-500',
                        border: 'border-blue-200 dark:border-blue-900/50',
                        hover: 'hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30'
                      },
                      amber: { 
                        bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30', 
                        icon: 'text-amber-600 dark:text-amber-400', 
                        accent: 'bg-amber-500',
                        border: 'border-amber-200 dark:border-amber-900/50',
                        hover: 'hover:shadow-amber-200/50 dark:hover:shadow-amber-900/30'
                      },
                      gray: { 
                        bg: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30', 
                        icon: 'text-gray-600 dark:text-gray-400', 
                        accent: 'bg-gray-400',
                        border: 'border-gray-200 dark:border-gray-900/50',
                        hover: 'hover:shadow-gray-200/50 dark:hover:shadow-gray-900/30'
                      },
                    };
                    
                    const colors = colorMap[quadrant.color];
                    const groupKey = `priority-${quadrant.id}`;
                    const isExpanded = expandedGroups[groupKey];
                    const visibleTasks = isExpanded ? tasks : tasks.slice(0, 5);
                    const hasMore = tasks.length > 5;
                    
                    return (
                      <div 
                        key={quadrant.id} 
                        className={`rounded-2xl border ${colors.border} ${colors.bg} overflow-hidden shadow-lg transition-all ${colors.hover}`}
                      >
                        {/* Card Header - Clickable to collapse/expand */}
                        <button
                          onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                          className="w-full p-6 flex items-center justify-between hover:opacity-90 transition-opacity"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl ${colors.accent} flex items-center justify-center shadow-md`}>
                              <QuadrantIcon className="w-6 h-6 text-white" strokeWidth={2.5} />
                            </div>
                            <div className="text-left">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {quadrant.label}
                                <span className="text-sm font-normal px-2.5 py-0.5 rounded-full bg-white/70 dark:bg-black/20 text-gray-700 dark:text-gray-300">
                                  {tasks.length}
                                </span>
                              </h3>
                              <p className={`text-sm ${colors.icon} font-medium mt-0.5`}>
                                {quadrant.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronUp className={`w-6 h-6 ${colors.icon}`} strokeWidth={2.5} />
                            ) : (
                              <ChevronDown className={`w-6 h-6 ${colors.icon}`} strokeWidth={2.5} />
                            )}
                          </div>
                        </button>
                        
                        {/* Card Content - Tasks Grid */}
                        {isExpanded && (
                          <div className="px-6 pb-6 space-y-3">
                            {visibleTasks.map(task => (
                              <div
                                key={task.id}
                                className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-800 hover:shadow-md transition-all group"
                              >
                                <div className="flex items-start gap-3">
                                  {/* Checkbox */}
                                  <button
                                    onClick={() => handleToggleComplete(task.id, task.completed)}
                                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all ${
                                      task.completed
                                        ? `${colors.accent} border-transparent`
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
                                    <h4 className={`font-semibold text-gray-900 dark:text-white ${task.completed ? 'line-through opacity-60' : ''}`}>
                                      {task.title || 'Untitled Task'}
                                    </h4>
                                    
                                    {task.description && (
                                      <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 line-clamp-2">
                                        {task.description}
                                      </p>
                                    )}

                                    {/* Task Metadata */}
                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                      {task.date && toYMDLocal(new Date(task.date)) && (
                                        <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
                                          toYMDLocal(new Date(task.date)) < toYMDLocal(new Date()) && !task.completed
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                            : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300'
                                        }`}>
                                          <CalendarIcon className="w-3.5 h-3.5" />
                                          {new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                      )}
                                      {task.time && (
                                        <span className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                                          <Clock className="w-3.5 h-3.5" />
                                          {task.time}
                                        </span>
                                      )}
                                      {task.courses && task.courses.name && (
                                        <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md">
                                          {task.courses.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => {
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
                                      className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                      <Edit3 className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {/* Show More/Less button */}
                            {hasMore && (
                              <button
                                onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                                className={`w-full mt-2 py-3 text-sm font-semibold ${colors.icon} hover:bg-white/50 dark:hover:bg-black/20 rounded-xl transition-all`}
                              >
                                {isExpanded ? 'Show less' : `Show all ${tasks.length} tasks`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {sortedTasks.map(task => (
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

function TaskRow({ task, onToggleComplete, onDelete, onEdit, quadrantColor, borderClass }) {
  const hasDate = task.date && toYMDLocal(new Date(task.date));
  const isOverdue = hasDate && toYMDLocal(new Date(task.date)) < toYMDLocal(new Date()) && !task.completed;
  
  // Get priority info for non-grouped views
  const getPriorityInfo = () => {
    if (!task.priority) return null;
    const quadrant = EISENHOWER_QUADRANTS.find(q => q.id === task.priority);
    return quadrant;
  };
  
  const priorityInfo = getPriorityInfo();
  
  // Color mapping for priority badges
  const colorMap = {
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    gray: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400',
  };

  return (
    <div
      className={`group flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
        task.completed ? 'opacity-60' : ''
      } ${borderClass ? `border-l-4 ${borderClass}` : ''}`}
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
        <div className="flex items-start gap-2">
          <h3 className={`font-medium text-gray-900 dark:text-white flex-1 ${task.completed ? 'line-through' : ''}`}>
            {task.title || 'Untitled Task'}
          </h3>
          
          {/* Priority Badge (shown when not in grouped view) */}
          {priorityInfo && (
            <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${colorMap[priorityInfo.color]}`}>
              {React.createElement(priorityInfo.icon, { className: "w-3 h-3" })}
              {priorityInfo.label}
            </span>
          )}
        </div>
        
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
