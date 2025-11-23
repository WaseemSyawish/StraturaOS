/**
 * Browser notification utilities for task reminders with Service Worker support
 */

let permission = 'default';
let serviceWorkerRegistration = null;

/**
 * Register service worker for background notifications
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported');
    return false;
  }

  try {
    serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered');
    return true;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return false;
  }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  // Register service worker first
  await registerServiceWorker();

  if (Notification.permission === 'granted') {
    permission = 'granted';
    return true;
  }

  if (Notification.permission !== 'denied') {
    const result = await Notification.requestPermission();
    permission = result;
    return result === 'granted';
  }

  return false;
}

/**
 * Show a browser notification
 */
export function showNotification(title, options = {}) {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  const notification = new Notification(title, {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    ...options,
  });

  return notification;
}

/**
 * Schedule a notification for a specific time (uses Service Worker if available)
 */
export function scheduleNotification(task) {
  if (!task?.reminder) return null;

  const reminderTime = new Date(task.reminder);
  const now = new Date();
  const delay = reminderTime.getTime() - now.getTime();

  if (delay <= 0) {
    // Reminder time has passed
    return null;
  }

  // Use Service Worker if available for background notifications
  if (serviceWorkerRegistration && serviceWorkerRegistration.active) {
    serviceWorkerRegistration.active.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      title: `Reminder: ${task.title}`,
      body: task.description || 'Task reminder',
      tag: `task-${task.id}`,
      timestamp: reminderTime.getTime(),
    });
    return `sw-${task.id}`;
  }

  // Fallback to setTimeout
  const timeoutId = setTimeout(() => {
    showNotification(`Reminder: ${task.title}`, {
      body: task.description || 'Task reminder',
      tag: `task-${task.id}`,
      requireInteraction: true,
      data: { taskId: task.id },
    });
  }, delay);

  return timeoutId;
}

/**
 * Check for overdue reminders and show them
 */
export function checkOverdueReminders(tasks) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const overdueKey = 'lastReminderCheck';
  const lastCheck = localStorage.getItem(overdueKey);
  const lastCheckTime = lastCheck ? new Date(lastCheck) : new Date(now.getTime() - 24 * 60 * 60 * 1000);

  tasks.forEach((task) => {
    if (!task?.reminder) return;

    const reminderTime = new Date(task.reminder);
    
    // Show notification if reminder is between last check and now
    if (reminderTime > lastCheckTime && reminderTime <= now) {
      showNotification(`Reminder: ${task.title}`, {
        body: task.description || 'Task reminder',
        tag: `task-${task.id}`,
        requireInteraction: true,
        data: { taskId: task.id },
      });
    }
  });

  localStorage.setItem(overdueKey, now.toISOString());
}

/**
 * Initialize notifications and schedule all pending reminders
 */
export async function initializeNotifications(tasks) {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  // Check for any overdue reminders first
  checkOverdueReminders(tasks);

  const scheduledIds = [];

  tasks.forEach((task) => {
    const timeoutId = scheduleNotification(task);
    if (timeoutId) {
      scheduledIds.push(timeoutId);
    }
  });

  // Set up periodic check every 5 minutes
  const periodicCheck = setInterval(() => {
    checkOverdueReminders(tasks);
  }, 5 * 60 * 1000);

  return { scheduledIds, periodicCheck };
}

/**
 * Clear all scheduled notifications
 */
export function clearScheduledNotifications(timeoutIds) {
  if (!Array.isArray(timeoutIds)) return;
  timeoutIds.forEach((id) => clearTimeout(id));
}
