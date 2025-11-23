// Modern Focus Session Page - Clean, minimal design inspired by best Pomodoro apps
import Head from 'next/head';
import React, { useState, useEffect, useCallback } from 'react';
import { Settings, X, Lightbulb, BarChart3, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import HygraphSidebar from '@/components/HygraphSidebar';
import { TimerDisplay } from '@/components/focus/TimerDisplay';
import { TimerControls } from '@/components/focus/TimerControls';
import { ModeSelector } from '@/components/focus/ModeSelector';
import { SessionProgress } from '@/components/focus/SessionProgress';
import { TaskInput } from '@/components/focus/TaskInput';
import { FocusSettingsModal } from '@/components/focus/FocusSettingsModal';
import { CompletedTasks } from '@/components/focus/CompletedTasks';
import { FocusStatistics } from '@/components/focus/FocusStatistics';
import { useFocusTimer } from '@/lib/useFocusTimer';
import { useFocusNotifications } from '@/lib/useFocusNotifications';

export default function FocusPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { playSound, notifySessionComplete } = useFocusNotifications();

  // State
  const [mode, setMode] = useState('focus'); // 'focus', 'short_break', 'long_break'
  const [settings, setSettings] = useState({
    focus_duration: 1500,
    short_break_duration: 300,
    long_break_duration: 900,
    sessions_until_long_break: 4,
    sound_enabled: true,
    sound_volume: 50,
    sound_type: 'chime',
    notifications_enabled: true,
    auto_start_breaks: false,
    auto_start_focus: false,
    daily_goal_sessions: 8,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [currentTask, setCurrentTask] = useState(null);
  const [currentTaskName, setCurrentTaskName] = useState('');
  const [availableTasks, setAvailableTasks] = useState([]);
  const [lastTask, setLastTask] = useState(null);
  const [completedTasksToday, setCompletedTasksToday] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showTips, setShowTips] = useState(true);

  // Get duration based on mode
  const getDuration = (m) => {
    switch (m) {
      case 'focus':
        return settings.focus_duration;
      case 'short_break':
        return settings.short_break_duration;
      case 'long_break':
        return settings.long_break_duration;
      default:
        return settings.focus_duration;
    }
  };

  // Timer complete callback
  const handleTimerComplete = useCallback(async () => {
    const completedMode = mode;
    
    // Play sound if enabled
    if (settings.sound_enabled) {
      playSound(settings.sound_type, settings.sound_volume);
    }

    // Show notification if enabled
    if (settings.notifications_enabled) {
      if (completedMode === 'focus') {
        const nextMode = (completedSessions + 1) % settings.sessions_until_long_break === 0
          ? 'long break'
          : 'short break';
        notifySessionComplete('focus', `Take a ${nextMode}!`);
      } else {
        notifySessionComplete(completedMode, 'Ready to focus again?');
      }
    }

    // Save completed session to database
    if (completedMode === 'focus' && sessionStartTime) {
      try {
        const response = await fetch('/api/focus/sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: currentSessionId,
            ended_at: new Date().toISOString(),
            completed: true,
            interrupted: false,
          }),
        });

        if (response.ok) {
          setCompletedSessions(prev => prev + 1);
          
          // Add to completed tasks today
          if (currentTaskName || currentTask) {
            setCompletedTasksToday(prev => [
              {
                taskName: currentTask?.title || currentTaskName,
                duration: Math.floor(settings.focus_duration / 60),
                completedAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          }

          // Refresh stats
          fetchStats();
        }
      } catch (error) {
        console.error('Error saving session:', error);
      }
    }

    // Auto-transition logic
    if (completedMode === 'focus') {
      const shouldTakeLongBreak = (completedSessions + 1) % settings.sessions_until_long_break === 0;
      const nextMode = shouldTakeLongBreak ? 'long_break' : 'short_break';
      setMode(nextMode);
      
      if (settings.auto_start_breaks) {
        setTimeout(() => {
          timer.reset(getDuration(nextMode));
          timer.start();
        }, 1000);
      } else {
        timer.reset(getDuration(nextMode));
      }
    } else {
      // Break finished
      setMode('focus');
      if (settings.auto_start_focus) {
        setTimeout(() => {
          timer.reset(getDuration('focus'));
          timer.start();
        }, 1000);
      } else {
        timer.reset(getDuration('focus'));
      }
    }

    setCurrentSessionId(null);
    setSessionStartTime(null);
  }, [mode, settings, completedSessions, currentSessionId, sessionStartTime, currentTask, currentTaskName]);

  // Initialize timer
  const timer = useFocusTimer(getDuration(mode), handleTimerComplete);

  // Load settings when session becomes available
  useEffect(() => {
    console.log('[focus] Session useEffect triggered, status:', status, 'session:', session ? 'available' : 'null');
    if (status === 'authenticated' && session) {
      console.log('[focus] Session authenticated, fetching data');
      fetchSettings();
      fetchTasks();
      fetchStats();
    } else if (status === 'loading') {
      console.log('[focus] Session still loading...');
    } else {
      console.log('[focus] Session not authenticated');
    }
  }, [session, status]);

  // Also try to load settings on mount regardless of session (in case session loads later)
  useEffect(() => {
    console.log('[focus] Component mounted, attempting to fetch settings');
    fetchSettings();
  }, []);

  // Fetch user settings
  const fetchSettings = async () => {
    try {
      console.log('[fetchSettings] STARTING - Fetching settings from API...');
      const response = await fetch('/api/focus/settings', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      console.log('[fetchSettings] Response received - status:', response.status);
      console.log('[fetchSettings] Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('[fetchSettings] SUCCESS - Settings received:', JSON.stringify(data.settings, null, 2));
        setSettings(data.settings);
        
        // Reset timer with loaded settings if not currently running
        if (!timer.isRunning) {
          const newDuration = mode === 'focus' 
            ? data.settings.focus_duration 
            : mode === 'short_break' 
              ? data.settings.short_break_duration 
              : data.settings.long_break_duration;
          console.log('[fetchSettings] Resetting timer with loaded duration:', newDuration);
          timer.reset(newDuration);
        }
        
        setSettingsLoaded(true);
      } else if (response.status === 401) {
        console.log('[fetchSettings] Not authenticated yet, using defaults');
        // Use default settings and mark as loaded so UI doesn't hang
        setSettingsLoaded(true);
      } else {
        console.error('[fetchSettings] FAILED - Status:', response.status);
        const errorText = await response.text();
        console.error('[fetchSettings] Error response:', errorText);
        // Mark as loaded with defaults to prevent infinite loading
        setSettingsLoaded(true);
      }
    } catch (error) {
      console.error('[fetchSettings] EXCEPTION caught:', error);
      console.error('[fetchSettings] Error stack:', error.stack);
      // Mark as loaded with defaults to prevent infinite loading
      setSettingsLoaded(true);
    }
  };

  // Fetch available tasks with optional search query
  const fetchTasks = async (searchQuery = '') => {
    try {
      const url = searchQuery 
        ? `/api/focus/tasks?search=${encodeURIComponent(searchQuery)}`
        : '/api/focus/tasks';
      console.log('[fetchTasks] Fetching from:', url);
      const response = await fetch(url);
      console.log('[fetchTasks] Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[fetchTasks] Received', data.tasks.length, 'tasks');
        setAvailableTasks(data.tasks);
        setLastTask(data.lastTask);
      } else {
        console.error('[fetchTasks] Failed with status:', response.status);
      }
    } catch (error) {
      console.error('[fetchTasks] Error:', error);
    }
  };

  // Debounce task search
  useEffect(() => {
    if (!currentTaskName) {
      fetchTasks();
      return;
    }
    
    const timer = setTimeout(() => {
      fetchTasks(currentTaskName);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentTaskName]);

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/focus/stats?period=today');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setCompletedSessions(data.stats.totalSessions);
        setCompletedTasksToday(data.stats.recentSessions || []);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Handle mode change
  const handleModeChange = (newMode) => {
    if (timer.isRunning) return; // Don't allow mode change while timer is running
    setMode(newMode);
    timer.reset(getDuration(newMode));
  };

  // Handle timer start
  const handleTimerStart = async () => {
    if (!timer.isRunning && mode === 'focus') {
      // Create new session in database
      try {
        const response = await fetch('/api/focus/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_name: currentTask?.isNew ? currentTaskName : null,
            task_id: currentTask?.id || null,
            session_type: 'focus',
            duration: settings.focus_duration,
            started_at: new Date().toISOString(),
            completed: false,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentSessionId(data.session.id);
          setSessionStartTime(new Date());
        }
      } catch (error) {
        console.error('Error creating session:', error);
      }
    }

    timer.toggle();
  };

  // Handle timer reset
  const handleTimerReset = () => {
    if (currentSessionId) {
      // Mark session as interrupted if it was running
      fetch('/api/focus/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId,
          ended_at: new Date().toISOString(),
          completed: false,
          interrupted: true,
        }),
      }).catch(error => console.error('Error updating session:', error));
    }

    timer.reset(getDuration(mode));
    setCurrentSessionId(null);
    setSessionStartTime(null);
  };

  // Handle task selection
  const handleTaskSelect = (task) => {
    setCurrentTask(task);
    if (task) {
      setCurrentTaskName(task.title);
    } else {
      setCurrentTaskName('');
    }
  };

  // Handle settings save
  const handleSettingsSave = async (newSettings) => {
    try {
      console.log('[handleSettingsSave] STARTING - Saving settings:', JSON.stringify(newSettings, null, 2));
      const response = await fetch('/api/focus/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      console.log('[handleSettingsSave] Response status:', response.status);
      console.log('[handleSettingsSave] Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('[handleSettingsSave] SUCCESS - Saved settings:', JSON.stringify(data.settings, null, 2));
        setSettings(data.settings);
        // Reset timer with new duration if not running
        if (!timer.isRunning) {
          const newDuration = mode === 'focus'
            ? data.settings.focus_duration
            : mode === 'short_break'
              ? data.settings.short_break_duration
              : data.settings.long_break_duration;
          timer.reset(newDuration);
        }
      } else {
        const errorData = await response.text();
        console.error('[handleSettingsSave] ERROR - Status:', response.status, 'Response:', errorData);
      }
    } catch (error) {
      console.error('[handleSettingsSave] EXCEPTION:', error);
      console.error('[handleSettingsSave] Error stack:', error.stack);
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

  // Document title effect
  useEffect(() => {
    if (timer.isRunning) {
      const mins = Math.floor(timer.timeLeft / 60);
      const secs = timer.timeLeft % 60;
      document.title = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} - ${
        mode === 'focus' ? 'Focus' : 'Break'
      }`;
    } else {
      document.title = 'Focus Session - University Planner';
    }
  }, [timer.timeLeft, timer.isRunning, mode]);

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
          <title>Focus Session - University Planner</title>
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
                  isRunning={timer.isRunning}
                />

                {/* Focus Tip */}
                {showTips && mode === 'focus' && !timer.isRunning && (
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
                      timeLeft={timer.timeLeft}
                      totalDuration={getDuration(mode)}
                      mode={mode}
                      isRunning={timer.isRunning}
                      isLoading={!settingsLoaded}
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
                      isRunning={timer.isRunning}
                      isPaused={timer.isPaused}
                      onToggle={handleTimerStart}
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

                {/* Completed Tasks Today */}
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
