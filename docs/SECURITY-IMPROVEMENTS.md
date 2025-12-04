# Security & Architecture Improvements

This document summarizes the critical security and architectural changes made to the straturaos project.

## Changes Overview

### 1. ✅ Rate Limiting (Upstash Redis)

**File:** `lib/security/rate-limit.js`

**Problem:** The previous in-memory rate limiting was ineffective on serverless platforms like Vercel because each function invocation has its own memory space.

**Solution:** Implemented distributed rate limiting using Upstash Redis with automatic fallback to in-memory for development.

**Features:**

- Sliding window algorithm for accurate rate limiting
- Automatic detection of Upstash credentials
- Fallback to in-memory for development/testing
- Configurable limits per endpoint type
- Rate limit headers in responses

**Required Environment Variables:**

```env
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

**Usage:**

```javascript
import { withRateLimit, RATE_LIMITS } from "../lib/security/rate-limit";

export default withRateLimit(handler, "auth", RATE_LIMITS.auth);
```

---

### 2. ✅ CSRF Protection

**File:** `lib/security/csrf.js`

**Problem:** Custom auth endpoints (register, forgot-password, reset-password) lacked CSRF protection, making them vulnerable to cross-site request forgery attacks.

**Solution:** Implemented CSRF protection middleware with:

- Origin/Referer validation
- Token-based protection (optional extra layer)
- Integration with NextAuth's CSRF handling for authenticated sessions

**Updated Endpoints:**

- `pages/api/auth/register.js`
- `pages/api/auth/forgot-password.js`
- `pages/api/auth/reset-password.js`

**Usage:**

```javascript
import { withCsrfProtection } from "../lib/security/csrf";

export default withCsrfProtection(handler, { skipInDev: true });
```

---

### 3. ✅ Input Validation (Zod)

**File:** `lib/validation/schemas.js`

**Problem:** API endpoints lacked consistent input validation, allowing potentially malicious or malformed data.

**Solution:** Created comprehensive Zod validation schemas for all API inputs:

**Schemas Included:**

- Auth: `registerSchema`, `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`
- Events: `createEventSchema`, `updateEventSchema`
- Tasks: `createTaskSchema`, `updateTaskSchema`
- Courses: `createCourseSchema`, `updateCourseSchema`
- Focus Sessions: `focusSessionSchema`
- Attendance: `attendanceRecordSchema`
- Settings: `userSettingsSchema`

**Usage:**

```javascript
import { withValidation, createEventSchema } from "../lib/validation/schemas";

export default withValidation(handler, createEventSchema);
```

---

### 4. ✅ Timezone Handling (UTC)

**File:** `lib/timezone.js`

**Problem:** Hardcoded Arabia timezone offset (-180 minutes) caused issues when server timezone differed from expected.

**Solution:**

- Store all dates in UTC
- Let clients handle timezone conversion for display
- Created utility functions for consistent date handling

**Key Functions:**

- `parseDateForStorage()` - Parse dates to UTC
- `toDateString()` - Format to YYYY-MM-DD
- `toTimeString()` - Format to HH:MM
- `normalizeEventDates()` - Normalize event dates for API response
- `resolveTimezone()` - Resolve timezone aliases to IANA names

**Updated Files:**

- `pages/api/events/index.js` - Removed hardcoded Arabia offset

---

### 5. ✅ Task Utilities Extraction

**File:** `lib/task-utils.js`

**Problem:** The `pages/tasks.js` file was 4,513 lines - a monolithic file that's hard to maintain.

**Solution:** Extracted utility functions to a separate module:

- Priority handling (`normalizePriority`, `getPriorityMeta`)
- Status handling (`normalizeStatus`)
- Date utilities (`getStartOfDay`, `addDays`, `getStartOfWeek`)
- Formatting (`formatShortDate`, `formatTimeRange`)
- Natural language date parsing (`parseNaturalDate`)
- Task grouping (`groupTasksBySection`)

**Note:** Full component extraction is recommended as a follow-up task.

---

### 6. ✅ Error Logging Infrastructure

**File:** `lib/logger.js`

**Problem:** Inconsistent error logging made debugging and monitoring difficult.

**Solution:** Created comprehensive logging infrastructure:

**Features:**

- Severity levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- Error categorization (AUTH, DATABASE, VALIDATION, etc.)
- Request context extraction
- Unique error IDs for tracking
- Pluggable handlers (console, JSON, external services)
- Middleware for automatic error logging

**Usage:**

```javascript
import logger, { withErrorLogging } from "../lib/logger";

// Manual logging
logger.error("Failed to process request", error, { userId: user.id });

// Middleware
export default withErrorLogging(handler);
```

---

## New Dependencies

```json
{
  "@upstash/ratelimit": "^x.x.x",
  "@upstash/redis": "^x.x.x",
  "zod": "^x.x.x"
}
```

---

## Environment Variables Required

Add these to your `.env` file for production:

```env
# Upstash Redis (required for distributed rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Optional: Custom CSRF secret (defaults to NEXTAUTH_SECRET)
CSRF_SECRET=your-csrf-secret
```

---

## Migration Notes

1. **Rate Limiting:** Works without Upstash in development, but configure Upstash for production
2. **CSRF:** Enabled by default, with `skipInDev: true` for easier development
3. **Validation:** Existing endpoints continue to work; validation is opt-in per endpoint
4. **Timezone:** Existing data may need migration if stored with timezone-specific values

---

## Recommended Follow-up Tasks

1. **Component Extraction:** Further break down `tasks.js` into smaller components
2. **Test Coverage:** Add unit tests for new security modules
3. **API Validation:** Apply Zod validation to remaining API endpoints
4. **Error Monitoring:** Integrate with Sentry or similar service
5. **Database Audit:** Review and optimize database queries

---

## Testing the Changes

1. **Rate Limiting:**

   ```bash
   # Make multiple rapid requests to test rate limiting
   for i in {1..10}; do curl -X POST http://localhost:3000/api/auth/register -d '{}'; done
   ```

2. **CSRF:** Test that cross-origin requests are blocked in production

3. **Validation:** Test with invalid input to verify proper error messages

4. **Build:** Run `npm run build` to verify no compilation errors
