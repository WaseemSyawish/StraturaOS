// Enhanced client-side cache with TTL, invalidation, and size limits
// IMPORTANT: This cache only works in browser (client-side), not during SSR

// Use a function to lazily initialize cache to avoid SSR issues
function getCache() {
  if (typeof window === 'undefined') return null;
  if (!window.__UP_CACHE) {
    window.__UP_CACHE = {};
  }
  return window.__UP_CACHE;
}

const MAX_CACHE_SIZE = 50; // Prevent memory bloat

export function getCached(key) {
  const cache = getCache();
  if (!cache) return null;
  
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
  const cache = getCache();
  if (!cache) return;
  
  try {
    // Enforce cache size limit
    const keys = Object.keys(cache);
    if (keys.length >= MAX_CACHE_SIZE) {
      // Remove oldest entries
      const sortedKeys = keys.sort((a, b) => {
        const aExpire = cache[a]?.expire || 0;
        const bExpire = cache[b]?.expire || 0;
        return aExpire - bExpire;
      });
      // Remove oldest 10 entries
      sortedKeys.slice(0, 10).forEach(k => delete cache[k]);
    }
    
    const expire = ttlMs > 0 ? Date.now() + ttlMs : null;
    cache[key] = { value, expire };
  } catch (e) { /* ignore */ }
}

export function invalidateCache(pattern) {
  const cache = getCache();
  if (!cache) return;
  
  try {
    if (typeof pattern === 'string') {
      delete cache[pattern];
    } else if (pattern instanceof RegExp) {
      Object.keys(cache).forEach(key => {
        if (pattern.test(key)) delete cache[key];
      });
    }
  } catch (e) { /* ignore */ }
}

export function clearCache() {
  const cache = getCache();
  if (!cache) return;
  
  try {
    Object.keys(cache).forEach(k => delete cache[k]);
  } catch (e) { /* ignore */ }
}

export default { getCached, setCached, invalidateCache, clearCache };
