import { getToken } from 'next-auth/jwt';

const isDev = process.env.NODE_ENV === 'development';

export default async function handler(req, res) {
  try {
    const secret = process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret';
    const token = await getToken({ req, secret });

    // Best-effort resolved user id using common fallbacks used across the API
    let resolvedUserId = null;
    try {
      if (token && (token.userId || token.sub)) resolvedUserId = token.userId || token.sub;
    } catch (e) {}
    try {
      if (!resolvedUserId && req && req.cookies) {
        if (req.cookies.userId) resolvedUserId = req.cookies.userId;
        else if (req.cookies.debug_userId) resolvedUserId = req.cookies.debug_userId;
      }
    } catch (e) {}

    return res.status(200).json({ ok: true, token: token || null, resolvedUserId: resolvedUserId || null, cookies: req && req.cookies ? req.cookies : {} });
  } catch (err) {
    if (isDev) console.error('debug/whoami error', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
