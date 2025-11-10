// Semester settings API - manages user semester configurations
// Updated: 2025-11-10 - Force rebuild for ES6 module fixes
import prisma from '../../lib/prisma';
import { resolveUser } from '../../lib/resolveUser';

export default async function handler(req, res) {
  try {
    console.log('[semester-settings] Method:', req.method, 'Path:', req.url);
    console.log('[semester-settings] Prisma client:', typeof prisma, 'has semesterSetting:', !!prisma?.semesterSetting);
    
    const userId = await resolveUser(req);
    console.log('[semester-settings] Resolved userId:', userId);
    
    if (!userId) {
      console.log('[semester-settings] Not authenticated - returning 401');
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // GET: Fetch all semester settings
    if (req.method === 'GET') {
      const settings = await prisma.semesterSetting.findMany({
        where: { user_id: userId },
        orderBy: { start_date: 'desc' }
      });

      return res.status(200).json({ success: true, semesters: settings, settings });
    }

    // POST: Create new semester setting
    if (req.method === 'POST') {
      console.log('[semester-settings POST] Request body:', req.body);
      console.log('[semester-settings POST] userId:', userId);
      
      const { name, start_date, end_date, is_active } = req.body;

      if (!name || !start_date || !end_date) {
        console.log('[semester-settings POST] Missing fields - name:', !!name, 'start_date:', !!start_date, 'end_date:', !!end_date);
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: name, start_date, end_date' 
        });
      }

      // If setting this as active, deactivate all others
      if (is_active) {
        console.log('[semester-settings POST] Deactivating other semesters for user:', userId);
        await prisma.semesterSetting.updateMany({
          where: { user_id: userId },
          data: { is_active: false }
        });
      }

      console.log('[semester-settings POST] Creating semester with data:', {
        user_id: userId,
        name,
        start_date,
        end_date,
        is_active: is_active ?? false
      });

      const setting = await prisma.semesterSetting.create({
        data: {
          user_id: userId,
          name,
          start_date: new Date(start_date),
          end_date: new Date(end_date),
          is_active: is_active ?? false
        }
      });

      console.log('[semester-settings POST] Successfully created semester:', setting.id);
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
    console.error('[semester-settings] ERROR:', error);
    console.error('[semester-settings] Error name:', error.name);
    console.error('[semester-settings] Error message:', error.message);
    console.error('[semester-settings] Error stack:', error.stack);
    
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message,
      errorType: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
