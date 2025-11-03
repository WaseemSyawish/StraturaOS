const { parseDatePreserveLocal } = require('../src/lib/dateHelpers');
const samples = [
  '2025-11-03T05:30:00.000Z',
  '2025-11-03T07:30:00.000Z',
  '2025-11-03T07:00:00.000Z'
];
for (const s of samples) {
  const parsedPreserve = parseDatePreserveLocal(s);
  const parsedNative = new Date(s);
  console.log('ISO:', s);
  console.log(' parseDatePreserveLocal -> local string:', parsedPreserve ? parsedPreserve.toString() : null, 'time ->', parsedPreserve ? parsedPreserve.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null);
  console.log(' new Date(iso)           -> local string:', parsedNative ? parsedNative.toString() : null, 'time ->', parsedNative ? parsedNative.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null);
  console.log('----');
}
