// Task Input Component - Smart combo box for selecting or creating tasks
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Clock, Book, CheckCircle2, Sparkles, Target, FileText, AlertTriangle, Beaker } from 'lucide-react';

// Get icon based on task type
const getTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'exam': return AlertTriangle;
    case 'quiz': return Beaker;
    case 'assignment': return FileText;
    case 'project': return Target;
    default: return Book;
  }
};

export const TaskInput = ({ value, onChange, onTaskSelect, availableTasks = [], lastTask }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSearchQuery(value || '');
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter tasks based on search query
  const filteredTasks = availableTasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build items list for keyboard navigation
  const hasCreateOption = searchQuery && !filteredTasks.some(t => t.title.toLowerCase() === searchQuery.toLowerCase());
  const totalItems = (hasCreateOption ? 1 : 0) + filteredTasks.length;

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      if (hasCreateOption && selectedIndex === 0) {
        handleCreateNew();
      } else {
        const taskIndex = hasCreateOption ? selectedIndex - 1 : selectedIndex;
        if (filteredTasks[taskIndex]) {
          handleTaskClick(filteredTasks[taskIndex]);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleTaskClick = (task) => {
    setSearchQuery(task.title);
    onChange(task.title);
    onTaskSelect(task);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleCreateNew = () => {
    onChange(searchQuery);
    onTaskSelect({ id: null, title: searchQuery, isNew: true });
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setSearchQuery('');
    onChange('');
    onTaskSelect(null);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getCourseColor = (color) => {
    return color || '#6366f1';
  };

  return (
    <div className="relative w-full">
      {/* Continue Last Task Quick Action */}
      {lastTask && !value && (
        <button
          onClick={() => handleTaskClick(lastTask)}
          className="mb-3 w-full px-4 py-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20
                     border border-indigo-200 dark:border-indigo-700 rounded-xl
                     hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 
                     transition-all duration-200 text-left group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wide mb-0.5">
                Continue where you left off
              </p>
              <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                {lastTask.title}
              </p>
              {lastTask.focusStats && lastTask.focusStats.totalSessions > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {lastTask.focusStats.totalSessions} sessions · {lastTask.focusStats.totalMinutes}m focused
                </p>
              )}
            </div>
            <div className="flex-shrink-0 text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </button>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="What will you focus on?"
          className="w-full pl-12 pr-12 py-4 bg-white dark:bg-gray-800 
                     border-2 border-gray-200 dark:border-gray-700 
                     rounded-xl text-gray-900 dark:text-white text-base
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10
                     transition-all duration-200 outline-none shadow-sm"
          aria-label="Task input"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 
                       p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-700
                       transition-colors"
            aria-label="Clear input"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 
                     border border-gray-200 dark:border-gray-700 rounded-xl
                     shadow-2xl max-h-80 overflow-y-auto
                     animate-in fade-in slide-in-from-top-2 duration-200"
          role="listbox"
        >
          {/* Create new option */}
          {hasCreateOption && (
            <button
              onClick={handleCreateNew}
              className={`w-full px-4 py-3.5 flex items-center gap-3 
                         transition-colors border-b border-gray-100 dark:border-gray-700
                         ${selectedIndex === 0 ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
              role="option"
              aria-selected={selectedIndex === 0}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 
                            flex items-center justify-center flex-shrink-0 shadow-md">
                <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  Start new: "{searchQuery}"
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Create a quick focus session
                </p>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                Enter ↵
              </span>
            </button>
          )}

          {/* Available tasks */}
          {filteredTasks.length > 0 ? (
            <>
              <div className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                Your Tasks
              </div>
              {filteredTasks.map((task, idx) => {
                const itemIndex = hasCreateOption ? idx + 1 : idx;
                const isSelected = selectedIndex === itemIndex;
                const TypeIcon = getTypeIcon(task.type);
                
                return (
                  <button
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className={`w-full px-4 py-3 flex items-center gap-3 
                               transition-colors group
                               ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{
                        backgroundColor: task.course ? `${getCourseColor(task.course.color)}15` : '#f3f4f6',
                        border: `1px solid ${task.course ? `${getCourseColor(task.course.color)}30` : '#e5e7eb'}`
                      }}
                    >
                      <TypeIcon className="w-5 h-5" style={{ color: getCourseColor(task.course?.color) }} />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {task.title}
                        </p>
                        {task.type && (
                          <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wide flex-shrink-0 ${
                            task.type === 'exam' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                            task.type === 'assignment' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                            task.type === 'quiz' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                            task.type === 'project' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                            'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}>
                            {task.type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.course && (
                          <span 
                            className="text-xs font-medium px-1.5 py-0.5 rounded"
                            style={{ 
                              backgroundColor: `${getCourseColor(task.course.color)}15`,
                              color: getCourseColor(task.course.color)
                            }}
                          >
                            {task.course.code || task.course.name}
                          </span>
                        )}
                        {task.focusStats && task.focusStats.totalSessions > 0 && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {task.focusStats.totalSessions} sessions · {task.focusStats.totalMinutes}m
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {task.isRecent && (
                      <div className="flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </button>
                );
              })}
            </>
          ) : searchQuery ? (
            <div className="px-4 py-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No matching tasks</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Press <span className="font-semibold">Enter</span> to create "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Target className="w-6 h-6 text-indigo-500" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">What will you focus on?</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Type to search your tasks or create a new one
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
