// Focus Statistics Component
import React from 'react';
import { TrendingUp, Target, Flame, Clock, Calendar } from 'lucide-react';

export const FocusStatistics = ({ stats }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  const weekStats = stats.weekStats || {};

  const statCards = [
    {
      label: 'Today',
      value: stats.totalFocusTime?.formatted || '0h 0m',
      icon: Clock,
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      subtitle: `${stats.totalSessions || 0} sessions`,
    },
    {
      label: 'This Week',
      value: weekStats.totalFocusTime?.formatted || '0h 0m',
      icon: Calendar,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      subtitle: `${weekStats.totalSessions || 0} sessions`,
    },
    {
      label: 'Daily Goal',
      value: stats.dailyGoal ? `${stats.totalSessions}/${stats.dailyGoal}` : '—',
      icon: Target,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
      subtitle: stats.goalProgress ? `${stats.goalProgress}% complete` : 'Not set',
    },
    {
      label: 'Streak',
      value: `${stats.currentStreak || 0}`,
      icon: Flame,
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-600 dark:text-orange-400',
      subtitle: 'days',
    },
    {
      label: 'Completion',
      value: stats.totalAttempted > 0 
        ? `${Math.round((stats.totalSessions / stats.totalAttempted) * 100)}%` 
        : '—',
      icon: TrendingUp,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400',
      subtitle: stats.totalInterrupted ? `${stats.totalInterrupted} interrupted` : 'No interrupts',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
              <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-3.5 h-3.5 ${stat.textColor}`} />
              </div>
            </div>
            <p className={`text-xl font-bold ${stat.textColor}`}>
              {stat.value}
            </p>
            {stat.subtitle && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                {stat.subtitle}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
