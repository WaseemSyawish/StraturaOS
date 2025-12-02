// Focus Session Notifications & Audio
import { useEffect, useRef, useCallback } from 'react';
import { getAudioManager } from '@/lib/focus/AudioManager';

export const useFocusNotifications = () => {
  const audioManagerRef = useRef(null);

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Initialize audio manager
    audioManagerRef.current = getAudioManager();
  }, []);

  const playSound = useCallback(async (soundType = 'chime', volume = 50) => {
    try {
      const audioManager = audioManagerRef.current || getAudioManager();
      audioManager.setVolume(volume / 100);
      await audioManager.play(soundType);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, []);

  const showNotification = useCallback((title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        return notification;
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
    return null;
  }, []);

  const notifySessionComplete = useCallback((sessionType, nextAction) => {
    let title, body;

    switch (sessionType) {
      case 'focus':
        title = '🎉 Focus Session Complete!';
        body = nextAction || 'Time for a break! Great work.';
        break;
      case 'short_break':
        title = '☕ Short Break Complete';
        body = 'Ready to focus again?';
        break;
      case 'long_break':
        title = '🌟 Long Break Complete';
        body = 'Refreshed and ready for the next session!';
        break;
      default:
        title = 'Session Complete';
        body = 'Your timer has finished.';
    }

    showNotification(title, { body });
  }, [showNotification]);

  return {
    playSound,
    showNotification,
    notifySessionComplete,
  };
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return Notification.permission === 'granted';
};
