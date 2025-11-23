// Mode Selector - Focus, Short Break, Long Break buttons
import React from 'react';
import { Timer, Coffee, Sparkles } from 'lucide-react';

export const ModeSelector = ({ mode, onModeChange, isRunning }) => {
  const modes = [
    { id: 'focus', label: 'Focus', icon: Timer, color: 'indigo' },
    { id: 'short_break', label: 'Short Break', icon: Coffee, color: 'green' },
    { id: 'long_break', label: 'Long Break', icon: Sparkles, color: 'purple' },
  ];

  return (
    <div className="flex items-center justify-center gap-2">
      {modes.map(({ id, label, icon: Icon, color }) => {
        const isActive = mode === id;
        return (
          <button
            key={id}
            onClick={() => onModeChange(id)}
            disabled={isRunning}
            className={`
              px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
              flex items-center gap-2 whitespace-nowrap
              ${
                isActive
                  ? `bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 
                     ring-2 ring-${color}-500 shadow-md`
                  : `bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400
                     hover:bg-gray-200 dark:hover:bg-gray-700`
              }
              ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
            `}
            style={
              isActive
                ? {
                    backgroundColor: color === 'indigo' ? '#eef2ff' : color === 'green' ? '#f0fdf4' : '#faf5ff',
                    color: color === 'indigo' ? '#4f46e5' : color === 'green' ? '#059669' : '#7c3aed',
                  }
                : {}
            }
            aria-label={`Switch to ${label} mode`}
            aria-pressed={isActive}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};
