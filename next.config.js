/**
 * Next.js config - Temporarily disabling Turbopack due to compatibility issues
 */
const path = require('path');

module.exports = {
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false
};

// Explicitly try to disable Turbopack/turbo in experimental flags to avoid
// compatibility issues with native modules (Prisma) during `next dev`.
// Some Next releases enable Turbopack by default in dev, so this helps force
// the older Webpack-based dev server.
// Removed explicit experimental turbopack keys to avoid Next.js warnings.
// Prefer using the env var `NEXT_PREFER_WEBPACK=true` when starting the dev
// server to force Webpack in environments where Turbopack may be selected
// by default. That is set in package.json `dev` script.
