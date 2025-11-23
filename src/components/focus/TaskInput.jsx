// Task Input Component - Smart combo box for selecting or creating tasks
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Clock, Book, CheckCircle2 } from 'lucide-react';

export const TaskInput = ({ value, onChange, onTaskSelect, availableTasks = [], lastTask }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || '');
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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter tasks based on search query
  const filteredTasks = availableTasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleTaskClick = (task) => {
    setSearchQuery(task.title);
    onChange(task.title);
    onTaskSelect(task);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    onChange(searchQuery);
    onTaskSelect({ id: null, title: searchQuery, isNew: true });
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    onChange('');
    onTaskSelect(null);
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
          className="mb-3 w-full px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 
                     border border-indigo-200 dark:border-indigo-800 rounded-lg
                     hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors
                     text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-0.5">
                Continue last task
              </p>
              <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                {lastTask.title}
              </p>
              {lastTask.focusStats && lastTask.focusStats.totalSessions > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {lastTask.focusStats.totalSessions} sessions · {lastTask.focusStats.totalMinutes}m
                </p>
              )}
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
          placeholder="What are you working on?"
          className="w-full pl-12 pr-12 py-4 bg-white dark:bg-gray-800 
                     border-2 border-gray-200 dark:border-gray-700 
                     rounded-xl text-gray-900 dark:text-white
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                     transition-all duration-200 outline-none"
          aria-label="Task input"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 
                       text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                       transition-colors"
            aria-label="Clear input"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 
                     border border-gray-200 dark:border-gray-700 rounded-xl
                     shadow-xl max-h-80 overflow-y-auto
                     animate-in fade-in slide-in-from-top-2 duration-200"
          role="listbox"
        >
          {/* Create new option */}
          {searchQuery && !filteredTasks.some(t => t.title.toLowerCase() === searchQuery.toLowerCase()) && (
            <button
              onClick={handleCreateNew}
              className="w-full px-4 py-3 flex items-center gap-3 
                         hover:bg-gray-50 dark:hover:bg-gray-700/50 
                         transition-colors border-b border-gray-100 dark:border-gray-700"
              role="option"
            >
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 
                            flex items-center justify-center flex-shrink-0">
                <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  Create: "{searchQuery}"
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Quick focus session
                </p>
              </div>
            </button>
          )}

          {/* Available tasks */}
          {filteredTasks.length > 0 ? (
            <>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Your Tasks
              </div>
              {filteredTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="w-full px-4 py-3 flex items-center gap-3 
                             hover:bg-gray-50 dark:hover:bg-gray-700/50 
                             transition-colors group"
                  role="option"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: task.course ? `${getCourseColor(task.course.color)}20` : '#f3f4f6',
                    }}
                  >
                    <Book className="w-4 h-4" style={{ color: getCourseColor(task.course?.color) }} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {task.title}
                      </p>
                      {task.type && (
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded uppercase tracking-wide flex-shrink-0 ${
                          task.type === 'exam' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                          task.type === 'assignment' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                          task.type === 'quiz' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}>
                          {task.type}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.course && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
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
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                </button>
              ))}
            </>
          ) : searchQuery ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">No matching tasks found</p>
              <p className="text-xs mt-1">Press Enter to create a new task</p>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">Start typing to search or create a task</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
