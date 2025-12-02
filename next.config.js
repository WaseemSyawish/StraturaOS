/**
 * Next.js config - Temporarily disabling Turbopack due to compatibility issues
 */
const path = require('path');

/**
 * Security headers for all routes
 */
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

module.exports = {
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  
  // Add security headers to all routes
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

// Explicitly try to disable Turbopack/turbo in experimental flags to avoid
// compatibility issues with native modules (Prisma) during `next dev`.
// Some Next releases enable Turbopack by default in dev, so this helps force
// the older Webpack-based dev server.
// Removed explicit experimental turbopack keys to avoid Next.js warnings.
// Prefer using the env var `NEXT_PREFER_WEBPACK=true` when starting the dev
// server to force Webpack in environments where Turbopack may be selected
// by default. That is set in package.json `dev` script.
