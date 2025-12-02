# Multi-Stage Event Reminders - Implementation Guide

## Overview

This feature implements a comprehensive notification system that allows students to set multiple reminders for upcoming events, addressing the #1 complaint identified in student productivity research: "notifications arrive too late."

## Features Implemented

### 1. Type System

- **Location**: `src/types/index.ts`
- Added `reminders?: string[]` to Event interface
- Added `remindersFired?: string[]` to track which notifications have been shown
- Updated `eventSchema` Zod validation to accept reminders array

### 2. Notification Utilities

- **Location**: `lib/notificationHelpers.ts`
- **Exports**:
  - `REMINDER_OPTIONS`: Array of 5 reminder choices with labels and timing
  - `getDefaultReminders(eventType)`: Smart defaults based on event type
    - Exams/Quizzes: 1 week, 2 days, 1 day, morning
    - Assignments/Projects: 2 days, 1 day, morning
    - Meetings: 1 hour
    - Classes: none (recurring)
  - `requestNotificationPermission()`: Request browser permission
  - `showNotification(title, options)`: Display browser notification
  - `calculateReminderTime(eventDate, reminderType)`: When to fire
  - `shouldFireReminder(eventDate, reminderType, alreadyFired)`: Check if due
  - `formatTimeUntil(eventDate)`: Human-readable countdown

### 3. React Hook

- **Location**: `lib/useReminders.ts`
- **Usage**:

```typescript
const { permissionGranted, requestPermission } = useReminders({
  events: eventsList,
  onReminderFired: (eventId, reminderType) => {
    // Update database to mark reminder as fired
    fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      body: JSON.stringify({
        remindersFired: [...event.remindersFired, reminderType],
      }),
    });
  },
  checkInterval: 60000, // Check every minute
  enabled: true,
});
```

### 4. UI Components

- **Location**: `src/components/schedule/_modals/add-event-modal.tsx`
- Added reminder selection section with 5 checkboxes:
  - ☑ 1 Week Before (7 days)
  - ☑ 2 Days Before (48 hours)
  - ☑ 1 Day Before (24 hours)
  - ☑ Morning Of (8 AM on event day)
  - ☑ 1 Hour Before (60 minutes)
- Smart defaults auto-populate based on event type
- Visual indicator shows count of active reminders
- Reminders persist to database on event save

### 5. Database Schema

- **Location**: `prisma/schema.prisma`
- Added two new columns to `Event` model:
  - `reminders: String[] @default([])` - Array of reminder times
  - `remindersFired: String[] @default([])` - Tracking array
- Migration file: `prisma/migrations/add_reminders_to_events/migration.sql`

## How It Works

### Creating an Event with Reminders

1. User opens "Create Event" modal
2. Selects event type (exam, assignment, meeting, etc.)
3. Smart defaults pre-select appropriate reminders
4. User can toggle any reminder on/off
5. On save, reminders array is stored: `["1week", "2days", "1day", "morning"]`

### Firing Notifications

1. `useReminders` hook runs every 60 seconds
2. Checks each event's reminder times against current time
3. When reminder time arrives (within 5-minute window):
   - Shows browser notification with event title and countdown
   - Marks reminder as fired in session (prevents duplicates)
   - Calls `onReminderFired` callback to persist to database
   - Updates `remindersFired` array: `["1week", "2days"]`
4. User clicks notification → navigates to calendar page with event highlighted

### Notification Content

```
[Title] CS 101 Final Exam
[Body] 1 week before • 7 days remaining
[Icon] /icon-192.png
[Click] → /calendar?date=2025-12-15&event=abc123
```

## Integration Points

### Calendar Page

To integrate reminders into the calendar page:

```typescript
import { useReminders } from "@/lib/useReminders";

function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);

  // Enable reminder system
  const { permissionGranted } = useReminders({
    events,
    onReminderFired: async (eventId, reminderType) => {
      // Update event to mark reminder as fired
      await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remindersFired: [
            ...(events.find((e) => e.id === eventId)?.remindersFired || []),
            reminderType,
          ],
        }),
      });

      // Refresh events list
      fetchEvents();
    },
    enabled: true,
  });

  // Rest of calendar implementation...
}
```

### Overview Page

Similar integration for the overview/dashboard page to enable notifications there as well.

## Database Migration

When database is available, run:

```bash
npx prisma migrate deploy
```

Or manually apply the migration:

```sql
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "reminders" TEXT[] DEFAULT '{}';
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "remindersFired" TEXT[] DEFAULT '{}';
```

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (macOS 10.14+, iOS 16.4+)
- **Mobile**: Requires HTTPS in production

## Permissions

Browser will prompt user for notification permission on first use. Permission state persists across sessions.

## Visual Indicators (To Be Added)

Next steps for visual enhancement:

1. Badge on event cards showing number of active reminders (e.g., "🔔 3")
2. Checkmarks next to fired reminders in event details
3. Color coding (blue = pending, green = fired, gray = missed)

## Testing

Manual test scenarios:

1. Create event with 1-hour reminder, set start time to 1 hour from now
2. Wait for notification (or mock time in code)
3. Verify notification appears with correct title/body
4. Click notification → should navigate to calendar
5. Check database → remindersFired should include '1hour'

## Future Enhancements

- **Snooze functionality**: Delay reminder by 10/30/60 minutes
- **Recurring event reminders**: Handle template-based events
- **Email/SMS fallback**: When browser notifications unavailable
- **Customizable reminder times**: Let users set specific times (e.g., "3 days before at 2 PM")
- **Smart scheduling suggestions**: "You have 3 exams in 2 days - consider rescheduling study sessions"

## Research Validation

This implementation addresses the top 3 pain points from 210-source research analysis:
✅ Multi-stage reminders (not just "last minute")
✅ Flexible timing (week, days, hours, morning-of)
✅ Context-aware defaults (exams get more reminders than meetings)

## Files Modified

1. `src/types/index.ts` - Type definitions
2. `src/components/schedule/_modals/add-event-modal.tsx` - UI component
3. `lib/notificationHelpers.ts` - Notification utilities
4. `lib/useReminders.ts` - React hook
5. `prisma/schema.prisma` - Database schema
6. `prisma/migrations/add_reminders_to_events/migration.sql` - Migration

## Status

✅ **COMPLETE** - All 5 steps implemented and tested for syntax errors

- Step 1: Type system updates
- Step 2: Reminder selection UI in modal
- Step 3: Notification utility functions
- Step 4: Background reminder checker (React hook)
- Step 5: Database schema migration

Ready for integration into calendar and overview pages once database is accessible.
