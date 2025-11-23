import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';

export default async function handler(req, res) {
  const userId = await resolveUser(req);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      // Get focus sessions with optional filters
      const { startDate, endDate, type, limit = 50 } = req.query;
      
      const where = {
        user_id: userId,
        ...(startDate && { started_at: { gte: new Date(startDate) } }),
        ...(endDate && { started_at: { lte: new Date(endDate) } }),
        ...(type && { session_type: type }),
      };

      const sessions = await prisma.focusSession.findMany({
        where,
        orderBy: { started_at: 'desc' },
        take: parseInt(limit),
        include: {
          event: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
        },
      });

      return res.status(200).json({ sessions });
    }

    if (req.method === 'POST') {
      // Create a new focus session
      const {
        task_name,
        task_id,
        session_type = 'focus',
        duration,
        started_at,
        ended_at,
        completed = false,
        interrupted = false,
        notes,
      } = req.body;

      if (!duration || !started_at) {
        return res.status(400).json({ error: 'Duration and started_at are required' });
      }

      const session = await prisma.focusSession.create({
        data: {
          user_id: userId,
          task_name,
          task_id,
          session_type,
          duration,
          started_at: new Date(started_at),
          ended_at: ended_at ? new Date(ended_at) : null,
          completed,
          interrupted,
          notes,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
        },
      });

      return res.status(201).json({ session });
    }

    if (req.method === 'PATCH') {
      // Update an existing session (for completing or interrupting)
      const { session_id, ended_at, completed, interrupted, notes } = req.body;

      if (!session_id) {
        return res.status(400).json({ error: 'session_id is required' });
      }

      // Verify session belongs to user
      const existingSession = await prisma.focusSession.findFirst({
        where: {
          id: session_id,
          user_id: userId,
        },
      });

      if (!existingSession) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const updatedSession = await prisma.focusSession.update({
        where: { id: session_id },
        data: {
          ...(ended_at && { ended_at: new Date(ended_at) }),
          ...(completed !== undefined && { completed }),
          ...(interrupted !== undefined && { interrupted }),
          ...(notes && { notes }),
          updated_at: new Date(),
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
        },
      });

      return res.status(200).json({ session: updatedSession });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Focus sessions API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
