import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma';

const isDev = process.env.NODE_ENV === 'development';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { name, email, password } = req.body || {};
      if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
      if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Password too short' });

      // Normalize email
      const normEmail = String(email).trim().toLowerCase();

      // Check existing
      const existing = await prisma.user.findUnique({ where: { email: normEmail } });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);

      const created = await prisma.user.create({ data: {
        name: String(name).trim(),
        email: normEmail,
        password_hash: hash
      }});

      return res.status(201).json({ success: true, user: { id: created.id, email: created.email, name: created.name } });
    }

    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  } catch (err) {
    if (isDev) console.error('/api/users error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
