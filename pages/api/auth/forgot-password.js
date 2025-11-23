import { Resend } from 'resend';
import crypto from 'crypto';
import prisma from '../../../lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_reset_token: resetToken,
        password_reset_expires: resetTokenExpiry,
        updated_at: new Date()
      }
    });

    // Send reset email - use the request's host so it works in dev and production
    // Priority: 1) NEXTAUTH_URL env var, 2) x-forwarded headers (production), 3) request host header
    let baseUrl = process.env.NEXTAUTH_URL;
    
    if (!baseUrl) {
      const protocol = req.headers['x-forwarded-proto'] || (req.connection?.encrypted ? 'https' : 'http');
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
      baseUrl = `${protocol}://${host}`;
    }
    
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'University Planner <noreply@universityplanner.com>',
        to: user.email,
        subject: 'Reset your University Planner password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reset your password</h2>
            <p>Hello ${user.name || 'there'},</p>
            <p>You requested a password reset for your University Planner account.</p>
            <p>Click the link below to reset your password:</p>
            <p style="margin: 20px 0;">
              <a href="${resetUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
            <p>Best regards,<br>The University Planner Team</p>
          </div>
        `
      });

      console.log(`Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // For development: log the reset link to console if email fails
      console.log(`
🔑 PASSWORD RESET REQUEST
   Email: ${user.email}
   Token: ${resetToken}
   🔗 Reset link: ${resetUrl}
   ⏰ Expires: ${resetTokenExpiry.toLocaleString()}

⚠️  Email sending failed - check RESEND_API_KEY configuration
   For production, get a free API key from: https://resend.com/api-keys
      `);
      return res.status(500).json({ error: 'Failed to send reset email' });
    }

    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      error: process.env.NODE_ENV === 'development'
        ? `Server error: ${error.message}`
        : 'An error occurred'
    });
  }
}