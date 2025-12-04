import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { withRateLimit, RATE_LIMITS } from '../../../lib/security/rate-limit';
import { withCsrfProtection } from '../../../lib/security/csrf';
import { validatePassword, sanitizeString } from '../../../lib/security/validation';

const isDev = process.env.NODE_ENV === 'development';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email: rawEmail, newPassword, currentPassword, token } = req.body;
    const email = rawEmail ? sanitizeString(rawEmail, { maxLength: 254 }).toLowerCase().trim() : null;

    // Token-based password reset (forgot password flow)
    if (token) {
      if (!newPassword) {
        return res.status(400).json({ error: 'New password is required' });
      }

      // Validate password strength
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.errors[0] || 'Password does not meet requirements' });
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

    // Validate password strength
    const pwdValidation = validatePassword(newPassword);
    if (!pwdValidation.valid) {
      return res.status(400).json({ error: pwdValidation.errors[0] || 'Password does not meet requirements' });
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

export default withCsrfProtection(
  withRateLimit(handler, 'passwordReset', RATE_LIMITS.passwordReset),
  { skipInDev: true }
);
