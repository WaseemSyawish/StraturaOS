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
  
  // Fetch fresh data
  const fetchPromise = fetch(url, options)
    .then(async res => {
      if (!res.ok) {
        console.warn(`[Cache] HTTP ${res.status} for ${url}, using cached data or safe defaults`);
        // Instead of throwing, directly return safe defaults
        if (cached) {
          console.log('[Cache] Returning cached data due to HTTP error');
          return cached;
        }
        // Return safe defaults based on the URL pattern
        if (url.includes('/api/events')) {
          console.log('[Cache] Returning safe default for events API');
          return { events: [] };
        } else if (url.includes('/api/courses')) {
          console.log('[Cache] Returning safe default for courses API');
          return { success: false, courses: [] };
        } else if (url.includes('/api/grades')) {
          console.log('[Cache] Returning safe default for grades API');
          return { success: false, data: [] };
        } else if (url.includes('/api/focus/stats')) {
          console.log('[Cache] Returning safe default for focus stats API');
          return { stats: null };
        }
        console.log('[Cache] Returning generic safe default');
        return { success: false };
      }
      const data = await res.json();
      setCache(cacheKey, data, ttl);
      return data;
    })
    .catch(err => {
      console.error('[Cache] Fetch error:', err);
      // Return cached data on error if available, otherwise return safe default
      if (cached) {
        console.log('[Cache] Returning cached data due to fetch error');
        return cached;
      }
      // Return safe defaults based on the URL pattern
      if (url.includes('/api/events')) {
        console.log('[Cache] Returning safe default for events API');
        return { events: [] };
      } else if (url.includes('/api/courses')) {
        console.log('[Cache] Returning safe default for courses API');
        return { success: false, courses: [] };
      } else if (url.includes('/api/grades')) {
        console.log('[Cache] Returning safe default for grades API');
        return { success: false, data: [] };
      } else if (url.includes('/api/focus/stats')) {
        console.log('[Cache] Returning safe default for focus stats API');
        return { stats: null };
      }
      console.log('[Cache] Returning generic safe default');
      return { success: false };
    });
  
  // If we have cached data, return it immediately
  // Otherwise wait for the fetch
  if (cached) {
    fetchPromise.catch(() => {}); // Fetch in background but don't block
    return cached;
  }
  
  return fetchPromise;
}
