import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, MessageSquare, ThumbsUp, User, CheckSquare } from 'lucide-react';
import { fadeIn, cardHover, staggerContainer, staggerItem } from '@/utils/animations';

/**
 * Recent Tasks Component
 * Displays task cards with priority badges, progress bars, and metadata
 */
export default function RecentTasks({ tasks, onViewAll, onTaskClick }) {
  const priorityConfig = {
    high: {
      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      progress: 'bg-red-500',
      border: 'border-red-200 dark:border-red-800',
    },
    medium: {
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      progress: 'bg-amber-500',
      border: 'border-amber-200 dark:border-amber-800',
    },
    low: {
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      progress: 'bg-emerald-500',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
  };

  const getPriorityConfig = (priority) => {
    return priorityConfig[priority?.toLowerCase()] || priorityConfig.medium;
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const calculateProgress = (task) => {
    // Calculate progress based on task status or explicit progress field
    if (task.status === 'completed') return 100;
    if (task.status === 'todo') return 0;
    if (task.progress !== undefined) return task.progress;
    return 50; // default for in-progress
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-purple-600 dark:bg-purple-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <CheckSquare className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Recent Tasks
              </h3>
              <p className="text-xs text-purple-100 mt-0.5">
                Your active assignments
              </p>
            </div>
          </div>
          <button
            onClick={onViewAll}
            className="group flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white hover:text-purple-100 hover:bg-white/10 rounded-lg transition-colors"
          >
            View All
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="p-6">
      {/* Task Cards */}
      {tasks.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
            <User className="w-7 h-7 text-gray-400 dark:text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No recent tasks</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Tasks will appear here once created
          </p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {tasks.slice(0, 5).map((task, index) => {
            const priorityStyle = getPriorityConfig(task.priority);
            const progress = calculateProgress(task);

            return (
              <motion.div
                key={task.id || index}
                variants={staggerItem}
                whileHover="hover"
              >
                <motion.div
                  variants={cardHover}
                  onClick={() => onTaskClick?.(task)}
                  className="cursor-pointer rounded-lg p-4 border border-gray-200/60 dark:border-slate-800/60 hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-sm bg-white dark:bg-slate-900 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {/* Priority dot */}
                        <div className={`w-2 h-2 rounded-full ${priorityStyle.progress} flex-shrink-0`}></div>
                        
                        {/* Title */}
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {task.title || task.name || 'Untitled Task'}
                        </h4>
                      </div>
                      
                      {/* Description */}
                      {task.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 pl-3.5">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Due date */}
                    {task.dueDate && (
                      <div className="flex-shrink-0">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {progress > 0 && progress < 100 && (
                    <div className="pl-3.5">
                      <div className="h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${priorityStyle.progress} rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
      </div>
    </div>
  );
}
