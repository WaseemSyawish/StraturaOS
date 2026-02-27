# StraturaOS — Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Getting Started](#getting-started)
4. [Core Features](#core-features)
5. [Technical Stack](#technical-stack)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Authentication & OAuth](#authentication--oauth)
9. [Deployment Guide](#deployment-guide)
10. [Configuration](#configuration)
11. [Design System](#design-system)
12. [Troubleshooting](#troubleshooting)
13. [Maintenance & Updates](#maintenance--updates)
14. [Security](#security)
15. [Contributing & License](#contributing--license)

---

## Overview

**StraturaOS** is a comprehensive academic management platform built for university students. It consolidates course management, grade tracking, smart scheduling, task management, focus sessions, attendance monitoring, and more into one cohesive web application.

### Key Capabilities

- **Course Management** — Organize modules with credits, instructors, semesters, and resources
- **Grade Tracking** — Monitor academic performance with weighted categories and real-time GPA
- **Smart Scheduling** — Automated timetable generation with recurring events and conflict detection
- **Task Management** — Full-featured task system with lists, sorting, filtering, and My Day view
- **Focus Timer** — Pomodoro-style focus sessions with statistics and configurable durations
- **Attendance Monitoring** — Track class attendance with point systems and visual analytics
- **Calendar Integration** — Unified view of assignments, exams, events, and regional holidays
- **Profile & Settings** — Personalized profile page with account management and quick links
- **Dark Mode** — Full theme support with light, dark, and system-auto detection
- **Authentication** — Secure user accounts with NextAuth.js (credentials + Google OAuth)
- **Holiday Integration** — Automatic holiday detection for Iraq and Kurdistan regions
- **Offline Support** — Local data backup and sync engine for offline resilience

---

## System Architecture

### Application Structure

```
straturaos/
├── pages/                          # Next.js pages (file-based routing)
│   ├── api/                        # Backend API endpoints
│   │   ├── auth/                   # NextAuth + custom auth endpoints
│   │   │   ├── [...nextauth].js    # NextAuth config (Credentials + Google)
│   │   │   ├── signup.js           # Account creation
│   │   │   ├── request-password-reset.js
│   │   │   ├── reset-password.js
│   │   │   └── local-signout.js
│   │   ├── courses/                # Course CRUD
│   │   ├── events/                 # Event CRUD + archive
│   │   ├── tasks/                  # Task management + My Day
│   │   ├── focus/                  # Focus sessions, settings, stats, tasks
│   │   ├── sessions/               # Study sessions (start/stop/history/stats)
│   │   ├── timetable/              # Timetable CRUD + patterns + bulk-create
│   │   ├── users/                  # User profile, avatar, password, settings
│   │   ├── calendar/               # Calendar sync (connect/callback/status)
│   │   ├── sync/                   # Offline sync (push/pull)
│   │   ├── lists/                  # Shared task lists
│   │   ├── health/                 # Health check + DB diagnostics
│   │   ├── debug/                  # Debug utilities (auth, cookies, data)
│   │   ├── legacy/                 # Legacy endpoints (courses, events)
│   │   ├── migrate/                # Data migration helpers
│   │   ├── grades.js               # Grade management
│   │   ├── attendance.js           # Attendance logging
│   │   ├── holidays.js             # Holiday data endpoint
│   │   ├── semester-settings.js    # Semester configuration
│   │   ├── course-resources.js     # Course resource management
│   │   ├── export-data.js          # Full data export
│   │   ├── templates.js            # Event templates
│   │   └── recurrence-options/     # Recurring event options
│   │
│   ├── index.js                    # Landing page (redirect)
│   ├── landing.js                  # Public landing / marketing page
│   ├── signin.js                   # Sign-in with animated UI
│   ├── signup.js                   # Registration with animated UI
│   ├── forgot-password.js          # Password reset request
│   ├── reset-password.js           # Password reset form
│   ├── signout.js                  # Sign-out page
│   │
│   ├── overview.js                 # Dashboard overview
│   ├── dashboard.js                # Main dashboard (alternate)
│   ├── calendar.js                 # Calendar view
│   ├── schedule.js                 # Weekly schedule + SmartScheduleManager
│   ├── timetable-setup.js          # Multi-step timetable wizard
│   ├── modules.js                  # Course manager
│   ├── grades.js                   # Grade tracking interface
│   ├── attendance.js               # Attendance tracker
│   ├── tasks.js                    # Task management
│   ├── focus.js                    # Focus / Pomodoro timer
│   ├── sessions.js                 # Study sessions
│   ├── history.js                  # Event history / archive
│   ├── profile.js                  # User profile page
│   ├── settings.js                 # App settings
│   ├── docs.js                     # In-app documentation viewer
│   ├── 404.js                      # Custom 404 page
│   │
│   ├── _app.js                     # App wrapper (providers, layout)
│   ├── _document.js                # Custom document (HTML head)
│   ├── _error.js                   # Error boundary page
│   └── _dashboard_ui.js            # Dashboard UI helper
│
├── src/
│   ├── components/                 # React components
│   │   ├── attendance/             # Attendance-specific components
│   │   ├── Calendar/               # Calendar view components
│   │   ├── courses/                # Course card/list components
│   │   ├── focus/                  # Focus timer components
│   │   ├── grades/                 # Grade-specific components
│   │   ├── icons/                  # Custom icon components
│   │   ├── overview/               # Dashboard overview widgets
│   │   ├── schedule/               # Schedule/timetable components
│   │   ├── tasks/                  # Task components (TaskDetailPanel, etc.)
│   │   ├── Timetable/              # Timetable grid components
│   │   ├── ui/                     # Shared UI primitives
│   │   ├── Layout.js               # App layout with sidebar
│   │   ├── Modal.js / Modal.jsx    # Modal components
│   │   ├── CustomSelect.jsx        # Portal-based dropdown select
│   │   ├── SmartScheduleManager.jsx # AI schedule builder
│   │   ├── TopNavbar.jsx           # Top navigation bar
│   │   ├── Avatar.js               # User avatar component
│   │   ├── Brand.js                # Brand logo
│   │   ├── Notification.js         # Toast notifications
│   │   ├── Portal.js               # React portal wrapper
│   │   └── ...                     # Additional components
│   │
│   ├── contexts/                   # React context providers
│   ├── providers/                  # App-level providers
│   ├── lib/                        # Client-side utilities
│   ├── utils/                      # Shared utility functions
│   ├── styles/                     # Global stylesheets
│   └── types/                      # TypeScript type definitions
│
├── lib/                            # Server-side utilities
│   ├── prisma.js                   # Prisma client singleton
│   ├── resolveUser.js              # Auth user resolution
│   ├── withPrisma.js               # Prisma middleware wrapper
│   ├── cache.js                    # Server-side caching
│   ├── syncEngine.js               # Offline sync engine
│   ├── offlineStore.js             # Offline data store
│   ├── calendar-sync.js            # Calendar sync logic
│   ├── task-helpers.js             # Task processing helpers
│   ├── task-utils.js               # Task utility functions
│   ├── eventHelpers.js             # Event processing
│   ├── eventUtils.js               # Event utilities
│   ├── color-utils.js              # Color manipulation
│   ├── i18n.js                     # Internationalization
│   ├── timezone.js                 # Timezone handling
│   ├── logger.js                   # Logging utility
│   ├── notifications.js            # Notification system
│   ├── parse-quick-capture.js      # Quick task capture parser
│   ├── security/                   # Security middleware
│   └── validation/                 # Input validation (Zod)
│
├── prisma/
│   └── schema.prisma               # Database schema (18 models)
│
├── data/                           # Static JSON data files
│   ├── courses.json                # Fallback course data
│   ├── events.json                 # Fallback event data
│   ├── attendance.json             # Fallback attendance data
│   ├── grades.json                 # Fallback grades data
│   ├── timetable.json              # Fallback timetable data
│   ├── recurrence-options.json     # Recurrence pattern options
│   ├── holidays-IQ-2025.json       # Iraq holidays 2025
│   ├── holidays-IQ-2026.json       # Iraq holidays 2026
│   ├── holidays-IQ-2027.json       # Iraq holidays 2027
│   ├── holidays-academic-2025-2026.json
│   ├── holidays-iq-kurdistan.json   # Kurdistan holidays
│   ├── holidays-iq-kurdistan-strict-2025-2026.json
│   └── holiday-eid-lookup.json     # Eid date lookup
│
├── scripts/                        # Build and maintenance scripts
├── dev-scripts/                    # Development/debug scripts
├── backups/                        # Database backups
├── docs/                           # Documentation
│
├── middleware.js                   # Next.js middleware
├── next.config.js                  # Next.js configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS configuration
├── jest.config.cjs                 # Jest test configuration
├── vercel.json                     # Vercel deployment config
├── package.json                    # Dependencies & scripts
└── tsconfig.json                   # TypeScript configuration
```

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **PostgreSQL** database (Railway, Neon, Supabase, or local)
- **npm** package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/WaseemSyawish/straturaos.git
   cd straturaos
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root (see `.env.example` for reference):

   ```env
   # Database (PostgreSQL)
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
   DIRECT_URL="postgresql://user:password@host:port/database?sslmode=require"

   # Authentication
   NEXTAUTH_SECRET="your-random-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   # Google OAuth (optional — enables "Sign in with Google")
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Email (for password reset via Resend)
   RESEND_API_KEY="your-resend-api-key"
   FROM_EMAIL="noreply@yourdomain.com"

   # Optional
   NODE_ENV="development"
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open in browser**

   Navigate to [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Script     | Command         | Description                                             |
| ---------- | --------------- | ------------------------------------------------------- |
| Dev server | `npm run dev`   | Starts Next.js development server                       |
| Build      | `npm run build` | Production build (runs Prisma generate + Next.js build) |
| Start      | `npm start`     | Starts production server                                |
| Lint       | `npm run lint`  | Runs ESLint                                             |
| Test       | `npm test`      | Runs Jest test suite                                    |
| Clean      | `npm run clean` | Cleans `.next` build cache                              |

---

## Core Features

### 1. Dashboard Overview

**Route**: `/overview`

The central hub providing a snapshot of academic life:

- **Today's Schedule** — Classes and events for the current day
- **Upcoming Deadlines** — 7-day forecast of assignments and exams
- **Quick Course Access** — Direct links to enrolled courses
- **Attendance Summary** — At-a-glance attendance rates
- **Recent Activity** — Latest actions across the platform
- **Week Strip** — Mini calendar showing the current week

### 2. Course Management (Modules)

**Route**: `/modules`

Comprehensive course organization:

- Course metadata: name, code, credits, color, instructor
- Extended fields: course website, office hours, Zoom link
- Semester assignment with configurable date ranges
- Color-coded visual organization
- Semester grouping and filtering
- Course archiving
- Resource attachments per course

### 3. Grade Tracking

**Route**: `/grades`

Detailed academic performance monitoring with a clean, solid-color card design:

- **Grading Categories** — Exams, quizzes, assignments, projects, labs, participation
- **Category Weighting** — Percentage-based grade calculation per course
- **Individual Items** — Track specific scores within each category
- **Real-time Calculations** — Automatic GPA, letter grade, and weighted averages
- **Statistics Dashboard** — Current GPA, total credits, course averages
- **Performance Colors** — Solid color indicators based on grade ranges (no gradients)

**Grade Scale**:

| Grade | Range   | Grade | Range     |
| ----- | ------- | ----- | --------- |
| A     | 93–100% | C     | 73–76%    |
| A-    | 90–92%  | C-    | 70–72%    |
| B+    | 87–89%  | D+    | 67–69%    |
| B     | 83–86%  | D     | 60–66%    |
| B-    | 80–82%  | F     | Below 60% |
| C+    | 77–79%  |       |           |

### 4. Task Management

**Route**: `/tasks`

Full-featured task system with multiple views:

- **List View** — Sortable, filterable task list with inline editing
- **My Day** — Focused view showing tasks scheduled for today
- **Task Lists** — Custom lists with color-coding and icons
- **Detail Panel** — Slide-out panel for editing task details, due dates, and notes
- **Sort & Filter** — Sort by date, priority, name; filter by status and list
- **Quick Capture** — Natural language task entry with auto-parsing
- **Completion Tracking** — Mark tasks complete with visual feedback
- **Shared Lists** — Collaborative task lists with member roles

### 5. Focus Timer

**Route**: `/focus`

Pomodoro-style focus session manager:

- **Timer Modes** — Focus, short break, long break
- **Configurable Durations** — Custom focus (default 25min), short break (5min), long break (15min)
- **Session Tracking** — Automatic logging of completed focus sessions
- **Task Integration** — Link focus sessions to specific tasks
- **Statistics** — Daily, weekly, and overall focus session analytics
- **Sound Notifications** — Configurable sounds for session transitions
- **Auto-start Options** — Auto-start breaks or next focus session
- **Daily Goals** — Set and track daily session targets

### 6. Smart Timetable

**Route**: `/schedule`, `/timetable-setup`

Automated weekly schedule generation:

- **SmartScheduleManager** — Multi-step wizard for building course schedules
- **Session Types** — Lectures, tutorials, labs, office hours
- **Recurring Events** — Automatic weekly repetition with pattern templates
- **Conflict Detection** — Visual time slot conflict warnings
- **Location Tracking** — Room and building information
- **Bulk Operations** — Edit entire recurring series or single instances
- **Day/Week/Month Views** — Flexible calendar display
- **Export** — Calendar format export

### 7. Calendar & Events

**Route**: `/calendar`

Unified calendar combining all academic events:

- Month grid with event previews
- Daily event sidebar
- **Event Types**: Assignment, Exam, Quiz, Project, Meeting, Study Session, Other
- Regional holiday highlighting (Iraq / Kurdistan)
- Quick event creation with modal
- Event completion tracking
- Attachment support (file uploads per event)
- Recurring event management
- Archive management for past events

### 8. Attendance Tracking

**Route**: `/attendance`

Comprehensive attendance monitoring with visual analytics:

- **Status Options** — Present, Absent, Late, Excused, Holiday
- **Point System** — Configurable points per attendance status
- **Visual Analytics** — Progress bars, color-coded indicators, charts
- **Course Breakdowns** — Per-course attendance rates and statistics
- **Historical Records** — Full attendance history with date navigation
- **Bulk Operations** — Multi-date selection and status updates

### 9. Study Sessions

**Route**: `/sessions`

Track study time outside of focus timer:

- Start/stop manual sessions
- Session history with duration
- Statistics and analytics
- Course-linked sessions

### 10. Profile

**Route**: `/profile`

Personalized user profile with card-based design:

- **Banner & Avatar** — Solid purple banner with card-overlay avatar
- **Personal Information** — Editable name, email display
- **Account & Security** — Change password, notification preferences, sign out
- **At a Glance** — Summary card showing courses, GPA, and attendance
- **Quick Links** — Direct navigation to Overview, Modules, Grades, Tasks, Schedule, Calendar
- **Member Since** — Account creation date display
- **Sign Out** — Dedicated sign-out functionality

### 11. Settings

**Route**: `/settings`

Application-wide preferences:

- Theme selection (Light / Dark / System)
- Week start day preference
- Default calendar view
- Notification preferences
- Account management
- Data export

### 12. Authentication Pages

**Routes**: `/signin`, `/signup`, `/forgot-password`, `/reset-password`

Polished authentication experience:

- **Animated Entrance** — Staggered fade-in with scale and translate animations
- **Focus Indicators** — Ring highlights on active form fields
- **Image Carousel** — Rotating background images with smooth scale transitions
- **Google OAuth** — "Sign in with Google" button (when configured)
- **Password Strength** — Real-time strength indicator on sign-up
- **Loading States** — Animated spinner during authentication
- **Error Feedback** — Slide-down error messages with pulsating indicators
- **Press Feedback** — Active scale animations on buttons

---

## Technical Stack

### Frontend

| Technology    | Version   | Purpose                                         |
| ------------- | --------- | ----------------------------------------------- |
| Next.js       | ^15.5.7   | React framework (Pages Router, SSR, API routes) |
| React         | ^19.2.0   | UI library                                      |
| Tailwind CSS  | ^3.4.17   | Utility-first CSS styling                       |
| Framer Motion | ^12.23.24 | Smooth animations and transitions               |
| Lucide React  | ^0.544.0  | Icon library                                    |
| Radix UI      | ^1.1.15+  | Accessible UI primitives (Dialog, Dropdown)     |
| NextUI        | ^2.6.11   | Additional UI components                        |
| date-fns      | ^4.1.0    | Date utility library                            |

### Backend

| Technology         | Version  | Purpose                                     |
| ------------------ | -------- | ------------------------------------------- |
| Next.js API Routes | ^15.5.7  | RESTful backend endpoints                   |
| Prisma             | ^5.22.0  | PostgreSQL ORM with type-safe queries       |
| NextAuth.js        | ^4.24.11 | Authentication (Credentials + Google OAuth) |
| bcryptjs           | ^2.4.3   | Password hashing                            |
| Zod                | ^4.1.13  | Runtime schema validation                   |
| Resend             | ^6.4.2   | Transactional email (password reset)        |
| jsonwebtoken       | ^9.0.0   | JWT token handling                          |

### Infrastructure

| Technology    | Purpose                              |
| ------------- | ------------------------------------ |
| Vercel        | Hosting and deployment (recommended) |
| Railway       | PostgreSQL database hosting          |
| Upstash Redis | Rate limiting (`@upstash/ratelimit`) |

### Development

| Technology      | Version | Purpose                          |
| --------------- | ------- | -------------------------------- |
| TypeScript      | 5.9.3   | Type checking (partial adoption) |
| Jest            | ^29.7.0 | Testing framework                |
| Testing Library | ^16.3.0 | React component testing          |
| ESLint          | —       | Code linting                     |
| PostCSS         | ^8.5.6  | CSS processing                   |

---

## Database Schema

The database uses **PostgreSQL** managed via **Prisma ORM** with 18 models. Below are the core tables.

### Users

```prisma
model User {
  id                     String    @id @default(uuid())
  email                  String    @unique
  password_hash          String?
  name                   String?
  settings               Json?
  role                   String    @default("user")
  locale                 String    @default("en")
  password_reset_token   String?
  password_reset_expires DateTime?
  created_at             DateTime? @default(now())
  updated_at             DateTime? @default(now())
  // Relations: courses, events, assessments (via courses),
  //   attendance_sessions, focus_sessions, focus_settings,
  //   semester_settings, calendar_connections, task lists,
  //   comments, activity_logs
}
```

### Courses

```prisma
model Course {
  id             String  @id @default(uuid())
  name           String
  code           String?
  credits        Int?    @default(3)
  color          String?
  semester       String?
  instructor     String?
  description    String?
  course_website String?
  office_hours   String?
  zoom_link      String?
  user_id        String
  // Relations: assessments, attendance_sessions, events,
  //   archived_events, resources
}
```

### Assessments (Grades)

```prisma
model Assessment {
  id        String @id @default(uuid())
  name      String
  type      String @default("assignment")
  weight    Float?
  items     Json?  @default("[]")    // Array of { id, name, score, maxScore }
  course_id String
  user_id   String
}
```

### Events

```prisma
model Event {
  id             String   @id @default(uuid())
  title          String
  type           String   @default("assignment")
  date           DateTime
  end_date       DateTime?
  time           String?
  location       String?
  description    String?
  completed      Boolean  @default(false)
  archived       Boolean  @default(false)
  meta           Json?
  version        Int      @default(1)
  reminders      String[] @default([])
  remindersFired String[] @default([])
  course_id      String?
  template_id    String?
  list_id        String?
  user_id        String
  // Relations: attachments, comments, course, template, list
}
```

### Attendance Sessions

```prisma
model AttendanceSession {
  id        String            @id @default(uuid())
  date      DateTime
  status    attendance_status   // PRESENT | ABSENT | HOLIDAY | EXCUSED | LATE
  points    Int?              @default(0)
  notes     String?
  course_id String
  user_id   String
}
```

### Focus Sessions

```prisma
model FocusSession {
  id           String    @id @default(uuid())
  user_id      String
  task_id      String?
  task_name    String?
  session_type String    @default("focus")
  duration     Int         // seconds
  started_at   DateTime
  ended_at     DateTime?
  completed    Boolean   @default(false)
  interrupted  Boolean   @default(false)
  notes        String?
}
```

### Focus Settings

```prisma
model FocusSettings {
  id                        String  @id @default(uuid())
  user_id                   String  @unique
  focus_duration            Int     @default(1500)    // 25 min in seconds
  short_break_duration      Int     @default(300)     // 5 min
  long_break_duration       Int     @default(900)     // 15 min
  sessions_until_long_break Int     @default(4)
  sound_enabled             Boolean @default(true)
  sound_volume              Int     @default(50)
  sound_type                String  @default("chime")
  notifications_enabled     Boolean @default(true)
  auto_start_breaks         Boolean @default(false)
  auto_start_focus          Boolean @default(false)
  daily_goal_sessions       Int?    @default(8)
  theme_preference          String  @default("system")
}
```

### Additional Models

| Model                | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| `EventTemplate`      | Recurring event patterns (repeat rules, payload)              |
| `ArchivedEvent`      | Completed/past events moved to archive                        |
| `Attachment`         | File attachments for events (filename, path, mime, size)      |
| `CourseResource`     | Links, files, and content attached to courses                 |
| `SemesterSetting`    | Academic semester date ranges and active status               |
| `CalendarConnection` | External calendar sync (Google/Outlook tokens)                |
| `TaskList`           | Shared/personal task lists with color and icon                |
| `TaskListMember`     | List membership with roles (owner/admin/member/viewer)        |
| `Comment`            | Threaded comments on events (with parent/reply support)       |
| `ActivityLog`        | Audit trail for actions (created, completed, commented, etc.) |

### Enums

```prisma
enum attendance_status {
  PRESENT
  ABSENT
  HOLIDAY
  EXCUSED
  LATE
}
```

---

## API Reference

All API endpoints are located under `/pages/api/`. Requests require authentication via NextAuth.js session (cookie-based JWT) unless noted otherwise.

### Authentication

| Method | Endpoint                           | Description                              |
| ------ | ---------------------------------- | ---------------------------------------- |
| POST   | `/api/auth/signup`                 | Create new account                       |
| POST   | `/api/auth/[...nextauth]`          | NextAuth sign-in (credentials or Google) |
| POST   | `/api/auth/request-password-reset` | Send password reset email                |
| POST   | `/api/auth/reset-password`         | Reset password with token                |
| POST   | `/api/auth/local-signout`          | Server-side session cleanup              |

**Sign Up — Request Body**:

```json
{
  "email": "student@university.edu",
  "password": "securePassword123",
  "name": "John Doe"
}
```

### Courses

| Method | Endpoint       | Description                             |
| ------ | -------------- | --------------------------------------- |
| GET    | `/api/courses` | List all courses for authenticated user |
| POST   | `/api/courses` | Create a new course                     |
| PUT    | `/api/courses` | Update a course                         |
| DELETE | `/api/courses` | Delete a course                         |

**Create Course — Request Body**:

```json
{
  "name": "Data Structures",
  "code": "CS201",
  "credits": 3,
  "color": "#3B82F6",
  "semester": "semester-uuid",
  "instructor": "Dr. Smith"
}
```

### Events

| Method | Endpoint                        | Description                                                    |
| ------ | ------------------------------- | -------------------------------------------------------------- |
| GET    | `/api/events`                   | List events (supports `start`, `end`, `archived` query params) |
| POST   | `/api/events`                   | Create an event                                                |
| PUT    | `/api/events/[id]`              | Update an event                                                |
| DELETE | `/api/events/[id]`              | Delete event (`scope=single\|all`, `templateId` for series)    |
| POST   | `/api/events/archive-completed` | Archive all completed events                                   |

**Create Event — Request Body**:

```json
{
  "title": "Midterm Exam",
  "type": "exam",
  "date": "2026-03-25",
  "time": "09:00",
  "location": "Room 101",
  "course_id": "uuid",
  "description": "Chapters 1-5"
}
```

### Tasks

| Method | Endpoint            | Description                           |
| ------ | ------------------- | ------------------------------------- |
| GET    | `/api/tasks`        | List all tasks for authenticated user |
| POST   | `/api/tasks`        | Create a new task                     |
| PUT    | `/api/tasks`        | Update a task                         |
| DELETE | `/api/tasks`        | Delete a task                         |
| GET    | `/api/tasks/my-day` | Get tasks marked for "My Day"         |
| GET    | `/api/lists`        | List all task lists                   |
| POST   | `/api/lists`        | Create a task list                    |

### Grades

| Method | Endpoint      | Description                                           |
| ------ | ------------- | ----------------------------------------------------- |
| GET    | `/api/grades` | Get all grades/assessments by course                  |
| PUT    | `/api/grades` | Update grades (add category, add item, update scores) |

**Add Category**:

```json
{
  "courseId": "uuid",
  "action": "add_assessment",
  "assessment": { "name": "Final Exam", "type": "exam", "weight": 40 }
}
```

**Add/Update Item**:

```json
{
  "courseId": "uuid",
  "action": "update_assessment",
  "assessment": {
    "id": "assessment-uuid",
    "items": [{ "id": 1, "name": "Quiz 1", "score": 90, "maxScore": 100 }]
  }
}
```

### Attendance

| Method | Endpoint          | Description                                               |
| ------ | ----------------- | --------------------------------------------------------- |
| GET    | `/api/attendance` | Get records (supports `courseId`, `startDate`, `endDate`) |
| POST   | `/api/attendance` | Log attendance session                                    |

**Log Attendance**:

```json
{
  "courseId": "uuid",
  "date": "2026-03-15",
  "status": "PRESENT",
  "points": 10
}
```

### Focus

| Method | Endpoint              | Description                         |
| ------ | --------------------- | ----------------------------------- |
| GET    | `/api/focus/sessions` | List focus sessions                 |
| POST   | `/api/focus/sessions` | Create/end a focus session          |
| GET    | `/api/focus/settings` | Get focus timer settings            |
| PUT    | `/api/focus/settings` | Update focus timer settings         |
| GET    | `/api/focus/stats`    | Get focus statistics                |
| GET    | `/api/focus/tasks`    | Get tasks for focus session linking |

### Study Sessions

| Method | Endpoint                | Description            |
| ------ | ----------------------- | ---------------------- |
| POST   | `/api/sessions/start`   | Start a study session  |
| POST   | `/api/sessions/stop`    | Stop a study session   |
| GET    | `/api/sessions/history` | Get session history    |
| GET    | `/api/sessions/stats`   | Get session statistics |

### Timetable

| Method | Endpoint                     | Description                   |
| ------ | ---------------------------- | ----------------------------- |
| GET    | `/api/timetable`             | Get timetable entries         |
| POST   | `/api/timetable`             | Create timetable entry        |
| PUT    | `/api/timetable/[id]`        | Update timetable entry        |
| DELETE | `/api/timetable/[id]`        | Delete timetable entry        |
| POST   | `/api/timetable/bulk-create` | Bulk create timetable entries |
| GET    | `/api/timetable/patterns`    | Get timetable patterns        |
| GET    | `/api/timetables`            | List all timetables           |

### Users

| Method | Endpoint                     | Description                |
| ------ | ---------------------------- | -------------------------- |
| GET    | `/api/users`                 | Get current user profile   |
| PUT    | `/api/users/[id]`            | Update user profile        |
| POST   | `/api/users/avatar`          | Upload avatar image        |
| POST   | `/api/users/change-password` | Change password            |
| DELETE | `/api/users/delete-account`  | Permanently delete account |
| GET    | `/api/users/settings`        | Get user settings          |
| PUT    | `/api/users/settings`        | Update user settings       |

### Other Endpoints

| Method | Endpoint                    | Description                    |
| ------ | --------------------------- | ------------------------------ |
| GET    | `/api/semester-settings`    | List semesters                 |
| POST   | `/api/semester-settings`    | Create semester                |
| GET    | `/api/holidays`             | Get holidays for date range    |
| GET    | `/api/course-resources`     | Get resources for a course     |
| GET    | `/api/export-data`          | Export all user data           |
| GET    | `/api/templates`            | Get event templates            |
| GET    | `/api/recurrence-options`   | Get recurrence pattern options |
| POST   | `/api/sync/push`            | Push offline changes           |
| GET    | `/api/sync/pull`            | Pull latest data               |
| GET    | `/api/health`               | Health check                   |
| GET    | `/api/health/db-diagnostic` | Database diagnostics           |

---

## Authentication & OAuth

### NextAuth.js Configuration

StraturaOS uses **NextAuth.js v4** with two authentication providers:

1. **Credentials Provider** — Email + password authentication with bcrypt hashing
2. **Google OAuth Provider** — "Sign in with Google" (conditional, requires env vars)

The NextAuth configuration is in `pages/api/auth/[...nextauth].js`.

### Setting Up Google OAuth

1. **Create a Google Cloud project** at [console.cloud.google.com](https://console.cloud.google.com)
2. **Enable the Google+ API** (or Google Identity)
3. **Create OAuth 2.0 credentials**:
   - Application type: Web application
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`
   - For local development, also add: `http://localhost:3000/api/auth/callback/google`
4. **Add credentials to `.env`**:

   ```env
   GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-your-secret"
   ```

5. Google OAuth is **automatically enabled** when both env vars are present. No code changes needed.

### Authentication Flow

1. User submits credentials or clicks "Sign in with Google"
2. NextAuth validates credentials (bcrypt compare) or OAuth token
3. For new Google users, an account is automatically created in the database
4. JWT session is created with user ID and name
5. Session cookie is set (httpOnly, secure in production)
6. Subsequent requests include session cookie for API authentication

### Password Reset Flow

1. User requests reset at `/forgot-password`
2. API generates a secure token and sends email via Resend
3. User clicks link in email, lands on `/reset-password?token=xxx`
4. Token is verified and password is updated with bcrypt hash

---

## Deployment Guide

### Vercel Deployment (Recommended)

1. **Push code to GitHub**

   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import in Vercel**
   - Go to [vercel.com](https://vercel.com) and import your GitHub repository
   - Vercel auto-detects Next.js and configures the build

3. **Configure environment variables** in Vercel dashboard:

   | Variable               | Required | Description                                         |
   | ---------------------- | -------- | --------------------------------------------------- |
   | `DATABASE_URL`         | Yes      | PostgreSQL connection string                        |
   | `DIRECT_URL`           | Yes      | Direct DB connection (for migrations)               |
   | `NEXTAUTH_SECRET`      | Yes      | Random secret for JWT signing                       |
   | `NEXTAUTH_URL`         | Yes      | Production URL (e.g., `https://app.straturaos.com`) |
   | `RESEND_API_KEY`       | No       | For password reset emails                           |
   | `FROM_EMAIL`           | No       | Sender email for password reset                     |
   | `GOOGLE_CLIENT_ID`     | No       | Google OAuth client ID                              |
   | `GOOGLE_CLIENT_SECRET` | No       | Google OAuth client secret                          |

4. **Deploy** — Vercel auto-deploys on push to `main`.

5. **Run database migrations** (first time or after schema changes):

   ```bash
   npx prisma migrate deploy
   ```

### Railway Database Setup

1. Create a **PostgreSQL** service on [Railway](https://railway.app)
2. Copy the connection string from the Railway dashboard
3. Set `DATABASE_URL` and `DIRECT_URL` in Vercel environment variables
4. Run `npx prisma migrate deploy` from the Vercel CLI or Railway terminal

### Post-Deployment Checklist

- [ ] Database connection verified (`/api/health`)
- [ ] User registration and sign-in working
- [ ] Google OAuth callback URL matches production domain
- [ ] Core features functional (courses, events, grades, tasks)
- [ ] Theme switching works in both light and dark mode
- [ ] Password reset email delivery confirmed
- [ ] Error monitoring configured

---

## Configuration

### Environment Variables

See `.env.example` for all available configuration options. Key variables:

| Variable               | Default                 | Description                    |
| ---------------------- | ----------------------- | ------------------------------ |
| `DATABASE_URL`         | —                       | PostgreSQL connection (pooled) |
| `DIRECT_URL`           | —                       | PostgreSQL direct connection   |
| `NEXTAUTH_SECRET`      | —                       | Session encryption secret      |
| `NEXTAUTH_URL`         | `http://localhost:3000` | Base URL for auth callbacks    |
| `GOOGLE_CLIENT_ID`     | —                       | Google OAuth (optional)        |
| `GOOGLE_CLIENT_SECRET` | —                       | Google OAuth (optional)        |
| `RESEND_API_KEY`       | —                       | Email service key (optional)   |
| `FROM_EMAIL`           | —                       | Sender email address           |
| `NODE_ENV`             | `development`           | Environment mode               |

### Theme Configuration

Theme preference is stored per-user in the database `settings` JSON:

```json
{
  "theme": "dark",
  "weekStartsOn": 0,
  "defaultView": "week"
}
```

Options: `"light"`, `"dark"`, or `"system"` (auto-detects OS preference).

### Holiday Configuration

Regional holidays are served from static JSON files in `data/`:

| File                                          | Coverage                           |
| --------------------------------------------- | ---------------------------------- |
| `holidays-IQ-2025.json`                       | Iraq national holidays 2025        |
| `holidays-IQ-2026.json`                       | Iraq national holidays 2026        |
| `holidays-IQ-2027.json`                       | Iraq national holidays 2027        |
| `holidays-iq-kurdistan.json`                  | Kurdistan regional holidays        |
| `holidays-iq-kurdistan-strict-2025-2026.json` | Kurdistan strict academic calendar |
| `holidays-academic-2025-2026.json`            | Academic calendar holidays         |
| `holiday-eid-lookup.json`                     | Eid date lookup table              |

---

## Design System

StraturaOS follows a consistent design system across all pages.

### Color Philosophy

- **No gradients** — All surfaces use solid colors for clarity and consistency
- **Purple accent** — Primary brand color (`#7c3aed` / purple-600)
- **Slate palette** — Neutral backgrounds and text
- **Semantic colors** — Green for success, red for errors, amber for warnings, blue for info

### Dark Mode

- Light: `bg-slate-50` backgrounds, `text-slate-900` text
- Dark: `bg-[#0a0a0f]` page backgrounds, `bg-[#12121a]` cards, `text-white` text
- Toggled via `html.dark` class (Tailwind class-based dark mode)

### Design System Object (`ds`)

Each page defines a `ds` (design system) constant for consistent styling:

```javascript
const ds = {
  pageBg: "bg-slate-50 dark:bg-[#0a0a0f]",
  cardBg: "bg-white dark:bg-[#12121a]",
  border: "border-slate-200 dark:border-white/10",
  text: "text-slate-900 dark:text-white",
  textMuted: "text-slate-500 dark:text-slate-400",
  // ... additional tokens per page
};
```

### Component Patterns

- **Cards** — Rounded-xl with ring-1 borders, no shadows in dark mode
- **Modals** — Portal-based with backdrop blur and fade-in animations
- **Buttons** — Rounded-lg with hover/active states, `active:scale-[0.98]` press feedback
- **Inputs** — Ring-based focus indicators (`ring-2 ring-purple-500/30`)
- **Animations** — Staggered entrance animations using CSS transitions and framer-motion

---

## Troubleshooting

### Common Issues

#### Database Connection Failed

1. Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db?sslmode=require`
2. Check that the database is running and accessible
3. Test with `npx prisma db push`
4. For Railway: ensure the proxy URL is correct (check Railway dashboard)

#### Authentication Not Working

1. Verify `NEXTAUTH_SECRET` is set and consistent across deployments
2. Check `NEXTAUTH_URL` matches your actual domain
3. Clear browser cookies and retry
4. Check server logs for NextAuth errors

#### Google OAuth Not Appearing

1. Verify both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
2. Check authorized redirect URIs in Google Cloud Console match your domain
3. Restart the dev server after adding env vars

#### Grades Not Saving

1. Run migrations: `npx prisma migrate deploy`
2. Verify the `assessments` table exists
3. Check API response in browser dev tools for error details

#### Events Not Appearing in Calendar

1. Verify date format is ISO 8601
2. Check `user_id` matches the authenticated user
3. Clear browser cache
4. Check `/api/events?start=...&end=...` response

#### Prisma Client Issues

If you see "Prisma client not generated" or engine errors:

```bash
npx prisma generate
```

If the Prisma engine is locked (e.g., after a failed build):

```bash
npm run clean
npx prisma generate
```

#### Dark Mode Flickering

1. Verify `_document.js` includes theme initialization script
2. Check that `html.dark` class is set before React hydration
3. Clear localStorage theme cache if corrupted

### Debug Endpoints

| Endpoint                        | Purpose                        |
| ------------------------------- | ------------------------------ |
| `GET /api/health`               | Server + database health check |
| `GET /api/health/db-diagnostic` | Detailed database diagnostics  |
| `GET /api/debug/auth-check`     | Verify authentication status   |
| `GET /api/debug/cookies`        | Inspect session cookies        |
| `GET /api/debug/data-check`     | Verify data integrity          |

---

## Maintenance & Updates

### Database Maintenance

```bash
# Backup database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql

# Run pending migrations
npx prisma migrate deploy

# Regenerate Prisma client after schema changes
npx prisma generate

# Open Prisma Studio (visual DB editor)
npx prisma studio
```

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update all packages
npm update

# After updating Prisma
npx prisma generate
```

### Build Commands

```bash
# Full production build
npm run build

# Clean build cache (resolves stale .next issues)
npm run clean

# Development with production database
npm run dev:prod
```

---

## Security

### Best Practices Implemented

1. **Password Hashing** — bcryptjs with salted hashes (never stored in plaintext)
2. **Parameterized Queries** — Prisma ORM prevents SQL injection
3. **XSS Prevention** — React's built-in escaping + input sanitization
4. **CSRF Protection** — NextAuth.js handles CSRF tokens automatically
5. **Rate Limiting** — Upstash Redis rate limiting on auth endpoints
6. **HTTPS** — Enforced in production via Vercel
7. **Session Security** — httpOnly, secure, sameSite cookie flags
8. **User Scoping** — All API queries filter by authenticated `user_id`
9. **Input Validation** — Zod schemas validate request bodies
10. **Environment Isolation** — Secrets stored in environment variables (never committed)

### Security Headers

The `vercel.json` and `next.config.js` configure security headers including:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## Contributing & License

### Contributing

This project is maintained by [WaseemSyawish](https://github.com/WaseemSyawish).

For bug reports and feature requests, please open an issue on GitHub:
[straturaos/issues](https://github.com/WaseemSyawish/straturaos/issues)

### License

This project is proprietary software. All rights reserved.

---

**Last Updated**: February 23, 2026
**Version**: 2.0.0
**Documentation Author**: GitHub Copilot
