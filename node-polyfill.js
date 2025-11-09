// This file MUST be loaded before ANY other code in Node.js
// It polyfills browser globals that some libraries incorrectly assume exist

if (typeof self === 'undefined') {
  global.self = global;
}

if (typeof window === 'undefined') {
  global.window = global;
}

if (typeof document === 'undefined') {
  global.document = {};
}

if (typeof navigator === 'undefined') {
  global.navigator = { userAgent: 'node' };
}

if (typeof location === 'undefined') {
  global.location = { href: '' };
}
