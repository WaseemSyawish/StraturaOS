/**
 * Comprehensive Next.js config for optimal performance.
 * - Production optimizations: compression, minification
 * - Development optimizations: faster rebuilds, persistent caching
 * - Excludes large data folders from watch
 */
const path = require('path');

module.exports = {
  reactStrictMode: false,
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  webpack: (config, { dev, isServer }) => {
    // Enable persistent caching for faster rebuilds
    config.cache = config.cache || {};
    config.cache.type = 'filesystem';

    // Fix for 'self is not defined' error during SSR
    if (isServer) {
      // Provide a polyfill for 'self' in the server bundle
      config.plugins = config.plugins || [];
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.DefinePlugin({
          'self': 'undefined',
        })
      );
    }

    // Production optimizations
    if (!dev) {
      // Minimize bundle size
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            }
          }
        }
      };
    }

    // Reduce the number of files webpack watches in dev
    if (dev) {
      const watchOptions = config.watchOptions || {};
      watchOptions.ignored = [
        /node_modules/,
        /\.next/,
        /data/, // large JSON fixtures
        /scripts/,
        /\.vscode/,
        /public/,
      ];
      config.watchOptions = watchOptions;
    }

    return config;
  },
  
  // Reduce telemetry and logging
  eslint: {
    ignoreDuringBuilds: true,
  },
};
