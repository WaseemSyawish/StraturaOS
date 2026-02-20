import { resolveUser } from '../../../lib/resolveUser';

export default async function handler(req, res) {
  // Only enable in dev
  if (process.env.NODE_ENV === 'production') return res.status(404).end();
  
  try {
    const userId = await resolveUser(req);
    const cookies = req.cookies || {};
    const raw = req.headers.cookie || '';
    
    res.status(200).json({ 
      ok: true, 
      resolved_user_id: userId,
      cookies: {
        session: cookies.session ? `[${cookies.session.length} chars]` : undefined,
        userId: cookies.userId,
        debug_userId: cookies.debug_userId,
        all_keys: Object.keys(cookies),
      },
      raw_cookie_header: raw ? raw.slice(0, 200) : 'empty',
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
}
