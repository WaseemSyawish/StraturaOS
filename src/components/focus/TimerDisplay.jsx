// Timer Display - Large circular timer component
import React from 'react';
import { formatTime } from '@/lib/useFocusTimer';

export const TimerDisplay = ({ timeLeft, totalDuration, mode, isRunning, isLoading = false }) => {
  const percentage = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;
  const circumference = 2 * Math.PI * 140; // radius = 140
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getModeColor = () => {
    switch (mode) {
      case 'focus':
        return '#6366f1'; // indigo-500
      case 'short_break':
        return '#10b981'; // green-500
      case 'long_break':
        return '#8b5cf6'; // purple-500
      default:
        return '#6366f1';
    }
  };

  if (isLoading) {
    return (
      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* Loading circle */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Animated loading progress */}
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke="#6366f1"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.7}
            strokeLinecap="round"
            className="animate-spin"
            style={{
              animation: 'spin 2s linear infinite',
            }}
          />
        </svg>

        {/* Loading text */}
        <div className="relative z-10 text-center">
          <div className="text-6xl font-bold tracking-tight text-gray-400 dark:text-gray-500">
            --
          </div>
          <div className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Loading Settings
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-80 h-80 flex items-center justify-center">
      {/* Background circle */}
      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
        <circle
          cx="160"
          cy="160"
          r="140"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx="160"
          cy="160"
          r="140"
          stroke={getModeColor()}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-linear"
          style={{
            filter: isRunning ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))' : 'none',
          }}
        />
      </svg>

      {/* Time display */}
      <div className="relative z-10 text-center">
        <div className="text-7xl font-bold tracking-tight text-gray-900 dark:text-white">
          {formatTime(timeLeft)}
        </div>
        <div className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {mode === 'focus' ? 'Focus Time' : mode === 'short_break' ? 'Short Break' : 'Long Break'}
        </div>
      </div>

      {/* Pulsing indicator when running */}
      {isRunning && (
        <div
          className="absolute inset-0 rounded-full opacity-20 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${getModeColor()} 0%, transparent 70%)`,
          }}
        />
      )}
    </div>
  );
};
