// Diagnostic endpoint to test database connectivity from Vercel
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database_url_set: !!process.env.DATABASE_URL,
    direct_url_set: !!process.env.DIRECT_URL,
    nextauth_secret_set: !!process.env.NEXTAUTH_SECRET,
  };

  // Don't log actual URLs for security, just check if they're set
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    // Extract just the host part
    const match = url.match(/@([^:]+):(\d+)/);
    if (match) {
      diagnostics.database_host = match[1];
      diagnostics.database_port = match[2];
    }
  }

  try {
    // Try a simple query
    const userCount = await prisma.user.count();
    diagnostics.database_connected = true;
    diagnostics.user_count = userCount;
    return res.status(200).json({
      status: 'ok',
      message: 'Database connection successful',
      data: diagnostics,
    });
  } catch (error) {
    diagnostics.database_connected = false;
    diagnostics.error = error.message;
    diagnostics.error_code = error.code;
    diagnostics.error_type = error.constructor.name;

    console.error('Diagnostic error:', {
      message: error.message,
      code: error.code,
      type: error.constructor.name,
      stack: error.stack,
    });

    return res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      data: diagnostics,
    });
  }
}
