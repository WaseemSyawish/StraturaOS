import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma';
import { withRateLimit, RATE_LIMITS } from '../../../lib/security/rate-limit';
import { withCsrfProtection } from '../../../lib/security/csrf';
import { registerSchema, withValidation } from '../../../lib/validation/schemas';

const isDev = process.env.NODE_ENV === 'development';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    // Body is already validated and sanitized by withValidation middleware
    const { name, email, password } = req.body;
    
    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'A user with that email already exists' });
    }

    // Hash password with bcrypt (cost factor 12 for better security)
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ 
      data: { 
        email, 
        name: name || null, 
        password_hash: hash 
      } 
    });

    // Don't expose internal user ID in response - use email confirmation instead
    return res.status(201).json({ 
      success: true,
      message: 'Account created successfully',
      email: user.email 
    });
  } catch (err) {
    if (isDev) console.error('Register error', err);
    // Generic error message to prevent information leakage
    return res.status(500).json({ error: 'Unable to create account. Please try again.' });
  }
}

// Apply validation, rate limiting, and CSRF protection
export default withCsrfProtection(
  withRateLimit(
    withValidation(handler, registerSchema),
    'auth',
    RATE_LIMITS.auth
  ),
  { skipInDev: true }
);
