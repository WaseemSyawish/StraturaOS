import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';

export default async function handler(req, res) {
  const userId = await resolveUser(req);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      console.log('[settings API] GET request for user:', userId);
      // Get user's focus settings
      let settings = await prisma.focusSettings.findUnique({
        where: { user_id: userId },
      });

      console.log('[settings API] Found settings:', settings ? 'YES' : 'NO');

      // Create default settings if none exist
      if (!settings) {
        console.log('[settings API] Creating default settings');
        settings = await prisma.focusSettings.create({
          data: {
            user_id: userId,
          },
        });
      }

      console.log('[settings API] Returning settings:', JSON.stringify(settings, null, 2));
      return res.status(200).json({ settings });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      console.log('[settings API] PUT/PATCH request for user:', userId);
      console.log('[settings API] Request body:', JSON.stringify(req.body, null, 2));
      console.log('[settings API] Request method:', req.method);
      
      // Update focus settings
      const {
        focus_duration,
        short_break_duration,
        long_break_duration,
        sessions_until_long_break,
        sound_enabled,
        sound_volume,
        sound_type,
        notifications_enabled,
        auto_start_breaks,
        auto_start_focus,
        daily_goal_sessions,
        theme_preference,
      } = req.body;

      // Check if settings exist
      let settings = await prisma.focusSettings.findUnique({
        where: { user_id: userId },
      });

      console.log('[settings API] Existing settings:', settings ? 'YES' : 'NO');

      if (!settings) {
        // Create new settings
        settings = await prisma.focusSettings.create({
          data: {
            user_id: userId,
            ...(focus_duration !== undefined && { focus_duration }),
            ...(short_break_duration !== undefined && { short_break_duration }),
            ...(long_break_duration !== undefined && { long_break_duration }),
            ...(sessions_until_long_break !== undefined && { sessions_until_long_break }),
            ...(sound_enabled !== undefined && { sound_enabled }),
            ...(sound_volume !== undefined && { sound_volume }),
            ...(sound_type !== undefined && { sound_type }),
            ...(notifications_enabled !== undefined && { notifications_enabled }),
            ...(auto_start_breaks !== undefined && { auto_start_breaks }),
            ...(auto_start_focus !== undefined && { auto_start_focus }),
            ...(daily_goal_sessions !== undefined && { daily_goal_sessions }),
            ...(theme_preference !== undefined && { theme_preference }),
          },
        });
      } else {
        // Update existing settings
        settings = await prisma.focusSettings.update({
          where: { user_id: userId },
          data: {
            ...(focus_duration !== undefined && { focus_duration }),
            ...(short_break_duration !== undefined && { short_break_duration }),
            ...(long_break_duration !== undefined && { long_break_duration }),
            ...(sessions_until_long_break !== undefined && { sessions_until_long_break }),
            ...(sound_enabled !== undefined && { sound_enabled }),
            ...(sound_volume !== undefined && { sound_volume }),
            ...(sound_type !== undefined && { sound_type }),
            ...(notifications_enabled !== undefined && { notifications_enabled }),
            ...(auto_start_breaks !== undefined && { auto_start_breaks }),
            ...(auto_start_focus !== undefined && { auto_start_focus }),
            ...(daily_goal_sessions !== undefined && { daily_goal_sessions }),
            ...(theme_preference !== undefined && { theme_preference }),
            updated_at: new Date(),
          },
        });
      }

      console.log('[settings API] Final settings object:', JSON.stringify(settings, null, 2));
      return res.status(200).json({ settings });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Focus settings API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
