// src/lib/prisma.ts
import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { appendFileSync } from "node:fs"
import { journaliser } from "./logging"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL manquante")

  // Prisma 7 : c'est nous qui fournissons la connexion.
  const adapter = new PrismaPg({ connectionString })
  const enDev = process.env.NODE_ENV === "development"

  const client = new PrismaClient({
    adapter,
    log: [
      { emit: "event", level: "query" },
      { emit: "stdout", level: "warn" },
      { emit: "stdout", level: "error" },
    ],
  })

  // Logs de requêtes 
  if (enDev) {
    client.$on("query", (e) => {
      journaliser(e.query, e.duration) 
      appendFileSync("logs-sql.log", `${new Date().toISOString()} ${e.duration}ms ${e.query}\n`) // SQL complet
    })
  }

  return client
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma