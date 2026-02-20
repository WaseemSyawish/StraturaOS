import prisma from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
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
  try {
    if (req.method !== 'POST') {
      return res.status(405).end();
    }

    const rawEmail = req.body?.email;
    const password = req.body?.password;
    
    // Validate email and password are provided
    if (!rawEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Validate and sanitize email
    if (!isValidEmail(rawEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const email = sanitizeString(rawEmail, { maxLength: 254 }).toLowerCase().trim();
    const devFallbackEnabled = process.env.DEV_FALLBACK === '1' || process.env.DEV_FALLBACK === 'true';

    // Query database
    let user = null;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (dbErr) {
      if (isDev) console.error('DB query error:', dbErr.message);
      // If DB is down and fallback is enabled, try local dev user
      if (devFallbackEnabled) {
        const local = loadLocalDevUser();
        if (local && local.email === email) {
          setSessionCookie(res, { userId: local.id, email: local.email, name: local.name });
          return res.status(200).json({ success: true, id: local.id, name: local.name, email: local.email });
        }
      }
      return res.status(503).json({ error: 'Database unavailable' });
    }

    // User not found
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password exists
    if (!user.password_hash) {
      if (isDev) console.warn('[signin] User has no password hash:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    let passwordValid = false;
    try {
      passwordValid = await bcryptjs.compare(password, user.password_hash);
    } catch (bcErr) {
      if (isDev) console.error('[signin] bcryptjs error:', bcErr.message);
      return res.status(500).json({ error: 'Authentication failed' });
    }

    if (!passwordValid) {
      if (isDev) console.warn('[signin] Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Set session cookie and return success
    setSessionCookie(res, { userId: user.id, email: user.email, name: user.name });
    return res.status(200).json({ success: true, id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error('[signin] Unhandled error:', err);
    return res.status(500).json({ error: 'Failed to sign in', details: isDev ? err.message : undefined });
  }
}

export default withRateLimit(handler, 'auth', RATE_LIMITS.auth);
