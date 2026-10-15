"use server"

import { redirect } from "next/navigation"
import { APIError } from "better-auth/api"
import { auth } from "@/lib/auth"
import { InscriptionInput } from "@/lib/shema"
import { erreursDe, valeursDuFormulaire, type EtatFormulaire } from "@/lib/form"
import { prisma } from "@/lib/prisma"

export async function inscrire(
  _etat: EtatFormulaire,
  formData: FormData
): Promise<EtatFormulaire> {
  const valeurs = valeursDuFormulaire(formData, ["password"])

  const parsed = InscriptionInput.safeParse(valeursDuFormulaire(formData))
  if (!parsed.success) return { erreurs: erreursDe(parsed.error), valeurs }

  const { role, ...compte } = parsed.data
  console.log("ROLE REÇU :", role)
  try {
    const res = await auth.api.signUpEmail({ body: compte })
   console.log("COMPTE CRÉÉ :", res.user.id)

    if (role === "AGENT") {
      await prisma.user.update({
        where: { id: res.user.id },
        data: { role: "AGENT", statutPro: "EN_ATTENTE" },
      })
         console.log("AGENT MIS À JOUR")
    }
   } catch (e) {
     console.error("ERREUR INSCRIPTION :", e)
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


  redirect(role === "AGENT" ? "/en-attente" : "/annonces")
}
