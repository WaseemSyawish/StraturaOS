// Shared Prisma client to avoid creating/disconnecting clients per-request
import { PrismaClient } from '@prisma/client';

// Use Node's global object for compatibility with ESLint environments
const globalForPrisma = globalThis;

let prisma;

if (process.env.NODE_ENV === 'production') {
  // In production (Vercel), always create a new client
  prisma = new PrismaClient();
} else {
  // In development, use global singleton to avoid too many clients
  if (!globalForPrisma.__prisma) {
    globalForPrisma.__prisma = new PrismaClient();
  }
  prisma = globalForPrisma.__prisma;
}

export default prisma;
