import { getToken } from 'next-auth/jwt';

/**
 * Resolve the authenticated user's ID from next-auth token or (in dev) from cookies.
 * This helper centralizes auth resolution so all API routes behave consistently.
 * 
 * @param {import('next').NextApiRequest} req - The Next.js API request object
 * @returns {Promise<string|null>} The resolved user ID or null if not authenticated
 */
export async function resolveUser(req) {
  try {
    // 1. Try next-auth token (production & dev)
    const secret = process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret';
    const token = await getToken({ req, secret });
    
    // Accept token.userId or token.sub (NextAuth variations)
    if (token) {
      const tokenUserId = token.userId || token.sub;
      if (tokenUserId) return String(tokenUserId);
      
      // Log if token exists but has no userId/sub claim
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[resolveUser] Token present but missing userId/sub claims:', Object.keys(token));
      }
    }

    // 2. In development: fall back to cookies set by local-signin helper
    if (process.env.NODE_ENV !== 'production') {
      if (req && req.cookies) {
        if (req.cookies.userId) return String(req.cookies.userId);
        if (req.cookies.debug_userId) return String(req.cookies.debug_userId);
      }
    }

    return null;
  } catch (err) {
    console.error('[resolveUser] Error resolving user:', err);
    return null;
  }
}
