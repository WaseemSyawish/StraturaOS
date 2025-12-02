import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';

const isDev = process.env.NODE_ENV === 'development';

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return Object.fromEntries(raw.split(';').map(s => { const [k,v] = s.split('='); return [k && k.trim(), v && v.trim()]; }).filter(Boolean));
}

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  try {
    if (req.method === 'GET') {
      // require token-based auth: only allow access if token.userId === id or admin
      const tokenUserId = await resolveUser(req);
      if (!tokenUserId) return res.status(401).json({ error: 'Unauthorized' });
      if (tokenUserId !== id) return res.status(403).json({ error: 'Forbidden' });
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      // Extract avatarColor from settings JSON
      const settings = user.settings || {};
      const avatarColor = settings.avatarColor || '#7c3aed';
      return res.json({ id: user.id, name: user.name || 'User', email: user.email || '', avatarColor });
    }

    if (req.method === 'PATCH') {
      // token-based auth: only allow updating your own profile
      const tokenUserId = await resolveUser(req);
      if (!tokenUserId) return res.status(401).json({ error: 'Unauthorized' });
      if (tokenUserId !== id) return res.status(403).json({ error: 'Forbidden' });
      const { name, email, avatarColor } = req.body || {};
      
      // First, get current user to merge settings
      const currentUser = await prisma.user.findUnique({ where: { id } });
      if (!currentUser) return res.status(404).json({ error: 'User not found' });
      
      const data = {};
      if (typeof name === 'string') data.name = name;
      if (typeof email === 'string') data.email = email;
      
      // Store avatarColor in settings JSON
      if (typeof avatarColor === 'string') {
        const currentSettings = currentUser.settings || {};
        data.settings = { ...currentSettings, avatarColor };
      }
      
      const updated = await prisma.user.update({ where: { id }, data });
      const updatedSettings = updated.settings || {};
      return res.json({ success: true, user: { id: updated.id, name: updated.name, email: updated.email, avatarColor: updatedSettings.avatarColor || '#7c3aed' } });
    }

    res.setHeader('Allow', 'GET,PATCH');
    return res.status(405).end();
  } catch (err) {
    if (isDev) console.error('[api/users/[id]]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
