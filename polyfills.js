// Polyfills for server-side rendering
// This file provides browser globals that some libraries expect

if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
  global.self = global;
}
