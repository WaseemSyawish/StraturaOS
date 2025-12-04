/**
 * Comprehensive error logging and monitoring
 * 
 * This module provides:
 * 1. Structured error logging
 * 2. Error classification and severity levels
 * 3. Integration points for external services (Sentry, LogRocket, etc.)
 * 4. Request context tracking
 */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

/**
 * Error categories for classification
 */
export const ErrorCategory = {
  AUTH: 'auth',
  DATABASE: 'database',
  VALIDATION: 'validation',
  RATE_LIMIT: 'rate_limit',
  EXTERNAL_SERVICE: 'external_service',
  INTERNAL: 'internal',
  NETWORK: 'network',
  PERMISSION: 'permission',
};

/**
 * Generate a unique error ID for tracking
 */
function generateErrorId() {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Extract relevant context from a request object
 */
function extractRequestContext(req) {
  if (!req) return {};
  
  return {
    method: req.method,
    path: req.url,
    query: req.query,
    userAgent: req.headers?.['user-agent'],
    ip: req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || 
        req.socket?.remoteAddress || 
        'unknown',
    // Don't log sensitive headers
  };
}

/**
 * Extract safe user info (no sensitive data)
 */
function extractUserContext(user) {
  if (!user) return {};
  
  return {
    userId: user.id || user.userId,
    // Don't log email or other PII
  };
}

/**
 * Format error for logging
 */
function formatError(error) {
  if (!error) return { message: 'Unknown error' };
  
  return {
    message: error.message || String(error),
    name: error.name,
    code: error.code,
    stack: isDev ? error.stack : undefined, // Only include stack in dev
  };
}

/**
 * Main logger class
 */
class Logger {
  constructor() {
    this.context = {};
    this.handlers = [];
    
    // Add console handler by default
    this.addHandler(consoleHandler);
  }
  
  /**
   * Set global context (e.g., service name, version)
   */
  setGlobalContext(context) {
    this.context = { ...this.context, ...context };
  }
  
  /**
   * Add a log handler
   */
  addHandler(handler) {
    if (typeof handler === 'function') {
      this.handlers.push(handler);
    }
  }
  
  /**
   * Remove a log handler
   */
  removeHandler(handler) {
    this.handlers = this.handlers.filter(h => h !== handler);
  }
  
  /**
   * Log an entry to all handlers
   */
  _log(entry) {
    const enrichedEntry = {
      ...entry,
      ...this.context,
      timestamp: new Date().toISOString(),
    };
    
    for (const handler of this.handlers) {
      try {
        handler(enrichedEntry);
      } catch (e) {
        // Don't let handler errors break logging
        console.error('[logger] Handler error:', e);
      }
    }
  }
  
  /**
   * Log debug message
   */
  debug(message, data = {}) {
    if (!isDev) return; // Skip debug logs in production
    this._log({
      severity: ErrorSeverity.DEBUG,
      message,
      ...data,
    });
  }
  
  /**
   * Log info message
   */
  info(message, data = {}) {
    this._log({
      severity: ErrorSeverity.INFO,
      message,
      ...data,
    });
  }
  
  /**
   * Log warning
   */
  warn(message, data = {}) {
    this._log({
      severity: ErrorSeverity.WARNING,
      message,
      ...data,
    });
  }
  
  /**
   * Log error
   */
  error(message, error = null, data = {}) {
    const errorId = generateErrorId();
    
    this._log({
      severity: ErrorSeverity.ERROR,
      message,
      errorId,
      error: formatError(error),
      ...data,
    });
    
    return errorId;
  }
  
  /**
   * Log critical error
   */
  critical(message, error = null, data = {}) {
    const errorId = generateErrorId();
    
    this._log({
      severity: ErrorSeverity.CRITICAL,
      message,
      errorId,
      error: formatError(error),
      ...data,
    });
    
    return errorId;
  }
  
  /**
   * Log API request
   */
  logRequest(req, res, responseTime) {
    this._log({
      severity: ErrorSeverity.INFO,
      type: 'request',
      request: extractRequestContext(req),
      statusCode: res?.statusCode,
      responseTime,
    });
  }
  
  /**
   * Log API error with request context
   */
  logApiError(req, error, category = ErrorCategory.INTERNAL, data = {}) {
    const errorId = generateErrorId();
    
    this._log({
      severity: ErrorSeverity.ERROR,
      type: 'api_error',
      errorId,
      category,
      error: formatError(error),
      request: extractRequestContext(req),
      ...data,
    });
    
    return errorId;
  }
  
  /**
   * Log authentication event
   */
  logAuth(event, req, success = true, data = {}) {
    this._log({
      severity: success ? ErrorSeverity.INFO : ErrorSeverity.WARNING,
      type: 'auth',
      event,
      success,
      request: extractRequestContext(req),
      ...data,
    });
  }
  
  /**
   * Log database operation
   */
  logDb(operation, table, duration, success = true, data = {}) {
    this._log({
      severity: success ? ErrorSeverity.DEBUG : ErrorSeverity.ERROR,
      type: 'database',
      operation,
      table,
      duration,
      success,
      ...data,
    });
  }
}

/**
 * Console handler - formats and logs to console
 */
function consoleHandler(entry) {
  const { severity, message, errorId, error, ...rest } = entry;
  
  const prefix = `[${severity.toUpperCase()}]`;
  const errorIdStr = errorId ? ` (${errorId})` : '';
  
  const logData = Object.keys(rest).length > 0 ? rest : undefined;
  
  switch (severity) {
    case ErrorSeverity.DEBUG:
      console.debug(prefix, message, logData || '');
      break;
    case ErrorSeverity.INFO:
      console.info(prefix, message, logData || '');
      break;
    case ErrorSeverity.WARNING:
      console.warn(prefix + errorIdStr, message, error?.message || '', logData || '');
      break;
    case ErrorSeverity.ERROR:
      console.error(prefix + errorIdStr, message, error?.message || '', logData || '');
      if (error?.stack && isDev) console.error(error.stack);
      break;
    case ErrorSeverity.CRITICAL:
      console.error('🚨 CRITICAL' + errorIdStr, message, error?.message || '', logData || '');
      if (error?.stack) console.error(error.stack);
      break;
  }
}

/**
 * Create a JSON handler for structured logging (e.g., for log aggregation)
 */
export function createJsonHandler(outputFn = console.log) {
  return (entry) => {
    try {
      outputFn(JSON.stringify(entry));
    } catch (e) {
      console.error('[logger] JSON handler error:', e);
    }
  };
}

/**
 * Create a handler that sends errors to an external service
 * This is a placeholder - implement with your preferred service (Sentry, LogRocket, etc.)
 */
export function createExternalHandler(options = {}) {
  return async (entry) => {
    if (entry.severity !== ErrorSeverity.ERROR && entry.severity !== ErrorSeverity.CRITICAL) {
      return; // Only send errors
    }
    
    // Placeholder for external service integration
    // Example: Sentry
    // if (Sentry) {
    //   Sentry.captureException(entry.error, { extra: entry });
    // }
    
    // Example: Custom webhook
    // if (options.webhookUrl) {
    //   fetch(options.webhookUrl, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(entry),
    //   }).catch(e => console.error('[logger] Webhook error:', e));
    // }
  };
}

// Create singleton logger instance
const logger = new Logger();

// Set default context
logger.setGlobalContext({
  service: 'straturaos',
  version: process.env.npm_package_version || 'unknown',
  environment: process.env.NODE_ENV || 'development',
});

/**
 * Error handling middleware for API routes
 */
export function withErrorLogging(handler) {
  return async (req, res) => {
    const startTime = Date.now();
    
    try {
      await handler(req, res);
      
      // Log successful requests in debug mode
      if (isDev) {
        logger.logRequest(req, res, Date.now() - startTime);
      }
    } catch (error) {
      const errorId = logger.logApiError(req, error, ErrorCategory.INTERNAL, {
        responseTime: Date.now() - startTime,
      });
      
      // Return error response if not already sent
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error',
          errorId,
          ...(isDev ? { details: error.message } : {}),
        });
      }
    }
  };
}

/**
 * Log unhandled errors in API routes
 */
export function logUnhandledError(error, req, additionalData = {}) {
  return logger.logApiError(req, error, ErrorCategory.INTERNAL, additionalData);
}

export {
  logger,
  Logger,
  consoleHandler,
  extractRequestContext,
  extractUserContext,
  formatError,
  generateErrorId,
};

export default logger;
