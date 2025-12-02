# UI/UX Consistency Review & Action Plan

## ✅ FIXED: ReminderPicker Issues

1. **Calendar Grid Alignment** - Fixed to start on Sunday (matching US calendar standard)
2. **Date Selection** - Now updates parent form immediately when clicking dates
3. **Create Mode** - Works properly now, date persists to Due & Reminder button
4. **Delete → Clear** - Changed to "Clear" button that resets date without closing modal

---

## 📋 Overview Page Issues

### 1. Credits Widget (60/120 Problem)

**Current Issue**: Shows 60/120 but user has 4 modules × 15 credits = 75 credits
**Root Cause**: Widget likely hardcoded or using generic calculation
**Proposed Fix**:

- Query actual module credits from database
- Display as "75 / Semester Goal" or just "75 Credits Enrolled"
- Alternative: Show "4 Modules • 75 Credits" format
  **Priority**: MEDIUM (incorrect data confuses users)

### 2. Start Focus Button Alignment

**Current Issue**: Not vertically centered with +Task and +Class buttons in hero
**Proposed Fix**: Adjust flexbox alignment or padding to match sibling buttons
**Priority**: LOW (cosmetic only)

### 3. Week Overview Widget Redesign

**Current Issue**: Not doing its job effectively, feels redundant
**Options**:
A. **Tabular Navigation** (like tasks page) - cleaner, familiar pattern
B. **Timeline View** - visual representation of week's events with time blocks
C. **Agenda Style** - scrollable list with day separators and time markers
D. **Your Research** - You explore modern calendar widget designs
**Recommendation**: Let's go with Option C (Agenda) or D (Your Research) to avoid redundancy
**Priority**: MEDIUM (affects core overview UX)

### 4. Navbar Icon Inconsistency

**Current Issue**: Notification icon much larger than Settings/Sign Out icons
**Proposed Fix**: Standardize all icons to same size (probably 20px or 22px)
**Priority**: LOW (cosmetic but noticeable)

---

## 📅 Timetable Page Issues

### 1. Navbar Consistency Decision

**Big Question**: Should ALL pages have navbars or NONE?
**Current State**:

- Tasks, Modules, Attendance → NO navbar (clean, minimal)
- Timetable, Grades → HAS navbar (feels awkward)
- Overview → Unique hero section

**Proposed Strategy**:

- **Option A**: Remove navbars from Timetable/Grades → consistent minimalism
- **Option B**: Add subtle top bar to ALL pages → consistent navigation
- **Option C**: Keep as-is but improve navbar design where present

**My Recommendation**: **Option A** - The navbar in Timetable doesn't add much value. Smart Schedule Creator can be:

- Floating action button (FAB) in bottom-right
- Quick action in a top-right menu (three dots)
- Keyboard shortcut (Ctrl+K command palette)

**Priority**: HIGH (affects navigation consistency across app)

### 2. Default Event Color

**Current Issue**: Events created from other pages have awkward default color
**Root Cause**: Missing color metadata when creating from non-timetable pages
**Proposed Fix**:

- Set intelligent default: Use course color if linked, else neutral slate-600
- Or: Always show color picker in event creation modal
- Or: Auto-assign colors from palette (purple, blue, green, orange rotation)
  **Priority**: LOW (doesn't break functionality)

### 3. Optional Time vs. Timetable Display

**MAJOR ISSUE**: Timetable requires start_time + end_time to display events
**Current Conflict**: Tasks allow "optional time" but timetable can't show them
**Proposed Solutions**:
A. **All-day events** - Display at top of day with special styling (no time slot)
B. **Default time** - Auto-assign 9am-10am slot for tasks without times
C. **Separate views** - Timetable shows only scheduled events, Tasks page shows all
D. **Hybrid display** - Show timeless tasks in a "Unscheduled" section at top of day

**My Recommendation**: **Option A + C** - Timetable shows scheduled events + all-day band at top. Tasks page is source of truth for all tasks regardless of time.

**Priority**: CRITICAL (architectural decision affecting multiple pages)

---

## 📊 Grades Page

**Issue**: Navbar consistency (same as Timetable)
**Fix**: Apply same navbar solution as Timetable page
**Logic Issues**: Noted for future (not now)
**Priority**: HIGH (tied to navbar decision)

---

## 📚 Modules Page

**Issue**: Navbar consistency only
**Fix**: Apply same navbar solution
**Priority**: HIGH (tied to navbar decision)

---

## ✅ Attendance Page

**Issue**: Navbar consistency only
**Fix**: Apply same navbar solution  
**Priority**: HIGH (tied to navbar decision)

---

## 🗂️ History/Archive Page

**Current State**: Not fully checked
**Expected Behavior**: Archive for completed/old tasks with ability to:

- Uncheck/uncomplete tasks (restore them)
- Unarchive tasks (return to active)
- View past semester work (useful for graduation portfolio)

**Proposed Features**:

- Search/filter by semester, course, date range
- Bulk actions (archive all, delete all from semester)
- Export to PDF/CSV for records

**Navbar**: Same consistency issue
**Priority**: MEDIUM (useful but not critical path)

---

## ⚙️ Settings Page

**Current State**: Correct - no navbar needed
**Needed Improvements**:

- Consistent layout with good visual hierarchy
- Sections: Account, Appearance, Notifications, Academic, Data & Privacy
- Feature suggestions:
  - Theme customization (colors, fonts)
  - Semester start/end dates
  - Grade calculation preferences
  - Default event durations
  - Export/import data
    **Priority**: MEDIUM (improves customization)

---

## 🎯 Focus Page

### 1. No Navbar Needed

**Status**: Agreed - immersive focus mode shouldn't have navigation distractions
**Alternative**: Escape key or back button to exit

### 2. Task Integration

**MUST HAVE**: Fetch actual tasks from tasks page
**Implementation**:

- Dropdown to select task from today/upcoming
- Quick search to find any task
- Link session to task_id in database (already in schema!)
- Show task context during focus (course, due date)
  **Priority**: HIGH (makes focus sessions meaningful)

### 3. Customizable Pomodoro Duration

**Question**: Does customization violate Pomodoro principles?
**Answer**: Slightly, but practical adaptation is okay
**Proposed Limits**:

- Focus: 25min (default), 30min, 45min, 60min (max)
- Break: 5min (default), 10min, 15min (max)
- Long break: 15min, 20min, 30min
  **Rationale**: Different work types need flexibility, but caps prevent abuse
  **Settings Location**: In Focus page itself + Settings page
  **Priority**: MEDIUM (nice-to-have improvement)

---

## 🎯 Priority Action Plan

### Phase 1: Critical Fixes (DO NOW)

1. ✅ Fix ReminderPicker calendar/date issues (DONE)
2. **Decide navbar strategy** - Remove from Timetable/Grades/History/Modules?
3. **Resolve timetable time conflict** - How to handle tasks without times?

### Phase 2: High Priority (THIS WEEK)

4. Fix credits widget to show real data (75 not 60)
5. Implement task selection in Focus page
6. Standardize navbar icons sizing

### Phase 3: Medium Priority (NEXT WEEK)

7. Redesign Week Overview widget (research OR implement agenda view)
8. Add customizable Pomodoro durations
9. Improve History/Archive page functionality

### Phase 4: Low Priority (POLISH)

10. Fix Start Focus button alignment
11. Set intelligent default colors for events
12. Enhance Settings page with more options

---

## 🤝 Your Input Needed

**Decision 1**: Navbar strategy - Remove from all secondary pages (Timetable, Grades, History) for consistency with Tasks/Modules/Attendance?

**Decision 2**: Week Overview widget - Should I research modern designs or go with Agenda-style list?

**Decision 3**: Timetable timeless tasks - All-day band at top? Or hidden from timetable entirely?

**Decision 4**: Should I implement these fixes incrementally or batch them by page?

Let me know your preferences and I'll proceed accordingly!
