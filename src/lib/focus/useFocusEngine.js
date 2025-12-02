/**
 * React Hook for FocusTimerEngine
 * 
 * Provides a clean React interface to the underlying timer engine.
 * Handles subscription management and state synchronization.
 */

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { getTimerEngine, TimerState, SessionMode, DEFAULT_SETTINGS } from './FocusTimerEngine';

// Static server snapshot to avoid hydration mismatch
const SERVER_SNAPSHOT = {
  state: TimerState.IDLE,
  mode: SessionMode.FOCUS,
  timeLeft: DEFAULT_SETTINGS.focusDuration,
  totalDuration: DEFAULT_SETTINGS.focusDuration,
  isRunning: false,
  isPaused: false,
  completedSessions: 0,
  sessionsInCycle: 0,
  currentTask: null,
  settings: DEFAULT_SETTINGS,
};

/**
 * Main hook for using the Focus Timer Engine in React components
 */
export function useFocusEngine() {
  const engine = useRef(null);
  
  // Initialize engine on first render (client-side only)
  if (typeof window !== 'undefined' && !engine.current) {
    engine.current = getTimerEngine();
  }
  
  // Subscribe to engine state using useSyncExternalStore for concurrent mode safety
  const snapshot = useSyncExternalStore(
    useCallback((callback) => {
      if (!engine.current) return () => {};
      const unsub = engine.current.on('tick', callback);
      return unsub;
    }, []),
    useCallback(() => engine.current ? engine.current.getSnapshot() : SERVER_SNAPSHOT, []),
    useCallback(() => SERVER_SNAPSHOT, []) // Server snapshot - static to avoid hydration issues
  );
  
  // Timer control methods (stable references)
  const start = useCallback(() => engine.current?.start(), []);
  const pause = useCallback(() => engine.current?.pause(), []);
  const resume = useCallback(() => engine.current?.resume(), []);
  const toggle = useCallback(() => engine.current?.toggle(), []);
  const reset = useCallback(() => engine.current?.reset(), []);
  const skip = useCallback(() => engine.current?.skip(), []);
  const addTime = useCallback((seconds) => engine.current?.addTime(seconds), []);
  const setMode = useCallback((mode) => engine.current?.setMode(mode), []);
  const setTask = useCallback((task) => engine.current?.setTask(task), []);
  const updateSettings = useCallback((settings) => engine.current?.updateSettings(settings), []);
  
  return {
    // State
    ...snapshot,
    
    // Controls
    start,
    pause,
    resume,
    toggle,
    reset,
    skip,
    addTime,
    setMode,
    setTask,
    updateSettings,
    
    // Engine reference for advanced use
    engine: engine.current,
  };
}

/**
 * Hook for subscribing to specific timer events
 * Note: Event handlers should be memoized with useCallback to avoid unnecessary resubscription
 */
export function useFocusEvents(eventHandlers = {}) {
  const engineRef = useRef(null);
  const handlersRef = useRef(eventHandlers);
  
  // Update handlers ref on each render
  handlersRef.current = eventHandlers;
  
  // Initialize engine ref on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      engineRef.current = getTimerEngine();
    }
  }, []);
  
  useEffect(() => {
    if (!engineRef.current) return;
    
    const engine = engineRef.current;
    const unsubscribers = [];
    
    // Subscribe with wrapper functions that call the current handler ref
    if (handlersRef.current.onTick) {
      unsubscribers.push(engine.on('tick', (data) => handlersRef.current.onTick?.(data)));
    }
    if (handlersRef.current.onStarted) {
      unsubscribers.push(engine.on('started', (data) => handlersRef.current.onStarted?.(data)));
    }
    if (handlersRef.current.onPaused) {
      unsubscribers.push(engine.on('paused', (data) => handlersRef.current.onPaused?.(data)));
    }
    if (handlersRef.current.onCompleted) {
      unsubscribers.push(engine.on('completed', (data) => handlersRef.current.onCompleted?.(data)));
    }
    if (handlersRef.current.onReset) {
      unsubscribers.push(engine.on('reset', (data) => handlersRef.current.onReset?.(data)));
    }
    if (handlersRef.current.onModeChanged) {
      unsubscribers.push(engine.on('modeChanged', (data) => handlersRef.current.onModeChanged?.(data)));
    }
    if (handlersRef.current.onRecovered) {
      unsubscribers.push(engine.on('recovered', (data) => handlersRef.current.onRecovered?.(data)));
    }
    if (handlersRef.current.onSessionCreated) {
      unsubscribers.push(engine.on('sessionCreated', (data) => handlersRef.current.onSessionCreated?.(data)));
    }
    if (handlersRef.current.onSessionEnded) {
      unsubscribers.push(engine.on('sessionEnded', (data) => handlersRef.current.onSessionEnded?.(data)));
    }
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []); // Empty deps - subscribe once on mount
}

/**
 * Hook for syncing settings with backend
 */
export function useFocusSettings() {
  const engineRef = useRef(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize engine on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      engineRef.current = getTimerEngine();
      setSettings(engineRef.current.settings);
    }
  }, []);
  
  // Fetch settings from backend
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/focus/settings', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        const backendSettings = data.settings;
        
        // Convert from backend format to engine format
        const engineSettings = {
          focusDuration: backendSettings.focus_duration,
          shortBreakDuration: backendSettings.short_break_duration,
          longBreakDuration: backendSettings.long_break_duration,
          sessionsUntilLongBreak: backendSettings.sessions_until_long_break,
          autoStartBreaks: backendSettings.auto_start_breaks,
          autoStartFocus: backendSettings.auto_start_focus,
          soundEnabled: backendSettings.sound_enabled,
          soundVolume: backendSettings.sound_volume / 100, // Convert 0-100 to 0-1
          soundType: backendSettings.sound_type,
          notificationsEnabled: backendSettings.notifications_enabled,
          dailyGoalSessions: backendSettings.daily_goal_sessions,
        };
        
        engineRef.current?.updateSettings(engineSettings);
        setSettings(engineSettings);
      } else if (response.status === 401) {
        // Not logged in, use defaults
        setSettings(engineRef.current?.settings || DEFAULT_SETTINGS);
      } else {
        throw new Error('Failed to fetch settings');
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
      setError(e.message);
      setSettings(engineRef.current?.settings || DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Save settings to backend
  const saveSettings = useCallback(async (newSettings) => {
    try {
      // Convert from engine format to backend format
      const backendSettings = {
        focus_duration: newSettings.focusDuration,
        short_break_duration: newSettings.shortBreakDuration,
        long_break_duration: newSettings.longBreakDuration,
        sessions_until_long_break: newSettings.sessionsUntilLongBreak,
        auto_start_breaks: newSettings.autoStartBreaks,
        auto_start_focus: newSettings.autoStartFocus,
        sound_enabled: newSettings.soundEnabled,
        sound_volume: Math.round(newSettings.soundVolume * 100),
        sound_type: newSettings.soundType,
        notifications_enabled: newSettings.notificationsEnabled,
        daily_goal_sessions: newSettings.dailyGoalSessions,
      };
      
      const response = await fetch('/api/focus/settings', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendSettings),
      });
      
      if (response.ok) {
        engineRef.current?.updateSettings(newSettings);
        setSettings(newSettings);
        return true;
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (e) {
      console.error('Error saving settings:', e);
      setError(e.message);
      return false;
    }
  }, []);
  
  // Fetch settings on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchSettings();
    }
  }, [fetchSettings]);
  
  // Subscribe to settings changes from engine
  useEffect(() => {
    if (!engineRef.current) return;
    return engineRef.current.on('settingsChanged', (newSettings) => {
      setSettings(newSettings);
    });
  }, []);
  
  return {
    settings,
    isLoading,
    error,
    updateSettings: saveSettings,
    refetch: fetchSettings,
  };
}

/**
 * Hook for focus statistics
 */
export function useFocusStats() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchStats = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [todayRes, weekRes] = await Promise.all([
        fetch('/api/focus/stats?period=today', { credentials: 'same-origin' }),
        fetch('/api/focus/stats?period=week', { credentials: 'same-origin' }),
      ]);
      
      if (todayRes.ok && weekRes.ok) {
        const todayData = await todayRes.json();
        const weekData = await weekRes.json();
        
        setStats({
          today: todayData.stats,
          week: weekData.stats,
          totalSessions: todayData.stats.totalSessions,
          totalMinutes: todayData.stats.totalMinutes,
          completedToday: todayData.stats.recentSessions || [],
        });
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  
  // Subscribe to session completion to refresh stats
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const engine = getTimerEngine();
    return engine.on('sessionEnded', ({ completed }) => {
      if (completed) {
        // Debounce refresh
        setTimeout(fetchStats, 500);
      }
    });
  }, [fetchStats]);
  
  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Hook for document title updates
 */
export function useFocusDocumentTitle() {
  const { timeLeft, isRunning, mode } = useFocusEngine();
  
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    if (isRunning) {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      const modeStr = mode === 'focus' ? 'Focus' : mode === 'short_break' ? 'Break' : 'Long Break';
      document.title = `${timeStr} - ${modeStr}`;
    } else {
      document.title = 'Focus Session - University Planner';
    }
    
    return () => {
      document.title = 'Focus Session - University Planner';
    };
  }, [timeLeft, isRunning, mode]);
}

/**
 * Hook for available tasks
 */
export function useFocusTasks() {
  const [tasks, setTasks] = useState([]);
  const [lastTask, setLastTask] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchTasks = useCallback(async (searchQuery = '') => {
    if (typeof window === 'undefined') return;
    
    setIsLoading(true);
    
    try {
      const url = searchQuery
        ? `/api/focus/tasks?search=${encodeURIComponent(searchQuery)}`
        : '/api/focus/tasks';
      
      const response = await fetch(url, { credentials: 'same-origin' });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
        setLastTask(data.lastTask || null);
      }
    } catch (e) {
      console.error('Error fetching tasks:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  
  return {
    tasks,
    lastTask,
    isLoading,
    search: fetchTasks,
  };
}

// Re-export constants for convenience
export { TimerState, SessionMode, DEFAULT_SETTINGS };
