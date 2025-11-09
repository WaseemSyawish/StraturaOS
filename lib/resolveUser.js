import { getToken } from 'next-auth/jwt';
const jwt = require('jsonwebtoken');

/**
 * Resolve the authenticated user's ID from next-auth token or (in dev) from cookies.
 * This helper centralizes auth resolution so all API routes behave consistently.
 * 
 * @param {import('next').NextApiRequest} req - The Next.js API request object
 * @returns {Promise<string|null>} The resolved user ID or null if not authenticated
 */
export async function resolveUser(req) {
  try {
    // Log all cookies for debugging
    console.log('[resolveUser] All cookies received:', JSON.stringify(req.cookies || {}, null, 2));
    
    // 1. Try next-auth token (production & dev)
    const secret = process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret';
    const token = await getToken({ req, secret });
    
    // Accept token.userId or token.sub (NextAuth variations)
    if (token) {
      const tokenUserId = token.userId || token.sub;
      if (tokenUserId) {
        console.log('[resolveUser] ✅ Found userId from NextAuth token:', tokenUserId);
        return String(tokenUserId);
      }
      
      // Log if token exists but has no userId/sub claim
      console.warn('[resolveUser] ⚠️ Token present but missing userId/sub claims:', Object.keys(token));
    }

    // 2. CRITICAL: Check custom session cookie from /api/auth/signin
    if (req && req.cookies && req.cookies.session) {
      console.log('[resolveUser] Found session cookie, attempting to decode...');
      try {
        const decoded = jwt.verify(req.cookies.session, secret);
        console.log('[resolveUser] Decoded session cookie:', JSON.stringify(decoded, null, 2));
        if (decoded && decoded.userId) {
          console.log('[resolveUser] ✅ Found userId from custom session cookie:', decoded.userId);
          return String(decoded.userId);
        } else {
          console.error('[resolveUser] ❌ Session cookie decoded but no userId field found');
        }
      } catch (e) {
        console.error('[resolveUser] ❌ Failed to decode custom session cookie:', e.message);
      }
    } else {
      console.log('[resolveUser] ❌ No session cookie found in request');
    }

    // 3. In development: fall back to cookies set by local-signin helper
    if (process.env.NODE_ENV !== 'production') {
      if (req && req.cookies) {
        if (req.cookies.userId) {
          console.log('[resolveUser] Found userId from dev cookie:', req.cookies.userId);
          return String(req.cookies.userId);
        }
        if (req.cookies.debug_userId) {
          console.log('[resolveUser] Found userId from debug cookie:', req.cookies.debug_userId);
          return String(req.cookies.debug_userId);
        }
      }
    }

    console.log('[resolveUser] No userId found in any source');
    return null;
  } catch (err) {
    console.error('[resolveUser] Error resolving user:', err);
    return null;
  }
}
