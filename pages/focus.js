// Modern Focus Session Page - Production-grade Pomodoro timer
// Uses robust timer engine with Web Worker support
// UI redesigned to match landing/auth design system
import Head from 'next/head';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Settings, X, Lightbulb, BarChart3, Timer, Target, Zap, TrendingUp, Clock, CheckCircle } from 'lucide-react';
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

// Design system styles matching landing/auth pages
const designSystem = {
  // Backgrounds
  pageBg: 'min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-[#0a0a0f] dark:via-[#0a0a0f] dark:to-[#12121a]',
  // Cards
  card: 'bg-white/80 dark:bg-[#12121a] rounded-2xl border border-slate-200/60 dark:border-white/5 backdrop-blur-sm',
  cardShadow: 'shadow-lg dark:shadow-2xl dark:shadow-purple-500/5',
  // Header band
  headerBand: 'relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 dark:from-purple-900/40 dark:via-purple-800/30 dark:to-indigo-900/40 border border-purple-500/20 dark:border-purple-500/10',
  // Typography
  headingXl: 'text-2xl sm:text-3xl font-extrabold text-white tracking-tight',
  headingLg: 'text-xl font-bold text-slate-900 dark:text-white tracking-tight',
  headingMd: 'text-lg font-semibold text-slate-900 dark:text-white',
  textMuted: 'text-slate-600 dark:text-slate-400',
  textSubtle: 'text-slate-500 dark:text-slate-500',
  // Stat cards
  statCard: 'bg-white/60 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5 p-4 backdrop-blur-sm',
  statValue: 'text-2xl font-bold text-slate-900 dark:text-white',
  statLabel: 'text-sm text-slate-600 dark:text-slate-400',
  // Icons
  iconContainer: 'w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100 dark:bg-purple-500/15',
  iconColor: 'text-purple-600 dark:text-purple-400',
  // Buttons
  primaryBtn: 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25 transition-all duration-200',
  secondaryBtn: 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-200',
};

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

  // Page actions removed - settings and stats now in hero banner
  const pageActions = null;

  return (
    <HygraphSidebar pageName="Focus Session" pageActions={pageActions}>
      <>
        <Head>
          <title>Focus Session - StraturaOS</title>
        </Head>

        <div className={designSystem.pageBg}>
          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* ========== HERO HEADER BAND ========== */}
            <div className={designSystem.headerBand}>
              {/* Decorative gradient orbs */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl" />
              
              <div className="relative p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                      <Timer className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h1 className={designSystem.headingXl}>Focus Session</h1>
                      <p className="text-purple-100 dark:text-purple-300/70 mt-1">
                        Deep work mode with Pomodoro technique
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push('/sessions')}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
                      aria-label="View sessions"
                      title="View Statistics"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm font-medium hidden sm:inline">Stats</span>
                    </button>
                    <button
                      onClick={() => setIsSettingsOpen(prev => !prev)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
                      aria-label="Open settings"
                      title="Focus Settings"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm font-medium hidden sm:inline">Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ========== MAIN GRID ========== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Timer */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Mode Selector Card */}
                <div className={`${designSystem.card} ${designSystem.cardShadow} p-4`}>
                  <ModeSelector
                    mode={mode}
                    onModeChange={handleModeChange}
                    isRunning={isRunning}
                  />
                </div>

                {/* Timer Display Card */}
                <div className={`${designSystem.card} ${designSystem.cardShadow} p-8 sm:p-12`}>
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
                      <div className="w-full max-w-md px-6 py-4 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-100 dark:border-purple-500/20">
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                          Working on
                        </p>
                        <p className={`${designSystem.headingMd} truncate`}>
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
                
                {/* Task Input Card */}
                <div className={`${designSystem.card} ${designSystem.cardShadow} p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className={designSystem.headingMd}>
                      Select Task
                    </h3>
                  </div>
                  <TaskInput
                    value={currentTaskName}
                    onChange={setCurrentTaskName}
                    onTaskSelect={handleTaskSelect}
                    availableTasks={availableTasks}
                    lastTask={lastTask}
                  />
                </div>

                {/* Focus Tip - subtle, dismissible */}
                {showTips && mode === 'focus' && !isRunning && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/40 dark:border-amber-500/10 rounded-xl">
                    <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300/80 flex-1">
                      {randomTip}
                    </p>
                    <button
                      onClick={() => setShowTips(false)}
                      className="text-amber-400 hover:text-amber-600 dark:hover:text-amber-200 transition-colors p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Completed Focus Sessions Today */}
                <div className={`${designSystem.card} ${designSystem.cardShadow} overflow-hidden`}>
                  <div className="p-4 border-b border-slate-200/60 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className={designSystem.headingMd}>Completed Today</h3>
                        <p className={designSystem.textSubtle + ' text-sm'}>{completedTasksToday.length} sessions</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <CompletedTasks
                      tasks={completedTasksToday}
                      onClear={() => setCompletedTasksToday([])}
                    />
                  </div>
                </div>
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
