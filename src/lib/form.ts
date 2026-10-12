// src/lib/form.ts 
import { z } from "zod"

export type ErreursChamps = Record<string, string[] | undefined>

// Ce que renvoie une Server Action de formulaire
export type EtatFormulaire = {
  erreurs?: ErreursChamps            // erreurs de validation, champ par champ
  valeurs?: Record<string, string>   // ce que l'utilisateur a saisi (à réafficher)
  message?: string                   // erreur générale (ex. identifiants incorrects)
}

// FormData → objet de chaînes. Écarte les champs internes de Next ("$ACTION_...")
// et ceux qu'on ne veut jamais renvoyer au navigateur (mot de passe).
export function valeursDuFormulaire(formData: FormData, exclure: string[] = []) {
  const valeurs: Record<string, string> = {}
  for (const [cle, valeur] of formData.entries()) {
    if (typeof valeur === "string" && !cle.startsWith("$") && !exclure.includes(cle)) {
      valeurs[cle] = valeur
    }
  }
  return valeurs
}

export function erreursDe(error: z.ZodError): ErreursChamps {
  return z.flattenError(error).fieldErrors
}
