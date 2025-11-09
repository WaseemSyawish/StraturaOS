// Shared Prisma client to avoid creating/disconnecting clients per-request
import { PrismaClient } from '@prisma/client';

// Use Node's global object for compatibility with ESLint environments
const globalForPrisma = global;

let prisma;
if (!globalForPrisma.__prisma) {
  globalForPrisma.__prisma = new PrismaClient();
}

prisma = globalForPrisma.__prisma;

export default prisma;
