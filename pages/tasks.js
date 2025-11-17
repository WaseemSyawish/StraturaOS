// Tasks page - Student-friendly task management with inbox for undated tasks
import Head from 'next/head';
import React, { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Plus, Calendar as CalendarIcon, Filter, Search, Clock, Trash2, Edit3, ChevronRight, ListTodo, ArrowUpDown, Zap, Target, AlertCircle, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
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
  { id: 'priority', label: 'Priority (Eisenhower)', icon: Target },
  { id: 'date', label: 'Due Date', icon: CalendarIcon },
  { id: 'alphabetical', label: 'Alphabetical', icon: ArrowUpDown },
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
  const [sortBy, setSortBy] = useState('priority');
  const [expandedQuadrants, setExpandedQuadrants] = useState({
    'urgent-important': true,
    'not-urgent-important': true,
    'urgent-not-important': false,
    'not-urgent-not-important': false,
  });
  const [tasksPerQuadrant, setTasksPerQuadrant] = useState(5);
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
        // Eisenhower Matrix sorting: urgent-important > not-urgent-important > urgent-not-important > not-urgent-not-important
        const priorityOrder = { 'urgent-important': 1, 'not-urgent-important': 2, 'urgent-not-important': 3, 'not-urgent-not-important': 4 };
        sorted.sort((a, b) => {
          const aPriority = a.priority || 'not-urgent-not-important';
          const bPriority = b.priority || 'not-urgent-not-important';
          return (priorityOrder[aPriority] || 99) - (priorityOrder[bPriority] || 99);
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
      case 'alphabetical':
        sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
    }
    
    return sorted;
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
  const timeframeGroups = activeView === 'upcoming' && sortBy === 'date' ? groupTasksByTimeframe(sortedTasks) : null;
  const groupedTasks = activeView === 'upcoming' && sortBy === 'priority' ? groupTasksByQuadrant(sortedTasks) : null;

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
            {/* Search Bar + Sort Controls */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
              
              {/* Sort Dropdown - Only show in upcoming view */}
              {activeView === 'upcoming' && (
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none px-4 py-3 pr-10 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-medium cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ArrowUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              )}
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
              ) : groupedTasks ? (
                // Eisenhower Matrix view - Modern card-based design
                <div className="space-y-4">
                  {EISENHOWER_QUADRANTS.map(quadrant => {
                    const QuadrantIcon = quadrant.icon;
                    const tasks = groupedTasks[quadrant.id];
                    
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
                    const isExpanded = expandedQuadrants[quadrant.id];
                    const visibleTasks = isExpanded ? tasks : tasks.slice(0, tasksPerQuadrant);
                    const hasMore = tasks.length > tasksPerQuadrant;
                    
                    return (
                      <div 
                        key={quadrant.id} 
                        className={`rounded-2xl border ${colors.border} ${colors.bg} overflow-hidden shadow-lg transition-all ${colors.hover}`}
                      >
                        {/* Card Header - Clickable to collapse/expand */}
                        <button
                          onClick={() => setExpandedQuadrants(prev => ({ ...prev, [quadrant.id]: !prev[quadrant.id] }))}
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
                                onClick={() => setTasksPerQuadrant(prev => prev === 5 ? 999 : 5)}
                                className={`w-full mt-2 py-3 text-sm font-semibold ${colors.icon} hover:bg-white/50 dark:hover:bg-black/20 rounded-xl transition-all`}
                              >
                                {tasksPerQuadrant === 5 ? `Show all ${tasks.length} tasks` : 'Show less'}
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
