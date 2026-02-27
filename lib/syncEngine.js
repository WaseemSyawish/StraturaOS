/**
 * Sync Engine — Client-side bidirectional sync with conflict resolution
 * ─────────────────────────────────────────────────────────────────────
 * Pushes queued offline changes → server, pulls server updates → local cache.
 * Uses optimistic concurrency via task.version field.
 *
 * Conflict strategy:
 *   - server_wins: Server version is kept (default for auto-sync)
 *   - client_wins: Client version overwrites server
 *   - manual:      Surface conflict to user for resolution
 *
 * Usage:
 *   import syncEngine from '../lib/syncEngine';
 *   syncEngine.start({ interval: 30000, onConflict, onSyncComplete });
 *   syncEngine.pushNow();   // force immediate push
 *   syncEngine.stop();
 */

import offlineStore from './offlineStore';

let syncInterval = null;
let isSyncing = false;
let listeners = { onConflict: null, onSyncComplete: null, onStatusChange: null };

/** Network status */
function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/** Current sync status: 'online' | 'offline' | 'syncing' | 'error' */
let currentStatus = 'online';

function setStatus(status) {
  currentStatus = status;
  listeners.onStatusChange?.(status);
}

export function getSyncStatus() {
  return currentStatus;
}

// ── Push ──────────────────────────────────────────────────

/**
 * Push all queued changes to the server.
 * Returns { pushed: number, failed: number, conflicts: [] }
 */
async function pushChanges() {
  const queue = await offlineStore.getQueuedChanges();
  if (!queue.length) return { pushed: 0, failed: 0, conflicts: [] };

  let pushed = 0;
  let failed = 0;
  const conflicts = [];

  for (const entry of queue) {
    try {
      const result = await pushSingleChange(entry);
      if (result.conflict) {
        conflicts.push({ entry, serverVersion: result.serverVersion });
        // Don't remove from queue — needs resolution
      } else if (result.success) {
        await offlineStore.removeQueuedChange(entry.queueId);
        pushed++;
      } else {
        // Retry logic: increment retries, remove if exceeded
        if (entry.retries >= 3) {
          await offlineStore.removeQueuedChange(entry.queueId);
          failed++;
        }
      }
    } catch (err) {
      console.warn('[syncEngine] Push failed for entry:', entry.queueId, err);
      failed++;
    }
  }

  return { pushed, failed, conflicts };
}

async function pushSingleChange(entry) {
  const { type, taskId, payload } = entry;

  try {
    let res;
    if (type === 'create') {
      res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ operations: [{ type: 'create', payload }] }),
      });
    } else if (type === 'update') {
      res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ operations: [{ type: 'update', taskId, payload, clientVersion: payload?.version }] }),
      });
    } else if (type === 'delete') {
      res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ operations: [{ type: 'delete', taskId }] }),
      });
    }

    if (!res) return { success: false };
    const data = await res.json();

    if (res.status === 409) {
      return { success: false, conflict: true, serverVersion: data.serverVersion };
    }

    return { success: data.success !== false };
  } catch (err) {
    return { success: false };
  }
}

// ── Pull ──────────────────────────────────────────────────

/**
 * Pull latest tasks from server and update local cache.
 * Uses lastSyncTimestamp for incremental sync.
 */
async function pullChanges() {
  try {
    const lastSync = await offlineStore.getMeta('lastSyncTimestamp');
    const url = lastSync
      ? `/api/sync/pull?since=${encodeURIComponent(lastSync)}`
      : '/api/sync/pull';

    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) return { pulled: 0 };

    const data = await res.json();
    if (!data.success || !Array.isArray(data.tasks)) return { pulled: 0 };

    // Update local cache
    await offlineStore.putTasks(data.tasks);
    await offlineStore.setMeta('lastSyncTimestamp', data.syncTimestamp || new Date().toISOString());

    // Handle deletions
    if (Array.isArray(data.deletedIds)) {
      for (const id of data.deletedIds) {
        await offlineStore.deleteTask(id);
      }
    }

    return { pulled: data.tasks.length, deletedIds: data.deletedIds || [] };
  } catch (err) {
    console.warn('[syncEngine] Pull failed:', err);
    return { pulled: 0 };
  }
}

// ── Full sync cycle ───────────────────────────────────────

async function syncCycle() {
  if (isSyncing || !isOnline()) return;
  isSyncing = true;
  setStatus('syncing');

  try {
    const pushResult = await pushChanges();
    const pullResult = await pullChanges();

    // Handle conflicts
    if (pushResult.conflicts.length > 0) {
      listeners.onConflict?.(pushResult.conflicts);
    }

    listeners.onSyncComplete?.({
      pushed: pushResult.pushed,
      pulled: pullResult.pulled,
      failed: pushResult.failed,
      conflicts: pushResult.conflicts.length,
    });

    setStatus('online');
  } catch (err) {
    console.error('[syncEngine] Sync cycle error:', err);
    setStatus('error');
  } finally {
    isSyncing = false;
  }
}

// ── Conflict resolution ──────────────────────────────────

/**
 * Resolve a conflict by choosing client or server version.
 * @param {object} conflict — { entry, serverVersion }
 * @param {'client_wins'|'server_wins'} resolution
 */
async function resolveConflict(conflict, resolution) {
  const { entry } = conflict;

  if (resolution === 'server_wins') {
    // Discard local change, accept server version
    await offlineStore.removeQueuedChange(entry.queueId);
    // Server version is already in cache from pull
  } else if (resolution === 'client_wins') {
    // Force-push with version override
    try {
      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          operations: [{ ...entry, forceOverwrite: true }],
        }),
      });
      if (res.ok) {
        await offlineStore.removeQueuedChange(entry.queueId);
      }
    } catch (err) {
      console.warn('[syncEngine] Force push failed:', err);
    }
  }
}

// ── Lifecycle ─────────────────────────────────────────────

function start(opts = {}) {
  const interval = opts.interval || 30000; // 30s default
  if (opts.onConflict) listeners.onConflict = opts.onConflict;
  if (opts.onSyncComplete) listeners.onSyncComplete = opts.onSyncComplete;
  if (opts.onStatusChange) listeners.onStatusChange = opts.onStatusChange;

  // Listen for online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      setStatus('online');
      syncCycle(); // sync immediately when back online
    });
    window.addEventListener('offline', () => setStatus('offline'));

    if (!navigator.onLine) setStatus('offline');
  }

  // Start periodic sync
  stop(); // Clear any existing interval
  syncInterval = setInterval(syncCycle, interval);

  // Immediate first sync
  syncCycle();
}

function stop() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

function pushNow() {
  return syncCycle();
}

// ── Public API ────────────────────────────────────────────

const syncEngine = {
  start,
  stop,
  pushNow,
  pullChanges,
  pushChanges,
  resolveConflict,
  getSyncStatus,
  isOnline,
};

export default syncEngine;
