import { PrismaClient } from '../app/generated/prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { withAccelerate } from '@prisma/extension-accelerate';

const databaseUrl = process.env.DATABASE_URL || '';

// Define a helper function to get the exact type of the extended client
const createAccelerateClient = () => {
  return new PrismaClient({ accelerateUrl: '' }).$extends(withAccelerate());
};

type ExtendedPrismaClient = ReturnType<typeof createAccelerateClient>;

const createPrismaClient = (): ExtendedPrismaClient => {
  if (databaseUrl.startsWith('prisma+postgres://')) {
    return new PrismaClient({
      accelerateUrl: databaseUrl,
    }).$extends(withAccelerate()) as unknown as ExtendedPrismaClient;
  } else {
    const pool = new pg.Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter }) as unknown as ExtendedPrismaClient;
  }
};

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

