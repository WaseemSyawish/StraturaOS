/**
 * Simple client-side cache with TTL (time-to-live)
 * Uses localStorage for persistence across page loads
 */

const CACHE_PREFIX = 'app_cache_';
const DEFAULT_TTL = 60 * 1000; // 1 minute default

/**
 * Get cached data if it exists and hasn't expired
 */
export function getCache(key) {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;
    
    const { data, timestamp, ttl } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age > ttl) {
      // Expired - remove from cache
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    
    return data;
  } catch (e) {
    console.error('[Cache] Error reading cache:', e);
    return null;
  }
}

/**
 * Store data in cache with TTL
 */
export function setCache(key, data, ttl = DEFAULT_TTL) {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheEntry));
  } catch (e) {
    console.error('[Cache] Error writing cache:', e);
  }
}

/**
 * Invalidate (remove) cached data
 */
export function invalidateCache(key) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch (e) {
    console.error('[Cache] Error invalidating cache:', e);
  }
}

/**
 * Clear all app caches
 */
export function clearAllCache() {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error('[Cache] Error clearing cache:', e);
  }
}

/**
 * Fetch with cache - stale-while-revalidate pattern
 * Returns cached data immediately if available, then fetches fresh data in background
 */
export async function fetchWithCache(url, options = {}, ttl = DEFAULT_TTL) {
  const cacheKey = url + JSON.stringify(options);

  // Try to get cached data first
  const cached = getCache(cacheKey);

  // Helper: return safe defaults depending on endpoint
  const safeDefaultFor = (u) => {
    if (u.includes('/api/events')) return { events: [] };
    if (u.includes('/api/courses')) return { success: false, courses: [] };
    if (u.includes('/api/grades')) return { success: false, data: [] };
    if (u.includes('/api/focus/stats')) return { stats: null };
    return { success: false };
  };

  // Retry fetch helper (simple exponential backoff)
  const attemptFetch = async (tries = 3, backoff = 250) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        console.warn(`[Cache] HTTP ${res.status} for ${url}, using cached data or safe defaults`);
        if (cached) return cached;
        return safeDefaultFor(url);
      }
      const data = await res.json();
      try { setCache(cacheKey, data, ttl); } catch (e) { console.warn('[Cache] setCache failed', e); }
      return data;
    } catch (err) {
      // Network error / failed to fetch — retry a few times
      if (tries > 1) {
        await new Promise((r) => setTimeout(r, backoff));
        return attemptFetch(tries - 1, Math.min(2000, backoff * 2));
      }
      console.error('[Cache] Fetch error after retries:', err);
      if (cached) {
        console.log('[Cache] Returning cached data due to fetch error');
        return cached;
      }
      return safeDefaultFor(url);
    }
  };

  // If we have cached data, kick off a background refresh and return cached immediately
  if (cached) {
    attemptFetch().catch(() => {});
    return cached;
  }

  // No cached data — wait for fetch (with retries)
  return attemptFetch();
}
