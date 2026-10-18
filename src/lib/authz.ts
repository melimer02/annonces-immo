export type Role = "USER" | "AGENT" | "ADMIN"
export type Acteur = { id: string; name?: string; role: Role ,statutPro: StatutPro }
export type StatutPro = "AUCUN" | "EN_ATTENTE" | "VALIDE" | "REFUSE"


export function peutCreer(user: Acteur): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "AGENT" && user.statutPro === "VALIDE") return true; 
  
  return false;
}

export const peutModifier = (a: Acteur, annonce: { auteurId: string }) =>
  a.role === "ADMIN" || (peutCreer(a) && annonce.auteurId === a.id)

export const peutAdministrer = (a: Acteur) => a.role === "ADMIN"


export const peutVoir = (
  a: Acteur | null,
  annonce: { auteurId: string; statutPublication: "BROUILLON" | "PUBLIEE" }
) =>
  annonce.statutPublication === "PUBLIEE" ||
  (a !== null && (a.role === "ADMIN" || a.id === annonce.auteurId))


export const filtreProprietaire = (a: Acteur) =>
  a.role === "ADMIN" ? {} : { auteurId: a.id }