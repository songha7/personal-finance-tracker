import { PrismaClient } from "./generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Prisma 7 requires an explicit "driver adapter" instead of connecting
// implicitly from the schema's datasource url. PrismaNeon talks to Neon
// over HTTP rather than a raw TCP connection, which suits serverless
// hosting (e.g. Vercel) better than a traditional long-lived connection.
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

// In dev, Next.js hot-reloads this module on every file save, which would
// normally create a brand new PrismaClient (and a new DB connection) each
// time. Stashing the instance on `globalThis` survives the reload, so we
// reuse the same client instead of leaking connections.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
