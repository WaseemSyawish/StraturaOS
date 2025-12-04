# StraturaOS - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Getting Started](#getting-started)
4. [Core Features](#core-features)
5. [Technical Stack](#technical-stack)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Deployment Guide](#deployment-guide)
9. [Configuration](#configuration)
10. [Troubleshooting](#troubleshooting)

---

## Overview

**StraturaOS** is a comprehensive academic management system designed specifically for university students. It provides an all-in-one platform to manage courses, track grades, schedule events, monitor attendance, and organize academic life efficiently.

### Key Capabilities

- 📚 **Course Management** - Organize modules with credits, instructors, and semesters
- 📊 **Grade Tracking** - Monitor academic performance with detailed grading categories
- 📅 **Smart Scheduling** - Automated timetable generation with recurring events
- ✅ **Attendance Monitoring** - Track class attendance with point systems
- 📆 **Calendar Integration** - Unified view of assignments, exams, and events
- 🌙 **Dark Mode** - Full theme support with automatic system detection
- 🔐 **Secure Authentication** - User accounts with NextAuth.js
- 🌍 **Holiday Integration** - Automatic holiday detection for Iraq and Kurdistan regions

---

## System Architecture

### Application Structure

```
straturaos/
├── pages/                      # Next.js pages and API routes
│   ├── api/                    # Backend API endpoints
│   │   ├── auth/               # Authentication endpoints
│   │   ├── courses.js          # Course management
│   │   ├── events.js           # Event CRUD operations
│   │   ├── grades.js           # Grade tracking
│   │   ├── attendance.js       # Attendance logging
│   │   └── semester-settings.js # Semester configuration
│   ├── index.js                # Landing page
│   ├── dashboard.js            # Main dashboard
│   ├── calendar.js             # Calendar view
│   ├── timetable.js            # Weekly timetable
│   ├── timetable-setup.js      # Smart schedule creator
│   ├── modules.js              # Course manager
│   ├── grades.js               # Grade tracking interface
│   ├── attendance.js           # Attendance tracker
│   └── archived.js             # Archived events
├── src/
│   ├── components/             # React components
│   │   ├── schedule/           # Scheduler components (mina-scheduler)
│   │   ├── ui/                 # UI components
│   │   └── Timetable/          # Timetable-specific components
│   ├── providers/              # Context providers
│   └── utils/                  # Utility functions
├── prisma/
│   └── schema.prisma           # Database schema
├── lib/                        # Server-side utilities
├── data/                       # JSON data files (fallback)
└── public/                     # Static assets
```

### Technology Stack

#### Frontend

- **Framework**: Next.js 14.2.18 (React 18.3.1)
- **Styling**: Tailwind CSS with custom dark mode
- **UI Components**:
  - Custom components
  - Lucide React icons
  - Radix UI primitives
  - NextUI components
- **State Management**: React Context API
- **Scheduling**: mina-scheduler (custom integration)

#### Backend

- **API**: Next.js API Routes
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: NextAuth.js 4.24.11
- **Security**: bcryptjs for password hashing

#### Infrastructure

- **Hosting**: Vercel (recommended)
- **Database**: Railway PostgreSQL / Neon / Supabase
- **Email**: Resend (for password reset)

---

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL database
- npm or yarn package manager

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
   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
   DIRECT_URL="postgresql://user:password@host:port/database?sslmode=require"

   # Authentication
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"

   # Email (for password reset)
   RESEND_API_KEY="your-resend-api-key"
   FROM_EMAIL="noreply@yourdomain.com"

   # Optional
   NODE_ENV="development"
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate deploy
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Core Features

### 1. Course Management (Modules)

**Location**: `/modules`

Comprehensive course organization with:

- Course metadata (name, code, credits, color, instructor)
- Semester assignment with date ranges
- Course archiving and deletion
- Color-coded visual organization
- Semester filtering and grouping

**Key Operations**:

- Add new courses
- Edit course details
- Assign courses to semesters
- Archive completed courses
- Configure semester settings

### 2. Grade Tracking

**Location**: `/grades`

Detailed academic performance monitoring:

- **Grading Categories**: Exams, quizzes, assignments, projects, labs, participation
- **Category Weighting**: Percentage-based grade calculation
- **Individual Items**: Track scores for specific assignments/tests
- **Automatic Calculations**: Real-time GPA and letter grade computation
- **Statistics Dashboard**: Current GPA, total credits, average grade

**Grade Scale**:

- A: 93-100%
- A-: 90-92%
- B+: 87-89%
- B: 83-86%
- B-: 80-82%
- C+: 77-79%
- C: 73-76%
- C-: 70-72%
- D+: 67-69%
- D: 60-66%
- F: Below 60%

### 3. Smart Timetable

**Location**: `/timetable`, `/timetable-setup`

Automated weekly schedule generation:

- **Smart Schedule Creator**: Multi-step wizard for course scheduling
- **Session Types**: Lectures, tutorials, labs, office hours
- **Recurring Events**: Automatic weekly repetition
- **Time Slot Management**: Visual time picker with conflict detection
- **Location Tracking**: Room/building information
- **Bulk Operations**: Edit entire series or single instances

**Features**:

- Day/Week/Month views
- Drag-and-drop event management
- Color-coded by course
- Event templates and patterns
- Export to calendar formats

### 4. Calendar & Events

**Location**: `/calendar`

Unified calendar view combining:

- Academic assignments
- Exams and tests
- Course schedules
- Custom events
- Regional holidays (Iraq/Kurdistan)

**Event Types**:

- Assignment
- Exam
- Quiz
- Project
- Meeting
- Study Session
- Other

**Calendar Features**:

- Month grid view with event previews
- Daily event sidebar
- Holiday highlighting
- Quick event creation
- Event completion tracking
- Archive management

### 5. Attendance Tracking

**Location**: `/attendance`

Comprehensive attendance monitoring:

- **Status Options**: Present, Absent, Late, Excused, Holiday
- **Point System**: Configurable points per status
- **Statistics**: Attendance rates, total points, session counts
- **Visualization**: Progress bars and color-coded indicators
- **Historical Records**: Full attendance history per course
- **Bulk Operations**: Multi-date selection and status updates

**Attendance Reports**:

- Overall attendance percentage
- Points earned vs. possible
- Sessions per status type
- Course-specific breakdowns

### 6. Dashboard Overview

**Location**: `/dashboard`

Centralized hub displaying:

- Today's schedule
- Upcoming deadlines (7-day forecast)
- Quick course access
- Attendance summary
- Recent activity
- Week-at-a-glance calendar

---

## Technical Stack

### Frontend Technologies

#### React & Next.js

- **Server-Side Rendering (SSR)**: Improved performance and SEO
- **API Routes**: Built-in backend endpoints
- **File-based Routing**: Automatic route generation
- **Image Optimization**: Next.js Image component
- **Static Generation**: Pre-rendered pages where possible

#### Styling & Design System

- **Tailwind CSS**: Utility-first CSS framework
- **Dark Mode**: Class-based theme switching with system detection
- **Responsive Design**: Mobile-first approach
- **Custom Components**: Reusable UI primitives
- **Animations**: CSS transitions and animations

#### State Management

- **React Context**: Global state for auth, theme, modals
- **Local State**: Component-level state with hooks
- **URL State**: Query parameters for filters

### Backend Architecture

#### Database Layer

```prisma
// Core Models
- User: Authentication and user data
- Course: Academic course information
- Event: Calendar events and assignments
- EventTemplate: Recurring event patterns
- Assessment: Grading categories and items
- AttendanceSession: Class attendance records
- SemesterSetting: Academic semester configuration
- ArchivedEvent: Completed/past events
- Attachment: File attachments for events
```

#### API Design

RESTful endpoints following standard conventions:

- `GET`: Retrieve resources
- `POST`: Create new resources
- `PUT`: Update existing resources
- `DELETE`: Remove resources

**Authentication**: NextAuth.js with JWT sessions
**Authorization**: User-scoped queries with Prisma

---

## Database Schema

### Core Tables

#### users

Stores user authentication and profile data.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR,
  name VARCHAR,
  settings JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### courses

Manages academic courses.

```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  code VARCHAR,
  credits INTEGER DEFAULT 3,
  color VARCHAR,
  semester VARCHAR,
  instructor VARCHAR,
  description TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### assessments

Tracks grading categories and items.

```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  type VARCHAR DEFAULT 'assignment',
  weight FLOAT,
  items JSON DEFAULT '[]',
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### events

Stores calendar events and assignments.

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR NOT NULL,
  type VARCHAR DEFAULT 'assignment',
  location VARCHAR,
  archived BOOLEAN DEFAULT FALSE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  template_id UUID REFERENCES event_templates(id) ON DELETE CASCADE,
  date TIMESTAMP NOT NULL,
  time VARCHAR,
  end_date TIMESTAMP,
  description TEXT,
  meta JSON,
  completed BOOLEAN DEFAULT FALSE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### semester_settings

Manages academic semester configurations.

```sql
CREATE TABLE semester_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### attendance_sessions

Logs class attendance records.

```sql
CREATE TABLE attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMP NOT NULL,
  status attendance_status NOT NULL,
  points INTEGER DEFAULT 0,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE attendance_status AS ENUM (
  'PRESENT',
  'ABSENT',
  'HOLIDAY',
  'EXCUSED',
  'LATE'
);
```

---

## API Reference

### Authentication Endpoints

#### POST `/api/auth/signup`

Create a new user account.

**Request Body**:

```json
{
  "email": "student@university.edu",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Account created successfully"
}
```

#### POST `/api/auth/signin`

Authenticate user and create session.

**Request Body**:

```json
{
  "email": "student@university.edu",
  "password": "securePassword123"
}
```

#### GET `/api/auth/me`

Get current authenticated user.

**Response**:

```json
{
  "id": "uuid",
  "email": "student@university.edu",
  "name": "John Doe"
}
```

### Course Management

#### GET `/api/courses`

Retrieve all courses for authenticated user.

**Response**:

```json
{
  "success": true,
  "courses": [
    {
      "id": "uuid",
      "name": "Data Structures",
      "code": "CS201",
      "credits": 3,
      "color": "#3B82F6",
      "semester": "semester-uuid",
      "instructor": "Dr. Smith",
      "description": "Introduction to data structures"
    }
  ]
}
```

#### POST `/api/courses`

Create a new course.

**Request Body**:

```json
{
  "name": "Algorithms",
  "code": "CS301",
  "credits": 3,
  "color": "#10B981",
  "semester": "semester-uuid",
  "instructor": "Prof. Johnson"
}
```

#### PUT `/api/courses/:id`

Update an existing course.

#### DELETE `/api/courses/:id`

Delete a course.

### Grade Management

#### GET `/api/grades`

Retrieve grades for all courses.

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "course-uuid",
      "name": "Data Structures",
      "code": "CS201",
      "assessments": [
        {
          "id": "assessment-uuid",
          "name": "Midterm Exam",
          "type": "exam",
          "weight": 30,
          "items": [
            {
              "id": "item-id",
              "name": "Midterm 1",
              "score": 85,
              "maxScore": 100
            }
          ]
        }
      ]
    }
  ]
}
```

#### PUT `/api/grades`

Update grades/assessments.

**Request Body** (Add Category):

```json
{
  "courseId": "uuid",
  "action": "add_assessment",
  "assessment": {
    "name": "Final Exam",
    "type": "exam",
    "weight": 40
  }
}
```

**Request Body** (Add Item):

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

### Event Management

#### GET `/api/events`

Retrieve all events for authenticated user.

**Query Parameters**:

- `start`: Start date (ISO format)
- `end`: End date (ISO format)
- `archived`: Include archived events (boolean)

**Response**:

```json
{
  "success": true,
  "events": [
    {
      "id": "uuid",
      "title": "Assignment 1 Due",
      "type": "assignment",
      "date": "2025-11-20T23:59:00Z",
      "time": "23:59",
      "course_id": "course-uuid",
      "completed": false
    }
  ]
}
```

#### POST `/api/events`

Create a new event.

**Request Body**:

```json
{
  "title": "Midterm Exam",
  "type": "exam",
  "date": "2025-11-25",
  "time": "09:00",
  "location": "Room 101",
  "course_id": "course-uuid",
  "description": "Chapters 1-5"
}
```

#### PUT `/api/events/:id`

Update an existing event.

#### DELETE `/api/events/:id`

Delete an event.

**Query Parameters**:

- `scope`: "single" or "all" (for recurring events)
- `templateId`: Template ID (for bulk delete)

### Attendance Management

#### GET `/api/attendance`

Retrieve attendance records.

**Query Parameters**:

- `courseId`: Filter by course
- `startDate`: Start date range
- `endDate`: End date range

#### POST `/api/attendance`

Log attendance session.

**Request Body**:

```json
{
  "courseId": "uuid",
  "date": "2025-11-15",
  "status": "PRESENT",
  "points": 10
}
```

### Semester Settings

#### GET `/api/semester-settings`

Get all semester configurations.

**Response**:

```json
{
  "success": true,
  "semesters": [
    {
      "id": "uuid",
      "name": "2025/2026 - Semester 1",
      "start_date": "2025-09-01",
      "end_date": "2026-01-15",
      "is_active": true
    }
  ]
}
```

#### POST `/api/semester-settings`

Create a new semester.

#### PUT `/api/semester-settings/:id`

Update semester settings.

#### DELETE `/api/semester-settings/:id`

Delete a semester configuration.

---

## Deployment Guide

### Vercel Deployment (Recommended)

1. **Prepare your repository**

   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `straturaos` project

3. **Configure environment variables**
   In Vercel dashboard, add all variables from `.env`:

   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (set to your production URL)
   - `RESEND_API_KEY`
   - `FROM_EMAIL`

4. **Deploy**
   Vercel will automatically deploy on push to main branch.

5. **Run database migrations**
   ```bash
   # After first deployment
   npx prisma migrate deploy
   ```

### Railway Database Setup

1. **Create a new PostgreSQL database** on [Railway](https://railway.app)
2. **Copy connection string** from Railway dashboard
3. **Update environment variables** in Vercel with Railway credentials
4. **Run migrations** using Vercel CLI or Railway terminal

### Post-Deployment Checklist

- [ ] Verify database connection
- [ ] Test user authentication
- [ ] Check API endpoints
- [ ] Validate theme switching
- [ ] Test core features (courses, events, grades)
- [ ] Verify email delivery (password reset)
- [ ] Monitor error logs

---

## Configuration

### Theme Configuration

The application supports automatic theme detection and manual switching:

```javascript
// User settings stored in database
{
  "theme": "dark",      // "light", "dark", or "system"
  "weekStartsOn": 0,    // 0 = Sunday, 1 = Monday
  "defaultView": "week" // "day", "week", or "month"
}
```

### Holiday Configuration

Regional holidays are stored in JSON files:

- `data/holidays-IQ-2025.json` - Iraq holidays
- `data/holidays-iq-kurdistan.json` - Kurdistan holidays
- `data/holidays-academic-2025-2026.json` - Academic calendar

### Email Templates

Email templates for password reset are configured in `/api/auth/request-password-reset.js`.

---

## Troubleshooting

### Common Issues

#### Database Connection Failed

**Problem**: Cannot connect to PostgreSQL database.

**Solutions**:

1. Verify `DATABASE_URL` is correct
2. Check database is running and accessible
3. Verify SSL mode (`?sslmode=require`)
4. Test connection with `npx prisma db push`

#### Authentication Not Working

**Problem**: Cannot sign in or session expires immediately.

**Solutions**:

1. Verify `NEXTAUTH_SECRET` is set
2. Check `NEXTAUTH_URL` matches your domain
3. Clear browser cookies
4. Verify password hashing works: `npm test`

#### Grades Not Saving

**Problem**: Grading categories disappear on refresh.

**Solutions**:

1. Verify `assessments` table exists
2. Run migrations: `npx prisma migrate deploy`
3. Check API logs for errors
4. Verify course_id is valid UUID

#### Events Not Appearing

**Problem**: Created events don't show in calendar.

**Solutions**:

1. Check date format (ISO 8601)
2. Verify user_id matches authenticated user
3. Clear browser cache
4. Check API response for errors

#### Dark Mode Not Working

**Problem**: Theme doesn't switch or appears broken.

**Solutions**:

1. Verify `html.dark` class is applied
2. Check Tailwind CSS compilation
3. Clear browser cache
4. Verify theme setting in user preferences

### Debug Mode

Enable debug logging:

```bash
# Add to .env
DEBUG=true
NODE_ENV=development
```

View detailed logs in browser console and terminal.

### Performance Optimization

#### Slow Page Loads

- Enable caching headers in API routes
- Use `getStaticProps` for static pages
- Optimize images with Next.js Image component
- Implement pagination for large datasets

#### Database Queries

- Add indexes on frequently queried columns
- Use Prisma's `include` selectively
- Implement query result caching
- Monitor slow queries with Prisma logging

---

## Maintenance & Updates

### Database Maintenance

```bash
# Backup database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql

# Clean up old data
# Run from Prisma Studio or custom scripts
```

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Update Prisma
npx prisma migrate dev

# Regenerate Prisma client
npx prisma generate
```

### Monitoring

Recommended monitoring tools:

- **Vercel Analytics** - Page views, performance metrics
- **Sentry** - Error tracking and monitoring
- **LogRocket** - Session replay and debugging
- **Prisma Insights** - Database query performance

---

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Password Hashing**: Use bcryptjs with appropriate salt rounds
3. **SQL Injection**: Always use Prisma parameterized queries
4. **XSS Prevention**: Sanitize user input, use React's built-in escaping
5. **CSRF Protection**: NextAuth.js handles CSRF tokens automatically
6. **Rate Limiting**: Implement rate limiting on authentication endpoints
7. **HTTPS**: Always use HTTPS in production
8. **Session Security**: Set appropriate cookie flags (httpOnly, secure, sameSite)

---

## Contributing

This project is maintained by [WaseemSyawish](https://github.com/WaseemSyawish).

For bug reports and feature requests, please open an issue on GitHub.

---

## License

This project is proprietary software. All rights reserved.

---

## Support

For support and questions:

- GitHub Issues: [straturaos/issues](https://github.com/WaseemSyawish/straturaos/issues)
- Email: support@example.com

---

**Last Updated**: November 15, 2025  
**Version**: 1.0.0  
**Documentation Author**: GitHub Copilot
