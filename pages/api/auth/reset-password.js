import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

const isDev = process.env.NODE_ENV === 'development';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, newPassword, currentPassword, token } = req.body;

    // Token-based password reset (forgot password flow)
    if (token) {
      if (!newPassword) {
        return res.status(400).json({ error: 'New password is required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      // Find user with valid reset token
      const user = await prisma.user.findFirst({
        where: {
          password_reset_token: token,
          password_reset_expires: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password_hash: hashedPassword,
          password_reset_token: null,
          password_reset_expires: null,
          updated_at: new Date()
        }
      });

      if (isDev) console.log(`Password reset successful for user ${user.email}`);

      return res.status(200).json({
        success: true,
        message: 'Password has been reset successfully'
      });
    }

    // Current password-based reset (change password flow)
    if (!email || !newPassword || !currentPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        updated_at: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    if (isDev) console.error('Password reset error:', error);
    return res.status(500).json({
      error: process.env.NODE_ENV === 'development'
        ? `Server error: ${error.message}`
        : 'An error occurred'
    });
  }
}
