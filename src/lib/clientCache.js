// Enhanced client-side cache with TTL, invalidation, and size limits
// IMPORTANT: This cache only works in browser (client-side), not during SSR
const MAX_CACHE_SIZE = 50; // Prevent memory bloat

// Initialize cache only in browser environment
let cache = {};
if (typeof window !== 'undefined') {
  cache = window.__UP_CACHE || (window.__UP_CACHE = {});
}

export function getCached(key) {
  // Return null during SSR
  if (typeof window === 'undefined') return null;
  
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
  // Skip during SSR
  if (typeof window === 'undefined') return;
  
  try {
    // Enforce cache size limit
    const keys = Object.keys(cache);
    if (keys.length >= MAX_CACHE_SIZE) {
      // Remove oldest entries
      const sortedKeys = keys.sort((a, b) => {
        const aExpire = cache[a].expire || 0;
        const bExpire = cache[b].expire || 0;
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
  // Skip during SSR
  if (typeof window === 'undefined') return;
  
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
  // Skip during SSR
  if (typeof window === 'undefined') return;
  
  try {
    Object.keys(cache).forEach(k => delete cache[k]);
  } catch (e) { /* ignore */ }
}

export default { getCached, setCached, invalidateCache, clearCache };
