// Focus Session Timer Hook - Manages timer state and logic
import { useState, useEffect, useRef, useCallback } from 'react';

export const useFocusTimer = (initialDuration, onComplete) => {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const remainingTimeRef = useRef(initialDuration);
  const onCompleteRef = useRef(onComplete);

  // keep latest onComplete in a ref to avoid stale closures when timer fires
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Use Web Worker for accurate timing (optional, can be added later)
  useEffect(() => {
    if (isRunning && !isPaused) {
      startTimeRef.current = Date.now();
      
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const newTimeLeft = Math.max(0, remainingTimeRef.current - elapsed);
        
        setTimeLeft(newTimeLeft);
        
        if (newTimeLeft === 0) {
          handleComplete();
        }
      }, 100); // Update every 100ms for smooth countdown
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isRunning, isPaused]);

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    // call the latest onComplete from ref to avoid stale closures
    try {
      if (onCompleteRef.current) onCompleteRef.current();
    } catch (e) {
      // swallow errors from user callback to avoid breaking timer internals
      console.error('Error in onComplete callback:', e);
    }
  }, [onComplete]);

  const start = useCallback(() => {
    remainingTimeRef.current = timeLeft;
    setIsRunning(true);
    setIsPaused(false);
  }, [timeLeft]);

  const pause = useCallback(() => {
    setIsPaused(true);
    remainingTimeRef.current = timeLeft;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [timeLeft]);

  const resume = useCallback(() => {
    remainingTimeRef.current = timeLeft;
    setIsPaused(false);
  }, [timeLeft]);

  const reset = useCallback((newDuration) => {
    setIsRunning(false);
    setIsPaused(false);
    const duration = newDuration || initialDuration;
    setTimeLeft(duration);
    remainingTimeRef.current = duration;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [initialDuration]);

  const toggle = useCallback(() => {
    if (!isRunning) {
      start();
    } else if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isRunning, isPaused, start, pause, resume]);

  return {
    timeLeft,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
    toggle,
  };
};

// Format time to MM:SS
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format duration to human-readable string
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
