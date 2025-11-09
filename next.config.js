/**
 * Simplified Next.js config to fix webpack runtime errors
 */
const path = require('path');

module.exports = {
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  
  webpack: (config, { dev, isServer }) => {
    // Disable problematic optimizations that cause webpack runtime errors
    if (!dev && config.optimization) {
      // Keep default Next.js splitting, don't override
      delete config.optimization.splitChunks;
    }
    
    return config;
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
};
