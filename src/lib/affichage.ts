// Libellés et styles d'affichage partagés (navbar, carte d'annonce, page de détail)

export const LIBELLE_TYPE: Record<string, string> = { VENTE: "Vente", LOCATION: "Location" }

export const LIBELLE_STATUT_BIEN: Record<string, string> = {
  DISPONIBLE: "Disponible",
  LOUE: "Loué",
  VENDU: "Vendu",
}

export const CLASSE_STATUT_BIEN: Record<string, string> = {
  DISPONIBLE: "bg-green-50 text-green-800",
  LOUE: "bg-amber-50 text-amber-800",
  VENDU: "bg-gray-100 text-gray-700",
}

export const LIBELLE_ROLE: Record<string, string> = {
  USER: "Utilisateur",
  AGENT: "Agent",
  ADMIN: "Admin",
}

// Hypothèse : le prix d'une location est un loyer mensuel
export function formatPrix(prix: number, typeBien: string) {
  const montant = prix.toLocaleString("fr-FR")
  return typeBien === "LOCATION" ? `${montant} € / mois` : `${montant} €`
}

// timeZone UTC : la date est stockée à minuit UTC, on évite un décalage d'un jour
export function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { dateStyle: "long", timeZone: "UTC" })
}
