import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma';
import { withRateLimit, RATE_LIMITS } from '../../../lib/security/rate-limit';
import { isValidEmail, validatePassword, sanitizeString } from '../../../lib/security/validation';

const isDev = process.env.NODE_ENV === 'development';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { name, email, password } = req.body || {};
    
    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        details: passwordValidation.errors 
      });
    }
    
    // Sanitize name input
    const sanitizedName = name ? sanitizeString(name, { maxLength: 100 }) : null;
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'A user with that email already exists' });
    }

    // Hash password with bcrypt (cost factor 12 for better security)
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ 
      data: { 
        email: normalizedEmail, 
        name: sanitizedName, 
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

// Apply rate limiting - 5 registration attempts per minute
export default withRateLimit(handler, 'auth', RATE_LIMITS.auth);
