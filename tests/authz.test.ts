//teste la logique pure d'autorisation 



import { describe, it, expect } from "vitest"
import { peutCreer, peutModifier, peutVoir, filtreProprietaire } from "@/lib/authz"

const agentA  = { id: "a", role: "AGENT" as const, statutPro: "VALIDE" as const }
const agentB = { id: "b", role: "AGENT" as const, statutPro: "VALIDE" as const }
const admin = { id: "z", role: "ADMIN" as const , statutPro: "AUCUN" as const }
const usager = { id: "u", role: "USER" as const , statutPro: "AUCUN" as const }
const agentAttente = { id: "attente", role: "AGENT" as const, statutPro: "EN_ATTENTE" as const }
const deB = { auteurId: "b" }

describe("peutCreer", () => {
  it("USER non", () => expect(peutCreer(usager)).toBe(false))
  it("AGENT  valideoui", () => expect(peutCreer(agentA)).toBe(true))
  it("ADMIN oui", () => expect(peutCreer(admin)).toBe(true))
  it("USER non", () => expect(peutCreer(usager)).toBe(false))
  it("AGENT EN ATTENTE non", () => {expect(peutCreer(agentAttente)).toBe(false)
  })
 
})

describe("peutModifier", () => {
  it("un agent ne modifie pas l'annonce d'un autre", () =>
    expect(peutModifier(agentA, deB)).toBe(false))
  it("un agent modifie la sienne", () => expect(peutModifier(agentB, deB)).toBe(true))
  it("un admin modifie tout", () => expect(peutModifier(admin, deB)).toBe(true))
  it("un USER ne modifie rien, même s'il est l'auteur", () =>
    expect(peutModifier({ id: "b", role: "USER" as const, statutPro: "AUCUN" as const }, deB)).toBe(false))
  it("un agent refusé ne peut pas créer", () => {
  expect(peutCreer({ id: "a", role: "AGENT", statutPro: "REFUSE" })).toBe(false)
})
})

describe("peutVoir", () => {
  const brouillon = { auteurId: "b", statutPublication: "BROUILLON" as const }
  const publiee = { auteurId: "b", statutPublication: "PUBLIEE" as const }
  it("un anonyme voit une annonce publiée", () => expect(peutVoir(null, publiee)).toBe(true))
  it("un anonyme ne voit pas un brouillon", () => expect(peutVoir(null, brouillon)).toBe(false))
  it("un autre agent ne voit pas le brouillon", () =>
    expect(peutVoir(agentA, brouillon)).toBe(false))
  it("l'auteur voit son brouillon", () => expect(peutVoir(agentB, brouillon)).toBe(true))
  it("un admin voit tous les brouillons", () => expect(peutVoir(admin, brouillon)).toBe(true))
})

describe("filtreProprietaire", () => {
  it("admin : aucun filtre", () => expect(filtreProprietaire(admin)).toEqual({}))
  it("agent : filtre sur son id", () =>
    expect(filtreProprietaire(agentA)).toEqual({ auteurId: "a" }))
})


