# StraturaOS - Complete Codebase Reference

> This document provides a comprehensive overview of the StraturaOS codebase for external AI assistants like Perplexity. It covers architecture, data models, API routes, key components, and implementation patterns.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Database Schema](#database-schema)
5. [API Routes](#api-routes)
6. [Authentication System](#authentication-system)
7. [Core Components](#core-components)
8. [State Management Patterns](#state-management-patterns)
9. [Security Implementation](#security-implementation)
10. [Key Business Logic](#key-business-logic)
11. [Styling & Theming](#styling--theming)
12. [Configuration Files](#configuration-files)

---

## Project Overview

StraturaOS is a comprehensive academic planning application built for students. It provides:

- **Task Management**: Create, organize, and track tasks with subtasks, priorities, due dates, and reminders
- **Course Management**: Track courses, grades, attendance, and academic resources
- **Calendar/Schedule**: View and manage events with recurring event support
- **Focus Sessions**: Pomodoro-style focus timer with session tracking
- **Dashboard/Overview**: At-a-glance view of upcoming deadlines, tasks, and academic progress

### Core Concepts

- **Events**: The base entity for calendar items - classes, assignments, exams, etc.
- **Tasks**: A specialized view of Events with additional metadata (priority, status, subtasks)
- **Courses/Modules**: Academic courses with associated events, grades, and resources
- **Semesters**: Time-bounded academic periods that organize courses and events

---

## Technology Stack

### Frontend

- **Next.js 15.5.6** - React framework with Pages Router
- **React 19.2.0** - UI library
- **Tailwind CSS 3.4.17** - Utility-first CSS
- **NextUI 2.6.11** - React component library
- **DaisyUI 2.52.0** - Tailwind component library
- **Lucide React** - Icon library
- **date-fns** - Date manipulation

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Prisma 5.22.0** - Database ORM
- **PostgreSQL** - Primary database (hosted on Supabase)
- **NextAuth.js 4.24.11** - Authentication

### Security & Validation

- **@upstash/ratelimit** - Distributed rate limiting
- **@upstash/redis** - Redis client for rate limiting
- **Zod 3.24.4** - Schema validation
- **bcryptjs** - Password hashing

### Deployment

- **Vercel** - Hosting platform
- **Supabase** - PostgreSQL database hosting

---

## Directory Structure

```
straturaos/
├── data/                    # Static JSON data files
│   ├── courses.json         # Sample course data
│   ├── events.json          # Sample event data
│   ├── holidays-*.json      # Holiday calendars
│   └── recurrence-options.json
│
├── dev-scripts/             # Development utilities
│   ├── test-security.js     # Security implementation tests
│   ├── check-users.js       # Database user verification
│   └── ...
│
├── docs/                    # Documentation
│   ├── SECURITY-IMPROVEMENTS.md
│   ├── DOCUMENTATION.md
│   └── ...
│
├── lib/                     # Shared utilities and modules
│   ├── prisma.js            # Prisma client singleton
│   ├── resolveUser.js       # User resolution from requests
│   ├── withPrisma.js        # Prisma connection wrapper
│   ├── task-helpers.js      # Task/Event transformation utilities
│   ├── timezone.js          # UTC timezone handling
│   ├── logger.js            # Structured logging
│   ├── security/            # Security modules
│   │   ├── rate-limit.js    # Upstash rate limiting
│   │   ├── csrf.js          # CSRF protection
│   │   └── index.js         # Security exports
│   └── validation/          # Validation schemas
│       └── schemas.js       # Zod schemas for all entities
│
├── pages/                   # Next.js pages and API routes
│   ├── _app.js              # App wrapper with providers
│   ├── _document.js         # HTML document structure
│   ├── index.js             # Home page (redirects)
│   ├── landing.js           # Public landing page
│   ├── signin.js            # Sign in page
│   ├── signup.js            # Sign up page
│   ├── overview.js          # Dashboard/overview
│   ├── tasks.js             # Task management (4500+ lines)
│   ├── calendar.js          # Calendar view
│   ├── schedule.js          # Schedule view
│   ├── modules.js           # Course management
│   ├── grades.js            # Grade tracking
│   ├── focus.js             # Focus session timer
│   ├── settings.js          # User settings
│   └── api/                 # API routes
│       ├── auth/            # Authentication endpoints
│       ├── tasks/           # Task CRUD
│       ├── events/          # Event CRUD
│       ├── courses/         # Course CRUD
│       ├── grades.js        # Grade operations
│       ├── attendance.js    # Attendance tracking
│       └── sessions/        # Focus session tracking
│
├── prisma/
│   └── schema.prisma        # Database schema
│
├── src/
│   ├── components/          # React components
│   │   ├── Layout.js        # Page layout wrapper
│   │   ├── tasks/           # Task-related components
│   │   │   └── TaskDetailPanel.jsx
│   │   ├── schedule/        # Schedule components
│   │   └── ...
│   ├── lib/                 # Frontend utilities
│   │   └── dateHelpers.js   # Date formatting utilities
│   ├── providers/           # React context providers
│   │   ├── modal-context.jsx
│   │   ├── toast-provider.jsx
│   │   └── confirm-provider.jsx
│   └── styles/              # CSS files
│
├── middleware.js            # Next.js middleware (auth checks)
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind configuration
├── package.json             # Dependencies
└── vercel.json              # Vercel deployment config
```

---

## Database Schema

The application uses PostgreSQL with Prisma ORM. Here are the core models:

### User

```prisma
model User {
  id                  String    @id @default(uuid())
  email               String    @unique
  password_hash       String?
  name                String?
  settings            Json?     // User preferences (theme, etc.)
  password_reset_token String?
  password_reset_expires DateTime?
  created_at          DateTime? @default(now())
  updated_at          DateTime? @default(now())

  // Relations
  events              Event[]
  courses             Course[]
  focus_sessions      FocusSession[]
  attendance_sessions AttendanceSession[]
  semester_settings   SemesterSetting[]
}
```

### Event (Core entity - used for tasks, classes, assignments, etc.)

```prisma
model Event {
  id             String         @id @default(uuid())
  title          String
  type           String         @default("assignment") // task, class, exam, etc.
  date           DateTime
  time           String?        // Optional time (HH:MM format)
  end_date       DateTime?      // For multi-day events
  description    String?
  location       String?
  completed      Boolean        @default(false)
  archived       Boolean        @default(false)

  // Metadata stored as JSON
  meta           Json?          // { priority, status, subtasks, tags, myDay, etc. }

  // Reminders
  reminders      String[]       @default([])  // ISO date strings
  remindersFired String[]       @default([])

  // Relations
  user_id        String
  course_id      String?
  template_id    String?        // For recurring events

  created_at     DateTime?      @default(now())
  updated_at     DateTime?      @default(now())
}
```

### Course

```prisma
model Course {
  id              String    @id @default(uuid())
  name            String
  code            String?
  credits         Int?      @default(3)
  color           String?   // Hex color for UI
  semester        String?
  instructor      String?
  description     String?
  course_website  String?
  office_hours    String?
  zoom_link       String?

  user_id         String
  created_at      DateTime? @default(now())
  updated_at      DateTime? @default(now())

  // Relations
  events          Event[]
  assessments     Assessment[]
  resources       CourseResource[]
}
```

### Assessment (for grade tracking)

```prisma
model Assessment {
  id         String    @id @default(uuid())
  name       String
  type       String    @default("assignment") // exam, quiz, project, etc.
  weight     Float?    // Percentage weight in final grade
  items      Json?     @default("[]")  // Individual grade items

  course_id  String
  user_id    String
  created_at DateTime? @default(now())
  updated_at DateTime? @default(now())
}
```

### FocusSession

```prisma
model FocusSession {
  id           String    @id @default(uuid())
  user_id      String
  task_id      String?
  task_name    String?
  session_type String    @default("focus") // focus, short_break, long_break
  duration     Int       // seconds
  started_at   DateTime
  ended_at     DateTime?
  completed    Boolean   @default(false)
  interrupted  Boolean   @default(false)
  notes        String?

  created_at   DateTime? @default(now())
  updated_at   DateTime? @default(now())
}
```

### FocusSettings

```prisma
model FocusSettings {
  id                        String  @id @default(uuid())
  user_id                   String  @unique
  focus_duration            Int     @default(1500)  // 25 minutes
  short_break_duration      Int     @default(300)   // 5 minutes
  long_break_duration       Int     @default(900)   // 15 minutes
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

### AttendanceSession

```prisma
model AttendanceSession {
  id         String            @id @default(uuid())
  date       DateTime
  status     attendance_status // PRESENT, ABSENT, HOLIDAY, EXCUSED, LATE
  points     Int?              @default(0)
  notes      String?

  user_id    String
  course_id  String
  created_at DateTime?         @default(now())
  updated_at DateTime?         @default(now())
}
```

---

## API Routes

### Authentication (`/api/auth/`)

| Endpoint                    | Method | Description                                   |
| --------------------------- | ------ | --------------------------------------------- |
| `/api/auth/[...nextauth]`   | \*     | NextAuth.js handler                           |
| `/api/auth/register`        | POST   | User registration (with CSRF + rate limiting) |
| `/api/auth/local-signin`    | POST   | Custom JWT sign-in                            |
| `/api/auth/local-signout`   | POST   | Custom sign-out                               |
| `/api/auth/forgot-password` | POST   | Password reset request (with CSRF)            |
| `/api/auth/reset-password`  | POST   | Password reset (with CSRF)                    |
| `/api/auth/me`              | GET    | Get current user                              |

### Tasks (`/api/tasks/`)

| Endpoint                       | Method | Description                                                 |
| ------------------------------ | ------ | ----------------------------------------------------------- |
| `/api/tasks`                   | GET    | List tasks (supports `view=my-day`, `completed=true/false`) |
| `/api/tasks`                   | POST   | Create task                                                 |
| `/api/tasks/[taskId]`          | GET    | Get single task                                             |
| `/api/tasks/[taskId]`          | PATCH  | Update task                                                 |
| `/api/tasks/[taskId]`          | DELETE | Delete task                                                 |
| `/api/tasks/[taskId]/complete` | POST   | Toggle task completion                                      |
| `/api/tasks/my-day`            | GET    | Get My Day tasks                                            |

### Events (`/api/events/`)

| Endpoint                        | Method | Description                              |
| ------------------------------- | ------ | ---------------------------------------- |
| `/api/events`                   | GET    | List events (supports many query params) |
| `/api/events`                   | POST   | Create event                             |
| `/api/events/[eventId]`         | GET    | Get single event                         |
| `/api/events/[eventId]`         | PATCH  | Update event                             |
| `/api/events/[eventId]`         | DELETE | Delete event                             |
| `/api/events/batch-delete`      | POST   | Delete multiple events                   |
| `/api/events/archive-completed` | POST   | Archive completed events                 |

### Courses (`/api/courses/`)

| Endpoint                      | Method | Description          |
| ----------------------------- | ------ | -------------------- |
| `/api/courses`                | GET    | List courses         |
| `/api/courses`                | POST   | Create course        |
| `/api/courses/[id]`           | GET    | Get single course    |
| `/api/courses/[id]`           | PATCH  | Update course        |
| `/api/courses/[id]`           | DELETE | Delete course        |
| `/api/courses/[id]/resources` | GET    | Get course resources |
| `/api/courses/[id]/resources` | POST   | Add course resource  |

### Other Routes

| Endpoint              | Method         | Description              |
| --------------------- | -------------- | ------------------------ |
| `/api/grades`         | GET/POST/PATCH | Grade management         |
| `/api/attendance`     | GET/POST/PATCH | Attendance tracking      |
| `/api/sessions`       | GET/POST       | Focus sessions           |
| `/api/sessions/stats` | GET            | Focus session statistics |
| `/api/users/[id]`     | GET/PATCH      | User profile             |
| `/api/settings`       | GET/POST       | User settings            |
| `/api/semesters`      | GET/POST       | Semester management      |

---

## Authentication System

The app uses a **hybrid authentication system**:

### NextAuth.js

- Configured in `/pages/api/auth/[...nextauth].js`
- Uses JWT strategy with 30-day expiry
- Stores user ID in JWT token

### Custom JWT Session

- Parallel custom JWT system in `/api/auth/local-signin`
- Sets `session` cookie with user info
- Used for faster session validation

### User Resolution

The `resolveUser(req)` function in `/lib/resolveUser.js` attempts to get the user ID from:

1. Custom `session` JWT cookie
2. Custom `userId` cookie
3. NextAuth session via `getServerSession()`

### Middleware

`/middleware.js` protects routes by checking authentication:

- Public routes: `/`, `/landing`, `/signin`, `/signup`, `/forgot-password`, `/reset-password`
- API routes starting with `/api/auth/` are public
- All other routes require authentication

---

## Core Components

### TaskDetailPanel (`/src/components/tasks/TaskDetailPanel.jsx`)

The main component for creating/editing tasks. Features:

- Title, description editing
- Status dropdown (todo, doing, later, done)
- Priority selection (Eisenhower matrix)
- Due date/time with ReminderPicker
- Tags management
- Subtasks with completion tracking
- Course/module association

**Key Props:**

```javascript
{
  task: Object,           // Task data (null for create mode)
  mode: 'detail' | 'create',
  onUpdateFields: Function,  // (taskId, updates) => void
  onToggleComplete: Function,
  onStatusChange: Function,
  onTagsChange: Function,
  onDeleteTask: Function,
  modules: Array,         // Available courses
  onCreate: Function,     // For create mode
  onClose: Function,
}
```

### ReminderPicker

Inline date/time picker component with:

- Calendar date selection
- Optional time input with clear button
- Quick shortcuts: "Later today", "Tomorrow", "Next week", "Someday"
- Clear all functionality

### Layout (`/src/components/Layout.js`)

App shell with:

- Sidebar navigation (collapsible)
- Top navigation bar
- Main content area

### Modal System

Uses React Context (`/src/providers/modal-context.jsx`):

```javascript
const { setOpen, setClose } = useModal();
setOpen(<MyModalContent />);
setClose(); // Close modal
```

---

## State Management Patterns

### Tasks Page Pattern (`/pages/tasks.js`)

The tasks page (~4500 lines) demonstrates the main patterns:

1. **Data Fetching**:

```javascript
const loadUnifiedData = useCallback(async () => {
  const [taskPayload, eventsPayload, coursesPayload] = await Promise.all([
    fetch("/api/tasks?view=planner"),
    fetch("/api/events?includeArchived=true"),
    fetch("/api/courses"),
  ]);
  // Normalize and set state
});
```

2. **Optimistic Updates**:

```javascript
const optimisticTaskUpdate = useCallback((taskId, updates) => {
  setTasks((prev) =>
    prev.map((task) =>
      task.id === taskId ? mergeTaskUpdates(task, updates) : task
    )
  );
}, []);

const persistTaskUpdate = useCallback(async (taskId, updates) => {
  await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}, []);
```

3. **Task Normalization**:

```javascript
const normalizeTask = (task) => ({
  id: String(task.id),
  title: task.title || "Untitled Task",
  dueDate: task.dueDate || task.date || null,
  subtasks: Array.isArray(task.subtasks)
    ? task.subtasks
    : Array.isArray(task.meta?.subtasks)
    ? task.meta.subtasks
    : [],
  priority: normalizePriority(task.priority),
  status: normalizeStatus(task.status, task.completed),
  // ... more fields
});
```

### Event/Task Transformation (`/lib/task-helpers.js`)

Events and Tasks share the same database model. Transformations:

```javascript
// Convert database Event to frontend Task
export const eventToTask = (event) => {
  const meta = event.meta || {};
  return {
    id: event.id,
    title: event.title,
    subtasks: Array.isArray(meta.subtasks) ? meta.subtasks : [],
    priority: meta.priority || "medium",
    status: meta.status || "backlog",
    // ... more fields
  };
};

// Build update payload for Prisma
export const buildTaskUpdatePayload = (body, existing) => {
  const data = {};
  // Copy explicit fields
  if (body.title) data.title = body.title.trim();
  if (body.dueDate) data.date = new Date(body.dueDate);

  // Merge meta fields
  const meta = buildTaskMeta(existing.meta, body);
  if (Object.keys(meta).length) data.meta = meta;

  return data;
};
```

---

## Security Implementation

### Rate Limiting (`/lib/security/rate-limit.js`)

Uses Upstash Redis for distributed rate limiting:

```javascript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const createRateLimiter = (config) => {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    prefix: config.prefix,
  });
};

// Usage in API route:
export default withRateLimit(handler, {
  limit: 10,
  window: "1m",
  identifier: "auth",
});
```

### CSRF Protection (`/lib/security/csrf.js`)

Origin/Referer header validation:

```javascript
export const validateCsrfRequest = (req) => {
  const origin = req.headers.origin || req.headers.referer;
  if (!origin) return false;

  const allowedOrigins = [process.env.NEXTAUTH_URL, "http://localhost:3000"];

  return allowedOrigins.some((allowed) => origin.startsWith(allowed));
};

// Usage:
export default withCsrfProtection(handler);
```

### Validation Schemas (`/lib/validation/schemas.js`)

Zod schemas for type-safe validation:

```javascript
import { z } from "zod";

export const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
});

export const TaskSchema = z.object({
  title: z.string().min(1).max(500),
  priority: z
    .enum([
      "urgent-important",
      "urgent-not-important",
      "not-urgent-important",
      "not-urgent-not-important",
    ])
    .optional(),
  status: z.enum(["todo", "doing", "later", "done", "backlog"]).optional(),
  subtasks: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        completed: z.boolean(),
      })
    )
    .optional(),
});

// Usage:
export const withValidation = (schema) => (handler) => async (req, res) => {
  try {
    req.validatedBody = schema.parse(req.body);
    return handler(req, res);
  } catch (error) {
    return res.status(400).json({ error: error.errors });
  }
};
```

---

## Key Business Logic

### Priority System (Eisenhower Matrix)

```javascript
const priorityMeta = {
  "urgent-important": {
    label: "Urgent & Important",
    color: "#ef4444",
    weight: 0,
  },
  "urgent-not-important": {
    label: "Urgent · Low Impact",
    color: "#f97316",
    weight: 1,
  },
  "not-urgent-important": {
    label: "Important, not urgent",
    color: "#0ea5e9",
    weight: 2,
  },
  "not-urgent-not-important": {
    label: "Low effort",
    color: "#94a3b8",
    weight: 3,
  },
};
```

### Task Status Flow

```javascript
const statusOptions = [
  { value: "todo", label: "To Do", color: "#f59e0b" },
  { value: "doing", label: "In Progress", color: "#8b5cf6" },
  { value: "later", label: "Later", color: "#f59e0b" },
  { value: "done", label: "Done", color: "#10b981" },
];
```

### My Day Logic

Tasks appear in "My Day" if:

1. `myDay: true` flag is set
2. Task is marked as `important` and not completed
3. Due date is today or overdue

```javascript
export const filterTasksForMyDay = (tasks) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  return tasks.filter((task) => {
    if (task.myDay) return true;
    if (task.important && !task.completed) return true;
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    if (due < now) return true; // Overdue
    return due >= todayStart && due < todayEnd; // Due today
  });
};
```

### Subtask Structure

Subtasks are stored in the Event's `meta.subtasks` field:

```javascript
{
  meta: {
    subtasks: [
      { id: "subtask-123", title: "Research topic", completed: false },
      { id: "subtask-456", title: "Write outline", completed: true },
    ];
  }
}
```

### Date/Time Handling

- **Storage**: All dates stored in UTC in the database
- **Time field**: Stored as string (HH:MM format) for display purposes
- **No time**: Tasks can have a date without time (time field = null)
- **No due date**: Tasks can have no due date (uses placeholder date 2099-12-31)

```javascript
// lib/timezone.js
export const toUTC = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return new Date(
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds()
    )
  );
};

export const parseUserInput = (dateStr, timeStr, timezone = "UTC") => {
  const date = new Date(dateStr);
  if (timeStr) {
    const [hours, minutes] = timeStr.split(":");
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  return date;
};
```

---

## Styling & Theming

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  darkMode: "class", // Dark mode via class
  content: ["./pages/**/*.{js,jsx}", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          purple: "#8b5cf6",
          // ... more
        },
      },
    },
  },
  plugins: [require("daisyui")],
};
```

### Dark Mode Implementation

Theme preference stored in localStorage at `up:settings`:

```javascript
// In _app.js
const applyTheme = (theme) => {
  const root = document.documentElement;
  root.classList.remove('dark');

  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) root.classList.add('dark');
  }
};

// Unauthenticated pages force light mode
const LIGHT_MODE_ONLY_PAGES = ['/', '/landing', '/signin', '/signup', ...];
```

### Color System

Course colors use hex values. Priority colors defined in `priorityMeta`. Status colors in `statusOptions`.

---

## Configuration Files

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."  # For Prisma migrations

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="..."

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Optional
NODE_ENV="development"
```

### next.config.js

```javascript
module.exports = {
  reactStrictMode: false, // Disabled for compatibility
  images: {
    domains: ["..."],
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};
```

### Vercel Configuration

```json
{
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "crons": []
}
```

---

## Common Patterns

### API Route Pattern

```javascript
import prisma from "../../../lib/prisma";
import { resolveUser } from "../../../lib/resolveUser";
import withPrisma from "../../../lib/withPrisma";

async function handler(req, res) {
  const userId = await resolveUser(req);
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.method === "GET") {
    const data = await prisma.model.findMany({
      where: { user_id: userId },
    });
    return res.json({ success: true, data });
  }

  if (req.method === "POST") {
    const created = await prisma.model.create({
      data: { ...req.body, user_id: userId },
    });
    return res.status(201).json({ success: true, data: created });
  }

  res.setHeader("Allow", "GET,POST");
  return res.status(405).end();
}

export default withPrisma(handler);
```

### Component Pattern

```jsx
const MyComponent = ({ data, onUpdate, onDelete }) => {
  const [localState, setLocalState] = useState(data);

  const handleChange = (updates) => {
    setLocalState((prev) => ({ ...prev, ...updates }));
    onUpdate?.(data.id, updates); // Optimistic + persist
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">{/* ... */}</div>
  );
};
```

---

## Known Limitations & TODOs

1. **Tasks page size**: `pages/tasks.js` is ~4500 lines and could benefit from further componentization
2. **Recurring events**: Template-based but generation happens client-side
3. **Offline support**: Not currently implemented
4. **Real-time sync**: No WebSocket/real-time updates between devices

---

## Quick Reference

### Important Files to Know

| File                                        | Purpose                      |
| ------------------------------------------- | ---------------------------- |
| `/lib/task-helpers.js`                      | Event ↔ Task transformations |
| `/lib/resolveUser.js`                       | User auth resolution         |
| `/pages/tasks.js`                           | Main task management logic   |
| `/src/components/tasks/TaskDetailPanel.jsx` | Task create/edit UI          |
| `/prisma/schema.prisma`                     | Database schema              |
| `/middleware.js`                            | Route protection             |
| `/pages/_app.js`                            | App wrapper, theme handling  |

### Key Concepts

- **Events are Tasks**: Tasks are stored as Events with `type: 'task'` and extra metadata
- **Meta field**: JSON blob for extensible properties (subtasks, priority, status, tags)
- **Optimistic updates**: UI updates immediately, API call happens in background
- **JWT dual system**: Both NextAuth and custom JWT for session handling

---

_Last updated: December 3, 2025_
