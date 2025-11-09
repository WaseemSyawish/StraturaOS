// This file MUST be loaded before ANY other code in Node.js
// It polyfills browser globals that some libraries incorrectly assume exist

// Only polyfill self - this is the minimal fix needed
if (typeof self === 'undefined') {
  global.self = global;
}
