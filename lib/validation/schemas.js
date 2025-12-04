/**
 * Zod validation schemas for API routes
 * 
 * This module provides type-safe validation for all API inputs,
 * preventing invalid data from reaching the database.
 */

import { z } from 'zod';

// ============================================================================
// Common/Reusable Schemas
// ============================================================================

/**
 * Email schema with normalization
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .transform((v) => v.toLowerCase().trim());

/**
 * UUID schema
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Password schema with strength requirements
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .refine((v) => /[a-z]/.test(v), 'Password must contain a lowercase letter')
  .refine((v) => /[A-Z]/.test(v), 'Password must contain an uppercase letter')
  .refine((v) => /\d/.test(v), 'Password must contain a number');

/**
 * Safe string schema (sanitized, prevents XSS)
 */
export const safeStringSchema = (maxLength = 1000) =>
  z
    .string()
    .max(maxLength)
    .transform((v) =>
      v
        .trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
    );

/**
 * Date string schema (YYYY-MM-DD format)
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)')
  .refine((v) => !isNaN(Date.parse(v)), 'Invalid date');

/**
 * Time string schema (HH:MM format)
 */
export const timeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Invalid time format (expected HH:MM)')
  .refine((v) => {
    const [h, m] = v.split(':').map(Number);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  }, 'Invalid time value');

/**
 * ISO datetime schema
 */
export const isoDateTimeSchema = z
  .string()
  .datetime({ message: 'Invalid ISO datetime format' });

/**
 * Hex color schema
 */
export const colorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format')
  .optional()
  .nullable();

// ============================================================================
// Auth Schemas
// ============================================================================

export const registerSchema = z.object({
  name: safeStringSchema(100).optional().nullable(),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().optional(),
    email: emailSchema.optional(),
    currentPassword: z.string().optional(),
    newPassword: passwordSchema,
  })
  .refine(
    (data) => data.token || (data.email && data.currentPassword),
    'Either reset token or email + current password is required'
  );

// ============================================================================
// Event Schemas
// ============================================================================

export const eventTypeSchema = z.enum([
  'assignment',
  'exam',
  'quiz',
  'lecture',
  'lab',
  'tutorial',
  'project',
  'presentation',
  'meeting',
  'deadline',
  'holiday',
  'other',
]);

export const repeatOptionSchema = z.enum([
  'none',
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'every-2-3-4',
]).optional().nullable();

export const createEventSchema = z.object({
  title: safeStringSchema(200),
  type: eventTypeSchema.optional().default('assignment'),
  courseId: z.string().optional().nullable(),
  date: dateStringSchema,
  time: timeStringSchema.optional().nullable(),
  endDate: z.string().optional().nullable(),
  description: safeStringSchema(5000).optional().nullable(),
  location: safeStringSchema(200).optional().nullable(),
  room: safeStringSchema(200).optional().nullable(),
  color: colorSchema,
  durationMinutes: z.number().int().min(1).max(1440).optional().nullable(),
  repeatOption: repeatOptionSchema,
  priority: z.enum(['low', 'medium', 'high']).optional().nullable(),
  // Recurrence options
  byDays: z.array(z.number().int().min(0).max(6)).optional(),
  interval: z.number().int().min(1).max(52).optional(),
  materialize: z.boolean().optional(),
  materializeCount: z.number().int().min(1).max(365).optional(),
  materializeUntil: dateStringSchema.optional(),
  // Template options
  isTemplate: z.boolean().optional(),
  templateModules: z.array(z.any()).optional(),
  // Meta information
  meta: z.record(z.any()).optional(),
  startDate: isoDateTimeSchema.optional(),
  userId: z.string().optional(), // For dev mode only
});

export const updateEventSchema = createEventSchema.partial().extend({
  id: z.string(),
  completed: z.boolean().optional(),
  archived: z.boolean().optional(),
});

// ============================================================================
// Task Schemas
// ============================================================================

export const taskPrioritySchema = z.enum(['low', 'medium', 'high']);
export const taskStatusSchema = z.enum(['todo', 'in-progress', 'done', 'cancelled']);

export const createTaskSchema = z.object({
  title: safeStringSchema(200),
  description: safeStringSchema(5000).optional().nullable(),
  dueDate: dateStringSchema.optional().nullable(),
  priority: taskPrioritySchema.optional().default('medium'),
  status: taskStatusSchema.optional().default('todo'),
  courseId: z.string().optional().nullable(),
  eventId: z.string().optional().nullable(),
  estimatedMinutes: z.number().int().min(1).max(1440).optional().nullable(),
  tags: z.array(safeStringSchema(50)).max(10).optional(),
  subtasks: z.array(z.object({
    title: safeStringSchema(200),
    completed: z.boolean().optional().default(false),
  })).max(50).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string(),
  completedAt: isoDateTimeSchema.optional().nullable(),
});

// ============================================================================
// Course Schemas
// ============================================================================

export const createCourseSchema = z.object({
  name: safeStringSchema(200),
  code: safeStringSchema(20).optional().nullable(),
  color: colorSchema,
  credits: z.number().int().min(0).max(20).optional().nullable(),
  instructor: safeStringSchema(100).optional().nullable(),
  room: safeStringSchema(100).optional().nullable(),
  description: safeStringSchema(2000).optional().nullable(),
  semester: safeStringSchema(50).optional().nullable(),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  id: z.string(),
});

// ============================================================================
// Focus Session Schemas
// ============================================================================

export const focusSessionSchema = z.object({
  duration: z.number().int().min(1).max(480), // Max 8 hours
  taskId: z.string().optional().nullable(),
  courseId: z.string().optional().nullable(),
  notes: safeStringSchema(2000).optional().nullable(),
  interruptions: z.number().int().min(0).max(100).optional().default(0),
});

// ============================================================================
// Attendance Schemas
// ============================================================================

export const attendanceStatusSchema = z.enum(['present', 'absent', 'late', 'excused']);

export const attendanceRecordSchema = z.object({
  courseId: z.string(),
  date: dateStringSchema,
  status: attendanceStatusSchema,
  notes: safeStringSchema(500).optional().nullable(),
});

// ============================================================================
// Settings Schemas
// ============================================================================

export const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  timezone: safeStringSchema(50).optional(),
  weekStartsOn: z.number().int().min(0).max(6).optional(),
  defaultEventDuration: z.number().int().min(15).max(480).optional(),
  focusDefaultDuration: z.number().int().min(5).max(120).optional(),
  focusBreakDuration: z.number().int().min(1).max(60).optional(),
  notifications: z.object({
    enabled: z.boolean().optional(),
    reminders: z.boolean().optional(),
    email: z.boolean().optional(),
  }).optional(),
});

// ============================================================================
// Validation Middleware Helper
// ============================================================================

/**
 * Validate request body with a Zod schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns Middleware function
 */
export function validateBody(schema) {
  return async (req, res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      if (typeof next === 'function') {
        return next();
      }
      return { valid: true, data: req.body };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        
        if (res) {
          return res.status(400).json({
            error: 'Validation failed',
            details: errors,
          });
        }
        return { valid: false, errors };
      }
      throw error;
    }
  };
}

/**
 * Validate request query parameters with a Zod schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 */
export function validateQuery(schema) {
  return async (req, res, next) => {
    try {
      req.query = await schema.parseAsync(req.query);
      if (typeof next === 'function') {
        return next();
      }
      return { valid: true, data: req.query };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        
        if (res) {
          return res.status(400).json({
            error: 'Invalid query parameters',
            details: errors,
          });
        }
        return { valid: false, errors };
      }
      throw error;
    }
  };
}

/**
 * Wrapper that validates request body before calling handler
 * @param {function} handler - API route handler
 * @param {z.ZodSchema} schema - Zod schema for body validation
 */
export function withValidation(handler, schema) {
  return async (req, res) => {
    // Skip validation for GET requests
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return handler(req, res);
    }
    
    try {
      req.body = await schema.parseAsync(req.body || {});
      return handler(req, res);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      }
      throw error;
    }
  };
}

export default {
  // Common schemas
  emailSchema,
  uuidSchema,
  passwordSchema,
  safeStringSchema,
  dateStringSchema,
  timeStringSchema,
  isoDateTimeSchema,
  colorSchema,
  // Auth schemas
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  // Event schemas
  eventTypeSchema,
  repeatOptionSchema,
  createEventSchema,
  updateEventSchema,
  // Task schemas
  taskPrioritySchema,
  taskStatusSchema,
  createTaskSchema,
  updateTaskSchema,
  // Course schemas
  createCourseSchema,
  updateCourseSchema,
  // Focus schemas
  focusSessionSchema,
  // Attendance schemas
  attendanceStatusSchema,
  attendanceRecordSchema,
  // Settings schemas
  userSettingsSchema,
  // Helpers
  validateBody,
  validateQuery,
  withValidation,
};
