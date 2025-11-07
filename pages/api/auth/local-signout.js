import { serialize } from 'cookie';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
  // Clear the demo user cookies set by local-signin and any session cookie
  const clearUserId = serialize('userId', '', { path: '/', httpOnly: true, maxAge: 0, sameSite: 'lax' });
  const clearDebug = serialize('debug_userId', '', { path: '/', maxAge: 0, sameSite: 'lax' });
  const clearSession = serialize('session', '', { path: '/', httpOnly: true, maxAge: 0, sameSite: 'lax' });
  // Also clear common next-auth cookie names just in case
  const clearNextAuth = serialize('next-auth.session-token', '', { path: '/', maxAge: 0, sameSite: 'lax' });
  const clearNextAuthSecure = serialize('__Secure-next-auth.session-token', '', { path: '/', maxAge: 0, sameSite: 'lax' });
  res.setHeader('Set-Cookie', [clearUserId, clearDebug, clearSession, clearNextAuth, clearNextAuthSecure]);
    // also return OK so callers can continue to next-auth signOut
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('local-signout error', err);
    res.status(500).json({ ok: false });
  }
}
