// Middleware wrapper to ensure Prisma connection is alive before handling requests
import prisma, { recreatePrismaClient } from './prisma';

/**
 * Wraps an API handler to ensure Prisma is connected before processing.
 * Retries with a fresh client if connection fails.
 */
export function withPrisma(handler) {
  return async (req, res) => {
    // Try to ensure connection before handling
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        // Use the current client for attempt 0, recreate on retries
        const client = attempt === 0 ? prisma : recreatePrismaClient();
        
        // Simple health check query with timeout
        await Promise.race([
          client.$queryRaw`SELECT 1`,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 10000))
        ]);
        
        // If we recreated the client, we need to re-import it for the handler
        // But since handlers import prisma directly, we update the global
        if (attempt > 0) {
          console.log(`[withPrisma] Connection restored on attempt ${attempt + 1}`);
        }
        break; // Connection is good
      } catch (connectError) {
        console.warn(`[withPrisma] Connection check failed (attempt ${attempt + 1}):`, connectError.message);
        
        if (attempt >= 3) {
          // Final attempt failed
          return res.status(503).json({
            success: false,
            error: 'Database connection unavailable. Please try again in a moment.',
            details: process.env.NODE_ENV === 'development' ? connectError.message : undefined,
          });
        }
        
        // Exponential backoff delay before retry
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
    
    return handler(req, res);
  };
}

export default withPrisma;
