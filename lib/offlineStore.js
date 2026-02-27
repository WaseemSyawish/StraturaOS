/**
 * Offline Store — IndexedDB-backed task cache with change queue
 * ─────────────────────────────────────────────────────────────
 * Provides offline-first data access for tasks.
 * All mutations go through a local queue → synced when online.
 *
 * Usage:
 *   import offlineStore from '../lib/offlineStore';
 *   await offlineStore.init();
 *   await offlineStore.putTasks(tasks);
 *   const cached = await offlineStore.getAllTasks();
 *   await offlineStore.queueChange({ type: 'update', taskId, payload });
 */

const DB_NAME = 'straturaos_offline';
const DB_VERSION = 1;
const STORE_TASKS = 'tasks';
const STORE_QUEUE = 'changeQueue';
const STORE_META = 'meta';

let dbInstance = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not available'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_TASKS)) {
        db.createObjectStore(STORE_TASKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'queueId', autoIncrement: true });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onerror = () => reject(request.error);
  });
}

async function getDB() {
  if (dbInstance) return dbInstance;
  return openDB();
}

function tx(storeName, mode = 'readonly') {
  return getDB().then((db) => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  });
}

// ── Tasks cache ───────────────────────────────────────────

async function getAllTasks() {
  const store = await tx(STORE_TASKS);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function getTask(id) {
  const store = await tx(STORE_TASKS);
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function putTask(task) {
  const store = await tx(STORE_TASKS, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put({ ...task, _cachedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function putTasks(tasks) {
  const db = await getDB();
  const transaction = db.transaction(STORE_TASKS, 'readwrite');
  const store = transaction.objectStore(STORE_TASKS);
  const now = Date.now();
  for (const task of tasks) {
    store.put({ ...task, _cachedAt: now });
  }
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function deleteTask(id) {
  const store = await tx(STORE_TASKS, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function clearTasks() {
  const store = await tx(STORE_TASKS, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ── Change queue ──────────────────────────────────────────

/**
 * Queue a change for later sync.
 * @param {{ type: 'create'|'update'|'delete', taskId?: string, payload?: object }} change
 */
async function queueChange(change) {
  const store = await tx(STORE_QUEUE, 'readwrite');
  const entry = {
    ...change,
    timestamp: Date.now(),
    retries: 0,
  };
  return new Promise((resolve, reject) => {
    const req = store.add(entry);
    req.onsuccess = () => resolve(req.result); // returns queueId
    req.onerror = () => reject(req.error);
  });
}

async function getQueuedChanges() {
  const store = await tx(STORE_QUEUE);
  return new Promise((resolve, reject) => {
    const req = store.index('timestamp').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function removeQueuedChange(queueId) {
  const store = await tx(STORE_QUEUE, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(queueId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function clearQueue() {
  const store = await tx(STORE_QUEUE, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getQueueCount() {
  const store = await tx(STORE_QUEUE);
  return new Promise((resolve, reject) => {
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Meta ──────────────────────────────────────────────────

async function getMeta(key) {
  const store = await tx(STORE_META);
  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function setMeta(key, value) {
  const store = await tx(STORE_META, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ── Public API ────────────────────────────────────────────

const offlineStore = {
  init: openDB,
  // Tasks
  getAllTasks,
  getTask,
  putTask,
  putTasks,
  deleteTask,
  clearTasks,
  // Queue
  queueChange,
  getQueuedChanges,
  removeQueuedChange,
  clearQueue,
  getQueueCount,
  // Meta
  getMeta,
  setMeta,
};

export default offlineStore;
