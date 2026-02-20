// Shared Prisma client to avoid creating/disconnecting clients per-request
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

// Create a fresh PrismaClient with connection handling
function createPrismaClient() {
  const isDev = process.env.NODE_ENV === 'development';
  return new PrismaClient({
    log: isDev ? ['error', 'warn'] : ['error'],
    // Add timeout for production (Vercel has cold starts)
    errorFormat: 'pretty',
  });
}

// Lazy initialization - create client on first use
function getPrismaClient() {
  if (!globalForPrisma.__prisma) {
    globalForPrisma.__prisma = createPrismaClient();
  }
  return globalForPrisma.__prisma;
}

// Force recreate the client (used when connection is lost)
export function recreatePrismaClient() {
  if (globalForPrisma.__prisma) {
    // Don't await - just fire and forget disconnect
    globalForPrisma.__prisma.$disconnect().catch(() => {});
  }
  globalForPrisma.__prisma = createPrismaClient();
  return globalForPrisma.__prisma;
}

// Export the client (lazy initialized)
const prisma = getPrismaClient();

export default prisma;
