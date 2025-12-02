/**
 * Simple in-memory rate limiter for API routes
 * Note: In production with multiple serverless instances, consider using Redis
 */

const rateLimitMap = new Map();

// Clean up old entries every 5 minutes
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
 * Check if request should be rate limited
 * @param {string} key - Unique key for this rate limit bucket (e.g., 'auth', 'api')
 * @param {object} req - Next.js request object
 * @param {object} config - { windowMs, maxRequests }
 * @returns {{ limited: boolean, remaining: number, resetTime: number }}
 */
export function checkRateLimit(key, req, config = RATE_LIMITS.api) {
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
 * Rate limit middleware wrapper
 * @param {function} handler - API route handler
 * @param {string} key - Rate limit bucket key
 * @param {object} config - Rate limit config
 */
export function withRateLimit(handler, key = 'api', config = RATE_LIMITS.api) {
  return async (req, res) => {
    const { limited, remaining, resetTime } = checkRateLimit(key, req, config);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
    
    if (limited) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Please wait before making more requests',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      });
    }
    
    return handler(req, res);
  };
}

export default { checkRateLimit, withRateLimit, RATE_LIMITS };
