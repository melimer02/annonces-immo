import { describe, it, expect } from "vitest"
import { AnnonceInput, IdInput } from "@/lib/shema"

const valide = {
  titre: "Bel appartement T3",
  description: "Lumineux, proche du centre-ville, balcon.",
  typeBien: "VENTE",
  statutBien: "DISPONIBLE",
  prix: 250000,
  dateDisponibilite: "2026-12-01",
}

// Renvoie les champs en erreur (ou [] si valide)
function champsEnErreur(input: unknown): string[] {
  const r = AnnonceInput.safeParse(input)
  return r.success ? [] : r.error.issues.map((i) => String(i.path[0]))
}

describe("validation des annonces", () => {
  it("accepte une annonce valide", () => {
    expect(champsEnErreur(valide)).toEqual([])
  })
  it("rejette un prix négatif (et seulement le prix)", () => {
    expect(champsEnErreur({ ...valide, prix: -5 })).toEqual(["prix"])
  })
  it("rejette un prix à zéro", () => {
    expect(champsEnErreur({ ...valide, prix: 0 })).toEqual(["prix"])
  })
  it("rejette un prix non numérique", () => {
    expect(champsEnErreur({ ...valide, prix: "abc" })).toEqual(["prix"])
  })
  it("rejette un titre trop court (et seulement le titre)", () => {
    expect(champsEnErreur({ ...valide, titre: "ab" })).toEqual(["titre"])
  })
  it("rejette un titre fait uniquement d'espaces", () => {
    expect(champsEnErreur({ ...valide, titre: "     " })).toEqual(["titre"])
  })
  it("rejette une description trop courte", () => {
    expect(champsEnErreur({ ...valide, description: "court" })).toEqual(["description"])
  })
  it("rejette un typeBien inconnu", () => {
    expect(champsEnErreur({ ...valide, typeBien: "ECHANGE" })).toEqual(["typeBien"])
  })
  it("rejette une date invalide", () => {
    expect(champsEnErreur({ ...valide, dateDisponibilite: "pas-une-date" })).toEqual([
      "dateDisponibilite",
    ])
  })
})

describe("validation des identifiants d'URL", () => {
  it("accepte un id numérique", () => {
    expect(IdInput.safeParse("42").success).toBe(true)
  })
  it.each(["abc", "-1", "0", "1.5", "99999999999", ""])("rejette %j", (v) => {
    expect(IdInput.safeParse(v).success).toBe(false)
  })
})
