// lib/useReminders.ts
// React hook for managing event reminders and notifications

import { useEffect, useRef, useState } from 'react';
import { Event } from '../src/types/index';
import { 
  shouldFireReminder, 
  showNotification, 
  requestNotificationPermission,
  formatTimeUntil,
  type ReminderTime 
} from './notificationHelpers';

interface UseRemindersOptions {
  events: Event[];
  onReminderFired?: (eventId: string, reminderType: string) => void;
  checkInterval?: number; // milliseconds between checks (default: 60000 = 1 minute)
  enabled?: boolean;
}

export function useReminders({
  events,
  onReminderFired,
  checkInterval = 60000, // Check every minute
  enabled = true,
}: UseRemindersOptions) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const lastCheckRef = useRef<Date>(new Date());
  const firedRemindersRef = useRef<Set<string>>(new Set());

  // Request notification permission on mount
  useEffect(() => {
    if (!enabled || permissionRequested) return;

    (async () => {
      const granted = await requestNotificationPermission();
      setPermissionGranted(granted);
      setPermissionRequested(true);
    })();
  }, [enabled, permissionRequested]);

  // Check for reminders to fire
  useEffect(() => {
    if (!enabled || !permissionGranted || events.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      console.log('[useReminders] Checking reminders at:', now.toISOString());
      console.log('[useReminders] Total events:', events.length);
      console.log('[useReminders] Permission granted:', permissionGranted);
      console.log('[useReminders] Enabled:', enabled);
      
      events.forEach((event) => {
        // Skip if event has no reminders or no start date
        if (!event.reminders || event.reminders.length === 0 || !event.startDate) {
          if (!event.startDate) {
            console.log(`[useReminders] Skipping "${event.title}" - no startDate`);
          } else if (!event.reminders || event.reminders.length === 0) {
            console.log(`[useReminders] Skipping "${event.title}" - no reminders`);
          }
          return;
        }

        console.log(`[useReminders] Checking event "${event.title}"`, {
          startDate: event.startDate,
          reminders: event.reminders,
        });

        const eventDate = new Date(event.startDate);
        const alreadyFired = event.remindersFired || [];

        event.reminders.forEach((reminderType) => {
          // Create unique key for this reminder
          const reminderKey = `${event.id}-${reminderType}`;
          
          // Skip if already fired in this session
          if (firedRemindersRef.current.has(reminderKey)) {
            console.log(`[useReminders] Reminder already fired: ${reminderKey}`);
            return;
          }

          // Check if reminder should fire
          console.log(`[useReminders] Checking reminder "${reminderType}" for "${event.title}"`, {
            eventDate: eventDate.toISOString(),
            now: now.toISOString(),
            shouldFire: shouldFireReminder(eventDate, reminderType, alreadyFired),
          });

          if (shouldFireReminder(eventDate, reminderType, alreadyFired)) {
            console.log(`[useReminders] FIRING reminder for "${event.title}"`);
            
            // Fire notification
            const notification = showNotification(event.title, {
              body: `Reminder: ${reminderType} • ${formatTimeUntil(eventDate)} remaining`,
              tag: reminderKey,
              requireInteraction: false,
              data: {
                eventId: event.id,
                reminderType,
                eventDate: event.startDate,
              },
            });

            // Mark as fired in this session
            firedRemindersRef.current.add(reminderKey);

            // Call callback to persist to database
            if (onReminderFired) {
              onReminderFired(event.id, reminderType);
            }

            // Add click handler to notification
            if (notification) {
              notification.onclick = () => {
                window.focus();
                notification.close();
                
                // Navigate to calendar page with event
                const eventDateStr = new Date(event.startDate).toISOString().split('T')[0];
                window.location.href = `/calendar?date=${eventDateStr}&event=${event.id}`;
              };
            }

            console.log(`[Reminder] Fired ${reminderType} for "${event.title}"`);
          }
        });
      });

      lastCheckRef.current = now;
    };

    // Check immediately
    checkReminders();

    // Set up interval
    const intervalId = setInterval(checkReminders, checkInterval);

    return () => clearInterval(intervalId);
  }, [events, enabled, permissionGranted, onReminderFired, checkInterval]);

  return {
    permissionGranted,
    permissionRequested,
    requestPermission: async () => {
      const granted = await requestNotificationPermission();
      setPermissionGranted(granted);
      setPermissionRequested(true);
      return granted;
    },
  };
}

// Helper to format reminder type as human-readable description
function formatTimeDescription(reminderType: ReminderTime): string {
  switch (reminderType) {
    case '1week':
      return '1 week before';
    case '2days':
      return '2 days before';
    case '1day':
      return '1 day before';
    case 'morning':
      return 'Morning reminder (8 AM)';
    case '1hour':
      return '1 hour before';
    default:
      return 'Reminder';
  }
}
