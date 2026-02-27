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
  
  // Add security + cache headers to all routes
  async headers() {
    return [
      {
        // JS/CSS/image assets — cache by content hash (immutable)
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // All page routes — never serve a stale HTML shell from CDN/browser
        source: '/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
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
