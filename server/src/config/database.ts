import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export async function initDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connected');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}
