import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { getToken } from 'next-auth/jwt';
import prisma from '../../lib/prisma';

// Helper to resolve userId from session with development fallbacks
async function resolveUserId(req, res) {
  try {
    // Try next-auth token first
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret' });
    const tokenUserId = token && (token.userId || token.sub) ? (token.userId || token.sub) : null;
    if (tokenUserId) return tokenUserId;

    // In development, allow fallback cookies
    if (process.env.NODE_ENV !== 'production' && req && req.cookies) {
      if (req.cookies.userId) return req.cookies.userId;
      if (req.cookies.debug_userId) return req.cookies.debug_userId;
    }

    // Try session as final fallback
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) return null;
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    
    return user?.id || null;
  } catch (err) {
    console.error('resolveUserId error', err);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const userId = await resolveUserId(req, res);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // GET: Fetch all semester settings
    if (req.method === 'GET') {
      const settings = await prisma.semesterSetting.findMany({
        where: { user_id: userId },
        orderBy: { start_date: 'desc' }
      });

      return res.status(200).json({ success: true, settings });
    }

    // POST: Create new semester setting
    if (req.method === 'POST') {
      const { name, start_date, end_date, is_active } = req.body;

      if (!name || !start_date || !end_date) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: name, start_date, end_date' 
        });
      }

      // If setting this as active, deactivate all others
      if (is_active) {
        await prisma.semesterSetting.updateMany({
          where: { user_id: userId },
          data: { is_active: false }
        });
      }

      const setting = await prisma.semesterSetting.create({
        data: {
          user_id: userId,
          name,
          start_date: new Date(start_date),
          end_date: new Date(end_date),
          is_active: is_active ?? false
        }
      });

      return res.status(201).json({ success: true, setting });
    }

    // PATCH: Update semester setting
    if (req.method === 'PATCH') {
      const { id, name, start_date, end_date, is_active } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Missing id' });
      }

      // Verify ownership
      const existing = await prisma.semesterSetting.findFirst({
        where: { id, user_id: userId }
      });

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Setting not found' });
      }

      // If setting this as active, deactivate all others
      if (is_active) {
        await prisma.semesterSetting.updateMany({
          where: { user_id: userId, id: { not: id } },
          data: { is_active: false }
        });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (start_date !== undefined) updateData.start_date = new Date(start_date);
      if (end_date !== undefined) updateData.end_date = new Date(end_date);
      if (is_active !== undefined) updateData.is_active = is_active;

      const setting = await prisma.semesterSetting.update({
        where: { id },
        data: updateData
      });

      return res.status(200).json({ success: true, setting });
    }

    // DELETE: Remove semester setting
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Missing id' });
      }

      // Verify ownership
      const existing = await prisma.semesterSetting.findFirst({
        where: { id, user_id: userId }
      });

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Setting not found' });
      }

      await prisma.semesterSetting.delete({
        where: { id }
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('Semester settings API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
