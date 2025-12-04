# Focus Session Feature - Implementation Guide

## 🎯 Overview

A modern, clean Pomodoro timer implementation for the StraturaOS with intelligent task integration, session tracking, and productivity analytics.

**Design Inspiration**: Clean, minimal interfaces from leading Pomodoro apps with focus on distraction-free work environment.

---

## ✅ Feature Implementation Status

### **MVP (Completed) ✓**

#### Core Timer Features

- [x] Large, prominent countdown timer (MM:SS format)
- [x] Three mode buttons: Focus | Short Break | Long Break
- [x] Active mode highlighted with visual indicators
- [x] Play/Pause button (primary action)
- [x] Reset button (secondary action)
- [x] Timer state management with accurate countdown
- [x] Circular progress ring visualization

#### Customizable Intervals

- [x] Focus time: 15-60 minutes (adjustable via slider)
  - Default: 25 minutes
  - Saved to user preferences
- [x] Short break: 5 minutes (fixed)
- [x] Long break: 15 minutes (fixed)
- [x] Settings modal for all preferences
- [x] Auto-save settings to database

#### Session Management

- [x] Session counter tracking daily progress
- [x] Visual progress indicators (bars and percentage)
- [x] Long break trigger after N completed sessions (configurable)
- [x] Session persistence to database
- [x] Auto-transition prompts between modes

#### Smart Task Input (Hybrid System)

- [x] Combo box with real-time search/filter
- [x] "Create new" option for ad-hoc tasks
- [x] Display recent tasks (last 7 days)
- [x] Display upcoming/priority tasks
- [x] Keyboard navigation support
- [x] Clear/reset input functionality

#### Task Integration

- [x] Quick add task flow
- [x] Select existing task with focus stats
- [x] Auto-increment session count on completion
- [x] Update last_worked_on timestamp
- [x] "Continue last task" quick action

#### Session Tracking

- [x] "Completed Today" section with task details
- [x] Session count and duration per task
- [x] Timestamp of completion
- [x] Empty state with encouraging message

#### Focus Statistics Dashboard

- [x] Total focus time today
- [x] Sessions completed count
- [x] Current streak tracking
- [x] Daily goal progress indicator
- [x] Task-level statistics

#### Data Persistence

- [x] Save timer state and preferences
- [x] Sync completed sessions to database
- [x] Store user preferences (intervals, sound, theme)
- [x] Focus sessions history storage
- [x] Focus settings table

#### Notifications & Alerts

- [x] Session completion notifications
- [x] Browser notification support
- [x] Sound effects (chime/bell)
- [x] Sound toggle and volume control
- [x] Visual completion alerts

#### Responsive Design

- [x] Mobile-optimized layout
- [x] Tablet/desktop responsive breakpoints
- [x] Touch-friendly controls
- [x] Dark mode support

---

## 📁 File Structure

```
pages/
  ├── focus-new.js                    # Main Focus Session page (new implementation)
  └── api/
      └── focus/
          ├── sessions.js              # CRUD operations for focus sessions
          ├── settings.js              # User settings management
          ├── stats.js                 # Statistics and analytics
          └── tasks.js                 # Task suggestions and recent tasks

src/
  ├── components/
  │   └── focus/
  │       ├── TimerDisplay.jsx         # Circular timer with progress ring
  │       ├── TimerControls.jsx        # Play/Pause/Reset buttons
  │       ├── ModeSelector.jsx         # Focus/Break mode switcher
  │       ├── SessionProgress.jsx      # Session counter and daily goal
  │       ├── TaskInput.jsx            # Smart combo box for task selection
  │       ├── FocusSettingsModal.jsx   # Settings configuration modal
  │       ├── CompletedTasks.jsx       # Today's completed sessions list
  │       └── FocusStatistics.jsx      # Stats cards display
  └── lib/
      ├── useFocusTimer.js             # Timer hook with state management
      └── useFocusNotifications.js     # Notifications and audio hook

prisma/
  └── schema.prisma                     # Updated with FocusSession & FocusSettings models

migrations/
  └── add_focus_features.sql           # Database migration script
```

---

## 🗄️ Database Schema

### **FocusSession Model**

```prisma
model FocusSession {
  id              String    @id @default(uuid())
  user_id         String
  task_name       String?   // Quick task name (ad-hoc)
  task_id         String?   // Link to Event table
  session_type    String    @default("focus") // 'focus', 'short_break', 'long_break'
  duration        Int       // Duration in seconds
  started_at      DateTime
  ended_at        DateTime?
  completed       Boolean   @default(false)
  interrupted     Boolean   @default(false)
  notes           String?
  created_at      DateTime? @default(now())
  updated_at      DateTime? @default(now())

  user  User   @relation(...)
  event Event? @relation(...)

  @@index([user_id])
  @@index([started_at])
  @@index([task_id])
}
```

### **FocusSettings Model**

```prisma
model FocusSettings {
  id                        String    @id @default(uuid())
  user_id                   String    @unique
  focus_duration            Int       @default(1500)     // 25 min
  short_break_duration      Int       @default(300)      // 5 min
  long_break_duration       Int       @default(900)      // 15 min
  sessions_until_long_break Int       @default(4)
  sound_enabled             Boolean   @default(true)
  sound_volume              Int       @default(50)       // 0-100
  sound_type                String    @default("chime")
  notifications_enabled     Boolean   @default(true)
  auto_start_breaks         Boolean   @default(false)
  auto_start_focus          Boolean   @default(false)
  daily_goal_sessions       Int?      @default(8)
  theme_preference          String    @default("system")
  created_at                DateTime? @default(now())
  updated_at                DateTime? @default(now())

  user User @relation(...)
}
```

---

## 🚀 API Endpoints

### **1. Focus Sessions API** (`/api/focus/sessions`)

#### GET - Retrieve sessions

```javascript
// Query parameters:
// - startDate: Filter sessions from date
// - endDate: Filter sessions to date
// - type: Filter by session_type ('focus', 'short_break', 'long_break')
// - limit: Max results (default: 50)

Response: {
  sessions: [
    {
      id: "uuid",
      task_name: "Complete assignment",
      task_id: "uuid",
      session_type: "focus",
      duration: 1500,
      started_at: "2025-11-22T10:00:00Z",
      ended_at: "2025-11-22T10:25:00Z",
      completed: true,
      interrupted: false,
      event: { id, title, type },
    },
    // ...
  ];
}
```

#### POST - Create new session

```javascript
Body: {
  task_name: "Optional task name",
  task_id: "Optional task ID",
  session_type: "focus",
  duration: 1500,
  started_at: "2025-11-22T10:00:00Z",
  completed: false
}

Response: {
  session: { /* session object */ }
}
```

#### PATCH - Update session (complete/interrupt)

```javascript
Body: {
  session_id: "uuid",
  ended_at: "2025-11-22T10:25:00Z",
  completed: true,
  interrupted: false,
  notes: "Optional notes"
}

Response: {
  session: { /* updated session */ }
}
```

---

### **2. Focus Settings API** (`/api/focus/settings`)

#### GET - Retrieve user settings

```javascript
Response: {
  settings: {
    focus_duration: 1500,
    short_break_duration: 300,
    long_break_duration: 900,
    sessions_until_long_break: 4,
    sound_enabled: true,
    sound_volume: 50,
    sound_type: "chime",
    notifications_enabled: true,
    auto_start_breaks: false,
    auto_start_focus: false,
    daily_goal_sessions: 8,
    theme_preference: "system"
  }
}
```

#### PUT/PATCH - Update settings

```javascript
Body: {
  focus_duration: 1800,  // 30 minutes
  daily_goal_sessions: 10,
  sound_enabled: false
  // ... any settings to update
}

Response: {
  settings: { /* updated settings */ }
}
```

---

### **3. Focus Stats API** (`/api/focus/stats`)

#### GET - Retrieve statistics

```javascript
// Query parameters:
// - period: 'today', 'week', '7days', '30days' (default: 'today')

Response: {
  stats: {
    period: "today",
    totalSessions: 6,
    totalFocusTime: {
      seconds: 9000,
      minutes: 150,
      hours: 2,
      formatted: "2h 30m"
    },
    currentStreak: 5,
    dailyGoal: 8,
    goalProgress: 75,
    taskStats: [
      {
        taskId: "uuid",
        taskName: "CS Project",
        sessions: 3,
        totalMinutes: 75,
        lastWorkedOn: "2025-11-22T15:00:00Z"
      },
      // ...
    ],
    dailyStats: [
      {
        date: "2025-11-22T00:00:00Z",
        sessions: 6,
        totalMinutes: 150
      },
      // ...
    ],
    recentSessions: [
      {
        id: "uuid",
        taskName: "Complete assignment",
        duration: 25,
        completedAt: "2025-11-22T15:30:00Z",
        interrupted: false
      },
      // ...
    ]
  }
}
```

---

### **4. Focus Tasks API** (`/api/focus/tasks`)

#### GET - Get suggested tasks

```javascript
// Query parameters:
// - search: Filter by title (optional)
// - limit: Max results (default: 20)

Response: {
  tasks: [
    {
      id: "uuid",
      title: "Complete CS Assignment",
      type: "assignment",
      date: "2025-11-25T00:00:00Z",
      course: {
        id: "uuid",
        name: "Computer Science",
        code: "CS101",
        color: "#6366f1"
      },
      focusStats: {
        totalSessions: 3,
        totalMinutes: 75,
        lastWorkedOn: "2025-11-22T15:00:00Z"
      },
      isRecent: true
    },
    // ...
  ],
  lastTask: {
    id: "uuid",
    title: "Last worked task",
    type: "assignment",
    lastWorkedOn: "2025-11-22T15:00:00Z"
  }
}
```

---

## 🎨 Design Features

### **Visual Design**

- Clean, minimal interface inspired by top Pomodoro apps
- Circular progress ring with smooth animations
- Color-coded modes (Indigo for Focus, Green for Short Break, Purple for Long Break)
- Glassmorphism effects on headers
- Smooth transitions and micro-animations

### **UX Enhancements**

- One-click "Continue Last Task" shortcut
- Real-time task search with instant results
- Visual session progress indicators
- Contextual focus tips (dismissible)
- Toggle statistics panel
- Distraction-free timer view

### **Accessibility**

- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader friendly
- Focus indicators visible
- High contrast dark mode

---

## 🎯 User Workflow

### **Starting a Focus Session**

1. User lands on Focus page
2. Optionally selects/creates a task
3. Clicks Play button
4. Timer starts, session saved to DB
5. User works until timer completes

### **Session Completion**

1. Timer reaches 00:00
2. Sound plays (if enabled)
3. Notification shown (if enabled)
4. Session marked complete in DB
5. Auto-suggest break (short/long)
6. Update statistics

### **Task Management**

1. Type in task input (combo box opens)
2. Either select existing task OR create new
3. Task associated with focus session
4. Session count increments on completion
5. Task appears in "Completed Today"

---

## 📊 Analytics & Tracking

### **Session Metrics**

- Total sessions completed
- Total focus time (hours/minutes)
- Current streak (consecutive days)
- Daily goal progress percentage

### **Task-Level Metrics**

- Sessions per task
- Total time spent per task
- Last worked on timestamp
- Recent vs. upcoming tasks

### **Productivity Insights**

- Best focus times (future enhancement)
- Completion rates
- Interruption tracking
- Weekly/monthly trends (future)

---

## 🔧 Configuration

### **User Settings**

Users can customize:

- Focus duration (15-60 min, default 25)
- Sessions until long break (2-5, default 4)
- Sound effects (on/off, type, volume)
- Browser notifications (on/off)
- Auto-start breaks/focus
- Daily session goal
- Theme preference

### **Default Values**

```javascript
{
  focus_duration: 1500,        // 25 minutes
  short_break_duration: 300,   // 5 minutes (fixed)
  long_break_duration: 900,    // 15 minutes (fixed)
  sessions_until_long_break: 4,
  sound_enabled: true,
  sound_volume: 50,
  sound_type: "chime",
  notifications_enabled: true,
  auto_start_breaks: false,
  auto_start_focus: false,
  daily_goal_sessions: 8
}
```

---

## 🚀 Setup Instructions

### **1. Database Migration**

```bash
# Option A: Manual SQL migration
psql -d your_database -f migrations/add_focus_features.sql

# Option B: Prisma migrate (when Prisma is unlocked)
npx prisma migrate dev --name add_focus_features
npx prisma generate
```

### **2. Environment Variables**

Ensure `.env` has:

```
DATABASE_URL="your_postgres_url"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secret"
```

### **3. Run Development Server**

```bash
npm run dev
```

### **4. Access Focus Page**

Navigate to: `http://localhost:3000/focus-new`

---

## 🎯 Future Enhancements (Phase 2+)

### **Phase 2 Features**

- [ ] Ambient sounds during focus (rain, waves, lo-fi)
- [ ] Focus mode (minimize sidebar, fullscreen)
- [ ] Weekly statistics charts
- [ ] Export focus data (CSV/JSON)
- [ ] Keyboard shortcuts panel (? key)

### **Phase 3 Features**

- [ ] Study group timer sync
- [ ] Calendar integration (block focus time)
- [ ] Productivity trends over time
- [ ] Best focus time analysis
- [ ] Pomodoro templates per task type

---

## 🐛 Known Issues & Limitations

1. **Prisma Generation**: Permission errors on Windows - restart dev server if needed
2. **Browser Notifications**: User must grant permission first time
3. **Timer Accuracy**: Uses setInterval (consider Web Worker for production)
4. **Offline Mode**: Not yet implemented (future enhancement)

---

## 📝 Testing Checklist

- [ ] Timer counts down accurately
- [ ] Sessions save to database correctly
- [ ] Settings persist across page reloads
- [ ] Task search/create works
- [ ] Statistics calculate correctly
- [ ] Notifications work on supported browsers
- [ ] Sound plays at correct volume
- [ ] Mobile responsive layout
- [ ] Dark mode displays properly
- [ ] Auto-transitions work as configured

---

## 🎓 Technical Notes

### **Timer Implementation**

- Uses custom `useFocusTimer` hook
- setInterval with 100ms tick for smooth UI
- Tracks start time and calculates remaining
- Prevents drift by recalculating from Date.now()

### **State Management**

- React useState for local UI state
- Database as source of truth for sessions
- Settings cached in state, synced to DB
- Real-time updates via API calls

### **Performance Optimizations**

- useCallback for expensive functions
- Lazy load statistics (toggle to show)
- Pagination on task lists
- Debounced search input (future)

---

## 📚 References

- Pomodoro Technique: https://francescocirillo.com/pages/pomodoro-technique
- Design Inspiration: Leading productivity apps
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- Notifications API: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API

---

**Built with ❤️ for focused, distraction-free productivity**
