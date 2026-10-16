// Dates "calendaires" : un jour du calendrier, au format AAAA-MM-JJ.
// <input type="date"> et z.coerce.date() donnent minuit UTC du jour choisi :
// on compare donc des jours entiers, jamais des heures.

export const FUSEAU = "Europe/Paris"

// Le jour d'aujourd'hui vu depuis Paris : "2026-10-16" (le format suédois est AAAA-MM-JJ)
export const jourParis = (d: Date = new Date()) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: FUSEAU }).format(d)

// Le jour calendaire d'une Date issue d'un champ date : "2026-10-16"
export const jourDe = (d: Date) => d.toISOString().slice(0, 10)

// "2026-10-16" → "16/10/2026" (pour les messages)
export const afficherJour = (iso: string) => iso.split("-").reverse().join("/")
