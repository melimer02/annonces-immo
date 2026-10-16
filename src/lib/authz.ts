export type Role = "USER" | "AGENT" | "ADMIN"
export type Acteur = { id: string; role: Role }


export const peutCreer = (a: Acteur) => a.role === "AGENT" || a.role === "ADMIN"


export const peutModifier = (a: Acteur, annonce: { auteurId: string }) =>
  a.role === "ADMIN" || (peutCreer(a) && annonce.auteurId === a.id)

export const peutVoir = (
  a: Acteur | null,
  annonce: { auteurId: string; statutPublication: "BROUILLON" | "PUBLIEE" }
) =>
  annonce.statutPublication === "PUBLIEE" ||
  (a !== null && (a.role === "ADMIN" || a.id === annonce.auteurId))


export const filtreProprietaire = (a: Acteur) =>
  a.role === "ADMIN" ? {} : { auteurId: a.id }