# Smart Timetable Creation System - Design Proposal

## 🎯 Problem Statement

**Current State (Pain Points)**:

- Users must manually create recurring events for EACH lecture
- Lectures happen 2-3x per week at different times → Requires multiple separate recurring series
- Process is tedious: Create event → Set day/time → Configure recurrence → Repeat for next day
- No integration with user's enrolled modules/courses
- High friction leads to incomplete timetables

**Example Tedious Workflow**:

```
Computer Science 101:
1. Create "CS101 Lecture" for Monday 9:00-11:00, repeat weekly until Dec 15
2. Create "CS101 Lecture" for Wednesday 14:00-16:00, repeat weekly until Dec 15
3. Create "CS101 Lab" for Friday 10:00-12:00, repeat weekly until Dec 15
❌ 3 separate recurring series for ONE course!
```

## 💡 Proposed Solution: Module-Aware Smart Timetable Builder

### Core Concept

A **guided wizard** that lets users define their entire semester schedule in one streamlined flow:

1. Select modules (from enrolled courses)
2. Define schedule patterns (days + times) for each module
3. Bulk-create all recurring events with one click

### User Experience Flow

```
┌─────────────────────────────────────────────────────┐
│ 📚 Step 1: Select Your Modules                     │
│ ✓ CS101 - Computer Science                         │
│ ✓ MATH201 - Calculus II                            │
│ ✓ ENG102 - English Composition                     │
│   PHYS101 - Physics                                 │
│                           [Next: Schedule Times →]  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🕐 Step 2: Define Schedule for CS101               │
│ ─────────────────────────────────────────────────── │
│ Lecture Sessions:                                   │
│ • Monday    09:00 - 11:00   Room: A101            │
│ • Wednesday 14:00 - 16:00   Room: A101            │
│                                                     │
│ Lab Sessions:                                       │
│ • Friday    10:00 - 12:00   Room: Lab 3           │
│                                                     │
│ [+ Add Another Session]  [Next: MATH201 →]        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📅 Step 3: Review & Generate                       │
│ ─────────────────────────────────────────────────── │
│ Total: 3 modules, 8 weekly sessions                │
│ Semester: 2025-1 (Jan 15 - May 30)                │
│                                                     │
│ This will create 120 timetable events              │
│ [Cancel]              [Create Timetable ✨]        │
└─────────────────────────────────────────────────────┘
```

## 🏗️ Technical Architecture

### 1. Data Model Extension

**New Table: `ModuleSchedulePattern`** (optional, for saving templates)

```prisma
model ModuleSchedulePattern {
  id          String   @id @default(uuid())
  user_id     String
  course_id   String
  day_of_week Int      // 0=Sunday, 6=Saturday
  start_time  String   // "09:00"
  end_time    String   // "11:00"
  location    String?
  session_type String? // "lecture", "lab", "tutorial"
  created_at  DateTime @default(now())

  users   User   @relation(...)
  courses Course @relation(...)

  @@map("module_schedule_patterns")
}
```

**OR** Use existing `Event` model with `meta` field:

```javascript
// Store pattern info in meta.schedulePattern for future editing
meta: {
  schedulePattern: {
    moduleId: "course-uuid",
    sessionType: "lecture",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "11:00"
  }
}
```

### 2. New API Endpoints

**`POST /api/timetable/bulk-create`**

```javascript
{
  "semester": "2025-1",
  "startDate": "2025-01-15",
  "endDate": "2025-05-30",
  "patterns": [
    {
      "courseId": "uuid-cs101",
      "sessionType": "lecture",
      "dayOfWeek": 1, // Monday
      "startTime": "09:00",
      "endTime": "11:00",
      "location": "Room A101"
    },
    {
      "courseId": "uuid-cs101",
      "sessionType": "lecture",
      "dayOfWeek": 3, // Wednesday
      "startTime": "14:00",
      "endTime": "16:00",
      "location": "Room A101"
    }
  ]
}

Response:
{
  "success": true,
  "eventsCreated": 30,
  "summary": {
    "CS101": 10,
    "MATH201": 12,
    "ENG102": 8
  }
}
```

**Backend Logic**:

```javascript
// Generate all occurrences for semester
for (const pattern of patterns) {
  const course = await prisma.course.findUnique({
    where: { id: pattern.courseId },
  });

  // Calculate all dates matching pattern.dayOfWeek between startDate and endDate
  const occurrences = calculateOccurrences(
    startDate,
    endDate,
    pattern.dayOfWeek,
    holidays // Skip holidays automatically
  );

  // Bulk insert events
  const events = occurrences.map((date) => ({
    title: `${course.name} ${pattern.sessionType}`,
    type: "class",
    course_id: pattern.courseId,
    date: date,
    time: `${pattern.startTime}-${pattern.endTime}`,
    description: pattern.location,
    color: course.color,
    user_id: userId,
    meta: {
      schedulePattern: pattern,
      durationMinutes: calculateDuration(pattern.startTime, pattern.endTime),
    },
  }));

  await prisma.event.createMany({ data: events });
}
```

### 3. Frontend Components

**New Components Needed**:

```
pages/
  timetable-setup.js        (NEW - Wizard page)

src/components/Timetable/
  SmartScheduleWizard.jsx   (NEW - Main wizard container)
  ModuleSelector.jsx        (NEW - Step 1: Select modules)
  ScheduleBuilder.jsx       (NEW - Step 2: Define times per module)
  ScheduleReview.jsx        (NEW - Step 3: Review & confirm)
  SessionPatternRow.jsx     (NEW - Single day/time row component)
```

**`SmartScheduleWizard.jsx` Structure**:

```jsx
const [step, setStep] = useState(1); // 1=modules, 2=schedule, 3=review
const [selectedModules, setSelectedModules] = useState([]);
const [schedulePatterns, setSchedulePatterns] = useState({});
const [semester, setSemester] = useState('2025-1');

// Step 1: Module Selection
<ModuleSelector
  courses={userCourses}
  selected={selectedModules}
  onChange={setSelectedModules}
  semester={semester}
  onSemesterChange={setSemester}
/>

// Step 2: Schedule Builder (one page per module)
<ScheduleBuilder
  module={currentModule}
  patterns={schedulePatterns[currentModule.id] || []}
  onChange={(patterns) => {
    setSchedulePatterns({
      ...schedulePatterns,
      [currentModule.id]: patterns
    });
  }}
  onNext={() => moveToNextModule()}
/>

// Step 3: Review
<ScheduleReview
  patterns={schedulePatterns}
  semester={semester}
  onConfirm={handleBulkCreate}
/>
```

### 4. Smart Features

**Automatic Semester Detection**:

```javascript
// Detect semester dates from course.semester field
// Fallback to academic calendar defaults
const semesterDates = {
  "2025-1": { start: "2025-01-15", end: "2025-05-30" },
  "2025-2": { start: "2025-09-01", end: "2025-12-20" },
};
```

**Holiday Integration**:

```javascript
// Automatically skip holidays when generating occurrences
const holidays = await fetch("/api/holidays?year=2025");
const occurrences = calculateOccurrences(start, end, dayOfWeek).filter(
  (date) => !isHoliday(date, holidays)
);
```

**Conflict Detection** (Future Enhancement):

```javascript
// Warn user if sessions overlap
if (hasTimeConflict(newPattern, existingPatterns)) {
  showWarning("⚠️ This conflicts with MATH201 lecture");
}
```

**Templates** (Future Enhancement):

```javascript
// Save common patterns
{
  "CS Lecture Pattern": [
    { day: 1, time: "09:00-11:00" },
    { day: 3, time: "09:00-11:00" }
  ]
}
```

## 🎨 UI/UX Design

### Entry Point Options

**Option A**: New button in timetable page header

```jsx
<button className="btn-primary">✨ Smart Schedule Creator</button>
```

**Option B**: Onboarding for new users

```
Welcome! Let's set up your timetable.
[Start with Smart Creator] or [Add Events Manually]
```

### Session Pattern Input

**Visual Day Selector + Time Picker**:

```
┌────────────────────────────────────────────────┐
│ Session 1:  [Lecture ▼]                       │
│ ┌───┬───┬───┬───┬───┬───┬───┐                │
│ │ S │ M │ T │ W │ T │ F │ S │                │
│ └───┴─●─┴───┴───┴───┴───┴───┘                │
│                                                │
│ Time: [09:00] to [11:00]   Room: [A101]      │
│                                    [× Remove] │
└────────────────────────────────────────────────┘
```

### Progress Indicator

```
┌─────────────────────────────────────────────┐
│ ● Select Modules → ○ Define Times → ○ Review │
└─────────────────────────────────────────────┘
```

## 📊 MVP Implementation Plan

### Phase 1: Core Wizard (Week 1)

- ✅ Module selection UI with course list
- ✅ Basic schedule builder (day + time inputs)
- ✅ Bulk event creation API
- ✅ Simple review screen

### Phase 2: Enhanced UX (Week 2)

- ✅ Visual day selector (button grid)
- ✅ Session type dropdown (Lecture/Lab/Tutorial)
- ✅ Semester date auto-detection
- ✅ Holiday integration

### Phase 3: Polish (Week 3)

- ✅ Conflict detection warnings
- ✅ Edit existing timetable patterns
- ✅ Export/import schedule templates
- ✅ Mobile-responsive design

## 🔧 Integration Points

### Existing Systems to Connect

1. **Modules API** (`/api/courses`) - Fetch user's enrolled courses
2. **Events API** (`/api/events`) - Bulk insert generated events
3. **Holidays API** (`/api/holidays`) - Skip non-teaching days
4. **Timetable Page** - Link to new wizard

### Backwards Compatibility

- Manual event creation still works
- Existing recurring events unaffected
- Generated events look identical to manual ones
- Can edit/delete individual sessions later

## 🚀 Benefits Summary

**For Users**:

- ⚡ **10x faster** timetable setup (3 minutes vs 30+ minutes)
- 🎯 **Zero repetition** - define each lecture once
- 📚 **Module-aware** - automatically uses course info (color, name)
- 🗓️ **Semester-intelligent** - respects academic calendar
- ✨ **Professional** - complete timetable in one session

**For System**:

- 🏗️ **Better data structure** - patterns stored for future editing
- 🔄 **Reusable** - semester-to-semester template copying (future)
- 📈 **Scalable** - bulk operations more efficient than N individual creates
- 🧩 **Extensible** - foundation for advanced features (conflict detection, optimization)

## ❓ Open Questions

1. **Edit Patterns**: Should users be able to edit the "pattern" later to update all future sessions?
2. **Exceptions**: How to handle one-off cancellations (e.g., Professor sick on one Monday)?
3. **Multi-Semester**: Support creating next semester's timetable in advance?
4. **Sharing**: Allow users to share schedule templates with classmates?
5. **Import**: Parse schedule from university's official timetable PDF/webpage?

## 📝 Implementation Notes

- Use existing `Event` model, add `meta.schedulePattern` for tracking
- No database schema changes required initially
- Wizard can be separate page (`/timetable/setup`) or modal
- Backend generates events synchronously (fast for ~100-200 events)
- For huge schedules (500+ events), consider async job + progress indicator

---

**Next Steps**:

1. Get user feedback on wizard flow mockup
2. Decide on wizard entry point (new page vs modal)
3. Implement Phase 1 MVP (basic wizard + bulk API)
4. Beta test with real users
5. Iterate based on usage patterns
