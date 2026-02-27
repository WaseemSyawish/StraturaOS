/**
 * Activity Logger — Server-side helper to record task/list activity
 * ─────────────────────────────────────────────────────────────────
 * Records who did what, when — powers the activity feed.
 *
 * Usage:
 *   import { logActivity } from '../lib/activity-logger';
 *   await logActivity(prisma, { userId, eventId, action: 'completed', details: { title } });
 */

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {Object} params
 * @param {string} params.userId     — Who performed the action
 * @param {string} [params.eventId]  — Related task/event ID
 * @param {string} [params.listId]   — Related task list ID
 * @param {string} params.action     — Action identifier
 * @param {Object} [params.details]  — Additional context (JSON-serializable)
 */
export async function logActivity(prisma, { userId, eventId = null, listId = null, action, details = null }) {
  if (!userId || !action) return null;

  try {
    return await prisma.activityLog.create({
      data: {
        user_id: userId,
        event_id: eventId,
        list_id: listId,
        action,
        details: details || undefined,
      },
    });
  } catch (err) {
    // Gracefully fail — activity logging should never block the main operation
    console.warn('[activity-logger] Failed to log activity:', err.message);
    return null;
  }
}

/**
 * Common action constants for consistency.
 */
export const ACTIONS = {
  TASK_CREATED: 'task_created',
  TASK_COMPLETED: 'task_completed',
  TASK_UNCOMPLETED: 'task_uncompleted',
  TASK_UPDATED: 'task_updated',
  TASK_DELETED: 'task_deleted',
  TASK_MOVED: 'task_moved',
  TASK_ASSIGNED: 'task_assigned',
  TASK_UNASSIGNED: 'task_unassigned',
  PRIORITY_CHANGED: 'priority_changed',
  STATUS_CHANGED: 'status_changed',
  TAG_ADDED: 'tag_added',
  TAG_REMOVED: 'tag_removed',
  SUBTASK_ADDED: 'subtask_added',
  SUBTASK_COMPLETED: 'subtask_completed',
  DUE_DATE_CHANGED: 'due_date_changed',
  COMMENT_ADDED: 'comment_added',
  COMMENT_DELETED: 'comment_deleted',
  LIST_CREATED: 'list_created',
  LIST_UPDATED: 'list_updated',
  LIST_DELETED: 'list_deleted',
  LIST_SHARED: 'list_shared',
  MEMBER_ADDED: 'member_added',
  MEMBER_REMOVED: 'member_removed',
  MEMBER_ROLE_CHANGED: 'member_role_changed',
  CALENDAR_SYNCED: 'calendar_synced',
};

export default logActivity;
