/**
 * Next.js 16 config - Updated for Turbopack compatibility
 */
const path = require('path');

module.exports = {
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  
  // Add empty turbopack config to silence the webpack warning
  turbopack: {},
  
  // Suppress ESLint during builds (moved from deprecated eslint key)
  experimental: {
    turbo: {
      rules: {
        // Allow middleware.js (it's for auth, not proxying)
      }
    }
  }
};
