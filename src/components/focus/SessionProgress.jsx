// Session Progress Indicator - Shows completed sessions
import React from 'react';
import { Circle, CheckCircle2 } from 'lucide-react';

export const SessionProgress = ({ completedSessions, sessionsUntilLongBreak, dailyGoal }) => {
  // Current cycle progress (up to long break)
  const cycleProgress = completedSessions % sessionsUntilLongBreak;
  
  // Calculate daily goal progress (only if dailyGoal is set and > 0)
  const goalProgress = (dailyGoal && dailyGoal > 0) ? Math.min(100, Math.round((completedSessions / dailyGoal) * 100)) : null;

  return (
    <div className="space-y-4">
      {/* Cycle Progress (sessions until long break) */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sessions until long break
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {cycleProgress}/{sessionsUntilLongBreak}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: sessionsUntilLongBreak }).map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                index < cycleProgress
                  ? 'bg-indigo-500 shadow-sm'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Today's Sessions */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sessions today
            </p>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {completedSessions}
            </p>
          </div>
          {dailyGoal > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Daily Goal: {dailyGoal}
              </p>
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 * (1 - goalProgress / 100)}
                    className="text-indigo-500 transition-all duration-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {goalProgress}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
