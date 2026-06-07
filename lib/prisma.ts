import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Global singleton para evitar múltiples instancias en desarrollo
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Creamos el pool con SSL explícito (no dependemos de sslmode en la URL)
const pool = new Pool({
  host: "aws-1-us-west-2.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  user: "postgres.vtcrncyrnpujswiolkih",
  password: "GRS8_?jGDbCivP5",
  ssl: {
    rejectUnauthorized: false,
  },
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
