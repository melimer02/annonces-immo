//teste la logique pure de visibilité des annonces, sans passer par l'API ni la base de données


import { describe, it, expect, beforeEach, afterAll } from "vitest"
import { prisma } from "@/lib/prisma"
import { listerAnnonces } from "@/lib/annonces"

const agentA = { id: "agent-a", role: "AGENT" as const }
const agentB = { id: "agent-b", role: "AGENT" as const }
const admin = { id: "admin-1", role: "ADMIN" as const }
const usager = { id: "user-1", role: "USER" as const }
import type { Acteur } from "@/lib/authz"

const base = {
  description: "Description de test suffisamment longue",
  prix: 100000,
  dateDisponibilite: new Date("2026-12-01"),
}

async function titres(user: Acteur | null, opts: { page?: number; type?: "VENTE" | "LOCATION" } = {}) {
  const { annonces } = await listerAnnonces(user, { page: opts.page ?? 1, type: opts.type })
  return annonces.map((a) => a.titre).sort()
}

beforeEach(async () => {
  await prisma.user.deleteMany()
  await prisma.user.createMany({
    data: [
      { id: agentA.id, name: "A", email: "a@test.fr", role: "AGENT" },
      { id: agentB.id, name: "B", email: "b@test.fr", role: "AGENT" },
      { id: admin.id, name: "Admin", email: "admin@test.fr", role: "ADMIN" },
      { id: usager.id, name: "U", email: "u@test.fr", role: "USER" },
    ],
  })
  await prisma.annonce.createMany({
    data: [
      { ...base, titre: "Publiee-A", typeBien: "VENTE", statutPublication: "PUBLIEE", auteurId: agentA.id },
      { ...base, titre: "Brouillon-A", typeBien: "VENTE", statutPublication: "BROUILLON", auteurId: agentA.id },
      { ...base, titre: "Brouillon-B", typeBien: "LOCATION", statutPublication: "BROUILLON", auteurId: agentB.id },
    ],
  })
})

afterAll(async () => {
  await prisma.user.deleteMany()
  await prisma.$disconnect()
})

describe("liste des annonces : visibilité des brouillons", () => {
  it("un anonyme ne voit que les publiées", async () => {
    expect(await titres(null)).toEqual(["Publiee-A"])
  })
  it("un USER ne voit que les publiées", async () => {
    expect(await titres(usager)).toEqual(["Publiee-A"])
  })
  it("un agent voit les publiées et SES brouillons, pas ceux d'un autre", async () => {
    expect(await titres(agentA)).toEqual(["Brouillon-A", "Publiee-A"])
    expect(await titres(agentB)).toEqual(["Brouillon-B", "Publiee-A"])
  })
  it("un admin voit tout", async () => {
    expect(await titres(admin)).toEqual(["Brouillon-A", "Brouillon-B", "Publiee-A"])
  })
  it("le total (pagination) ne compte pas les brouillons pour un anonyme", async () => {
    const { total } = await listerAnnonces(null, { page: 1 })
    expect(total).toBe(1)
  })
  it("le filtre de type s'applique sans réexposer les brouillons", async () => {
    expect(await titres(null, { type: "LOCATION" })).toEqual([])
    expect(await titres(admin, { type: "LOCATION" })).toEqual(["Brouillon-B"])
  })
  it("une page au-delà de la fin renvoie une liste vide, sans erreur", async () => {
    expect(await titres(admin, { page: 99 })).toEqual([])
  })
})
