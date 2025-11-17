// src/components/CapacityIndicator.tsx
// Visual indicator for schedule overload and conflicts

import React from 'react';
import { CapacityInfo, ConflictInfo, formatCapacityWarning, formatConflictWarning } from '../../lib/capacityHelpers';

interface CapacityIndicatorProps {
  capacity?: CapacityInfo;
  conflict?: ConflictInfo;
  compact?: boolean;
  className?: string;
}

export function CapacityIndicator({ capacity, conflict, compact = false, className = '' }: CapacityIndicatorProps) {
  const hasWarning = capacity?.isOverloaded || conflict?.hasConflict;

  if (!hasWarning) return null;

  const warningColor = capacity?.warningLevel === 'critical' 
    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
    : capacity?.warningLevel === 'warning'
    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${warningColor} ${className}`}>
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {capacity && <span className="text-xs font-medium">{Math.round(capacity.totalHours)}h</span>}
        {conflict?.hasConflict && <span className="text-xs font-medium">{conflict.conflictingEvents.length} conflicts</span>}
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg border ${warningColor} ${className}`}>
      <div className="flex items-start gap-2">
        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div className="flex-1 min-w-0">
          {capacity && capacity.isOverloaded && (
            <p className="text-sm font-medium mb-1">
              {formatCapacityWarning(capacity)}
            </p>
          )}
          {conflict && conflict.hasConflict && (
            <p className="text-sm font-medium mb-1">
              {formatConflictWarning(conflict)}
            </p>
          )}
          {capacity && capacity.isOverloaded && (
            <p className="text-xs mt-1 opacity-90">
              Consider rescheduling some tasks or breaking them into smaller chunks for better focus.
            </p>
          )}
          {capacity && capacity.suggestedBreaks && capacity.suggestedBreaks > 0 && (
            <p className="text-xs mt-1 opacity-90 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recommend {capacity.suggestedBreaks} × 10-minute break{capacity.suggestedBreaks > 1 ? 's' : ''} throughout the day
            </p>
          )}
          {capacity && capacity.missingBufferTime && capacity.missingBufferTime > 0 && (
            <p className="text-xs mt-1 opacity-90 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Need {capacity.missingBufferTime} minutes more buffer time between events
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface DayCapacityBadgeProps {
  capacity: CapacityInfo;
  showDetails?: boolean;
}

export function DayCapacityBadge({ capacity, showDetails = false }: DayCapacityBadgeProps) {
  if (!capacity.isOverloaded && !showDetails) return null;

  const hours = Math.floor(capacity.totalHours);
  const badgeColor = capacity.warningLevel === 'critical'
    ? 'bg-red-500 text-white'
    : capacity.warningLevel === 'warning'
    ? 'bg-amber-500 text-white'
    : 'bg-gray-300 text-gray-700';

  return (
    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold ${badgeColor}`}>
      {capacity.isOverloaded && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )}
      {hours}h
    </div>
  );
}

interface ConflictBadgeProps {
  conflict: ConflictInfo;
}

export function ConflictBadge({ conflict }: ConflictBadgeProps) {
  if (!conflict.hasConflict) return null;

  return (
    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-red-500 text-white">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      {conflict.conflictingEvents.length}
    </div>
  );
}
