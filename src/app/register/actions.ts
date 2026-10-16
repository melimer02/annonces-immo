"use server"

import { redirect } from "next/navigation"
import { APIError } from "better-auth/api"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { InscriptionInput } from "@/lib/schemas"
import { erreursDe, valeursDuFormulaire, type EtatFormulaire } from "@/lib/form"

export async function inscrire(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const valeurs = valeursDuFormulaire(formData, ["password"])

  const parsed = InscriptionInput.safeParse(valeursDuFormulaire(formData))
  if (!parsed.success) return { erreurs: erreursDe(parsed.error), valeurs }


  const veutEtreAgent = formData.get("devenirAgent") === "1"

  try {
    const { user } = await auth.api.signUpEmail({ body: parsed.data })

    if (veutEtreAgent) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "AGENT" },
      })
    }
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

  redirect(veutEtreAgent ? "/compte" : "/annonces")
}