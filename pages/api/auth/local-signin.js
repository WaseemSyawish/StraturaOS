import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  // Only allow this legacy helper in development to avoid demo authentication in production
  if (process.env.NODE_ENV !== 'development') {
    res.status(404).send('Not found');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }
  try {
    const { email, password, returnTo } = req.body || {};
    if (!email || !password) {
      res.status(400).send('Email and password required');
      return;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password_hash) {
      res.status(401).send('Invalid credentials');
      return;
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      res.status(401).send('Invalid credentials');
      return;
    }

  // Set a simple HttpOnly cookie that our middleware accepts. In production you should
    // prefer secure, signed cookies and use proper session management.
    const maxAge = 60 * 60 * 24 * 30; // 30 days
  const cookie = `userId=${encodeURIComponent(user.id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
  // In dev, also set a non-HttpOnly readable cookie so client-side JS / logs can verify the cookie landed.
  const debugCookie = `debug_userId=${encodeURIComponent(user.id)}; Path=/; SameSite=Lax; Max-Age=${60}`; // short-lived debug cookie
  // Also create a session JWT so /api/auth/me and other token-based endpoints recognize this session
  try {
    const secret = process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret';
    const sessionToken = jwt.sign({ userId: user.id, email: user.email, name: user.name }, secret, { expiresIn: maxAge });
    const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
    const sessionCookie = `session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${secureFlag}`;
    // Set cookies (session last)
    res.setHeader('Set-Cookie', [cookie, debugCookie, sessionCookie]);
  } catch (e) {
    // If session creation fails, still set basic cookies
    res.setHeader('Set-Cookie', [cookie, debugCookie]);
  }
  // Dev logging to help trace whether the cookie was generated
  try { if (process.env.NODE_ENV !== 'production') console.log('[local-signin] set-cookies:', { cookie, debugCookie }, 'for user', user.email || user.id); } catch (e) {}
  const dest = returnTo || '/overview';
    res.writeHead(302, { Location: dest });
    res.end();
    return;
  } catch (err) {
    console.error('local-signin error', err);
    res.status(500).send('Server error');
    return;
  }
}
