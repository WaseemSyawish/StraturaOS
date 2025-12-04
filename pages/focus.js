// Modern Focus Session Page - Production-grade Pomodoro timer
// Uses robust timer engine with Web Worker support
import Head from 'next/head';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Settings, X, Lightbulb, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/router';
import HygraphSidebar from '@/components/HygraphSidebar';
import { TimerDisplay } from '@/components/focus/TimerDisplay';
import { TimerControls } from '@/components/focus/TimerControls';
import { ModeSelector } from '@/components/focus/ModeSelector';
import { SessionProgress } from '@/components/focus/SessionProgress';
import { TaskInput } from '@/components/focus/TaskInput';
import { FocusSettingsModal } from '@/components/focus/FocusSettingsModal';
import { CompletedTasks } from '@/components/focus/CompletedTasks';
import { FocusStatistics } from '@/components/focus/FocusStatistics';
import { 
  useFocusEngine, 
  useFocusSettings, 
  useFocusStats, 
  useFocusDocumentTitle,
  useFocusTasks,
  useFocusEvents,
  getAudioManager,
} from '@/lib/focus';
import { useFocusNotifications } from '@/lib/useFocusNotifications';

export default function FocusPage() {
  const router = useRouter();
  const { notifySessionComplete } = useFocusNotifications();
  
  // Audio manager initialization
  const audioInitialized = useRef(false);
  
  // Use the new production-grade timer engine
  const {
    timeLeft,
    totalDuration,
    isRunning,
    isPaused,
    mode,
    completedSessions,
    settings: engineSettings,
    toggle,
    reset,
    setMode,
    setTask,
  } = useFocusEngine();
  
  // Settings from backend (synced with engine)
  const { 
    isLoading: settingsLoading, 
    updateSettings: saveSettings 
  } = useFocusSettings();
  
  // Stats
  const { stats, refetch: refetchStats } = useFocusStats();
  
  // Tasks
  const { tasks: availableTasks, lastTask, search: searchTasks } = useFocusTasks();
  
  // Document title
  useFocusDocumentTitle();
  
  // Local UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showStats] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [currentTaskName, setCurrentTaskName] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [completedTasksToday, setCompletedTasksToday] = useState([]);
  
  // Convert engine settings to UI format (memoized to prevent re-renders)
  const settings = useMemo(() => ({
    focus_duration: engineSettings.focusDuration,
    short_break_duration: engineSettings.shortBreakDuration,
    long_break_duration: engineSettings.longBreakDuration,
    sessions_until_long_break: engineSettings.sessionsUntilLongBreak,
    sound_enabled: engineSettings.soundEnabled,
    sound_volume: Math.round(engineSettings.soundVolume * 100),
    sound_type: engineSettings.soundType,
    notifications_enabled: engineSettings.notificationsEnabled,
    auto_start_breaks: engineSettings.autoStartBreaks,
    auto_start_focus: engineSettings.autoStartFocus,
    daily_goal_sessions: engineSettings.dailyGoalSessions,
  }), [engineSettings]);
  
  // Initialize audio manager on first user interaction
  const initAudio = useCallback(() => {
    if (audioInitialized.current) return;
    audioInitialized.current = true;
    
    const audio = getAudioManager();
    audio.init();
    audio.preload();
    audio.setEnabled(engineSettings.soundEnabled);
    audio.setVolume(engineSettings.soundVolume);
  }, [engineSettings.soundEnabled, engineSettings.soundVolume]);
  
  // Listen for session events
  useFocusEvents({
    onCompleted: useCallback((data) => {
      // Show notification
      if (engineSettings.notificationsEnabled) {
        const isBreak = data.mode !== 'focus';
        const message = isBreak ? 'Ready to focus again?' : 'Time for a break!';
        notifySessionComplete(data.mode, message);
      }
      
      // Play completion sound
      if (engineSettings.soundEnabled) {
        const audio = getAudioManager();
        audio.playComplete();
      }
      
      // Add to completed tasks
      if (data.mode === 'focus' && currentTaskName) {
        setCompletedTasksToday(prev => [
          {
            taskName: currentTaskName,
            duration: Math.floor(engineSettings.focusDuration / 60),
            completedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      
      // Refresh stats
      refetchStats();
    }, [engineSettings, currentTaskName, notifySessionComplete, refetchStats]),
    
    onStarted: useCallback(() => {
      // Play start sound
      if (engineSettings.soundEnabled) {
        const audio = getAudioManager();
        audio.playStart();
      }
    }, [engineSettings.soundEnabled]),
  });

  // Handle mode change
  const handleModeChange = (newMode) => {
    if (isRunning) return; // Don't allow mode change while timer is running
    setMode(newMode);
  };

  // Handle timer toggle (start/pause)
  const handleTimerToggle = () => {
    initAudio(); // Initialize audio on first interaction
    
    // Set the task before starting
    if (!isRunning && currentTaskName) {
      setTask({
        id: selectedTask?.id || null,
        name: currentTaskName,
        isNew: !selectedTask?.id,
      });
    }
    
    toggle();
  };

  // Handle timer reset
  const handleTimerReset = () => {
    reset();
  };

  // Handle task selection
  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    if (task) {
      setCurrentTaskName(task.title);
    } else {
      setCurrentTaskName('');
    }
  };
  
  // Debounce task search
  useEffect(() => {
    if (!currentTaskName) {
      searchTasks('');
      return;
    }
    
    const debounceTimer = setTimeout(() => {
      searchTasks(currentTaskName);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [currentTaskName, searchTasks]);

  // Handle settings save
  const handleSettingsSave = async (newSettings) => {
    const engineFormatSettings = {
      focusDuration: newSettings.focus_duration,
      shortBreakDuration: newSettings.short_break_duration,
      longBreakDuration: newSettings.long_break_duration,
      sessionsUntilLongBreak: newSettings.sessions_until_long_break,
      autoStartBreaks: newSettings.auto_start_breaks,
      autoStartFocus: newSettings.auto_start_focus,
      soundEnabled: newSettings.sound_enabled,
      soundVolume: newSettings.sound_volume / 100,
      soundType: newSettings.sound_type,
      notificationsEnabled: newSettings.notifications_enabled,
      dailyGoalSessions: newSettings.daily_goal_sessions,
    };
    
    const success = await saveSettings(engineFormatSettings);
    if (success) {
      // Update audio manager settings
      const audio = getAudioManager();
      audio.setEnabled(newSettings.sound_enabled);
      audio.setVolume(newSettings.sound_volume / 100);
    }
  };

  // Focus tips - use state to prevent hydration mismatch
  const [randomTip, setRandomTip] = useState('');

  useEffect(() => {
    const tips = [
      'Eliminate distractions before starting your session',
      'Keep a glass of water nearby to stay hydrated',
      'Use breaks to stretch and move around',
      'One task at a time yields better results',
      'Turn off notifications on your devices',
      'Take deep breaths during breaks',
    ];
    setRandomTip(tips[Math.floor(Math.random() * tips.length)]);
  }, []);

  const pageActions = (
    <>
      <button
        onClick={() => router.push('/sessions')}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
        aria-label="View sessions"
        title="View Sessions"
      >
        <BarChart3 className="w-5 h-5" />
      </button>
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
        aria-label="Open settings"
        title="Focus Settings"
      >
        <Settings className="w-5 h-5" />
      </button>
    </>
  );

  return (
    <HygraphSidebar pageName="Focus Session" pageActions={pageActions}>
      <>
        <Head>
          <title>Focus Session - StraturaOS</title>
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Statistics Row */}
            {showStats && (
              <div className="mb-8 animate-in slide-in-from-top duration-300">
                <FocusStatistics stats={stats} />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Timer */}
              <div className="lg:col-span-2 space-y-6">
                {/* Mode Selector */}
                <ModeSelector
                  mode={mode}
                  onModeChange={handleModeChange}
                  isRunning={isRunning}
                />

                {/* Focus Tip */}
                {showTips && mode === 'focus' && !isRunning && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                          Focus Tip
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          {randomTip}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowTips(false)}
                        className="text-amber-400 hover:text-amber-600 dark:hover:text-amber-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Timer Display */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-12">
                  <div className="flex flex-col items-center space-y-8">
                    <TimerDisplay
                      timeLeft={timeLeft}
                      totalDuration={totalDuration}
                      mode={mode}
                      isRunning={isRunning}
                      isLoading={settingsLoading}
                    />

                    {/* Current Task Display */}
                    {currentTaskName && mode === 'focus' && (
                      <div className="w-full max-w-md px-6 py-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                          Working on
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {currentTaskName}
                        </p>
                      </div>
                    )}

                    {/* Timer Controls */}
                    <TimerControls
                      isRunning={isRunning}
                      isPaused={isPaused}
                      onToggle={handleTimerToggle}
                      onReset={handleTimerReset}
                    />

                    {/* Dev test button removed */}

                    {/* Session Progress */}
                    <div className="w-full max-w-md">
                      <SessionProgress
                        completedSessions={completedSessions}
                        sessionsUntilLongBreak={settings.sessions_until_long_break}
                        dailyGoal={settings.daily_goal_sessions}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Tasks & Completed */}
              <div className="space-y-6">
                {/* Task Input */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Select or Create Task
                  </h3>
                  <TaskInput
                    value={currentTaskName}
                    onChange={setCurrentTaskName}
                    onTaskSelect={handleTaskSelect}
                    availableTasks={availableTasks}
                    lastTask={lastTask}
                  />
                </div>

                {/* Completed Focus Sessions Today */}
                <CompletedTasks
                  tasks={completedTasksToday}
                  onClear={() => setCompletedTasksToday([])}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        <FocusSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSave={handleSettingsSave}
        />
      </>
    </HygraphSidebar>
  );
}
