/**
 * Focus Timer Web Worker
 * 
 * Runs timer logic in a separate thread for accurate background timing.
 * Communicates with main thread via postMessage.
 */

// State
let isRunning = false;
let startTime = null;
let pausedTimeRemaining = null;
let totalDuration = null;
let tickInterval = null;

// Constants
const TICK_INTERVAL = 100; // 100ms for smooth updates

/**
 * Calculate remaining time based on elapsed
 */
function getTimeRemaining() {
  if (!isRunning || !startTime || !totalDuration) {
    return pausedTimeRemaining || 0;
  }
  
  const elapsed = (Date.now() - startTime) / 1000;
  const remaining = Math.max(0, totalDuration - elapsed);
  return Math.ceil(remaining);
}

/**
 * Send tick to main thread
 */
function tick() {
  const timeRemaining = getTimeRemaining();
  
  self.postMessage({
    type: 'tick',
    timeRemaining,
    isRunning,
    timestamp: Date.now(),
  });
  
  // Check for completion
  if (isRunning && timeRemaining <= 0) {
    isRunning = false;
    clearInterval(tickInterval);
    tickInterval = null;
    
    self.postMessage({
      type: 'completed',
      timestamp: Date.now(),
    });
  }
}

/**
 * Start the timer
 */
function start(duration) {
  totalDuration = duration;
  startTime = Date.now();
  pausedTimeRemaining = null;
  isRunning = true;
  
  // Clear any existing interval
  if (tickInterval) {
    clearInterval(tickInterval);
  }
  
  // Start ticking
  tickInterval = setInterval(tick, TICK_INTERVAL);
  
  // Immediate tick
  tick();
  
  self.postMessage({
    type: 'started',
    duration: totalDuration,
    timestamp: Date.now(),
  });
}

/**
 * Pause the timer
 */
function pause() {
  if (!isRunning) return;
  
  pausedTimeRemaining = getTimeRemaining();
  isRunning = false;
  
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  
  self.postMessage({
    type: 'paused',
    timeRemaining: pausedTimeRemaining,
    timestamp: Date.now(),
  });
}

/**
 * Resume the timer
 */
function resume() {
  if (isRunning || !pausedTimeRemaining) return;
  
  totalDuration = pausedTimeRemaining;
  startTime = Date.now();
  pausedTimeRemaining = null;
  isRunning = true;
  
  // Start ticking
  tickInterval = setInterval(tick, TICK_INTERVAL);
  
  // Immediate tick
  tick();
  
  self.postMessage({
    type: 'resumed',
    duration: totalDuration,
    timestamp: Date.now(),
  });
}

/**
 * Stop and reset the timer
 */
function stop() {
  isRunning = false;
  startTime = null;
  pausedTimeRemaining = null;
  totalDuration = null;
  
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  
  self.postMessage({
    type: 'stopped',
    timestamp: Date.now(),
  });
}

/**
 * Add time to the current timer
 */
function addTime(seconds) {
  if (!totalDuration) return;
  
  if (isRunning) {
    // Extend the total duration
    totalDuration += seconds;
  } else if (pausedTimeRemaining !== null) {
    // Add to paused time
    pausedTimeRemaining = Math.max(0, pausedTimeRemaining + seconds);
  }
  
  // Immediate tick to reflect change
  tick();
  
  self.postMessage({
    type: 'timeAdded',
    seconds,
    timeRemaining: getTimeRemaining(),
    timestamp: Date.now(),
  });
}

/**
 * Sync state (for recovery scenarios)
 */
function sync(state) {
  if (state.isRunning) {
    totalDuration = state.totalDuration;
    startTime = state.startTime;
    pausedTimeRemaining = null;
    isRunning = true;
    
    if (!tickInterval) {
      tickInterval = setInterval(tick, TICK_INTERVAL);
    }
  } else {
    pausedTimeRemaining = state.timeRemaining;
    isRunning = false;
    
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  }
  
  tick();
}

/**
 * Get current state
 */
function getState() {
  self.postMessage({
    type: 'state',
    state: {
      isRunning,
      timeRemaining: getTimeRemaining(),
      totalDuration,
      startTime,
    },
    timestamp: Date.now(),
  });
}

// Message handler
self.onmessage = function(event) {
  const { type, ...payload } = event.data;
  
  switch (type) {
    case 'start':
      start(payload.duration);
      break;
    case 'pause':
      pause();
      break;
    case 'resume':
      resume();
      break;
    case 'stop':
      stop();
      break;
    case 'addTime':
      addTime(payload.seconds);
      break;
    case 'sync':
      sync(payload.state);
      break;
    case 'getState':
      getState();
      break;
    default:
      console.warn('[Worker] Unknown message type:', type);
  }
};

// Let main thread know we're ready
self.postMessage({
  type: 'ready',
  timestamp: Date.now(),
});
