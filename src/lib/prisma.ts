// src/lib/prisma.ts
// ⚠️ L'import vient du dossier généré, PAS de "@prisma/client".
import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL manquante")

  // Prisma 7 : c'est nous qui fournissons la connexion.
  const adapter = new PrismaPg({ connectionString })

  return new PrismaClient({ adapter, log: ["query"] })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
