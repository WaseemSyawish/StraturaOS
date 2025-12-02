// Debug endpoint - disabled in production for security
export default async function handler(req, res) {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  try {
    const { getToken } = await import('next-auth/jwt');
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret' });
    // Don't expose raw cookies in response
    return res.status(200).json({ 
      ok: true, 
      hasToken: !!token,
      userId: token?.userId || token?.sub || null
    });
  } catch (err) {
    // Already in dev mode (production returns 404 above)
    console.error('auth/debug error', err.message);
    return res.status(500).json({ ok: false, error: 'Debug check failed' });
  }
}
