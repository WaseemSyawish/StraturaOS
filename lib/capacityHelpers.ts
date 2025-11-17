// lib/capacityHelpers.ts
// Utilities for detecting schedule overload and event conflicts

import { Event } from '../src/types/index';

export interface ConflictInfo {
  hasConflict: boolean;
  conflictingEvents: Event[];
  overlapMinutes: number;
}

export interface CapacityInfo {
  totalMinutes: number;
  totalHours: number;
  isOverloaded: boolean;
  warningLevel: 'none' | 'warning' | 'critical';
  events: Event[];
  suggestedBreaks?: number; // Number of breaks needed
  missingBufferTime?: number; // Minutes of buffer time missing between events
}

// Maximum realistic hours per day
const MAX_HOURS_WARNING = 10; // Yellow warning
const MAX_HOURS_CRITICAL = 12; // Red warning

/**
 * Parse time string to minutes from midnight
 */
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Get duration from event in minutes
 */
function getEventDuration(event: Event): number {
  // Try to get duration from meta
  const meta = (event as any).meta;
  if (meta?.durationMinutes && typeof meta.durationMinutes === 'number') {
    return meta.durationMinutes;
  }

  // Calculate from start and end dates
  if (event.startDate && event.endDate) {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
  }

  // Default to 60 minutes
  return 60;
}

/**
 * Get event start time in minutes from midnight
 */
function getEventStartMinutes(event: Event): number {
  if (event.time) {
    return timeToMinutes(event.time);
  }

  if (event.startDate) {
    const date = new Date(event.startDate);
    return date.getHours() * 60 + date.getMinutes();
  }

  return 0;
}

/**
 * Check if two events overlap in time
 */
export function eventsOverlap(event1: Event, event2: Event): { overlaps: boolean; minutes: number } {
  const start1 = getEventStartMinutes(event1);
  const duration1 = getEventDuration(event1);
  const end1 = start1 + duration1;

  const start2 = getEventStartMinutes(event2);
  const duration2 = getEventDuration(event2);
  const end2 = start2 + duration2;

  // Check for overlap
  const overlaps = start1 < end2 && start2 < end1;
  
  if (!overlaps) {
    return { overlaps: false, minutes: 0 };
  }

  // Calculate overlap duration
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  const overlapMinutes = overlapEnd - overlapStart;

  return { overlaps: true, minutes: overlapMinutes };
}

/**
 * Check if an event conflicts with any other events on the same day
 */
export function detectConflicts(event: Event, allEvents: Event[]): ConflictInfo {
  const eventDate = new Date(event.date || event.startDate);
  const eventDateStr = eventDate.toISOString().split('T')[0];

  const conflictingEvents: Event[] = [];
  let totalOverlapMinutes = 0;

  for (const otherEvent of allEvents) {
    // Skip self
    if (otherEvent.id === event.id) continue;

    // Skip archived events
    if (otherEvent.archived) continue;

    // Check if same day
    const otherDate = new Date(otherEvent.date || otherEvent.startDate);
    const otherDateStr = otherDate.toISOString().split('T')[0];

    if (eventDateStr !== otherDateStr) continue;

    // Check for time overlap
    const { overlaps, minutes } = eventsOverlap(event, otherEvent);
    if (overlaps) {
      conflictingEvents.push(otherEvent);
      totalOverlapMinutes += minutes;
    }
  }

  return {
    hasConflict: conflictingEvents.length > 0,
    conflictingEvents,
    overlapMinutes: totalOverlapMinutes,
  };
}

/**
 * Calculate total scheduled time for a specific day
 */
export function calculateDayCapacity(date: Date | string, events: Event[]): CapacityInfo {
  const targetDateStr = new Date(date).toISOString().split('T')[0];

  // Filter events for this day (excluding archived)
  const dayEvents = events.filter(event => {
    if (event.archived) return false;
    const eventDate = new Date(event.date || event.startDate);
    const eventDateStr = eventDate.toISOString().split('T')[0];
    return eventDateStr === targetDateStr;
  });

  // Sort events by start time for buffer/break calculations
  const sortedEvents = [...dayEvents].sort((a, b) => {
    const startA = getEventStartMinutes(a);
    const startB = getEventStartMinutes(b);
    return startA - startB;
  });

  // Calculate total duration
  let totalMinutes = 0;
  for (const event of dayEvents) {
    totalMinutes += getEventDuration(event);
  }

  const totalHours = totalMinutes / 60;

  // Calculate needed breaks (one 10-min break per 2 hours of continuous work)
  const suggestedBreaks = Math.floor(totalHours / 2);

  // Calculate missing buffer time between consecutive events
  let missingBufferTime = 0;
  const BUFFER_MINUTES = 10; // Recommended buffer between events

  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const current = sortedEvents[i];
    const next = sortedEvents[i + 1];
    
    const currentEnd = getEventStartMinutes(current) + getEventDuration(current);
    const nextStart = getEventStartMinutes(next);
    const actualBuffer = nextStart - currentEnd;
    
    if (actualBuffer < BUFFER_MINUTES) {
      missingBufferTime += (BUFFER_MINUTES - actualBuffer);
    }
  }

  // Determine warning level
  let warningLevel: 'none' | 'warning' | 'critical' = 'none';
  let isOverloaded = false;

  if (totalHours >= MAX_HOURS_CRITICAL) {
    warningLevel = 'critical';
    isOverloaded = true;
  } else if (totalHours >= MAX_HOURS_WARNING) {
    warningLevel = 'warning';
    isOverloaded = true;
  }

  return {
    totalMinutes,
    totalHours,
    isOverloaded,
    warningLevel,
    events: dayEvents,
    suggestedBreaks: suggestedBreaks > 0 ? suggestedBreaks : undefined,
    missingBufferTime: missingBufferTime > 0 ? missingBufferTime : undefined,
  };
}

/**
 * Get capacity info for multiple days
 */
export function calculateWeekCapacity(startDate: Date, events: Event[]): Map<string, CapacityInfo> {
  const capacityMap = new Map<string, CapacityInfo>();

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const capacity = calculateDayCapacity(date, events);
    capacityMap.set(dateStr, capacity);
  }

  return capacityMap;
}

/**
 * Format capacity info for display
 */
export function formatCapacityWarning(capacity: CapacityInfo): string {
  const hours = Math.floor(capacity.totalHours);
  const minutes = Math.round((capacity.totalHours - hours) * 60);

  if (capacity.warningLevel === 'critical') {
    return `⚠️ Critical overload: ${hours}h ${minutes}m scheduled (max recommended: ${MAX_HOURS_CRITICAL}h)`;
  } else if (capacity.warningLevel === 'warning') {
    return `⚠️ Heavy schedule: ${hours}h ${minutes}m scheduled (recommended: <${MAX_HOURS_WARNING}h)`;
  }

  return `${hours}h ${minutes}m scheduled`;
}

/**
 * Format conflict info for display
 */
export function formatConflictWarning(conflict: ConflictInfo): string {
  if (!conflict.hasConflict) return '';

  const count = conflict.conflictingEvents.length;
  const eventNames = conflict.conflictingEvents.map(e => e.title).join(', ');

  if (count === 1) {
    return `⚠️ Time conflict with: ${eventNames}`;
  }

  return `⚠️ Time conflicts with ${count} events: ${eventNames}`;
}
