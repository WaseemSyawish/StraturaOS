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
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      setCache(cacheKey, data, ttl);
      return data;
    })
    .catch(err => {
      console.error('[Cache] Fetch error:', err);
      // Return stale data on error if available, otherwise return safe default
      return cached || { events: [], data: [], success: false };
    });
  
  // If we have cached data, return it immediately
  // Otherwise wait for the fetch
  if (cached) {
    fetchPromise.catch(() => {}); // Fetch in background but don't block
    return cached;
  }
  
  return fetchPromise;
}
