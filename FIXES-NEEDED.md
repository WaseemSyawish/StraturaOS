# UI/UX Fixes Implementation Guide

## Issues to Fix

### 1. ✅ Vercel Build Status

**Status:** No action needed - Vercel uses environment variables from dashboard, not local `.env`

### 2. 🔧 Modules Page - Semester Config Auth Issue

**Problem:** "Not authenticated" message when fetching semester settings
**Root Cause:** SQLite database is empty (no user session data since we switched from Postgres)
**Solution:**

- Either wait for Railway Postgres to come back online, OR
- Manually create a test user in SQLite database, OR
- Modify `/api/semester-settings` to be more lenient in dev mode

**Files to check:**

- `pages/api/semester-settings.js` - Add dev mode bypass
- `src/components/SemesterSettings.jsx` - Better error handling

### 3. 🔧 Semester Config UI - Smart Display

**Problem:** Config boxes should appear/disappear based on active semester
**Solution:** Add conditional rendering in `pages/modules.js`

**Implementation:**

```javascript
// In modules.js, around line 540
{
  currentSemester && (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/60 dark:border-slate-800 p-6 mb-6">
      <h3 className="text-lg font-semibold mb-2">
        Active Semester: {currentSemester.name}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {new Date(currentSemester.start_date).toLocaleDateString()} -{" "}
        {new Date(currentSemester.end_date).toLocaleDateString()}
      </p>
    </div>
  );
}
```

### 4. 🎨 Add Module Modal - Light Mode Theme

**Problem:** Modal only has dark mode styling
**Location:** Need to find the add module modal component

**Solution Pattern:**

```jsx
// Add light mode classes alongside dark mode
className = "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100";
```

**Files to modify:**

- Search for the add course/module modal in `pages/modules.js`
- Add light mode variants to all `className` attributes

### 5. 🔧 Calendar/Timetable Modal Improvements

#### A. Description Form - Reduce Space

**File:** `src/components/schedule/_modals/add-event-modal.tsx`
**Current:** Description textarea takes too much space
**Solution:**

- Reduce rows from 4 to 2
- Make it collapsible/expandable

#### B. Location Field Issue

**Problem:** Location is in description, not separate location field
**Solution:** Add dedicated location field in the form

**Implementation:**

```tsx
// Around line 300-400 in add-event-modal.tsx
<div className="space-y-2">
  <Label htmlFor="location">Location (Optional)</Label>
  <input
    id="location"
    type="text"
    placeholder="e.g., Room 301, Building A"
    className="w-full px-3 py-2 border rounded-lg"
    {...register("location")}
  />
</div>
```

#### C. Color Scheme Choices

**Current:** Limited colors (6 options in COLORS array)
**Problem:** Not matching modules page colors
**Solution:** Expand COLORS array to match `colorOptions` from modules.js

**Implementation:**

```tsx
const COLORS = [
  {
    key: "blue",
    name: "Blue",
    variant: "primary",
    class: "bg-blue-500",
    hex: "#3B82F6",
  },
  {
    key: "red",
    name: "Red",
    variant: "danger",
    class: "bg-red-500",
    hex: "#EF4444",
  },
  {
    key: "green",
    name: "Green",
    variant: "success",
    class: "bg-green-500",
    hex: "#10B981",
  },
  {
    key: "orange",
    name: "Orange",
    variant: "warning",
    class: "bg-orange-500",
    hex: "#F59E0B",
  },
  {
    key: "purple",
    name: "Purple",
    variant: "primary",
    class: "bg-purple-500",
    hex: "#8B5CF6",
  },
  {
    key: "pink",
    name: "Pink",
    variant: "danger",
    class: "bg-pink-500",
    hex: "#EC4899",
  },
  {
    key: "cyan",
    name: "Cyan",
    variant: "info",
    class: "bg-cyan-500",
    hex: "#06B6D4",
  },
  {
    key: "lime",
    name: "Lime",
    variant: "success",
    class: "bg-lime-500",
    hex: "#84CC16",
  },
  {
    key: "amber",
    name: "Amber",
    variant: "warning",
    class: "bg-amber-500",
    hex: "#F97316",
  },
  {
    key: "indigo",
    name: "Indigo",
    variant: "primary",
    class: "bg-indigo-500",
    hex: "#6366F1",
  },
  {
    key: "teal",
    name: "Teal",
    variant: "success",
    class: "bg-teal-500",
    hex: "#14B8A6",
  },
  {
    key: "rose",
    name: "Rose",
    variant: "danger",
    class: "bg-rose-500",
    hex: "#F472B6",
  },
];
```

#### D. Event Types Dropdown - Better Options

**Current:** `EVENT_TYPES` array (lines 26-90) has class/lecture/lab focus
**Problem:** Missing quiz, project, general personal events
**Current types:** class, lecture, lab, tutorial, exam, assignment, deadline, meeting, office-hours, study-session, personal, other

**Assessment:** Actually pretty good! Already has:

- ✅ assignment
- ✅ deadline
- ✅ personal
- ✅ exam

**Just need to add:**

- quiz
- project

**Implementation:**

```tsx
// Add after exam type (around line 65)
{ value: "quiz", label: "Quiz", icon: (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)},
{ value: "project", label: "Project", icon: (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)},
```

### 6. 🎨 Hide Scrollbars on Calendar Page

**File:** `pages/calendar.js`
**Location:** Main container around line 304

**Solution - Add custom scrollbar styles:**

```jsx
// At top of calendar.js, add this style object
const customScrollbarStyles = {
  /* Hide scrollbar for Chrome, Safari and Opera */
  '::-webkit-scrollbar': {
    display: 'none'
  },
  /* Hide scrollbar for IE, Edge and Firefox */
  msOverflowStyle: 'none',  /* IE and Edge */
  scrollbarWidth: 'none'  /* Firefox */
};

// Then apply to the scrollable container:
<div className="p-6 flex-1 flex flex-col min-h-0 overflow-auto" style={customScrollbarStyles}>
```

**OR add to global CSS (`styles/globals.css` or tailwind):**

```css
/* Hide scrollbar in calendar */
.calendar-container {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.calendar-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}
```

Then add className:

```jsx
<div className="calendar-container p-6 flex-1 flex flex-col min-h-0 overflow-auto">
```

## Priority Order

1. **HIGH:** Add light mode to add module modal
2. **HIGH:** Rework event modal (location field, better description layout)
3. **MEDIUM:** Expand color palette in event modal
4. **MEDIUM:** Add quiz/project event types
5. **LOW:** Hide scrollbars (aesthetic)
6. **LOW:** Smart semester config display (needs functional Postgres)

## Next Steps

When you're ready, I can:

1. Implement these fixes one by one
2. Focus on specific high-priority items first
3. Wait until Railway Postgres is back to test auth-dependent features

Which would you like me to start with?
