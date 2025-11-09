import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Delete all user data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete attendance sessions
      await tx.attendanceSession.deleteMany({
        where: { userId: user.id }
      });

      // Delete grades
      await tx.grade.deleteMany({
        where: { userId: user.id }
      });

      // Delete events and archived events
      await tx.event.deleteMany({
        where: { userId: user.id }
      });

      await tx.archivedEvent.deleteMany({
        where: { userId: user.id }
      });

      // Delete courses
      await tx.course.deleteMany({
        where: { userId: user.id }
      });

      // Delete accounts
      await tx.account.deleteMany({
        where: { userId: user.id }
      });

      // Delete sessions
      await tx.session.deleteMany({
        where: { userId: user.id }
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: user.id }
      });
    });

    return res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
}
