
// teste les actions côté serveur  anti-idor

import { describe, it, expect, vi, beforeEach, afterAll } from "vitest"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  creerAnnonce,
  modifierAnnonce,
  changerPublication,
  supprimerAnnonce,
  poserQuestion,
  repondreQuestion,
} from "@/app/annonces/actions"



vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`)
  },
  notFound: () => {
    throw new Error("NOT_FOUND")
  },
}))
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

const UTILISATEURS = [
  { id: "agent-a", name: "Agent A", email: "a@test.fr", role: "AGENT" },
  { id: "agent-b", name: "Agent B", email: "b@test.fr", role: "AGENT" },
  { id: "admin-1", name: "Admin", email: "admin@test.fr", role: "ADMIN" },
  { id: "user-1", name: "Usager", email: "user@test.fr", role: "USER" },
] as const
const [agentA, agentB, admin, usager] = UTILISATEURS



function connecterEn(u: { id: string; role: string } | null) {
  vi.mocked(auth.api.getSession).mockResolvedValue(
    (u ? { user: { id: u.id, role: u.role } } : null) as never
  )
}

function form(champs: Record<string, string>) {
  const f = new FormData()
  for (const [k, v] of Object.entries(champs)) f.set(k, v)
  return f
}

const champsValides = {
  titre: "Titre modifié valide",
  description: "Description assez longue pour être acceptée",
  typeBien: "VENTE",
  statutBien: "DISPONIBLE",
  prix: "250000",
  dateDisponibilite: "2026-12-01",
  ville: "Rouen",
}

const donnees = (auteurId: string, extra: Record<string, unknown> = {}) => ({
  titre: "Appartement T3",
  description: "Lumineux, proche du centre",
  typeBien: "VENTE" as const,
  prix: 200000,
  dateDisponibilite: new Date("2026-12-01"),
  ville : "Rouen",
  auteurId,
  ...extra,
})

async function nettoyer() {
  await prisma.user.deleteMany() // cascade : annonces, questions, favoris, photos
}

beforeEach(async () => {
  await nettoyer()
  await prisma.user.createMany({ data: [...UTILISATEURS] })
})

afterAll(async () => {
  await nettoyer()
  await prisma.$disconnect()
})

describe("suppression (IDOR)", () => {
  it("l'agent A ne peut PAS supprimer l'annonce de l'agent B", async () => {
    const b = await prisma.annonce.create({ data: donnees(agentB.id) })
    connecterEn(agentA)
    await expect(supprimerAnnonce(b.id)).rejects.toThrow("NOT_FOUND")
    expect(await prisma.annonce.count({ where: { id: b.id } })).toBe(1)
  })

  it("l'agent supprime sa propre annonce", async () => {
    const a = await prisma.annonce.create({ data: donnees(agentA.id) })
    connecterEn(agentA)
    await expect(supprimerAnnonce(a.id)).rejects.toThrow(/^REDIRECT:\/annonces$/)
    expect(await prisma.annonce.count({ where: { id: a.id } })).toBe(0)
  })

  it("un admin supprime l'annonce de n'importe qui", async () => {
    const b = await prisma.annonce.create({ data: donnees(agentB.id) })
    connecterEn(admin)
    await expect(supprimerAnnonce(b.id)).rejects.toThrow(/^REDIRECT:\/annonces$/)
    expect(await prisma.annonce.count({ where: { id: b.id } })).toBe(0)
  })

  it("un USER ne supprime rien", async () => {
    const b = await prisma.annonce.create({ data: donnees(agentB.id) })
    connecterEn(usager)
    await expect(supprimerAnnonce(b.id)).rejects.toThrow("NOT_FOUND")
    expect(await prisma.annonce.count({ where: { id: b.id } })).toBe(1)
  })

  it("un anonyme est renvoyé vers /login et rien n'est supprimé", async () => {
    const b = await prisma.annonce.create({ data: donnees(agentB.id) })
    connecterEn(null)
    await expect(supprimerAnnonce(b.id)).rejects.toThrow("REDIRECT:/login")
    expect(await prisma.annonce.count({ where: { id: b.id } })).toBe(1)
  })

  it.each(["abc", "999999", "-1"])("id invalide %j → NOT_FOUND", async (id) => {
    connecterEn(agentA)
    await expect(supprimerAnnonce(id)).rejects.toThrow("NOT_FOUND")
  })
})

describe("modification", () => {
  it("l'agent A ne modifie pas l'annonce de B", async () => {
    const b = await prisma.annonce.create({ data: donnees(agentB.id) })
    connecterEn(agentA)
    await expect(modifierAnnonce(b.id, {}, form(champsValides))).rejects.toThrow("NOT_FOUND")
    const apres = await prisma.annonce.findUniqueOrThrow({ where: { id: b.id } })
    expect(apres.titre).toBe("Appartement T3")
  })

  it("le propriétaire modifie son annonce", async () => {
    const a = await prisma.annonce.create({ data: donnees(agentA.id) })
    connecterEn(agentA)
    await expect(modifierAnnonce(a.id, {}, form(champsValides))).rejects.toThrow(
      `REDIRECT:/annonces/${a.id}`
    )
    const apres = await prisma.annonce.findUniqueOrThrow({ where: { id: a.id } })
    expect(apres.titre).toBe("Titre modifié valide")
  })

  it("une donnée invalide ne modifie rien", async () => {
    const a = await prisma.annonce.create({ data: donnees(agentA.id) })
    connecterEn(agentA)
    const r = await modifierAnnonce(a.id, {}, form({ ...champsValides, prix: "-5" }))
    expect(r).toHaveProperty("erreurs")
    const apres = await prisma.annonce.findUniqueOrThrow({ where: { id: a.id } })
    expect(apres.prix).toBe(200000)
  })
})

describe("publication", () => {
  it("l'agent A ne publie pas l'annonce de B", async () => {
    const b = await prisma.annonce.create({ data: donnees(agentB.id) })
    connecterEn(agentA)
    await expect(changerPublication(b.id, true)).rejects.toThrow("NOT_FOUND")
    const apres = await prisma.annonce.findUniqueOrThrow({ where: { id: b.id } })
    expect(apres.statutPublication).toBe("BROUILLON")
  })

  it("le propriétaire publie puis dépublie", async () => {
    const a = await prisma.annonce.create({ data: donnees(agentA.id) })
    connecterEn(agentA)
    await changerPublication(a.id, true)
    expect(
      (await prisma.annonce.findUniqueOrThrow({ where: { id: a.id } })).statutPublication
    ).toBe("PUBLIEE")
    await changerPublication(a.id, false)
    expect(
      (await prisma.annonce.findUniqueOrThrow({ where: { id: a.id } })).statutPublication
    ).toBe("BROUILLON")
  })

  it("un booléen invalide est refusé", async () => {
    const a = await prisma.annonce.create({ data: donnees(agentA.id) })
    connecterEn(agentA)
    await expect(changerPublication(a.id, "true")).rejects.toThrow("NOT_FOUND")
  })
})

describe("création", () => {
  it("un USER ne crée rien", async () => {
    connecterEn(usager)
    await expect(creerAnnonce({}, form(champsValides))).rejects.toThrow("NOT_FOUND")
    expect(await prisma.annonce.count()).toBe(0)
  })

  it("un anonyme est renvoyé vers /login", async () => {
    connecterEn(null)
    await expect(creerAnnonce({}, form(champsValides))).rejects.toThrow("REDIRECT:/login")
    expect(await prisma.annonce.count()).toBe(0)
  })

  it("l'auteur vient de la session, jamais du formulaire", async () => {
    connecterEn(agentA)
    await expect(
      creerAnnonce({}, form({ ...champsValides, auteurId: agentB.id }))
    ).rejects.toThrow(/^REDIRECT:\/annonces\/\d+$/)
    const creee = await prisma.annonce.findFirstOrThrow()
    expect(creee.auteurId).toBe(agentA.id)
  })

  it("un prix négatif ne crée rien", async () => {
    connecterEn(agentA)
    const r = await creerAnnonce({}, form({ ...champsValides, prix: "-5" }))
    expect(r).toHaveProperty("erreurs")
    expect(await prisma.annonce.count()).toBe(0)
  })
})

describe("questions / réponses", () => {
  it("un anonyme ne peut pas poser de question", async () => {
    const a = await prisma.annonce.create({
      data: donnees(agentA.id, { statutPublication: "PUBLIEE" }),
    })
    connecterEn(null)
    await expect(poserQuestion(a.id, {}, form({ contenu: "Est-ce négociable ?" }))).rejects.toThrow(
      "REDIRECT:/login"
    )
    expect(await prisma.question.count()).toBe(0)
  })

  it("un USER pose une question sur une annonce publiée (auteur = session)", async () => {
    const a = await prisma.annonce.create({
      data: donnees(agentA.id, { statutPublication: "PUBLIEE" }),
    })
    connecterEn(usager)
    await poserQuestion(a.id, {}, form({ contenu: "Est-ce négociable ?", auteurId: agentA.id }))
    const q = await prisma.question.findFirstOrThrow()
    expect(q.auteurId).toBe(usager.id)
  })

  it("un USER ne peut pas questionner un brouillon", async () => {
    const a = await prisma.annonce.create({ data: donnees(agentA.id) }) // BROUILLON
    connecterEn(usager)
    await expect(
      poserQuestion(a.id, {}, form({ contenu: "Est-ce négociable ?" }))
    ).rejects.toThrow("NOT_FOUND")
    expect(await prisma.question.count()).toBe(0)
  })

  it("l'agent A ne répond pas à une question sur l'annonce de B", async () => {
    const b = await prisma.annonce.create({
      data: donnees(agentB.id, { statutPublication: "PUBLIEE" }),
    })
    const q = await prisma.question.create({
      data: { contenu: "Est-ce négociable ?", annonceId: b.id, auteurId: usager.id },
    })
    connecterEn(agentA)
    await expect(
      repondreQuestion(q.id, {}, form({ reponse: "Oui, un peu." }))
    ).rejects.toThrow("NOT_FOUND")
    expect((await prisma.question.findUniqueOrThrow({ where: { id: q.id } })).reponse).toBeNull()
  })

  it("l'agent propriétaire répond", async () => {
    const b = await prisma.annonce.create({
      data: donnees(agentB.id, { statutPublication: "PUBLIEE" }),
    })
    const q = await prisma.question.create({
      data: { contenu: "Est-ce négociable ?", annonceId: b.id, auteurId: usager.id },
    })
    connecterEn(agentB)
    await repondreQuestion(q.id, {}, form({ reponse: "Oui, un peu." }))
    expect((await prisma.question.findUniqueOrThrow({ where: { id: q.id } })).reponse).toBe(
      "Oui, un peu."
    )
  })
})
