import { describe, it, expect, beforeEach, afterAll } from "vitest"
import { prisma } from "@/lib/prisma"
import { listerAnnonces, type FiltresAnnonces } from "@/lib/annonces"
import type { Acteur } from "@/lib/authz"

const agentA: Acteur = { id: "agent-a", role: "AGENT", statutPro: "VALIDE" }
const agentB: Acteur = { id: "agent-b", role: "AGENT", statutPro: "VALIDE" }
const admin: Acteur  = { id: "admin-1", role: "ADMIN", statutPro: "AUCUN" }

const base = {
  description: "Description de test suffisamment longue",
  prix: 100000,
  dateDisponibilite: new Date("2026-12-01"),
  typeBien: "VENTE" as const,
}

async function titres(user: Acteur | null, filtres: Omit<FiltresAnnonces, "page"> = {}) {
  const { annonces } = await listerAnnonces(user, { page: 1, ...filtres })
  return annonces.map((a) => a.titre).sort()
}

beforeEach(async () => {
  await prisma.user.deleteMany()
  await prisma.user.createMany({
    data: [
      { id: agentA.id, name: "A", email: "a@test.fr", role: "AGENT" },
      { id: agentB.id, name: "B", email: "b@test.fr", role: "AGENT" },
      { id: admin.id, name: "Admin", email: "admin@test.fr", role: "ADMIN" },
    ],
  })
  await prisma.annonce.createMany({
    data: [
      { ...base, titre: "Publiee-A", statutPublication: "PUBLIEE", auteurId: agentA.id },
      { ...base, titre: "Brouillon-A", statutPublication: "BROUILLON", auteurId: agentA.id },
      { ...base, titre: "Publiee-B", statutPublication: "PUBLIEE", auteurId: agentB.id },
      { ...base, titre: "Brouillon-B", statutPublication: "BROUILLON", auteurId: agentB.id },
    ],
  })
})

afterAll(async () => {
  await prisma.user.deleteMany()
  await prisma.$disconnect()
})

describe("espace agent : mes annonces", () => {
  it("ne montre que les annonces de l'agent (publiées et brouillons)", async () => {
    expect(await titres(agentA, { auteurId: agentA.id })).toEqual(["Brouillon-A", "Publiee-A"])
  })

  it("« Mes brouillons » ne renvoie que ses propres brouillons", async () => {
    expect(await titres(agentA, { auteurId: agentA.id, statutPublication: "BROUILLON"})).toEqual([
      "Brouillon-A",
    ])
  })

  it("un agent ne lit jamais les brouillons d'un autre, même en demandant son auteur", async () => {
    expect(await titres(agentA, { auteurId: agentB.id, statutPublication: "BROUILLON" })).toEqual([])
    expect(await titres(agentA, { auteurId: agentB.id })).toEqual(["Publiee-B"])
  })

  it("un admin voit les brouillons de l'auteur demandé", async () => {
    expect(await titres(admin, { auteurId: agentB.id })).toEqual(["Brouillon-B", "Publiee-B"])
  })
})
