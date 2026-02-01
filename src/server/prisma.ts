import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in dev hot-reload
const g = globalThis as any;
export const prisma: PrismaClient = g.__PRISMA__ || new PrismaClient();
if (!g.__PRISMA__) g.__PRISMA__ = prisma;
