import React from 'react';
import { motion } from 'framer-motion';
import { ListTodo, Clock, CheckCircle2 } from 'lucide-react';
import { fadeIn, cardHover } from '@/utils/animations';

/**
 * Stats Cards Component  
 * Clean metric cards with subtle styling inspired by modern dashboards
 */
export default function StatsCards({ totalTasks, inProgressTasks, completedTasks, loading }) {
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const progressRate = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;

  const upcomingTasks = totalTasks - completedTasks - inProgressTasks;

  const statsConfig = [
    {
      id: 'progress',
      label: 'Active Tasks',
      value: inProgressTasks,
      subtitle: 'In progress',
      icon: Clock,
      iconBg: 'bg-purple-50 dark:bg-purple-900/10',
      iconColor: 'text-purple-600 dark:text-purple-400',
      accentColor: 'bg-purple-500',
      showMiniChart: true,
      chartValue: progressRate,
      chartColor: 'bg-purple-500',
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      value: upcomingTasks,
      subtitle: 'Not started',
      icon: ListTodo,
      iconBg: 'bg-blue-50 dark:bg-blue-900/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      accentColor: 'bg-blue-500',
    },
    {
      id: 'completed',
      label: 'Completed',
      value: completedTasks,
      subtitle: `${completionRate}% done`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      accentColor: 'bg-emerald-500',
      showMiniChart: true,
      chartValue: completionRate,
      chartColor: 'bg-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
      {statsConfig.map((stat, index) => (
        <motion.div
          key={stat.id}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: index * 0.1 }}
          whileHover="hover"
        >
          <motion.div
            variants={cardHover}
            className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200/60 dark:border-slate-800/60 hover:shadow-md transition-all duration-200"
          >
            {/* Icon and value */}
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${stat.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} strokeWidth={2.5} />
              </div>
              <div className="text-right">
                {loading ? (
                  <div className="h-8 w-14 bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                )}
              </div>
            </div>

            {/* Label and subtitle */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                {stat.label}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {stat.subtitle}
              </p>
            </div>

            {/* Mini bar chart (only for progress and completed) */}
            {stat.showMiniChart && (
              <div className="mt-4">
                <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${stat.chartColor} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.chartValue}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + index * 0.1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
