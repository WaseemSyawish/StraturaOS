// Focus Session Notifications & Audio
import { useEffect, useRef } from 'react';

export const useFocusNotifications = () => {
  const audioRef = useRef(null);

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const playSound = (soundType = 'chime', volume = 50) => {
    try {
      // Create audio context for web audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set volume (0-1)
      gainNode.gain.value = volume / 100;

      // Different sound patterns
      switch (soundType) {
        case 'chime':
          oscillator.frequency.value = 523.25; // C5
          oscillator.type = 'sine';
          break;
        case 'bell':
          oscillator.frequency.value = 659.25; // E5
          oscillator.type = 'triangle';
          break;
        default:
          oscillator.frequency.value = 440; // A4
          oscillator.type = 'sine';
      }

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);

      // Cleanup
      setTimeout(() => {
        audioContext.close();
      }, 500);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const showNotification = (title, options = {}) => {
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
  };

  const notifySessionComplete = (sessionType, nextAction) => {
    let title, body, icon;

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
  };

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
