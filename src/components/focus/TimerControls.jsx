// Timer Controls - Play, Pause, Reset buttons
import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export const TimerControls = ({ isRunning, isPaused, onToggle, onReset }) => {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Main play/pause button */}
      <button
        onClick={onToggle}
        className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-700 
                   text-white shadow-lg hover:shadow-xl transition-all duration-200
                   flex items-center justify-center group active:scale-95"
        aria-label={isRunning && !isPaused ? 'Pause timer' : 'Start timer'}
      >
        {isRunning && !isPaused ? (
          <Pause className="w-7 h-7" />
        ) : (
          <Play className="w-7 h-7 ml-1" />
        )}
      </button>

      {/* Reset button */}
      <button
        onClick={onReset}
        className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 
                   hover:bg-gray-300 dark:hover:bg-gray-600 
                   text-gray-700 dark:text-gray-200
                   shadow-md hover:shadow-lg transition-all duration-200
                   flex items-center justify-center active:scale-95"
        aria-label="Reset timer"
      >
        <RotateCcw className="w-5 h-5" />
      </button>
    </div>
  );
};
