// Focus/Pomodoro Page - Calm, focused environment for deep work sessions
import Head from 'next/head';
import React, { useState, useEffect, useCallback } from 'react';
import { Timer, Play, Pause, RotateCcw, CheckCircle, Plus, X, Clock, Target, Coffee, Book } from 'lucide-react';
import { useRouter } from 'next/router';
import HygraphSidebar from '@/components/HygraphSidebar';

const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK = 5 * 60; // 5 minutes
const LONG_BREAK = 15 * 60; // 15 minutes

export default function FocusPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(POMODORO_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus', 'shortBreak', 'longBreak'
  const [sessionCount, setSessionCount] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [completedTasks, setCompletedTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished
      handleTimerComplete();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      setSessionCount(count => count + 1);
      if (currentTask) {
        setCompletedTasks(prev => [...prev, { task: currentTask, completedAt: new Date() }]);
        setCurrentTask('');
      }
      // Auto-switch to break
      if ((sessionCount + 1) % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(LONG_BREAK);
      } else {
        setMode('shortBreak');
        setTimeLeft(SHORT_BREAK);
      }
    } else {
      // Break finished, switch back to focus
      setMode('focus');
      setTimeLeft(POMODORO_DURATION);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      setTimeLeft(POMODORO_DURATION);
    } else if (mode === 'shortBreak') {
      setTimeLeft(SHORT_BREAK);
    } else {
      setTimeLeft(LONG_BREAK);
    }
  };

  const switchMode = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'focus') {
      setTimeLeft(POMODORO_DURATION);
    } else if (newMode === 'shortBreak') {
      setTimeLeft(SHORT_BREAK);
    } else {
      setTimeLeft(LONG_BREAK);
    }
  };

  const addTask = () => {
    if (taskInput.trim()) {
      setCurrentTask(taskInput.trim());
      setTaskInput('');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeConfig = () => {
    switch (mode) {
      case 'focus':
        return { color: 'purple', label: 'Focus Time', icon: Target };
      case 'shortBreak':
        return { color: 'green', label: 'Short Break', icon: Coffee };
      case 'longBreak':
        return { color: 'blue', label: 'Long Break', icon: Coffee };
      default:
        return { color: 'purple', label: 'Focus Time', icon: Target };
    }
  };

  const config = getModeConfig();

  return (
    <HygraphSidebar>
    <>
      <Head>
        <title>Focus Session - University Planner</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Focus Session</h1>
            </div>
            <button 
              onClick={() => router.push('/overview')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Exit
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Timer Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mode Selector */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => switchMode('focus')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    mode === 'focus'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Target className="w-4 h-4 inline mr-2" />
                  Focus
                </button>
                <button
                  onClick={() => switchMode('shortBreak')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    mode === 'shortBreak'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Coffee className="w-4 h-4 inline mr-2" />
                  Short Break
                </button>
                <button
                  onClick={() => switchMode('longBreak')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    mode === 'longBreak'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Coffee className="w-4 h-4 inline mr-2" />
                  Long Break
                </button>
              </div>

              {/* Timer Display */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-12 text-center">
                <div className="mb-8">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {config.label}
                  </p>
                  <div className={`text-8xl font-bold bg-gradient-to-br ${
                    mode === 'focus' ? 'from-purple-600 to-indigo-600' :
                    mode === 'shortBreak' ? 'from-green-600 to-emerald-600' :
                    'from-blue-600 to-cyan-600'
                  } bg-clip-text text-transparent`}>
                    {formatTime(timeLeft)}
                  </div>
                </div>

                {/* Current Task Display */}
                {currentTask && mode === 'focus' && (
                  <div className="mb-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Current Focus</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{currentTask}</p>
                  </div>
                )}

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={toggleTimer}
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
                      isRunning 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : `bg-${config.color}-600 hover:bg-${config.color}-700`
                    } text-white`}
                  >
                    {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>

                {/* Session Counter */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Sessions Completed</p>
                  <div className="flex items-center justify-center gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i < (sessionCount % 4)
                            ? 'bg-purple-600 dark:bg-purple-400'
                            : 'bg-gray-300 dark:bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                    {sessionCount} total
                  </p>
                </div>
              </div>
            </div>

            {/* Task Sidebar */}
            <div className="space-y-6">
              {/* Add Task */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">What are you working on?</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    placeholder="Enter your task..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={addTask}
                    disabled={!taskInput.trim()}
                    className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Set Current Task
                  </button>
                </div>
              </div>

              {/* Completed Tasks */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Completed Today</h3>
                {completedTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No completed tasks yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {completedTasks.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.task}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {new Date(item.completedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
                <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200 mb-3">Focus Tips</h4>
                <ul className="space-y-2 text-xs text-purple-700 dark:text-purple-300">
                  <li>• Eliminate distractions before starting</li>
                  <li>• Take breaks between sessions</li>
                  <li>• Stay hydrated and stretch</li>
                  <li>• One task at a time for best results</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
    </HygraphSidebar>
  );
}
