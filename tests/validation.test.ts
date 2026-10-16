// tests/validation.test.ts

//on teste la validation des schémas Zod pour les annonces, l'authentification, les questions/réponses et les identifiants d'URL.

import { describe, it, expect } from "vitest"
import { AnnonceInput, IdInput ,InscriptionInput,QuestionInput,ReponseInput,annonceModificationInput} from "@/lib/schemas"
import z from "zod"
import { jourParis } from "@/lib/dates"


const valide = {
  titre: "Bel appartement T3",
  description: "Lumineux, proche du centre-ville, balcon.",
  typeBien: "VENTE",
  statutBien: "DISPONIBLE",
  prix: 250000,
  dateDisponibilite: "2026-12-01",
  ville: "Rouen",
}

function champsEnErreur(input: unknown): string[] {
  const r = AnnonceInput.safeParse(input)
  if (r.success) return []
  const champs = r.error.issues.map((i) => String(i.path[0]))
  return Array.from(new Set(champs)) 
}


//-----------------------------Test sur les annonces---------------------------------
describe("validation des annonces", () => {
  it("accepte une annonce valide", () => {
    expect(champsEnErreur(valide)).toEqual([])
  })
  it("rejette un prix négatif (et seulement le prix)", () => {
    expect(champsEnErreur({ ...valide, prix: -5 })).toEqual(["prix"])
  })
  it("rejette un titre trop long", () => {
    
    expect(champsEnErreur({ ...valide, titre: "a".repeat(150) })).toEqual(["titre"])
  })
  it("rejette un prix à zéro", () => {
    expect(champsEnErreur({ ...valide, prix: 0 })).toEqual(["prix"])
  })
  it("rejette un prix non numérique", () => {
    expect(champsEnErreur({ ...valide, prix: "abc" })).toEqual(["prix"])
  })
  it("rejette un titre trop court", () => {
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
  it("rejette un statutBien inconnu", () => {
    expect(champsEnErreur({ ...valide, statutBien: "INCONNU" })).toEqual(["statutBien"])
  })
  
  it("rejette une ville vide", () => {
    expect(champsEnErreur({ ...valide, ville: "   " })).toEqual(["ville"])
  })
  
  
})



// ---------------------------Tests pour l'Authentification -----------------------------------------

describe("validation de l'authentification", () => {
  it("accepte une inscription valide", () => {
    expect(InscriptionInput.safeParse({ 
      name: "Jean Dupont", 
      email: "jean@test.fr", 
      password: "motdepassesecurise" 
    }).success).toBe(true)
  })
  it("rejette un email invalide", () => {
    expect(InscriptionInput.safeParse({ 
      name: "Jean", 
      email: "ceci-n-est-pas-un-email", 
      password: "password123" 
    }).success).toBe(false)
  })
  it("rejette un mot de passe vraiment trop court à l'inscription (moins de 8 caractères)", () => {
     expect(InscriptionInput.safeParse({ 
      name: "Jean",
      email: "jean@test.fr", 
      password: "abc" 
    }).success).toBe(false)
  })
  
})







// Décale un jour AAAA-MM-JJ de n jours (calcul en UTC, sans heure)
function decale(jours: number) {
  const d = new Date(`${jourParis()}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + jours)
  return d.toISOString().slice(0, 10)
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






//-------------------------------Question / Réponse---------------------------------

describe("validation des questions", () => {
  it("accepte une question valide", () => {
    expect(QuestionInput.safeParse({ contenu: "Est-ce que le bien possède une cave ?" }).success).toBe(true)
  })
  it("rejette une question trop courte", () => {
    const r = QuestionInput.safeParse({ contenu: "Oui?" })
    expect(r.success).toBe(false)
  })
  it("rejette une question vide ou faite d'espaces", () => {
    const r = QuestionInput.safeParse({ contenu: "    " })
    expect(r.success).toBe(false)
  })
})

describe("validation des réponses", () => {
  it("accepte une réponse valide", () => {
    expect(ReponseInput.safeParse({ reponse: "Oui, une cave de 10m2." }).success).toBe(true)
  })
  it("rejette une réponse trop courte", () => {
    expect(ReponseInput.safeParse({ reponse: "Non" }).success).toBe(false)
  })
})



//------------------------------Test sur les identifiants d'URL---------------------------------


describe("validation des identifiants d'URL", () => {
  it("accepte un id numérique", () => {
    expect(IdInput.safeParse("42").success).toBe(true)
  })
  it.each(["abc", "-1", "0", "1.5", "99999999999", ""])("rejette %j", (v) => {
    expect(IdInput.safeParse(v).success).toBe(false)
  })
})
