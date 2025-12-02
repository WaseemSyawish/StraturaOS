import { resolveUser } from '../../../lib/resolveUser';
import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma';

const isDev = process.env.NODE_ENV === 'development';

export default async function handler(req, res) {
  try {
    let userId = await resolveUser(req);
    
    // Development helper: allow devUserId query param when running locally
    if (!userId && (process.env.NODE_ENV === 'development' || process.env.ALLOW_DEV === 'true')) {
      const devUserId = req.query && req.query.devUserId ? String(req.query.devUserId) : null;
      if (devUserId) userId = devUserId;
    }
    
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.password_hash) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
      const ok = await bcrypt.compare(currentPassword, user.password_hash);
      if (!ok) return res.status(403).json({ error: 'Invalid current password' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password_hash: hash } });

    return res.status(200).json({ success: true });
  } catch (err) {
    if (isDev) console.error('/api/users/change-password error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
