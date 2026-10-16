"use server"

import { redirect } from "next/navigation"
import { APIError } from "better-auth/api"
import { auth } from "@/lib/auth"
import { InscriptionInput } from "@/lib/shema"
import { erreursDe, valeursDuFormulaire, type EtatFormulaire } from "@/lib/form"
import { suiteSure } from "@/lib/redirection"



export async function inscrire(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const valeurs = valeursDuFormulaire(formData, ["password"])

  const parsed = InscriptionInput.safeParse(valeursDuFormulaire(formData))
  if (!parsed.success) return { erreurs: erreursDe(parsed.error), valeurs }

  try {
    await auth.api.signUpEmail({ body: parsed.data })
  } catch (e) {
    if (e instanceof APIError) {
      const code = String(e.body?.code ?? "")
      if (code.includes("USER_ALREADY_EXISTS")) {
        return {
          erreurs: { email: ["Un compte existe déjà avec cette adresse email"] },
          valeurs,
        }
      }
      return { message: "Inscription impossible pour le moment, réessayez.", valeurs }
    }
    throw e
  }

  redirect(suiteSure(formData.get("suite")))
}