/**
 * Rate limiter for API routes
 * 
 * Uses Upstash Redis for distributed rate limiting in production (serverless-compatible)
 * Falls back to in-memory rate limiting for development
 * 
 * Required environment variables for production:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

// In-memory fallback for development
const rateLimitMap = new Map();

// Clean up old entries every 5 minutes (development only)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now - value.timestamp > 60000) {
        rateLimitMap.delete(key);
      }
    }
  }, 300000);
}

/**
 * Rate limit configuration presets
 */
export const RATE_LIMITS = {
  // Auth endpoints - stricter limits
  auth: { windowMs: 60000, maxRequests: 5 },
  // Password reset - very strict
  passwordReset: { windowMs: 3600000, maxRequests: 3 },
  // General API - moderate limits
  api: { windowMs: 60000, maxRequests: 60 },
  // Write operations - moderate
  write: { windowMs: 60000, maxRequests: 30 },
};

/**
 * Get client identifier from request
 */
function getClientId(req) {
  // Prefer X-Forwarded-For for proxied requests (Vercel)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip;
  }
  // Fall back to socket address
  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
}

/**
 * Check if request should be rate limited (in-memory fallback)
 * @param {string} key - Unique key for this rate limit bucket
 * @param {object} req - Next.js request object
 * @param {object} config - { windowMs, maxRequests }
 * @returns {{ limited: boolean, remaining: number, resetTime: number }}
 */
function checkRateLimitMemory(key, req, config) {
  const clientId = getClientId(req);
  const bucketKey = `${key}:${clientId}`;
  const now = Date.now();
  
  let bucket = rateLimitMap.get(bucketKey);
  
  if (!bucket || now - bucket.timestamp > config.windowMs) {
    bucket = { count: 0, timestamp: now };
    rateLimitMap.set(bucketKey, bucket);
  }
  
  bucket.count++;
  
  const remaining = Math.max(0, config.maxRequests - bucket.count);
  const resetTime = bucket.timestamp + config.windowMs;
  
  return {
    limited: bucket.count > config.maxRequests,
    remaining,
    resetTime,
  };
}

/**
 * Check if request should be rate limited using Upstash Redis
 * @param {string} key - Unique key for this rate limit bucket
 * @param {object} req - Next.js request object
 * @param {object} config - { windowMs, maxRequests }
 * @returns {Promise<{ limited: boolean, remaining: number, resetTime: number }>}
 */
async function checkRateLimitUpstash(key, req, config) {
  const clientId = getClientId(req);
  const identifier = `${key}:${clientId}`;
  
  try {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');
    
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    // Create a rate limiter specific to this config
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs}ms`),
      analytics: true,
      prefix: `ratelimit:${key}`,
    });
    
    const result = await ratelimit.limit(identifier);
    
    return {
      limited: !result.success,
      remaining: result.remaining,
      resetTime: result.reset,
    };
  } catch (err) {
    console.error('[rate-limit] Upstash error, falling back to memory:', err.message);
    // Fall back to memory-based rate limiting on error
    return checkRateLimitMemory(key, req, config);
  }
}

/**
 * Check if request should be rate limited
 * Automatically uses Upstash Redis in production if configured, otherwise in-memory
 * @param {string} key - Unique key for this rate limit bucket (e.g., 'auth', 'api')
 * @param {object} req - Next.js request object
 * @param {object} config - { windowMs, maxRequests }
 * @returns {Promise<{ limited: boolean, remaining: number, resetTime: number }>}
 */
export async function checkRateLimit(key, req, config = RATE_LIMITS.api) {
  const hasUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (hasUpstash) {
    return checkRateLimitUpstash(key, req, config);
  }
  
  return checkRateLimitMemory(key, req, config);
}

/**
 * Rate limit middleware wrapper
 * @param {function} handler - API route handler
 * @param {string} key - Rate limit bucket key
 * @param {object} config - Rate limit config
 */
export function withRateLimit(handler, key = 'api', config = RATE_LIMITS.api) {
  return async (req, res) => {
    const { limited, remaining, resetTime } = await checkRateLimit(key, req, config);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
    
    if (limited) {
      // Log rate limit events for monitoring
      const clientId = getClientId(req);
      console.warn(`[rate-limit] Request blocked: ${key} from ${clientId}`);
      
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Please wait before making more requests',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      });
    }
    
    return handler(req, res);
  };
}

/**
 * Check rate limit without blocking (for monitoring/logging)
 * @param {string} key - Rate limit bucket key
 * @param {object} req - Request object
 * @param {object} config - Rate limit config
 * @returns {Promise<{ remaining: number, resetTime: number }>}
 */
export async function getRateLimitStatus(key, req, config = RATE_LIMITS.api) {
  const hasUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (hasUpstash) {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit');
      const { Redis } = await import('@upstash/redis');
      
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      
      const clientId = getClientId(req);
      const identifier = `${key}:${clientId}`;
      
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs}ms`),
        prefix: `ratelimit:${key}`,
      });
      
      const result = await ratelimit.getRemaining(identifier);
      return { remaining: result.remaining, resetTime: result.reset };
    } catch (err) {
      // Fall back to memory
    }
  }
  
  const clientId = getClientId(req);
  const bucketKey = `${key}:${clientId}`;
  const bucket = rateLimitMap.get(bucketKey);
  
  if (!bucket) {
    return { remaining: config.maxRequests, resetTime: Date.now() + config.windowMs };
  }
  
  return {
    remaining: Math.max(0, config.maxRequests - bucket.count),
    resetTime: bucket.timestamp + config.windowMs,
  };
}

export default { checkRateLimit, withRateLimit, RATE_LIMITS, getRateLimitStatus };
