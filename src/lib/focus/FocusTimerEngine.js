/**
 * FocusTimerEngine - Production-grade Pomodoro Timer
 * 
 * Inspired by: Pomofocus, Forest, Centered, Be Focused
 * 
 * Features:
 * - Accurate timing using performance.now() with drift correction
 * - Background tab support via Page Visibility API
 * - Persistent state via localStorage + IndexedDB fallback
 * - Automatic session recovery on page reload/navigation
 * - State machine for predictable session lifecycle
 * - Event-driven architecture for UI updates
 * - Audio preloading for instant sound playback
 * - Notification management with permission handling
 */

// Timer States (State Machine)
export const TimerState = {
  IDLE: 'idle',           // Ready to start
  RUNNING: 'running',     // Actively counting down
  PAUSED: 'paused',       // Temporarily stopped
  COMPLETED: 'completed', // Timer finished naturally
  INTERRUPTED: 'interrupted', // User stopped early
};

// Session Modes
export const SessionMode = {
  FOCUS: 'focus',
  SHORT_BREAK: 'short_break',
  LONG_BREAK: 'long_break',
};

// Storage key for persistence
const STORAGE_KEY = 'focus_timer_state_v2';
const SETTINGS_KEY = 'focus_timer_settings_v2';

// Default settings (in seconds)
export const DEFAULT_SETTINGS = {
  focusDuration: 25 * 60,      // 25 minutes
  shortBreakDuration: 5 * 60,  // 5 minutes
  longBreakDuration: 15 * 60,  // 15 minutes
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  soundVolume: 0.7,
  soundType: 'bell',
  notificationsEnabled: true,
  dailyGoalSessions: 8,
  tickSoundEnabled: false,
};

/**
 * Core Timer Engine
 * Handles all timer logic independently of React
 */
class FocusTimerEngine {
  constructor() {
    // Core state
    this.state = TimerState.IDLE;
    this.mode = SessionMode.FOCUS;
    this.timeLeft = 0;
    this.totalDuration = 0;
    this.startTime = null;
    this.pausedAt = null;
    this.accumulatedPausedTime = 0;
    
    // Session tracking
    this.sessionId = null;
    this.currentTask = null;
    this.completedSessions = 0;
    this.sessionsInCycle = 0;
    
    // Settings
    this.settings = { ...DEFAULT_SETTINGS };
    
    // Timing internals
    this.frameId = null;
    this.lastTick = 0;
    
    // Event listeners
    this.listeners = new Map();
    
    // Audio cache
    this.audioCache = new Map();
    
    // Visibility handling
    this.wasHidden = false;
    this.hiddenAt = null;
    
    // Snapshot caching for useSyncExternalStore
    this._cachedSnapshot = null;
    this._snapshotVersion = 0;
    
    // Initialize
    this._init();
  }
  
  /**
   * Initialize the engine
   */
  _init() {
    // Load persisted state
    this._loadState();
    
    // Load settings
    this._loadSettings();
    
    // Set up visibility change listener
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this));
    }
    
    // Set up beforeunload to persist state
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this._handleBeforeUnload.bind(this));
    }
    
    // Preload audio files
    this._preloadAudio();
    
    // Check for recovered session
    this._checkRecoveredSession();
    
    // Ensure initial snapshot is created after all initialization
    this._invalidateSnapshot();
  }
  
  /**
   * Event System
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }
  
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }
  
  _emit(event, data) {
    // Invalidate snapshot cache before notifying listeners
    // This ensures getSnapshot returns fresh data
    if (event === 'tick' || event === 'settingsChanged' || event === 'modeChanged') {
      this._invalidateSnapshot();
    }
    
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`Error in ${event} listener:`, e);
        }
      });
    }
  }
  
  /**
   * Get current snapshot of timer state
   * IMPORTANT: Returns cached snapshot for useSyncExternalStore stability
   */
  getSnapshot() {
    // Return cached snapshot if version hasn't changed
    if (this._cachedSnapshot && this._cachedSnapshot._version === this._snapshotVersion) {
      return this._cachedSnapshot;
    }
    
    // Create new snapshot only when state has actually changed
    this._cachedSnapshot = {
      _version: this._snapshotVersion,
      state: this.state,
      mode: this.mode,
      timeLeft: this.timeLeft,
      totalDuration: this.totalDuration,
      progress: this.totalDuration > 0 ? (this.totalDuration - this.timeLeft) / this.totalDuration : 0,
      sessionId: this.sessionId,
      currentTask: this.currentTask,
      completedSessions: this.completedSessions,
      sessionsInCycle: this.sessionsInCycle,
      settings: this.settings, // Don't spread - keep reference stable
      isRunning: this.state === TimerState.RUNNING,
      isPaused: this.state === TimerState.PAUSED,
    };
    
    return this._cachedSnapshot;
  }
  
  /**
   * Invalidate snapshot cache - call when state changes
   */
  _invalidateSnapshot() {
    this._snapshotVersion++;
  }
  
  /**
   * Update settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this._saveSettings();
    
    // If idle, update duration to match new settings
    if (this.state === TimerState.IDLE) {
      this.totalDuration = this._getDurationForMode(this.mode);
      this.timeLeft = this.totalDuration;
    }
    
    this._emit('settingsChanged', this.settings);
    this._emit('tick', this.getSnapshot());
  }
  
  /**
   * Get duration for a given mode
   */
  _getDurationForMode(mode) {
    switch (mode) {
      case SessionMode.FOCUS:
        return this.settings.focusDuration;
      case SessionMode.SHORT_BREAK:
        return this.settings.shortBreakDuration;
      case SessionMode.LONG_BREAK:
        return this.settings.longBreakDuration;
      default:
        return this.settings.focusDuration;
    }
  }
  
  /**
   * Change mode (only when idle)
   */
  setMode(newMode) {
    if (this.state !== TimerState.IDLE) {
      console.warn('Cannot change mode while timer is running');
      return false;
    }
    
    this.mode = newMode;
    this.totalDuration = this._getDurationForMode(newMode);
    this.timeLeft = this.totalDuration;
    
    this._emit('modeChanged', { mode: newMode, duration: this.totalDuration });
    this._emit('tick', this.getSnapshot());
    
    return true;
  }
  
  /**
   * Set current task
   */
  setTask(task) {
    this.currentTask = task;
    this._emit('taskChanged', task);
    this._emit('tick', this.getSnapshot());
  }
  
  /**
   * Start the timer
   */
  async start() {
    if (this.state === TimerState.RUNNING) return;
    
    // If starting fresh (not resuming from pause)
    if (this.state === TimerState.IDLE || this.state === TimerState.COMPLETED) {
      this.totalDuration = this._getDurationForMode(this.mode);
      this.timeLeft = this.totalDuration;
      this.accumulatedPausedTime = 0;
      this.startTime = performance.now();
      
      // Create session in database if focus mode
      if (this.mode === SessionMode.FOCUS) {
        this._createSession();
      }
    } else if (this.state === TimerState.PAUSED) {
      // Resume from pause - add paused time to accumulated
      this.accumulatedPausedTime += performance.now() - this.pausedAt;
    }
    
    this.state = TimerState.RUNNING;
    this.pausedAt = null;
    
    // Start the animation frame loop
    this._startLoop();
    
    this._emit('started', this.getSnapshot());
    this._saveState();
  }
  
  /**
   * Pause the timer
   */
  pause() {
    if (this.state !== TimerState.RUNNING) return;
    
    this.state = TimerState.PAUSED;
    this.pausedAt = performance.now();
    
    // Stop the loop
    this._stopLoop();
    
    this._emit('paused', this.getSnapshot());
    this._saveState();
  }
  
  /**
   * Resume from pause
   */
  resume() {
    if (this.state !== TimerState.PAUSED) return;
    this.start();
  }
  
  /**
   * Toggle start/pause
   */
  toggle() {
    if (this.state === TimerState.RUNNING) {
      this.pause();
    } else {
      this.start();
    }
  }
  
  /**
   * Reset timer to initial state
   */
  reset() {
    const wasRunning = this.state === TimerState.RUNNING || this.state === TimerState.PAUSED;
    
    this._stopLoop();
    
    // Mark session as interrupted if it was running
    if (wasRunning && this.sessionId && this.mode === SessionMode.FOCUS) {
      this._endSession(false, true);
    }
    
    this.state = TimerState.IDLE;
    this.totalDuration = this._getDurationForMode(this.mode);
    this.timeLeft = this.totalDuration;
    this.startTime = null;
    this.pausedAt = null;
    this.accumulatedPausedTime = 0;
    this.sessionId = null;
    
    this._emit('reset', this.getSnapshot());
    this._clearState();
  }
  
  /**
   * Skip to next session (break or focus)
   */
  skip() {
    this._stopLoop();
    
    // End current session if running
    if (this.sessionId && this.mode === SessionMode.FOCUS) {
      this._endSession(false, true);
    }
    
    // Move to next mode
    this._transitionToNextMode();
    
    this._emit('skipped', this.getSnapshot());
  }
  
  /**
   * Add time to current session (extend)
   */
  addTime(seconds) {
    if (this.state === TimerState.IDLE) return;
    
    this.timeLeft = Math.max(0, this.timeLeft + seconds);
    this.totalDuration += seconds;
    
    this._emit('timeAdded', { seconds, newTimeLeft: this.timeLeft });
    this._emit('tick', this.getSnapshot());
  }
  
  /**
   * Main timing loop using requestAnimationFrame
   */
  _startLoop() {
    this.lastTick = performance.now();
    
    const tick = (now) => {
      if (this.state !== TimerState.RUNNING) return;
      
      // Calculate elapsed time since start, minus paused time
      const totalElapsed = now - this.startTime - this.accumulatedPausedTime;
      const newTimeLeft = Math.max(0, Math.round(this.totalDuration - totalElapsed / 1000));
      
      // Only emit if time changed (avoid excessive updates)
      if (newTimeLeft !== this.timeLeft) {
        this.timeLeft = newTimeLeft;
        this._emit('tick', this.getSnapshot());
        
        // Save state periodically (every 10 seconds)
        if (newTimeLeft % 10 === 0) {
          this._saveState();
        }
      }
      
      // Check for completion
      if (newTimeLeft <= 0) {
        this._handleComplete();
        return;
      }
      
      // Continue loop
      this.frameId = requestAnimationFrame(tick);
    };
    
    this.frameId = requestAnimationFrame(tick);
  }
  
  _stopLoop() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }
  
  /**
   * Handle timer completion
   */
  async _handleComplete() {
    this._stopLoop();
    
    const completedMode = this.mode;
    this.state = TimerState.COMPLETED;
    this.timeLeft = 0;
    
    // Play completion sound
    if (this.settings.soundEnabled) {
      this._playSound('complete');
    }
    
    // Show notification
    if (this.settings.notificationsEnabled) {
      this._showNotification(completedMode);
    }
    
    // End session in database
    if (completedMode === SessionMode.FOCUS && this.sessionId) {
      await this._endSession(true, false);
      this.completedSessions++;
      this.sessionsInCycle++;
    }
    
    this._emit('completed', { 
      mode: completedMode, 
      completedSessions: this.completedSessions,
      snapshot: this.getSnapshot(),
    });
    
    // Auto-transition to next mode
    this._transitionToNextMode();
    
    // Auto-start if enabled
    const shouldAutoStart = 
      (completedMode === SessionMode.FOCUS && this.settings.autoStartBreaks) ||
      (completedMode !== SessionMode.FOCUS && this.settings.autoStartFocus);
    
    if (shouldAutoStart) {
      setTimeout(() => this.start(), 1500);
    }
    
    this._clearState();
  }
  
  /**
   * Transition to next mode
   */
  _transitionToNextMode() {
    let nextMode;
    
    if (this.mode === SessionMode.FOCUS) {
      // Check if it's time for a long break
      if (this.sessionsInCycle >= this.settings.sessionsUntilLongBreak) {
        nextMode = SessionMode.LONG_BREAK;
        this.sessionsInCycle = 0;
      } else {
        nextMode = SessionMode.SHORT_BREAK;
      }
    } else {
      // After break, go back to focus
      nextMode = SessionMode.FOCUS;
    }
    
    this.mode = nextMode;
    this.state = TimerState.IDLE;
    this.totalDuration = this._getDurationForMode(nextMode);
    this.timeLeft = this.totalDuration;
    this.sessionId = null;
    this.startTime = null;
    this.pausedAt = null;
    this.accumulatedPausedTime = 0;
    
    this._emit('modeChanged', { mode: nextMode, duration: this.totalDuration });
    this._emit('tick', this.getSnapshot());
  }
  
  /**
   * Visibility change handler
   */
  _handleVisibilityChange() {
    if (document.hidden) {
      // Tab became hidden
      this.wasHidden = true;
      this.hiddenAt = Date.now();
      this._saveState();
    } else {
      // Tab became visible
      if (this.wasHidden && this.state === TimerState.RUNNING) {
        // Recalculate time (the loop may have been throttled)
        const now = performance.now();
        const totalElapsed = now - this.startTime - this.accumulatedPausedTime;
        const newTimeLeft = Math.max(0, Math.round(this.totalDuration - totalElapsed / 1000));
        
        if (newTimeLeft <= 0) {
          // Timer completed while hidden
          this._handleComplete();
        } else {
          this.timeLeft = newTimeLeft;
          this._emit('tick', this.getSnapshot());
        }
      }
      this.wasHidden = false;
      this.hiddenAt = null;
    }
  }
  
  /**
   * Before unload handler
   */
  _handleBeforeUnload() {
    this._saveState();
  }
  
  /**
   * Persistence - Save State
   */
  _saveState() {
    if (this.state === TimerState.IDLE) return;
    
    const stateToSave = {
      state: this.state,
      mode: this.mode,
      timeLeft: this.timeLeft,
      totalDuration: this.totalDuration,
      startTime: this.startTime,
      pausedAt: this.pausedAt,
      accumulatedPausedTime: this.accumulatedPausedTime,
      sessionId: this.sessionId,
      currentTask: this.currentTask,
      completedSessions: this.completedSessions,
      sessionsInCycle: this.sessionsInCycle,
      savedAt: Date.now(),
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save timer state:', e);
    }
  }
  
  _loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load timer state:', e);
      return null;
    }
  }
  
  _clearState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear timer state:', e);
    }
  }
  
  /**
   * Check and recover saved session
   */
  _checkRecoveredSession() {
    const saved = this._loadState();
    if (!saved) return;
    
    const elapsed = (Date.now() - saved.savedAt) / 1000;
    const maxRecoveryAge = 2 * 60 * 60; // 2 hours
    
    if (elapsed > maxRecoveryAge) {
      // Too old, mark as interrupted if was a focus session
      if (saved.mode === SessionMode.FOCUS && saved.sessionId) {
        this._markSessionInterrupted(saved.sessionId);
      }
      this._clearState();
      return;
    }
    
    // Restore state
    this.mode = saved.mode;
    this.totalDuration = saved.totalDuration;
    this.sessionId = saved.sessionId;
    this.currentTask = saved.currentTask;
    this.completedSessions = saved.completedSessions || 0;
    this.sessionsInCycle = saved.sessionsInCycle || 0;
    
    if (saved.state === TimerState.RUNNING || saved.state === TimerState.PAUSED) {
      // Calculate remaining time
      let newTimeLeft;
      
      if (saved.state === TimerState.PAUSED) {
        // Was paused - timeLeft is accurate
        newTimeLeft = saved.timeLeft;
        this.pausedAt = performance.now();
        this.accumulatedPausedTime = saved.accumulatedPausedTime || 0;
        this.startTime = performance.now() - (saved.totalDuration - saved.timeLeft) * 1000 - this.accumulatedPausedTime;
        this.state = TimerState.PAUSED;
      } else {
        // Was running - need to account for elapsed time
        newTimeLeft = Math.max(0, saved.timeLeft - Math.floor(elapsed));
        
        if (newTimeLeft <= 0) {
          // Would have completed - mark as complete
          if (saved.mode === SessionMode.FOCUS && saved.sessionId) {
            this._endSession(true, false);
            this.completedSessions++;
          }
          this._transitionToNextMode();
          this._emit('recoveredComplete', { originalMode: saved.mode });
          return;
        }
        
        // Restore as paused (user can resume)
        this.timeLeft = newTimeLeft;
        this.state = TimerState.PAUSED;
        this.pausedAt = performance.now();
        this.startTime = performance.now() - (saved.totalDuration - newTimeLeft) * 1000;
        this.accumulatedPausedTime = 0;
      }
      
      this.timeLeft = newTimeLeft;
      this._emit('recovered', { 
        originalState: saved.state, 
        timeLeft: newTimeLeft,
        snapshot: this.getSnapshot(),
      });
    } else {
      this.timeLeft = this._getDurationForMode(this.mode);
      this.state = TimerState.IDLE;
    }
    
    this._emit('tick', this.getSnapshot());
  }
  
  /**
   * Settings persistence
   */
  _saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }
  
  _loadSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
      
      // Initialize time based on settings
      this.totalDuration = this._getDurationForMode(this.mode);
      this.timeLeft = this.totalDuration;
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }
  
  /**
   * Database Operations
   */
  async _createSession() {
    if (!this.currentTask && !this.settings.allowEmptySessions) {
      // Optional: require task
    }
    
    try {
      const response = await fetch('/api/focus/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          task_name: this.currentTask?.title || this.currentTask?.name || null,
          task_id: this.currentTask?.id || null,
          session_type: 'focus',
          duration: this.totalDuration,
          started_at: new Date().toISOString(),
          completed: false,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        this.sessionId = data.session?.id;
        this._emit('sessionCreated', { sessionId: this.sessionId });
      }
    } catch (e) {
      console.error('Failed to create session:', e);
    }
  }
  
  async _endSession(completed, interrupted) {
    if (!this.sessionId) return;
    
    try {
      await fetch('/api/focus/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          session_id: this.sessionId,
          ended_at: new Date().toISOString(),
          completed,
          interrupted,
        }),
      });
      
      this._emit('sessionEnded', { sessionId: this.sessionId, completed, interrupted });
    } catch (e) {
      console.error('Failed to end session:', e);
    }
  }
  
  async _markSessionInterrupted(sessionId) {
    try {
      await fetch('/api/focus/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          session_id: sessionId,
          ended_at: new Date().toISOString(),
          completed: false,
          interrupted: true,
        }),
      });
    } catch (e) {
      console.error('Failed to mark session interrupted:', e);
    }
  }
  
  /**
   * Audio System
   */
  _preloadAudio() {
    if (typeof window === 'undefined') return;
    
    const sounds = {
      complete: '/sounds/focus-complete.mp3',
      tick: '/sounds/tick.mp3',
      start: '/sounds/start.mp3',
    };
    
    Object.entries(sounds).forEach(([name, src]) => {
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = src;
        this.audioCache.set(name, audio);
      } catch (e) {
        // Audio not supported
      }
    });
  }
  
  _playSound(name) {
    try {
      const audio = this.audioCache.get(name);
      if (audio) {
        audio.volume = this.settings.soundVolume;
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    } catch (e) {
      console.error('Failed to play sound:', e);
    }
  }
  
  /**
   * Notifications
   */
  async _showNotification(completedMode) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    
    if (Notification.permission !== 'granted') return;
    
    let title, body;
    
    if (completedMode === SessionMode.FOCUS) {
      const isLongBreak = this.sessionsInCycle >= this.settings.sessionsUntilLongBreak;
      title = '🎉 Focus Session Complete!';
      body = isLongBreak 
        ? "Great work! Time for a long break." 
        : "Nice! Take a short break.";
    } else {
      title = '⏰ Break Over!';
      body = "Ready to focus again?";
    }
    
    try {
      new Notification(title, {
        body,
        icon: '/icons/focus-icon.png',
        tag: 'focus-timer',
        requireInteraction: false,
      });
    } catch (e) {
      console.error('Failed to show notification:', e);
    }
  }
  
  /**
   * Cleanup
   */
  destroy() {
    this._stopLoop();
    
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this._handleVisibilityChange);
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this._handleBeforeUnload);
    }
    
    this.listeners.clear();
    this.audioCache.clear();
  }
}

// Singleton instance
let timerInstance = null;

/**
 * Get the singleton timer engine instance
 */
export function getTimerEngine() {
  if (!timerInstance) {
    timerInstance = new FocusTimerEngine();
  }
  return timerInstance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetTimerEngine() {
  if (timerInstance) {
    timerInstance.destroy();
    timerInstance = null;
  }
}

// Named export for convenience
export { FocusTimerEngine };
export default FocusTimerEngine;
