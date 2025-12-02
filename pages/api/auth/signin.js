import prisma from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { withRateLimit, RATE_LIMITS } from '../../../lib/security/rate-limit';
import { isValidEmail, sanitizeString } from '../../../lib/security/validation';

const isDev = process.env.NODE_ENV === 'development';

function setSessionCookie(res, payload) {
  if (isDev) console.log('[signin] Setting session cookie with payload:', JSON.stringify(payload, null, 2));
  const maxAge = 60 * 60 * 24 * 7; // 7 days in seconds
  const secret = process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret';
  const token = jwt.sign(payload, secret, { expiresIn: maxAge });
  if (isDev) console.log('[signin] Generated JWT token (first 50 chars):', token.substring(0, 50));
  // Use a single cookie name 'session' for simplicity
  const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
  // HttpOnly, Path=/, SameSite=Lax and Max-Age (in seconds)
  const cookieValue = `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${secureFlag}`;
  if (isDev) console.log('[signin] Setting cookie:', cookieValue.substring(0, 100) + '...');
  res.setHeader(
    'Set-Cookie',
    cookieValue
  );
}

function loadLocalDevUser() {
  // Try environment first
  if (process.env.DEV_USER_EMAIL) {
    return {
      id: process.env.DEV_USER_ID || 'dev-user',
      email: process.env.DEV_USER_EMAIL,
      name: process.env.DEV_USER_NAME || 'Developer'
    };
  }
  // Next try data/dev-user.json
  try {
    const p = path.join(process.cwd(), 'data', 'dev-user.json');
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) return parsed;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawEmail = req.body?.email;
  
  // Validate and sanitize email
  if (rawEmail && !isValidEmail(rawEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  const email = rawEmail ? sanitizeString(rawEmail, { maxLength: 254 }).toLowerCase().trim() : null;

  const devFallbackEnabled = process.env.DEV_FALLBACK === '1' || process.env.DEV_FALLBACK === 'true';

  // Try to query DB but handle unreachable DB with a clear 503 and a local dev-user fallback
  try {
    let user = null;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }
    if (!user) {
      // only fallback to first user in database when DEV_FALLBACK is explicitly enabled
      if (devFallbackEnabled) {
        user = await prisma.user.findFirst();
      }
    }
    if (!user) {
      // No user in DB — try local dev-user fallback only when explicitly allowed
      if (devFallbackEnabled) {
        const local = loadLocalDevUser();
        if (local) {
          setSessionCookie(res, { userId: local.id, email: local.email, name: local.name });
          return res.status(200).json({ success: true, id: local.id, name: local.name, email: local.email, warning: 'Using local dev-user fallback' });
        }
      }
      return res.status(400).json({ error: 'No user available' });
    }

    setSessionCookie(res, { userId: user.id, email: user.email, name: user.name });
    return res.status(200).json({ success: true, id: user.id, name: user.name, email: user.email });
  } catch (err) {
    // Detect common Prisma connection error message and return 503 with helpful details
    const msg = err && err.message ? String(err.message) : '';
    if (isDev) console.error('POST /api/auth/signin error', msg || err);
    if (msg.includes("Can't reach database server") || msg.includes('P1001') || msg.includes('Connection refused') || msg.includes('connect ECONNREFUSED')) {
      // DB unreachable — if DEV_FALLBACK is enabled, try local dev-user fallback; otherwise return 503
      if (devFallbackEnabled) {
        const local = loadLocalDevUser();
        if (local) {
          setSessionCookie(res, { userId: local.id, email: local.email, name: local.name });
          return res.status(200).json({ success: true, id: local.id, name: local.name, email: local.email, warning: 'Database unreachable — using local dev-user fallback' });
        }
      }
      return res.status(503).json({ error: 'Database unreachable', details: isDev ? msg : undefined });
    }
    return res.status(500).json({ error: 'Failed to sign in', details: isDev ? msg : undefined });
  }
}

export default withRateLimit(handler, 'auth', RATE_LIMITS.auth);
