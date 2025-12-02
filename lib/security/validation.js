/**
 * Input validation and sanitization utilities
 * Prevents XSS, SQL injection, and other input-based attacks
 */

/**
 * Sanitize string input - remove potential XSS vectors
 * @param {string} input - User input string
 * @param {object} options - { maxLength, allowHtml }
 * @returns {string} Sanitized string
 */
export function sanitizeString(input, options = {}) {
  if (typeof input !== 'string') return '';
  
  const { maxLength = 10000, allowHtml = false } = options;
  
  let sanitized = input.trim();
  
  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  if (!allowHtml) {
    // Escape HTML entities to prevent XSS
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  return sanitized;
}

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return email.length <= 254 && emailRegex.test(email);
}

/**
 * Validate UUID format
 * @param {string} id 
 * @returns {boolean}
 */
export function isValidUUID(id) {
  if (typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate password strength
 * @param {string} password 
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePassword(password) {
  const errors = [];
  
  if (typeof password !== 'string') {
    return { valid: false, errors: ['Password must be a string'] };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for at least one digit
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize object fields recursively
 * @param {object} obj - Object to sanitize
 * @param {object} schema - Field definitions { fieldName: { type, maxLength, required } }
 * @returns {{ sanitized: object, errors: string[] }}
 */
export function sanitizeObject(obj, schema = {}) {
  if (!obj || typeof obj !== 'object') {
    return { sanitized: {}, errors: ['Invalid input object'] };
  }
  
  const sanitized = {};
  const errors = [];
  
  for (const [key, config] of Object.entries(schema)) {
    const value = obj[key];
    const { type = 'string', maxLength, required = false, allowNull = true } = config;
    
    // Check required fields
    if (required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} is required`);
      continue;
    }
    
    // Allow null if specified
    if ((value === undefined || value === null) && allowNull) {
      sanitized[key] = null;
      continue;
    }
    
    // Type-specific validation and sanitization
    switch (type) {
      case 'string':
        sanitized[key] = sanitizeString(value, { maxLength: maxLength || 10000 });
        break;
      case 'email':
        const email = String(value).toLowerCase().trim();
        if (!isValidEmail(email)) {
          errors.push(`${key} must be a valid email address`);
        } else {
          sanitized[key] = email;
        }
        break;
      case 'uuid':
        if (!isValidUUID(value)) {
          errors.push(`${key} must be a valid UUID`);
        } else {
          sanitized[key] = value;
        }
        break;
      case 'number':
        const num = Number(value);
        if (Number.isNaN(num)) {
          errors.push(`${key} must be a valid number`);
        } else {
          sanitized[key] = num;
        }
        break;
      case 'boolean':
        sanitized[key] = Boolean(value);
        break;
      case 'date':
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
          errors.push(`${key} must be a valid date`);
        } else {
          sanitized[key] = date;
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${key} must be an array`);
        } else {
          sanitized[key] = value.slice(0, maxLength || 100);
        }
        break;
      default:
        sanitized[key] = value;
    }
  }
  
  return { sanitized, errors };
}

/**
 * Prevent prototype pollution by removing dangerous keys
 * @param {object} obj 
 * @returns {object}
 */
export function cleanObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  const cleaned = {};
  
  for (const key of Object.keys(obj)) {
    if (!dangerous.includes(key)) {
      cleaned[key] = obj[key];
    }
  }
  
  return cleaned;
}

export default {
  sanitizeString,
  isValidEmail,
  isValidUUID,
  validatePassword,
  sanitizeObject,
  cleanObject,
};
