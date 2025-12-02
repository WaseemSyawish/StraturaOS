import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { withRateLimit, RATE_LIMITS } from '../../../lib/security/rate-limit';

const isDev = process.env.NODE_ENV === 'development';

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Find user by ID from session (more secure than email)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    if (!user.password_hash) {
      return res.status(400).json({ error: 'Cannot verify account - no password set' });
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Delete all user data in transaction
    // Using correct field names from Prisma schema
    await prisma.$transaction(async (tx) => {
      // Delete focus sessions
      await tx.focusSession.deleteMany({
        where: { user_id: user.id }
      });

      // Delete focus settings
      await tx.focusSettings.deleteMany({
        where: { user_id: user.id }
      });

      // Delete attendance sessions
      await tx.attendanceSession.deleteMany({
        where: { user_id: user.id }
      });

      // Delete assessments (linked to courses)
      await tx.assessment.deleteMany({
        where: { user_id: user.id }
      });

      // Delete events and archived events
      await tx.event.deleteMany({
        where: { user_id: user.id }
      });

      await tx.archivedEvent.deleteMany({
        where: { user_id: user.id }
      });

      // Delete event templates
      await tx.eventTemplate.deleteMany({
        where: { user_id: user.id }
      });

      // Delete semester settings
      await tx.semesterSetting.deleteMany({
        where: { user_id: user.id }
      });

      // Delete courses (will cascade to course resources)
      await tx.course.deleteMany({
        where: { user_id: user.id }
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: user.id }
      });
    });

    return res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    if (isDev) console.error('Delete account error:', error.message);
    return res.status(500).json({ error: 'Failed to delete account. Please try again.' });
  }
}

// Apply rate limiting - 3 attempts per hour
export default withRateLimit(handler, 'auth', RATE_LIMITS.auth);
