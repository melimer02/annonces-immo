import { describe, it, expect } from "vitest"
import { z } from "zod"
import { AnnonceInput, annonceModificationInput } from "@/lib/schemas"
import { jourParis } from "@/lib/dates"

// Décale un jour AAAA-MM-JJ de n jours (calcul en UTC, sans heure)
function decale(jours: number) {
  const d = new Date(`${jourParis()}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + jours)
  return d.toISOString().slice(0, 10)
}

const valide = {
  titre: "Appartement lumineux",
  description: "Description de test suffisamment longue",
  typeBien: "VENTE",
  statutBien: "DISPONIBLE",
  prix: "150000",
  ville: "Le Havre",
}

const erreursDate = (r: { success: boolean; error?: z.ZodError }) =>
  r.success
    ? undefined
    : (z.flattenError(r.error!).fieldErrors as Record<string, string[] | undefined>).dateDisponibilite

describe("date de disponibilité : création", () => {
  it("refuse hier, avec un message compréhensible", () => {
    const r = AnnonceInput.safeParse({ ...valide, dateDisponibilite: decale(-1) })
    expect(erreursDate(r)?.[0]).toMatch(/ne peut pas être dans le passé/)
    expect(erreursDate(r)?.[0]).toContain("aujourd'hui")
  })
  it("accepte aujourd'hui", () => {
    expect(AnnonceInput.safeParse({ ...valide, dateDisponibilite: decale(0) }).success).toBe(true)
  })
  it("accepte demain", () => {
    expect(AnnonceInput.safeParse({ ...valide, dateDisponibilite: decale(1) }).success).toBe(true)
  })
  it("refuse une date vide ou absurde", () => {
    expect(erreursDate(AnnonceInput.safeParse({ ...valide, dateDisponibilite: "" }))?.[0]).toMatch(/invalide/)
    expect(erreursDate(AnnonceInput.safeParse({ ...valide, dateDisponibilite: "pas-une-date" }))?.[0]).toMatch(/invalide/)
  })
})

describe("date de disponibilité : modification", () => {
  const ancienne = decale(-30)
  it("accepte une date passée inchangée (ancienne annonce)", () => {
    const r = annonceModificationInput(ancienne).safeParse({ ...valide, dateDisponibilite: ancienne })
    expect(r.success).toBe(true)
  })
  it("refuse de CHANGER pour une autre date passée", () => {
    const r = annonceModificationInput(ancienne).safeParse({ ...valide, dateDisponibilite: decale(-5) })
    expect(erreursDate(r)?.[0]).toMatch(/ne peut pas être dans le passé/)
  })
  it("accepte de passer à une date future", () => {
    const r = annonceModificationInput(ancienne).safeParse({ ...valide, dateDisponibilite: decale(10) })
    expect(r.success).toBe(true)
  })
})
