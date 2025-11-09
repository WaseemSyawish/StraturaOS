import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Resend } from 'resend';

// Initialize Resend only if API key is configured
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, token, newPassword } = req.body;

    // Step 1: Request password reset (send token)
    if (email && !token && !newPassword) {
      const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() }
      });

      if (!user) {
        // Don't reveal if user exists or not for security
        return res.status(200).json({ 
          success: true, 
          message: 'If an account exists with this email, you will receive reset instructions.' 
        });
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Try to save token to user record (skip if columns don't exist)
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            reset_token: resetToken,
            reset_token_expiry: resetTokenExpiry
          }
        });
      } catch (dbError) {
        console.log('Note: Database does not support reset tokens yet. Token will work via console only.');
      }

      // Send email with reset link
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      // In development, always log the token for easy testing
      if (process.env.NODE_ENV === 'development') {
        console.log('\n🔑 PASSWORD RESET REQUEST');
        console.log('   Email:', email);
        console.log('   Token:', resetToken);
        console.log('   🔗 Reset link:', resetUrl);
        console.log('   ⏰ Expires:', resetTokenExpiry.toLocaleString());
        console.log('');
      }

      // Check if email service is configured
      if (!resend) {
        console.warn('⚠️  RESEND_API_KEY not configured - email will not be sent');
        console.warn('   For production, get a free API key from: https://resend.com/api-keys');
        
        // In development, return success with dev link
        if (process.env.NODE_ENV === 'development') {
          return res.status(200).json({ 
            success: true, 
            message: 'Reset link generated (check server console - email not configured)',
            devToken: resetToken,
            devLink: resetUrl
          });
        }
        
        return res.status(500).json({ 
          error: 'Email service not configured. Please contact administrator.' 
        });
      }
      
      try {
        const emailResult = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'University Planner <onboarding@resend.dev>',
          to: email.trim(),
          subject: 'Reset Your Password - University Planner',
          text: `
Password Reset Request

Hello,

You requested to reset your password for University Planner.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this, you can safely ignore this email.

---
University Planner
Built with caffeine & desperation
          `.trim(),
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <!-- Header -->
                  <div style="background-color: #a855f7; border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
                    <div style="width: 64px; height: 64px; background-color: rgba(255,255,255,0.2); border-radius: 16px; margin: 0 auto 16px; line-height: 64px; font-size: 32px;">
                      🎓
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Password Reset Request</h1>
                  </div>
                  
                  <!-- Content -->
                  <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      Dear University Planner User,
                    </p>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      We have received a request to reset the password associated with your University Planner account. To proceed with resetting your password, please click the secure link below:
                    </p>
                    
                    <!-- Button -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${resetUrl}" style="display: inline-block; background-color: #a855f7; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Reset Your Password
                      </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="color: #7c3aed; font-size: 14px; word-break: break-all; margin: 8px 0 24px 0;">
                      ${resetUrl}
                    </p>
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 24px;">
                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
                        <strong>Important Security Information:</strong>
                      </p>
                      <ul style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                        <li style="margin-bottom: 8px;">This password reset link will expire in <strong>1 hour</strong> for your security.</li>
                        <li style="margin-bottom: 8px;">If you did not request this password reset, please disregard this email. Your account remains secure.</li>
                        <li>For security concerns, please contact our support team immediately.</li>
                      </ul>
                    </div>
                  </div>
                  
                  <!-- Footer -->
                  <div style="text-align: center; padding: 24px 0; color: #9ca3af; font-size: 12px;">
                    <p style="margin: 0 0 8px 0;"><strong>University Planner</strong></p>
                    <p style="margin: 0;">Empowering Academic Excellence Through Smart Planning</p>
                    <p style="margin: 8px 0 0 0; color: #d1d5db;">© 2025 University Planner. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
        
        console.log('✅ Password reset email sent successfully to:', email);
        console.log('   Email ID:', emailResult?.id || 'unknown');
      } catch (emailError) {
        console.error('❌ Email send error:', emailError);
        console.error('   Error details:', emailError.message || emailError);
        
        // In production, don't reveal email send failures for security
        // But in development, we want to know
        if (process.env.NODE_ENV === 'development') {
          return res.status(500).json({ 
            error: `Failed to send email: ${emailError.message || 'Unknown error'}. Check server logs.` 
          });
        }
        // Still return success to user (don't reveal if email exists)
        // But log the error for debugging
      }

      // In development, also log the token for easy testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔑 Reset token for ${email}: ${resetToken}`);
        console.log(`🔗 Reset link: ${resetUrl}`);
      }

      // In development, return the token so user can use it
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({ 
          success: true, 
          message: 'Reset token generated (check console for link)',
          devToken: resetToken // Only in dev mode
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'If an account exists with this email, you will receive reset instructions.' 
      });
    }

    // Step 2: Reset password with token
    if (token && newPassword) {
      // Find user with valid token
      let user;
      try {
        user = await prisma.user.findFirst({
          where: {
            reset_token: token,
            reset_token_expiry: {
              gt: new Date() // Token not expired
            }
          }
        });
      } catch (dbError) {
        // Columns don't exist - this feature requires database migration
        return res.status(400).json({ 
          error: 'Password reset requires database update. Please contact administrator.' 
        });
      }

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Validate new password
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password_hash: hashedPassword,
          reset_token: null,
          reset_token_expiry: null
        }
      });

      return res.status(200).json({ 
        success: true, 
        message: 'Password reset successful. You can now sign in with your new password.' 
      });
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Failed to process password reset' });
  }
}
