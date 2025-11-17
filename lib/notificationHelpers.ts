// lib/notificationHelpers.ts
// Utilities for managing browser notifications and reminders

export type ReminderTime = '1week' | '2days' | '1day' | '1hour' | 'morning';

export interface ReminderOption {
  value: ReminderTime;
  label: string;
  description: string;
  minutesBefore: number | ((eventDate: Date) => number);
}

export const REMINDER_OPTIONS: ReminderOption[] = [
  {
    value: '1week',
    label: '1 Week Before',
    description: 'Get notified 7 days in advance',
    minutesBefore: 7 * 24 * 60,
  },
  {
    value: '2days',
    label: '2 Days Before',
    description: 'Get notified 2 days in advance',
    minutesBefore: 2 * 24 * 60,
  },
  {
    value: '1day',
    label: '1 Day Before',
    description: 'Get notified the day before',
    minutesBefore: 24 * 60,
  },
  {
    value: 'morning',
    label: 'Morning Of (8 AM)',
    description: 'Get notified at 8 AM on the day',
    minutesBefore: (eventDate: Date) => {
      // Calculate minutes from 8 AM to event time
      const morningOf = new Date(eventDate);
      morningOf.setHours(8, 0, 0, 0);
      return Math.max(0, Math.floor((eventDate.getTime() - morningOf.getTime()) / (1000 * 60)));
    },
  },
  {
    value: '1hour',
    label: '1 Hour Before',
    description: 'Get notified 1 hour in advance',
    minutesBefore: 60,
  },
];

// Get smart default reminders based on event type
export function getDefaultReminders(eventType?: string): ReminderTime[] {
  switch (eventType) {
    case 'exam':
    case 'quiz':
      return ['1week', '2days', '1day', 'morning'];
    case 'assignment':
    case 'project':
    case 'deadline':
      return ['2days', '1day', 'morning'];
    case 'meeting':
    case 'office-hours':
      return ['1hour'];
    case 'class':
    case 'lab':
    case 'tutorial':
      return []; // Classes are recurring, usually don't need reminders
    default:
      return ['morning'];
  }
}

// Request notification permission from user
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Show a browser notification
export function showNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }

  try {
    return new Notification(title, {
      icon: '/icon-192.png', // You'll need to add this
      badge: '/badge-72.png', // You'll need to add this
      ...options,
    });
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
}

// Calculate when a reminder should fire
export function calculateReminderTime(eventDate: Date, reminderType: ReminderTime | string): Date {
  // Handle simple text reminders
  const reminderText = reminderType.toLowerCase();
  
  // Quick presets
  if (reminderText.includes('later today')) {
    const today = new Date();
    today.setHours(18, 0, 0, 0); // 6 PM today
    return today;
  } else if (reminderText.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow
    return tomorrow;
  } else if (reminderText.includes('next week')) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(9, 0, 0, 0);
    return nextWeek;
  } else if (reminderText.includes('someday')) {
    const someday = new Date();
    someday.setDate(someday.getDate() + 30);
    someday.setHours(9, 0, 0, 0);
    return someday;
  }
  
  // Test reminder - 30 seconds before event
  if (reminderText.includes('test in 30 seconds')) {
    return new Date(eventDate.getTime() - 30 * 1000);
  } else if (reminderText.includes('1 hour before')) {
    return new Date(eventDate.getTime() - 60 * 60 * 1000);
  } else if (reminderText.includes('1 day before')) {
    return new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
  } else if (reminderText.includes('2 days before')) {
    return new Date(eventDate.getTime() - 2 * 24 * 60 * 60 * 1000);
  } else if (reminderText.includes('1 week before')) {
    return new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  // Custom datetime string (e.g., "Nov 17, 2:30 PM")
  if (!['1week', '2days', '1day', '1hour', 'morning'].includes(reminderType)) {
    try {
      const parsed = new Date(reminderType);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse custom reminder time:', reminderType);
    }
  }

  const option = REMINDER_OPTIONS.find(r => r.value === reminderType);
  if (!option) return new Date();

  const minutesBefore = typeof option.minutesBefore === 'function'
    ? option.minutesBefore(eventDate)
    : option.minutesBefore;

  const reminderTime = new Date(eventDate.getTime() - minutesBefore * 60 * 1000);
  return reminderTime;
}

// Check if a reminder should fire now
export function shouldFireReminder(
  eventDate: Date,
  reminderType: ReminderTime | string,
  alreadyFired: string[] = []
): boolean {
  // Already fired
  if (alreadyFired.includes(reminderType)) {
    console.log(`[shouldFireReminder] Already fired: ${reminderType}`);
    return false;
  }

  const now = new Date();
  const reminderTime = calculateReminderTime(eventDate, reminderType);

  console.log(`[shouldFireReminder] Checking reminder:`, {
    reminderType,
    eventDate: eventDate.toISOString(),
    reminderTime: reminderTime.toISOString(),
    now: now.toISOString(),
    nowPastReminderTime: now >= reminderTime,
  });

  // Fire if we've passed the reminder time and within 5 minutes of it
  // (to handle cases where app wasn't open exactly at reminder time)
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const shouldFire = now >= reminderTime && fiveMinutesAgo <= reminderTime;
  
  console.log(`[shouldFireReminder] Result:`, {
    shouldFire,
    fiveMinutesAgo: fiveMinutesAgo.toISOString(),
    withinWindow: fiveMinutesAgo <= reminderTime,
  });
  
  return shouldFire;
}

// Format time until event for display
export function formatTimeUntil(eventDate: Date): string {
  const now = new Date();
  const diff = eventDate.getTime() - now.getTime();
  
  if (diff < 0) return 'Past';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}
