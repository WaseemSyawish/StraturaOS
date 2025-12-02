/**
 * Focus Timer Module
 * 
 * Production-grade focus/pomodoro timer system.
 * 
 * Features:
 * - Accurate timing using elapsed time calculation
 * - Web Worker support for background operation
 * - Visibility API handling for tab focus/blur
 * - Robust localStorage persistence
 * - Event-driven architecture
 * - Audio management with preloading
 * - Offline-first with session queue
 */

// Core engine
export { 
  FocusTimerEngine, 
  getTimerEngine, 
  TimerState, 
  SessionMode, 
  DEFAULT_SETTINGS 
} from './FocusTimerEngine';

// React hooks
export { 
  useFocusEngine, 
  useFocusEvents, 
  useFocusSettings, 
  useFocusStats, 
  useFocusDocumentTitle,
  useFocusTasks,
} from './useFocusEngine';

// Audio manager
export { 
  getAudioManager, 
  SOUNDS 
} from './AudioManager';
