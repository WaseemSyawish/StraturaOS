const { resolveUser } = require('../../../lib/resolveUser');

module.exports = async function handler(req, res) {
  try {
    console.log('[auth-debug] Environment:', process.env.NODE_ENV);
    console.log('[auth-debug] NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
    console.log('[auth-debug] NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    console.log('[auth-debug] Cookies:', Object.keys(req.cookies || {}));
    
    const userId = await resolveUser(req);
    
    return res.status(200).json({
      authenticated: !!userId,
      userId: userId,
      environment: process.env.NODE_ENV,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      cookies: Object.keys(req.cookies || {}),
      headers: {
        cookie: req.headers.cookie ? 'present' : 'missing',
        host: req.headers.host
      }
    });
  } catch (error) {
    console.error('[auth-debug] Error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};
