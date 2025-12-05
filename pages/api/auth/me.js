import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

const isDev = process.env.NODE_ENV === 'development';

// Returns 200 + user when authenticated, otherwise 401
export default async function handler(req, res) {
  try {
    if (isDev) console.log('[/api/auth/me] All cookies received:', JSON.stringify(req.cookies || {}, null, 2));
    
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret' });
    // Resolve user id from token or (development) local cookies set by local-signin.
    let userId = token && (token.userId || token.sub) ? (token.userId || token.sub) : null;
    
    if (userId) {
      if (isDev) console.log('[/api/auth/me] ✅ Found userId from NextAuth token:', userId);
    }
    
    // ALSO check for custom session cookie from /api/auth/signin
    if (!userId && req.cookies && req.cookies.session) {
      if (isDev) console.log('[/api/auth/me] Found session cookie, attempting to decode...');
      try {
        const secret = process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret';
        const decoded = jwt.verify(req.cookies.session, secret);
        if (isDev) console.log('[/api/auth/me] Decoded session cookie:', JSON.stringify(decoded, null, 2));
        if (decoded && decoded.userId) {
          userId = decoded.userId;
          if (isDev) console.log('[/api/auth/me] ✅ Found userId from custom session cookie:', userId);
        } else {
          if (isDev) console.error('[/api/auth/me] ❌ Session cookie decoded but no userId field');
        }
      } catch (e) {
        if (isDev) console.error('[/api/auth/me] ❌ Failed to decode custom session cookie:', e.message);
      }
    } else if (!userId) {
      if (isDev) console.log('[/api/auth/me] ❌ No session cookie found');
    }
    
    if (!userId) {
      try {
        if (req && req.cookies && req.cookies.userId) userId = req.cookies.userId;
        else if (req && req.cookies && req.cookies.debug_userId) userId = req.cookies.debug_userId;
      } catch (e) {
        // ignore cookie parsing errors
      }
    }

    if (!userId) {
      if (process.env.NODE_ENV !== 'production') {
        // Help diagnose why clients are treated as unauthenticated in dev
        try { res.setHeader('X-Debug-Auth-Path', 'none'); } catch (e) {}
      }
      return res.status(401).json({ authenticated: false, error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        try { res.setHeader('X-Debug-Auth-Path', `user:${userId}:not-found`); } catch (e) {}
      }
      return res.status(404).json({ authenticated: false, error: 'User not found' });
    }

    // Extract avatar settings for faster loading
    const settings = user.settings || {};
    const avatarColor = settings.avatarColor || '#7c3aed';
    const avatarUrl = settings.avatarUrl || null;

    // In development, expose which auth source was used for easier debugging.
    if (process.env.NODE_ENV !== 'production') {
      try {
        const authSource = token ? (token.userId || token.sub ? 'token' : 'token:unknown') : (req.cookies && req.cookies.userId ? 'cookie:userId' : (req.cookies && req.cookies.debug_userId ? 'cookie:debug_userId' : 'cookie:unknown'));
        res.setHeader('X-Debug-Auth-Path', `${authSource}:${user.id}`);
      } catch (e) {
        // ignore header errors
      }
    }

    return res.status(200).json({ 
      authenticated: true, 
      id: user.id, 
      name: user.name, 
      email: user.email,
      avatarColor,
      avatarUrl
    });
  } catch (err) {
    if (isDev) console.error('/api/auth/me error', err);
    return res.status(500).json({ error: 'Failed to read auth' });
  }
}
