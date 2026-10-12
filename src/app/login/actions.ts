"use server"

import { redirect } from "next/navigation"
import { APIError } from "better-auth/api"
import { auth } from "@/lib/auth"
import { ConnexionInput } from "@/lib/shema"
import { erreursDe, valeursDuFormulaire, type EtatFormulaire } from "@/lib/form"

export async function connecter(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const valeurs = valeursDuFormulaire(formData, ["password"])

  const parsed = ConnexionInput.safeParse(valeursDuFormulaire(formData))
  if (!parsed.success) return { erreurs: erreursDe(parsed.error), valeurs }

  try {
    await auth.api.signInEmail({ body: parsed.data })
  } catch (e) {
    if (e instanceof APIError) {
      return { message: "Email ou mot de passe incorrect", valeurs }
    }
    throw e
  }

  redirect("/annonces")
}
