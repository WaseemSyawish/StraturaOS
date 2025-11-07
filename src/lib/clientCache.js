// Lightweight in-memory client cache to reduce duplicate network requests
const cache = (typeof window !== 'undefined' && window.__UP_CACHE) ? window.__UP_CACHE : (typeof window !== 'undefined' ? (window.__UP_CACHE = {}) : {});

export function getCached(key) {
  try {
    const entry = cache[key];
    if (!entry) return null;
    // TTL support
    if (entry.expire && Date.now() > entry.expire) {
      delete cache[key];
      return null;
    }
    return entry.value;
  } catch (e) { return null; }
}

export function setCached(key, value, ttlMs = 60 * 1000) {
  try {
    const expire = ttlMs > 0 ? Date.now() + ttlMs : null;
    cache[key] = { value, expire };
  } catch (e) { /* ignore */ }
}

export default { getCached, setCached };
