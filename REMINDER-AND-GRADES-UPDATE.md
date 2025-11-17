# Reminder System & Grades Page Update

## Changes Made

### 1. **Any.do-Style Reminder Picker** ✅

The reminder picker has been redesigned to match the any.do interface:

#### Features:

- **Quick Presets**: Fast access buttons

  - "Later today" - Sets reminder for 6 PM today
  - "Tomorrow" - Sets reminder for 9 AM tomorrow
  - "Next week" - Sets reminder for 9 AM next week (7 days)
  - "Someday" - Sets reminder for 9 AM in 30 days

- **Custom Date & Time Picker**:

  - Click "Pick date & time" to reveal date/time inputs
  - Date picker (HTML5 date input)
  - Time picker (HTML5 time input)
  - Formats as readable string: "Nov 17, 2:30 PM"

- **Selected Reminders List**:
  - Shows all added reminders
  - Delete button (×) for each reminder
  - Clean, organized display

#### Location:

- File: `src/components/schedule/_modals/add-event-modal.tsx`
- Lines: 1525-1660 (approximately)

---

### 2. **Enhanced Notification Helper** ✅

Updated `lib/notificationHelpers.ts` to handle new reminder formats:

#### New Reminder Types:

```typescript
"Later today"    → 6 PM today
"Tomorrow"       → 9 AM tomorrow
"Next week"      → 9 AM next week
"Someday"        → 9 AM in 30 days
"Test in 30 seconds" → 30 seconds before event
Custom datetime  → Parsed directly (e.g., "Nov 17, 2025, 2:30 PM")
```

#### Calculation Logic:

- Quick presets set absolute times, not relative to event
- "Test in 30 seconds" remains for testing (subtracts 30s from event time)
- Custom datetime strings are parsed directly using `new Date()`
- Falls back to old REMINDER_OPTIONS for legacy support

---

### 3. **Debug Logging Added** 🔍

Comprehensive console logging to diagnose notification issues:

#### In `lib/useReminders.ts`:

- Logs check start time and event count
- Shows permission status
- Lists events being checked
- Reports missing `startDate` or `reminders` fields
- Shows when reminders fire
- Displays already-fired reminders

#### In `lib/notificationHelpers.ts`:

- Logs `shouldFireReminder` calculations
- Shows reminder time vs current time
- Displays 5-minute firing window
- Reports calculation results

#### How to Use:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Create event with reminder
4. Watch for `[useReminders]` and `[shouldFireReminder]` logs
5. Check if permission granted, events found, calculations correct

---

### 4. **Grades Page Redesign** 🎨

Complete UI/UX overhaul to embrace calculator aesthetic:

#### Main Calculator Dashboard:

- **Dark Calculator Display**: Slate-900 background mimicking calculator screen
- **Digital Numbers**: Monospace fonts with colored displays
  - GPA: Emerald green (3.85)
  - Credits: Blue (45)
  - Avg Grade: Amber (A-)
- **Calculator-Style Buttons**: Three action buttons with active:scale-95 effect
  - "Grade Predictor" - Opens calculator modal
  - "Add Course" - Links to modules page
  - "Export Data" - Export functionality

#### Quick Stats Row:

- Three small cards below main display
- Shows: Active Courses, Categories Tracked, Total Assessments
- Icon + number layout
- Clean and minimal

#### Course Cards:

- **Purple Gradient Header**: Professional and eye-catching
- **Digital Grade Display**:
  - Black calculator-style display on right
  - Shows grade (A, B+, etc.) and percentage
  - Monospace font with colored text
- **Weight Allocation Section**:
  - Shows current weight vs 100%
  - Color-coded progress bar:
    - Green: Exactly 100%
    - Amber: Under 100%
    - Red: Over 100%
  - Helper text shows available weight or overflow

#### Category Display:

- **Gradient Headers**: Slate-50 to Slate-100
- **Icon Badges**: White rounded boxes with category icons
- **Weight Badges**: Purple pills with percentage
- **Calculator-Style Action Buttons**:
  - Purple "Add" button
  - Hover and active states
  - Clean iconography

#### Assessment Items:

- **Digital Score Display**: Each item shows percentage in calculator-style box
- **Color-Coded Grades**:
  - Green: 90%+
  - Blue: 80-89%
  - Amber: 70-79%
  - Red: Below 70%
- **Monospace Points**: "85 / 100 pts" format

#### Empty States:

- Calculator icon with dashed border
- "No assessments yet" messaging
- Clear call-to-action

---

## Testing Instructions

### Test Reminders:

1. Create a new event on Schedule page
2. Add a reminder using any preset or custom time
3. Open DevTools Console (F12)
4. Wait for reminder time
5. Check console for:
   ```
   [useReminders] Checking reminders at: ...
   [shouldFireReminder] Checking reminder: ...
   [useReminders] FIRING reminder for "..."
   ```
6. Verify browser notification appears

### Test Grades Calculator UI:

1. Go to `/grades` page
2. Verify:
   - Dark calculator display at top with monospace numbers
   - Three calculator-style action buttons
   - Course cards have purple gradient headers
   - Digital grade displays on right side
   - Weight progress bars are color-coded
   - Categories have gradient headers
   - Assessment items show calculator-style percentage boxes
   - Empty states show calculator icons

---

## Debugging Checklist

If reminders don't fire:

1. ✅ **Browser Permission**: Check notification permission granted

   ```javascript
   Notification.permission; // Should be "granted"
   ```

2. ✅ **Event Data**: Check event has correct fields

   ```javascript
   console.log(event);
   // Should have: startDate, reminders: ["Later today"]
   ```

3. ✅ **Time Calculation**: Verify reminder time calculated correctly

   ```
   [shouldFireReminder] Checking reminder: {
     reminderTime: "...",  // Should be in the past for firing
     now: "...",           // Current time
     nowPastReminderTime: true
   }
   ```

4. ✅ **5-Minute Window**: Reminder must be within last 5 minutes

   - If you wait > 5 minutes, it won't fire
   - Set new reminder to test again

5. ✅ **Check Interval**: useReminders runs every 60 seconds
   - May take up to 1 minute to fire after reminder time

---

## Files Modified

### Reminders:

- `src/components/schedule/_modals/add-event-modal.tsx` - New any.do picker UI
- `lib/notificationHelpers.ts` - Handle new reminder formats + debug logging
- `lib/useReminders.ts` - Debug logging for notification checks

### Grades:

- `pages/grades.js` - Complete UI redesign with calculator aesthetic

---

## Next Steps

1. **Test notifications** - Create event, wait for reminder, check console
2. **Check browser permission** - Ensure notifications allowed
3. **Verify event structure** - Ensure `startDate` and `reminders` fields present
4. **Monitor console logs** - Look for errors or calculation issues
5. **Test grades UI** - Verify calculator displays correctly in light/dark mode

---

## Known Issues

### Reminder System:

- 5-minute window means reminders > 5 minutes old won't fire
- 60-second check interval means up to 1 minute delay
- Requires `startDate` field (not just `date`)
- Test reminders work differently (relative to event time, not absolute)

### Grades Page:

- Export functionality not yet implemented
- Calculator modal button present but uses existing modal
- Dark mode colors may need adjustment based on user feedback

---

## User Feedback Addressed

✅ "waited for 5 mins. did not work" → Added extensive debug logging to diagnose issue  
✅ "issue with having presets only" → Added custom date/time picker alongside presets  
✅ Showed any.do screenshot → Matched exact UI pattern with presets + custom option  
✅ "shift its UI and UX too not only name for the grades page" → Complete calculator-style redesign
