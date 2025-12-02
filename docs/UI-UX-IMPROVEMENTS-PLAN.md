# UI/UX Improvements Plan - Timetable & Event Modals

## Current Problems Identified

### 1. **Recurrence Feature Redundancy**

- The manual recurrence dropdown in Create/Edit modal is now redundant
- Smart Timetable Creator is the better way to create recurring timetable events
- Manual recurrence still needed for: assignments, deadlines, personal events
- Need to differentiate: "Timetable events" vs "Calendar events"

### 2. **Month View Issues**

- "+1 more" indicator looks unprofessional
- Takes up too much space
- Clicking it shows a basic modal
- Needs better visual design

### 3. **Delete Button Design**

- Current delete button on events is "mediocre"
- Small X button in corner isn't intuitive
- Needs hover states and better visibility
- Should be consistent across all views (month/week/day)

### 4. **Modal Context Awareness**

- Modals don't know if event was created via Smart Timetable
- Should show pattern info for smart-scheduled events
- Should prevent breaking patterns accidentally
- Need different behaviors for timetable vs calendar events

---

## Proposed Solutions

### 1. Smart Modal System

#### A. Event Type Detection

```typescript
enum EventOrigin {
  SMART_TIMETABLE = "smart_timetable", // Created via bulk wizard
  MANUAL_RECURRING = "manual_recurring", // Old recurrence system
  SINGLE_EVENT = "single_event", // One-off event
}
```

#### B. Modal Intelligence

**For Smart Timetable Events:**

- Show pattern info badge: "Part of CS101 Lecture series"
- Edit options:
  - "Edit this session only" → Changes one instance
  - "Edit all sessions" → Updates pattern in meta
  - "Remove from pattern" → Marks as exception
- Delete warning: "This will delete 45 events. Use Smart Timetable to modify patterns."

**For Manual Events:**

- Show recurrence dropdown (assignments/deadlines)
- Standard edit/delete behavior
- Link to Smart Timetable: "Create course schedule instead?"

### 2. Month View "+N More" Redesign

**Current:**

```
+1 more
```

**Proposed Option A - Compact Badge:**

```
┌─────────────────┐
│ Mon 15          │
│ CS101 9:00     │
│ MATH 2:00      │
│ [+2] ─→        │  ← Hoverable, shows preview tooltip
└─────────────────┘
```

**Proposed Option B - Stacked Preview:**

```
┌─────────────────┐
│ Mon 15          │
│ CS101 9:00     │
│ MATH 2:00      │
│ PHY... (2 more)│  ← Semi-transparent stack effect
└─────────────────┘
```

**Proposed Option C - Icon Indicator:**

```
┌─────────────────┐
│ Mon 15    [📅 4] │  ← Number badge with icon
│ CS101 9:00     │
│ MATH 2:00      │
│ ⋮              │
└─────────────────┘
```

### 3. Delete Button Redesign

**Current Issues:**

- Small X in top-right corner
- Hard to see until hover
- Not consistent across views

**Proposed Solution - Contextual Delete:**

**On Hover (All Views):**

```
┌────────────────────────────┐
│ CS101 - Lecture            │ ← Larger event card
│ 9:00 AM - 11:00 AM         │
│ [Edit] [Delete]            │ ← Action buttons appear
└────────────────────────────┘
```

**Delete Button Variants:**

- **Normal event**: Red trash icon with "Delete"
- **Smart timetable event**: Yellow warning icon with "Remove from schedule"
- **Recurring event**: Shows scope modal automatically

**Design Specs:**

```css
.event-delete-btn {
  /* Visible on hover or focus */
  opacity: 0;
  transition: all 0.2s ease;

  /* Better positioning */
  position: absolute;
  top: 4px;
  right: 4px;

  /* Larger hit area */
  min-width: 24px;
  min-height: 24px;

  /* Clear visual state */
  background: rgba(239, 68, 68, 0.9);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.event-card:hover .event-delete-btn,
.event-card:focus-within .event-delete-btn {
  opacity: 1;
}
```

### 4. Improved Show More Modal

**Current:**

- Simple list of events
- Basic edit/delete buttons
- No context awareness

**Proposed:**

```
┌───────────────────────────────────────────┐
│ Monday, November 9 • 4 Events             │
│                                           │
│ ┌───────────────────────────────────────┐ │
│ │ 🎓 CS101 - Lecture                    │ │
│ │ 9:00 AM - 11:00 AM • Room A101        │ │
│ │ 📋 Part of semester timetable         │ │ ← Badge
│ │ [View Pattern] [Edit] [Delete]        │ │
│ └───────────────────────────────────────┘ │
│                                           │
│ ┌───────────────────────────────────────┐ │
│ │ 📝 MATH Assignment Due                │ │
│ │ 11:59 PM                              │ │
│ │ [Edit] [Complete] [Delete]            │ │
│ └───────────────────────────────────────┘ │
│                                           │
│ [+ Add Another Event]                    │
└───────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Event Origin Tracking (HIGH PRIORITY)

1. ✅ Already storing `meta.schedulePattern` in bulk-create
2. Add origin field to distinguish event types
3. Update event display logic to check origin

### Phase 2: Smart Modal Awareness (HIGH PRIORITY)

1. Detect smart timetable events in AddEventModal
2. Show pattern info banner
3. Add "Edit Pattern" vs "Edit Instance" options
4. Warn on delete with event count

### Phase 3: Delete Button Redesign (MEDIUM PRIORITY)

1. Update EventStyled component
2. Larger, clearer delete button
3. Consistent across all views
4. Better hover states

### Phase 4: Month View "+N More" (MEDIUM PRIORITY)

1. Design new compact indicator
2. Tooltip preview on hover
3. Better modal styling
4. Smooth animations

### Phase 5: Recurrence Simplification (LOW PRIORITY)

1. Hide recurrence for lecture/lab types
2. Show only for assignments/deadlines
3. Add link to Smart Timetable Creator
4. Educational tooltips

---

## Quick Wins (Can implement today)

### 1. Badge for Smart Events

Add visual indicator to events created via Smart Timetable:

```tsx
{
  event.meta?.schedulePattern && (
    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
      📅 Semester Schedule
    </span>
  );
}
```

### 2. Better Delete Button

```tsx
<button
  onClick={handleDelete}
  className="absolute top-2 right-2 w-7 h-7 bg-red-500/90 hover:bg-red-600 
             rounded-lg text-white flex items-center justify-center 
             opacity-0 group-hover:opacity-100 transition-all shadow-lg"
>
  <Trash2 className="w-4 h-4" />
</button>
```

### 3. Improved "+N More" Indicator

```tsx
<div
  className="mt-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 
                rounded text-xs font-semibold text-indigo-600 
                dark:text-indigo-400 hover:bg-indigo-100 
                dark:hover:bg-indigo-900/40 cursor-pointer 
                transition-colors flex items-center gap-1"
>
  <Calendar className="w-3 h-3" />+{hiddenCount} more
</div>
```

---

## User Experience Goals

### Before:

- ❌ Manual recurrence is tedious
- ❌ Delete buttons hard to find
- ❌ "+1 more" looks unprofessional
- ❌ No awareness of smart scheduling

### After:

- ✅ Smart Timetable handles bulk creation
- ✅ Clear, accessible delete buttons
- ✅ Beautiful "+N more" indicators
- ✅ Modals understand event context
- ✅ Pattern editing preserves structure
- ✅ Visual badges show event origin

---

## Priority Ranking

1. **🔴 Critical**: Delete button redesign (affects usability)
2. **🟡 High**: Modal smart awareness (prevents pattern breaking)
3. **🟡 High**: Event origin badges (visual clarity)
4. **🟢 Medium**: "+N more" redesign (polish)
5. **🔵 Low**: Recurrence dropdown hiding (convenience)

---

## Next Steps

**Immediate Actions:**

1. Implement better delete buttons (30 min)
2. Add smart event badges (15 min)
3. Improve "+N more" styling (20 min)

**This Week:**

1. Add pattern awareness to modals (2 hours)
2. Implement "Edit Pattern" vs "Edit Instance" (1 hour)
3. Smart delete warnings (30 min)

**Future:**

1. Complete recurrence system overhaul
2. Advanced pattern editing
3. Calendar export features
