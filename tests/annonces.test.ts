//teste la logique pure de visibilité des annonces, sans passer par l'API ni la base de données


import { describe, it, expect, beforeEach, afterAll } from "vitest"
import { prisma } from "@/lib/prisma"
import { listerAnnonces } from "@/lib/annonces"

const agentA: Acteur = { id: "agent-a", role: "AGENT", statutPro: "VALIDE" }
const agentB: Acteur = { id: "agent-b", role: "AGENT", statutPro: "VALIDE" }
const admin: Acteur  = { id: "admin-1", role: "ADMIN", statutPro: "AUCUN" }
const usager: Acteur = { id: "user-1",  role: "USER",  statutPro: "AUCUN" }
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

//-----------------test de performance : pas de N+1-----------------


type ClientAvecRequetes = {
  $on(event: "query", cb: (e: { query: string; duration: number }) => void): void
}

async function compterRequetes(fn: () => Promise<unknown>) {
  let n = 0
  ;(prisma as unknown as ClientAvecRequetes).$on("query", () => { n++ })
  await fn()
  return n
}

async function ajouterPubliees(nb: number) {
  for (let i = 0; i < nb; i++) {
    await prisma.annonce.create({
      data: {
        ...base,
        titre: `Invariance-${i}-${Math.random()}`,
        typeBien: "VENTE",
        statutPublication: "PUBLIEE",
        auteurId: agentA.id,
        photos: { create: [{ url: "https://exemple.fr/a.jpg" }] },
      },
    })
  }
}

describe("performance : pas de N+1", () => {
  it("le nombre de requêtes ne dépend pas du nombre d'annonces affichées", async () => {
    // beforeEach a déjà créé 1 publiée. On en ajoute 1 
    await ajouterPubliees(1)
    const avec2 = await compterRequetes(() => listerAnnonces(null, { page: 1 }))

    // puis 28 de plus → page pleine (PAR_PAGE = 6 annonces affichées)
    await ajouterPubliees(28)
    const avec6 = await compterRequetes(() => listerAnnonces(null, { page: 1 }))

    expect(avec2).toBeGreaterThan(0) 
    expect(avec6).toBe(avec2)
  })
})