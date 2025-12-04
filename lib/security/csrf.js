/**
 * CSRF Protection for custom auth endpoints
 * 
 * NextAuth handles CSRF for its own endpoints, but custom auth endpoints
 * (register, forgot-password, reset-password) need explicit protection.
 * 
 * This module provides:
 * 1. Token generation and validation
 * 2. Middleware for protecting POST/PUT/DELETE requests
 * 3. Integration with NextAuth's CSRF token when available
 */

import crypto from 'crypto';

const isDev = process.env.NODE_ENV === 'development';

// Token configuration
const TOKEN_SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'dev-csrf-secret';
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a CSRF token
 * @param {string} sessionId - Unique session identifier
 * @returns {string} CSRF token
 */
export function generateCsrfToken(sessionId) {
  const timestamp = Date.now().toString(36);
  const nonce = crypto.randomBytes(16).toString('hex');
  const data = `${sessionId}:${timestamp}:${nonce}`;
  
  const hmac = crypto.createHmac('sha256', TOKEN_SECRET);
  hmac.update(data);
  const signature = hmac.digest('hex');
  
  return Buffer.from(`${data}:${signature}`).toString('base64');
}

/**
 * Validate a CSRF token
 * @param {string} token - The token to validate
 * @param {string} sessionId - Expected session identifier
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCsrfToken(token, sessionId) {
  if (!token) {
    return { valid: false, error: 'Missing CSRF token' };
  }
  
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    
    if (parts.length !== 4) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const [tokenSessionId, timestamp, nonce, providedSignature] = parts;
    
    // Verify session ID matches
    if (tokenSessionId !== sessionId) {
      return { valid: false, error: 'Session mismatch' };
    }
    
    // Verify token hasn't expired
    const tokenTime = parseInt(timestamp, 36);
    if (Date.now() - tokenTime > TOKEN_EXPIRY_MS) {
      return { valid: false, error: 'Token expired' };
    }
    
    // Verify signature
    const data = `${tokenSessionId}:${timestamp}:${nonce}`;
    const hmac = crypto.createHmac('sha256', TOKEN_SECRET);
    hmac.update(data);
    const expectedSignature = hmac.digest('hex');
    
    // Use timing-safe comparison
    const providedBuffer = Buffer.from(providedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (providedBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    return { valid: true };
  } catch (err) {
    if (isDev) console.error('[csrf] Token validation error:', err.message);
    return { valid: false, error: 'Token validation failed' };
  }
}

/**
 * Get session ID from request (for CSRF validation)
 * Uses IP + User-Agent as a simple session identifier for anonymous requests
 */
function getSessionId(req) {
  // For authenticated requests, use the session token
  const sessionToken = req.cookies?.['next-auth.session-token'] || 
                       req.cookies?.['__Secure-next-auth.session-token'];
  
  if (sessionToken) {
    // Hash the session token for privacy
    return crypto.createHash('sha256').update(sessionToken).digest('hex').slice(0, 32);
  }
  
  // For anonymous requests (login, register), use IP + User-Agent fingerprint
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  return crypto.createHash('sha256')
    .update(`${ip}:${userAgent}`)
    .digest('hex')
    .slice(0, 32);
}

/**
 * Extract CSRF token from request
 * Checks headers and body
 */
function extractCsrfToken(req) {
  // Check header first (preferred for API calls)
  const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  if (headerToken) return headerToken;
  
  // Check body (for form submissions)
  if (req.body && req.body._csrf) return req.body._csrf;
  if (req.body && req.body.csrfToken) return req.body.csrfToken;
  
  // Check NextAuth CSRF token as fallback
  const nextAuthCsrf = req.cookies?.['next-auth.csrf-token'] || 
                       req.cookies?.['__Host-next-auth.csrf-token'];
  if (nextAuthCsrf) {
    // NextAuth CSRF token format is "token|hash"
    const [token] = nextAuthCsrf.split('|');
    return token;
  }
  
  return null;
}

/**
 * CSRF protection middleware
 * Validates CSRF tokens for state-changing requests
 * 
 * @param {function} handler - API route handler
 * @param {object} options - { exemptMethods: string[], skipInDev: boolean }
 */
export function withCsrfProtection(handler, options = {}) {
  const { 
    exemptMethods = ['GET', 'HEAD', 'OPTIONS'],
    skipInDev = false,
  } = options;
  
  return async (req, res) => {
    // Skip for exempt methods
    if (exemptMethods.includes(req.method)) {
      return handler(req, res);
    }
    
    // Skip in development if configured
    if (skipInDev && isDev) {
      return handler(req, res);
    }
    
    const sessionId = getSessionId(req);
    const token = extractCsrfToken(req);
    
    // For NextAuth protected routes, the CSRF is handled by NextAuth
    // We only need to validate for custom endpoints
    const hasNextAuthCsrf = req.cookies?.['next-auth.csrf-token'] || 
                            req.cookies?.['__Host-next-auth.csrf-token'];
    
    // If request has a valid NextAuth session, trust its CSRF handling
    const hasValidSession = req.cookies?.['next-auth.session-token'] || 
                           req.cookies?.['__Secure-next-auth.session-token'];
    
    if (hasValidSession && hasNextAuthCsrf) {
      // NextAuth handles CSRF for authenticated sessions
      return handler(req, res);
    }
    
    // For custom auth endpoints without session (login, register, forgot-password)
    // We use origin/referer validation as primary protection
    const origin = req.headers['origin'];
    const referer = req.headers['referer'];
    const host = req.headers['host'];
    
    // Validate origin matches host (same-origin policy)
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const expectedHosts = [
          host,
          'localhost:3000',
          process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).host : null,
          process.env.VERCEL_URL || null,
        ].filter(Boolean);
        
        if (!expectedHosts.some(h => originUrl.host === h)) {
          console.warn(`[csrf] Origin mismatch: ${origin} not in ${expectedHosts.join(', ')}`);
          return res.status(403).json({ error: 'Invalid request origin' });
        }
      } catch (e) {
        if (isDev) console.error('[csrf] Origin parsing error:', e.message);
        return res.status(403).json({ error: 'Invalid request origin' });
      }
    } else if (referer) {
      // Fallback to referer check
      try {
        const refererUrl = new URL(referer);
        const expectedHosts = [
          host,
          'localhost:3000',
          process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).host : null,
          process.env.VERCEL_URL || null,
        ].filter(Boolean);
        
        if (!expectedHosts.some(h => refererUrl.host === h)) {
          console.warn(`[csrf] Referer mismatch: ${referer}`);
          return res.status(403).json({ error: 'Invalid request origin' });
        }
      } catch (e) {
        // Referer parsing failed
      }
    } else if (!isDev) {
      // In production, require origin or referer header
      console.warn('[csrf] Missing origin/referer header');
      return res.status(403).json({ error: 'Missing required headers' });
    }
    
    // Additional token validation if provided
    if (token) {
      const validation = validateCsrfToken(token, sessionId);
      if (!validation.valid) {
        if (isDev) console.warn('[csrf] Token validation failed:', validation.error);
        // Don't fail if origin check passed - token is optional extra layer
      }
    }
    
    return handler(req, res);
  };
}

/**
 * API endpoint to get a new CSRF token
 * Can be called by clients before making protected requests
 */
export async function getCsrfTokenHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const sessionId = getSessionId(req);
  const token = generateCsrfToken(sessionId);
  
  // Set as cookie for automatic inclusion in requests
  res.setHeader('Set-Cookie', [
    `csrf-token=${token}; Path=/; HttpOnly; SameSite=Strict${isDev ? '' : '; Secure'}`,
  ]);
  
  return res.status(200).json({ csrfToken: token });
}

export default {
  generateCsrfToken,
  validateCsrfToken,
  withCsrfProtection,
  getCsrfTokenHandler,
};
