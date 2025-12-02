/**
 * Security headers middleware for Next.js
 * Adds essential security headers to all responses
 */

/**
 * Security headers configuration
 */
export const securityHeaders = [
  // Prevent clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Enable XSS protection in older browsers
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Control referrer information
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Permissions policy (formerly Feature-Policy)
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

/**
 * Content Security Policy for production
 * Allows only trusted sources
 */
export const getCSPHeader = (nonce) => {
  const isDev = process.env.NODE_ENV !== 'production';
  
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      isDev ? "'unsafe-eval'" : '',
      nonce ? `'nonce-${nonce}'` : '',
    ].filter(Boolean),
    'style-src': ["'self'", "'unsafe-inline'"], // Required for Tailwind/DaisyUI
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': [
      "'self'",
      // Supabase connection
      'https://*.supabase.co',
      'wss://*.supabase.co',
      // Vercel analytics
      'https://vercel.live',
      'https://vitals.vercel-insights.com',
      isDev ? 'ws://localhost:*' : '',
    ].filter(Boolean),
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
  };
  
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
};

/**
 * Apply security headers to API response
 * @param {object} res - Next.js response object
 */
export function applySecurityHeaders(res) {
  for (const { key, value } of securityHeaders) {
    res.setHeader(key, value);
  }
}

/**
 * Middleware wrapper that adds security headers
 * @param {function} handler - API route handler
 */
export function withSecurityHeaders(handler) {
  return async (req, res) => {
    applySecurityHeaders(res);
    return handler(req, res);
  };
}

export default { securityHeaders, getCSPHeader, applySecurityHeaders, withSecurityHeaders };
