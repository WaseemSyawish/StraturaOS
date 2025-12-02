import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';
import withPrisma from '../../../lib/withPrisma';

const isDev = process.env.NODE_ENV === 'development';

async function handler(req, res) {
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

      if (isDev) console.log('[api/focus/sessions] userId=', userId, 'creating session with duration=', duration);
      if (!duration || !started_at) {
        return res.status(400).json({ error: 'Duration and started_at are required' });
      }

      try {
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
        });

        if (isDev) console.log('[api/focus/sessions] created session id=', session.id);

        return res.status(201).json({ session });
      } catch (err) {
        if (isDev) console.error('[api/focus/sessions] Prisma error on POST:', err && err.message ? err.message : err);
        // Dev fallback: persist to local JSON when Prisma engine not available
        if (process.env.NODE_ENV !== 'production' && err && String(err.message || '').includes('Engine is not yet connected')) {
          try {
            const devFile = path.join(process.cwd(), 'data', 'dev-focus-sessions.json');
            let list = [];
            if (fs.existsSync(devFile)) {
              const raw = fs.readFileSync(devFile, 'utf8');
              list = raw ? JSON.parse(raw) : [];
            }
            const fakeSession = {
              id: 'dev-' + Date.now(),
              user_id: userId,
              task_name,
              task_id,
              session_type,
              duration,
              started_at,
              ended_at: ended_at || null,
              completed,
              interrupted,
              notes: notes || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            list.push(fakeSession);
            fs.writeFileSync(devFile, JSON.stringify(list, null, 2));
            if (isDev) console.log('[api/focus/sessions] Wrote dev session to', devFile);
            return res.status(201).json({ session: fakeSession, fallback: 'dev-file' });
          } catch (fsErr) {
            if (isDev) console.error('[api/focus/sessions] dev fallback write failed:', fsErr);
            return res.status(500).json({ error: 'Prisma unavailable and fallback failed' });
          }
        }

        throw err;
      }
    }

    if (req.method === 'PATCH') {
      // Update an existing session (for completing or interrupting)
      const { session_id, ended_at, completed, interrupted, notes } = req.body;

      if (isDev) console.log('[api/focus/sessions] PATCH for session_id=', session_id, 'userId=', userId);

      if (!session_id) {
        return res.status(400).json({ error: 'session_id is required' });
      }

      try {
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

        // Calculate actual duration if session is being ended
        const MIN_DURATION_SECONDS = 300; // 5 minutes
        if (ended_at && !completed) {
          const startTime = new Date(existingSession.started_at);
          const endTime = new Date(ended_at);
          const actualDurationSeconds = Math.floor((endTime - startTime) / 1000);
          
          // If session was under 5 minutes and not completed, delete it instead of saving
          if (actualDurationSeconds < MIN_DURATION_SECONDS) {
            await prisma.focusSession.delete({
              where: { id: session_id },
            });
            if (isDev) console.log('[api/focus/sessions] Deleted incomplete session under 5 min, id=', session_id, 'duration=', actualDurationSeconds, 'seconds');
            return res.status(200).json({ session: null, deleted: true, reason: 'Session under 5 minutes' });
          }
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
        });

        return res.status(200).json({ session: updatedSession });
      } catch (err) {
        if (isDev) console.error('[api/focus/sessions] Prisma error on PATCH:', err && err.message ? err.message : err);
        if (process.env.NODE_ENV !== 'production' && err && String(err.message || '').includes('Engine is not yet connected')) {
          // Dev fallback: update local JSON file
          try {
            const devFile = path.join(process.cwd(), 'data', 'dev-focus-sessions.json');
            let list = [];
            if (fs.existsSync(devFile)) {
              const raw = fs.readFileSync(devFile, 'utf8');
              list = raw ? JSON.parse(raw) : [];
            }
            const idx = list.findIndex(s => s.id === session_id || s.id === String(session_id));
            if (idx === -1) {
              return res.status(404).json({ error: 'Session not found (dev fallback)' });
            }
            if (ended_at) list[idx].ended_at = ended_at;
            if (completed !== undefined) list[idx].completed = completed;
            if (interrupted !== undefined) list[idx].interrupted = interrupted;
            if (notes) list[idx].notes = notes;
            list[idx].updated_at = new Date().toISOString();
            fs.writeFileSync(devFile, JSON.stringify(list, null, 2));
            if (isDev) console.log('[api/focus/sessions] Updated dev session in', devFile);
            return res.status(200).json({ session: list[idx], fallback: 'dev-file' });
          } catch (fsErr) {
            if (isDev) console.error('[api/focus/sessions] dev fallback update failed:', fsErr);
            return res.status(500).json({ error: 'Prisma unavailable and fallback failed' });
          }
        }

        throw err;
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    if (isDev) console.error('Focus sessions API error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Use withPrisma wrapper for connection management
export default withPrisma(handler);
